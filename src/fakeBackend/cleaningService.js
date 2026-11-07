// src/fakeBackend/cleaningService.js
import { isExpired, phaseStats } from "../utils/time";
// Bu dosya backend'in vereceği cevapları taklit ediyor. Boş alan gibi kontroller formda,
// makine, yetki ve adım sırası gibi kurallar burada. Doküman yalnızca ekran kontrolünü
// yeterli bulmuyor. Hata kodları: 403 yetki, 409 çakışma, 422 iş kuralı.
export function fail(message, status = 400, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  throw error;
}

// Yetki kuralları tek yerde. Hem servisin kararı hem ekrana giden permissions bilgisi
// bu fonksiyonları kullanıyor, böylece ekranda görünen ile servisin kararı ayrışmıyor.
const isOpenRecord = (record) => record.status === "opened" || record.status === "in_progress";

// Vaka: adımı yalnızca işin sahibi veya o adımda görevli kişiler ilerletebilir.
// Yöneticinin rolü müdahale, adım yürütmüyor (bu bizim varsayımımız).
export function canOperateStep(record, step, user) {
  return user.role === "operator" && (record.ownerId === user.id || step.people.includes(user.id));
}

// Adımın kimlerle yapılacağına kaydın sorumlusu karar veriyor.
export function canEditPeople(record, user) {
  return user.role === "operator" && record.ownerId === user.id;
}

// Operatör yalnızca kendi başlamamış kaydını, yönetici her açık kaydı kapatabiliyor.
export function canCancel(record, user) {
  if (!isOpenRecord(record)) return false;
  return user.role === "admin" || (record.ownerId === user.id && record.status === "opened");
}

// Ekran butonları bu bilgiye göre gösteriyor, kuralı kendisi hesaplamıyor.
export function getPermissions(record, user) {
  const step = getCurrentStep(record);
  const open = isOpenRecord(record) && Boolean(step);
  return {
    canOperate: open && canOperateStep(record, step, user),
    canEditPeople: open && canEditPeople(record, user),
    canCancel: canCancel(record, user),
  };
}

function requireAdmin(user) {
  if (user.role !== "admin") fail("Bu işlem yönetici yetkisi ister.", 403);
}

function requireOperateStep(record, step, user) {
  if (!canOperateStep(record, step, user)) fail("Bu adımı yalnızca kaydın sorumlusu ve adımda görevli kişiler ilerletebilir.", 403);
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
  return category === "emergency" ? `${prefix}-AC${order}` : `${prefix}-${order}`;
}

// Normal temizliğin saha referansını sistem üretiyor. Acil kayıtlar saha defterine
// işlenmediği için referansları yok.
export function makeFieldRef(db, category, year) {
  if (category === "emergency") return null;
  const count = db.records.filter((r) => r.fieldRef?.startsWith(`SAHA-${year}`)).length + 1;
  return `SAHA-${year}-${String(count).padStart(5, "0")}`;
}

// Kayıt burada açılıyor. Ekranda listeleri süzüyorum ama asıl kontrol burada,
// çünkü kişi rastgele makine veya form seçememeli.
// Makinenin açık kaydını bulur. Durumu ayrıca saklamıyorum, kayıttan hesaplıyorum.
// Böylece rezervasyon süresi dolunca makine kendiliğinden boşa çıkıyor.
export function getMachineLock(db, machineId, now) {
  const record = db.records.find((r) => r.machine.id === machineId && (r.status === "opened" || r.status === "in_progress"));
  if (!record) return null;
  if (record.status === "in_progress") return { record, state: "in_progress" };
  return { record, state: now > record.reservedUntil ? "expired" : "reserved" };
}

// Ekran dolu makineyi önceden gösterebilsin diye. Son kararı yine openRecord veriyor,
// çünkü iki kişi aynı anda boş görüp aynı makineyi seçebilir.
export function getMachines(db, now) {
  return db.machines
    .filter((m) => m.active)
    .map((machine) => {
      const lock = getMachineLock(db, machine.id, now);
      const taken = lock && lock.state !== "expired";
      const owner = taken ? db.users.find((u) => u.id === lock.record.ownerId) : null;
      return { ...machine, lock: taken ? { recordNo: lock.record.no, ownerName: owner.name } : null };
    });
}

export function openRecord(db, user, form) {
  // Kaydı sahadaki operatör açıyor, yönetici müdahale ediyor (bizim varsayımımız).
  if (user.role !== "operator") fail("Kaydı yalnızca operatör açabilir.", 403);
  const machine = db.machines.find((m) => m.id === form.machineId);
  if (!machine || !machine.active) fail("Bu makine seçilemez.", 422);
  const procedure = db.procedures.find((p) => p.id === form.procedureId);
  if (!procedure || !procedure.machineIds.includes(machine.id)) fail("Bu form bu makine için tanımlı değil.", 422);
  // Yeni kayıt her zaman formun son versiyonuyla açılıyor.
  const version = procedure.versions.at(-1);
  // Ekran yalnızca malzeme ve lot seçimini gönderiyor. Kod, ad ve son kullanma tarihi
  // tanımdan alınıyor, böylece kayda giren malzeme bilgisi ekrandan değiştirilemiyor.
  const materials = (form.materialLots ?? []).map(({ materialId, lot }) => {
    const material = db.materials.find((m) => m.id === materialId);
    const selected = material?.lots.find((l) => l.lot === lot);
    if (!selected) fail("Seçilen malzeme bulunamadı.", 422);
    // Son kullanma tarihi geçmiş malzeme kullanılamaz (vakada yok, bizim varsayımımız).
    if (isExpired(selected.expiry)) fail(`${material.code} ${lot} lotunun son kullanma tarihi geçmiş.`, 422);
    return { code: material.code, name: material.name, ...selected };
  });
  // Formdaki zorunluluk kontrolü kullanıcıya kolaylık, asıl kontrol burada.
  if (version.materialRequired && materials.length === 0) fail("Bu form için malzeme zorunlu.", 422);
  if (!form.workOrder?.trim()) fail("İş emri zorunlu.", 422);
  const now = Date.now();
  // Makinede devam eden veya rezerve kayıt varsa ikinci kayıt açılamıyor.
  const lock = getMachineLock(db, machine.id, now);
  if (lock && lock.state !== "expired") {
    const owner = db.users.find((u) => u.id === lock.record.ownerId);
    fail(`${machine.code} ${owner.name} tarafından alındı.`, 409);
  }
  // Süresi dolmuş rezervasyon makineyi kilitlemesin, eski kayıt nedeniyle kapanıyor.
  if (lock) {
    lock.record.status = "cancelled";
    lock.record.cancel = { at: now, by: "system", reason: "Rezervasyon süresi doldu." };
    addLog(db, user, lock.record.id, "Rezervasyon süresi doldu");
  }

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
    materials,
    workOrder: form.workOrder.trim(),
    note: form.note ?? "",
    openedAt: now,
    // Kayıt 30 dakika makineyi ayırıyor. Bu süre bizim varsayımımız.
    reservedUntil: now + 30 * 60 * 1000,
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
  requireAdmin(user);
  const code = form.code?.trim().toUpperCase();
  const name = form.name?.trim();
  if (!code || !name) fail("Makine kodu ve adı zorunlu.", 422);
  if (!db.lines.some((l) => l.id === form.lineId)) fail("Hat bulunamadı.", 422);
  // Kayıt numarası makine kodunu içerdiği için kod benzersiz olmalı.
  if (db.machines.some((m) => m.code === code)) fail(`${code} kodlu makine zaten var.`, 409);
  const machine = {
    id: `machine${db.machines.length + 1}`,
    lineId: form.lineId,
    code,
    name,
    active: true,
  };
  db.machines.push(machine);
  form.procedureIds?.forEach((id) => db.procedures.find((p) => p.id === id).machineIds.push(machine.id));
  addLog(db, user, null, "Makine eklendi", `${machine.code} ${machine.name}`);
  return machine;
}

// Makineyi silmiyorum, pasif yapıyorum. Böylece eski kayıtlar kaybolmuyor.
export function setMachineActive(db, user, machineId, active) {
  requireAdmin(user);
  const machine = db.machines.find((m) => m.id === machineId);
  if (!machine) fail("Makine bulunamadı.", 404);
  // Açık kaydı olan makine kullanımdan kaldırılamıyor.
  if (!active && getMachineLock(db, machineId, Date.now())) fail("Bu makinede açık kayıt var.", 409);
  machine.active = active;
  addLog(db, user, null, active ? "Makine geri alındı" : "Makine kaldırıldı", machine.code);
}

// Tanım değişince eski versiyona dokunulmuyor, yeni versiyon ekleniyor. Kayıtlar açıldıkları
// andaki prosedürün kopyasını taşıdığı için etkilenmiyor, yeni kayıtlar yeni versiyonla açılıyor.
// Değiştirilebilenler vakadaki örnekler: faz minimum süresi, adım açıklaması, malzeme zorunluluğu.
export function createProcedureVersion(db, user, procedureId, form) {
  requireAdmin(user);
  const procedure = db.procedures.find((p) => p.id === procedureId);
  if (!procedure) fail("Prosedür bulunamadı.", 404);
  const latest = procedure.versions.at(-1);
  // İki yönetici aynı anda düzenlerse sonradan kaydeden, öncekinin değişikliğini ezmesin.
  if (form.baseVersion !== latest.version) fail("Prosedür başka biri tarafından güncellendi, sayfayı yenile.", 409);
  if (!form.note?.trim()) fail("Değişiklik nedeni zorunlu.", 422);

  const phases = latest.phases.map((phase) => {
    const changed = form.phases?.find((p) => p.id === phase.id);
    const minMinutes = changed?.minMinutes ?? phase.minMinutes;
    if (!Number.isInteger(minMinutes) || minMinutes < 1) fail(`${phase.name} için minimum süre en az 1 dakika olmalı.`, 422);
    return {
      ...structuredClone(phase),
      minMinutes,
      steps: phase.steps.map((step) => {
        const description = (changed?.steps?.find((s) => s.id === step.id)?.description ?? step.description).trim();
        if (!description) fail(`"${step.title}" adımının açıklaması boş olamaz.`, 422);
        return { ...structuredClone(step), description };
      }),
    };
  });
  const materialRequired = form.materialRequired ?? latest.materialRequired;
  // Hiçbir şey değişmediyse boş bir versiyon üretmiyorum.
  if (materialRequired === latest.materialRequired && JSON.stringify(phases) === JSON.stringify(latest.phases)) {
    fail("Değişiklik yok.", 422);
  }

  const next = { version: latest.version + 1, note: form.note.trim(), createdAt: Date.now(), createdBy: user.id, materialRequired, phases };
  procedure.versions.push(next);
  addLog(db, user, null, "Prosedür versiyonu oluşturuldu", `${procedure.code} v${next.version}: ${next.note}`);
  return next;
}

// Malzemeye yeni parti/lot ekleniyor. Eski lotlar silinmiyor, kayıtlar onları göstermeye devam ediyor.
export function addMaterialLot(db, user, materialId, form) {
  requireAdmin(user);
  const material = db.materials.find((m) => m.id === materialId);
  if (!material) fail("Malzeme bulunamadı.", 404);
  const lot = form.lot?.trim();
  if (!lot) fail("Lot numarası zorunlu.", 422);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.expiry ?? "")) fail("Son kullanma tarihi geçersiz.", 422);
  if (material.lots.some((l) => l.lot === lot)) fail(`${lot} lotu zaten tanımlı.`, 409);
  material.lots.push({ lot, expiry: form.expiry });
  addLog(db, user, null, "Lot eklendi", `${material.code} ${lot} SKT ${form.expiry}`);
}

//temizlik aşamaları
//güncel adımı bulma
export function getCurrentStep(record) {
  return record.steps.find((s) => s.status !== "done");
}

//Açık Adımı bulma
function getOpenStep(db, user, recordId, stepId) {
  const record = db.records.find((r) => r.id === recordId);
  if (!record) fail("Kayıt bulunamadı.", 404);
  if (record.status === "completed" || record.status === "cancelled") fail("Bu kayıt kapalı.", 409);
  const step = record.steps.find((s) => s.stepId === stepId);
  if (!step) fail("Adım bulunamadı.", 404);
  return { record, step };
}

// Temizlik Adımı Başlatma
export function startStep(db, user, recordId, stepId) {
  const { record, step } = getOpenStep(db, user, recordId, stepId);
  requireOperateStep(record, step, user);
  if (getCurrentStep(record).stepId !== stepId) fail("Adımlar sırayla yapılır.", 409);
  if (step.status !== "pending") fail("Bu adım daha önce başlatılmış.", 409);
  checkPeopleFree(db, step);
  const now = Date.now();
  step.status = "running";
  step.sessions.push({ start: now, end: null, people: [...step.people] });
  if (record.status === "opened") {
    record.status = "in_progress";
    record.startedAt = now;
  }
  //adım logu
  addLog(db, user, record.id, "Adım başlatıldı", step.title);
}

// Temizlik Adımı Bitirme
export function finishStep(db, user, recordId, stepId, reason) {
  const { record, step } = getOpenStep(db, user, recordId, stepId);
  requireOperateStep(record, step, user);
  if (step.status !== "running") fail("Yalnızca çalışan adım bitirilebilir.", 409);
  const now = Date.now();

  const phase = record.procedure.phases.find((p) => p.id === step.phaseId);
  const isLastInPhase = phase.steps.at(-1).id === stepId;
  if (isLastInPhase) {
    const stats = phaseStats(record, phase, now);
    if (!stats.metMin) {
      if (!reason?.trim()) fail("Minimum süre sağlanmadı.", 422, "MIN_NOT_MET");
      record.deviations.push({ phaseName: phase.name, workMs: stats.workMs, minMs: stats.minMs, reason, by: user.id, at: now });
    }
  }
  step.sessions.at(-1).end = now;
  step.status = "done";
  addLog(db, user, record.id, "Adım tamamlandı", step.title);
  if (record.steps.every((s) => s.status === "done")) {
    record.status = "completed";
    record.completedAt = now;
    addLog(db, user, record.id, "Temizlik tamamlandı");
  }
}

//Temizlik İçin Kişi Ekleme
export function setStepPeople(db, user, recordId, stepId, userIds) {
  const { record, step } = getOpenStep(db, user, recordId, stepId);
  if (!canEditPeople(record, user)) fail("Adımın görevlilerini yalnızca kaydın sorumlusu değiştirebilir.", 403);
  if (step.status === "done") fail("Biten adım değiştirilemez.", 409);
  if (step.status === "running") fail("Önce adımı duraklat.", 409);
  if (!userIds?.length) fail("En az bir kişi seçilmeli.", 422);
  // Adıma yalnızca aktif operatörler eklenebilir.
  const valid = userIds.every((id) => db.users.some((u) => u.id === id && u.role === "operator" && u.active));
  if (!valid) fail("Seçilen kişi bu adıma eklenemez.", 422);
  step.people = userIds;
  // Denetimde kimin adıma eklendiği de görünsün.
  const names = userIds.map((id) => db.users.find((u) => u.id === id).name).join(", ");
  addLog(db, user, record.id, "Adım görevlisi değiştirildi", `${step.title}: ${names}`);
}

// adım durdurma
export function pauseStep(db, user, recordId, stepId, reason) {
  const { record, step } = getOpenStep(db, user, recordId, stepId);
  requireOperateStep(record, step, user);
  if (step.status !== "running") fail("Yalnızca çalışan adım duraklatılır.", 409);
  // Duraklatmanın nedeni denetimde görünsün diye zorunlu.
  if (!reason?.trim()) fail("Duraklatma nedeni seçilmeli.", 422);
  const now = Date.now();
  step.sessions.at(-1).end = now;
  step.status = "paused";
  step.pauses.push({ at: now, reason });
  addLog(db, user, record.id, "Adım duraklatıldı", `${step.title}: ${reason}`);
}

//adım devam ettirme
export function resumeStep(db, user, recordId, stepId) {
  const { record, step } = getOpenStep(db, user, recordId, stepId);
  requireOperateStep(record, step, user);
  if (step.status !== "paused") fail("Bu adım duraklatılmış değil.", 409);
  checkPeopleFree(db, step);
  step.status = "running";
  step.sessions.push({ start: Date.now(), end: null, people: [...step.people] });
  addLog(db, user, record.id, "Adım sürdürüldü", step.title);
}

// Kişinin çalışan bir adımı olan kaydı bulur. Duraklatılan adım "running" olmadığı için
// kişiyi serbest bırakır, ama kayıt açık kaldığı için makineyi bırakmaz.
export function findBusyRecord(db, userId) {
  return db.records.find((r) => r.status === "in_progress" && r.steps.some((s) => s.status === "running" && s.people.includes(userId)));
}

// Ekran başka kayıtta çalışan kişiyi önceden gösterebilsin diye. Son kararı checkPeopleFree veriyor.
export function getAvailability(db) {
  return db.users
    .filter((u) => u.role === "operator" && u.active)
    .map(({ id, name }) => {
      const busy = findBusyRecord(db, id);
      return { id, name, busy: busy ? { recordId: busy.id, recordNo: busy.no } : null };
    });
}

// Adım başlamadan önce görevli herkesin boşta olduğunu kontrol eder.
function checkPeopleFree(db, step) {
  for (const userId of step.people) {
    const busy = findBusyRecord(db, userId);
    if (busy) {
      const person = db.users.find((u) => u.id === userId);
      fail(`${person.name} şu anda ${busy.no} kaydında çalışıyor.`, 409);
    }
  }
}

// Kayıt silinmiyor, nedeniyle kapanıyor. Operatör yalnızca kendi başlamamış kaydını,
// yönetici ise açıklama yazarak her açık kaydı kapatabiliyor.
export function cancelRecord(db, user, recordId, reason, detail = "") {
  const record = db.records.find((r) => r.id === recordId);
  if (!record) fail("Kayıt bulunamadı.", 404);
  if (record.status === "completed" || record.status === "cancelled") fail("Bu kayıt zaten kapalı.", 409);
  if (user.role === "admin") {
    if (!detail.trim()) fail("Yönetici kapatırken açıklama yazmalı.", 422);
  } else {
    if (record.ownerId !== user.id) fail("Başkasının kaydını kapatamazsın.", 403);
    if (record.status !== "opened") fail("Başlamış kaydı yalnızca yönetici kapatabilir.", 403);
  }

  const now = Date.now();
  // Çalışan adımın süresi kapatma anında bitiyor, yarım adımlar "interrupted" kalıyor.
  const running = record.steps.find((s) => s.status === "running");
  if (running) running.sessions.at(-1).end = now;
  record.steps.forEach((s) => {
    if (s.status === "running" || s.status === "paused") s.status = "interrupted";
  });
  record.status = "cancelled";
  record.cancel = { at: now, by: user.id, reason: detail ? `${reason}: ${detail}` : reason };
  addLog(db, user, record.id, "Kayıt kapatıldı", record.cancel.reason);
}
