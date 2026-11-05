// src/fakeBackend/cleaningService.js
// Bu dosya backend'in vereceği cevapları taklit ediyor. Boş alan gibi kontroller formda,
// makine, yetki ve adım sırası gibi kurallar burada. Doküman yalnızca ekran kontrolünü
// yeterli bulmuyor. Hata kodları: 403 yetki, 409 çakışma, 422 iş kuralı.
function fail(message, status = 400, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  throw error;
}

// "Kim, ne zaman, ne yaptı" sorusunun cevabı burada birikiyor.
export function addLog(db, user, recordId, action, detail = "") {
  db.auditLog.push({
    at: Date.now(),
    userId: user.id,
    recordId,
    action,
    detail,
  });
}
// Kayıt numarasını sistem üretiyor. Numaraya bakınca işin hangi tesis, hat ve makinede
// yapıldığı anlaşılıyor. Sıra numarası da numarayı benzersiz yapıyor.
export function makeRecordNo(db, facility, line, machine, category, now) {
  const date = new Date(now);
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const prefix = `${facility.code}-${line.code}-${machine.code}-${yy}${mm}${dd}`;
  const count = db.records.filter((r) => r.no.startsWith(prefix)).length + 1;
  const order = String(count).padStart(2, "0");
  return category === "emergency"
    ? `${prefix}-AC${order}`
    : `${prefix}-${order}`;
}

// Normal temizliğin saha referansını sistem üretiyor. Acil kayıtlar saha defterine
// işlenmediği için referansları yok.
export function makeFieldRef(db, category, year) {
  if (category === "emergency") return null;
  const count =
    db.records.filter((r) => r.fieldRef?.startsWith(`SAHA-${year}`)).length + 1;
  return `SAHA-${year}-${String(count).padStart(5, "0")}`;
}

// Kayıt burada açılıyor. Ekranda listeleri süzüyorum ama asıl kontrol burada,
// çünkü kişi rastgele makine veya form seçememeli.
export function openRecord(db, user, form) {
  const machine = db.machines.find((m) => m.id === form.machineId);
  if (!machine || !machine.active) fail("Bu makine seçilemez.", 422);
  const procedure = db.procedures.find((p) => p.id === form.procedureId);
  if (!procedure || !procedure.machineIds.includes(machine.id))
    fail("Bu form bu makine için tanımlı değil.", 422);
  // Yeni kayıt her zaman formun son versiyonuyla açılıyor.
  const version = procedure.versions.at(-1);

  const now = Date.now();
  const line = db.lines.find((l) => l.id === machine.lineId);
  const facility = db.facilities.find((f) => f.id === line.facilityId);
  const record = {
    id: `r${db.records.length + 1}`,
    no: makeRecordNo(db, facility, line, machine, procedure.category, now),
    fieldRef: makeFieldRef(db, procedure.category, new Date(now).getFullYear()),
    category: procedure.category,
    status: "opened",
    // Kaydı açan kişi işin sorumlusu, sonradan başkasına devredilemiyor.
    ownerId: user.id,
    helperIds: form.helperIds ?? [],
    machine: {
      id: machine.id,
      code: machine.code,
      name: machine.name,
      lineName: line.name,
      facilityName: facility.name,
    },
    // Prosedürü kayda kopyalıyorum. Tanım sonradan değişse de bu kayıt o günkü adımları gösterir.
    procedure: structuredClone({
      id: procedure.id,
      code: procedure.code,
      name: procedure.name,
      version: version.version,
      materialRequired: version.materialRequired,
      phases: version.phases,
    }),
    materials: form.materials ?? [],
    workOrder: form.workOrder.trim(),
    note: form.note ?? "",
    openedAt: now,
    // Kayıt açmak temizliğe başlamak değil, süre ilk adım başlayınca başlayacak.
    startedAt: null,
    completedAt: null,
    deviations: [],
    steps: version.phases.flatMap((phase) =>
      phase.steps.map((step) => ({
        stepId: step.id,
        phaseId: phase.id,
        title: step.title,
        status: "pending",
        // Kaydı açan varsayılan görevli, gerekirse adımda başkaları da eklenecek.
        people: [user.id],
        sessions: [],
        pauses: [],
      })),
    ),
  };
  db.records.push(record);
  addLog(db, user, record.id, "Kayıt açıldı", record.no);
  return record;
}

// Tanım işlemlerini de denetim izine yazıyorum.
export function addMachine(db, user, form) {
  const machine = {
    id: `machine${db.machines.length + 1}`,
    lineId: form.lineId,
    code: form.code.trim(),
    name: form.name.trim(),
    active: true,
  };
  db.machines.push(machine);
  form.procedureIds?.forEach((id) =>
    db.procedures.find((p) => p.id === id).machineIds.push(machine.id),
  );
  addLog(db, user, null, "Makine eklendi", machine.code);
}

// Makineyi silmiyorum, pasif yapıyorum. Böylece eski kayıtlar kaybolmuyor.
export function setMachineActive(db, user, machineId, active) {
  const machine = db.machines.find((m) => m.id === machineId);
  machine.active = active;
  addLog(
    db,
    user,
    null,
    active ? "Makine geri alındı" : "Makine kaldırıldı",
    machine.code,
  );
}
