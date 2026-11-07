// src/fakeBackend/sampleRecords.js
// Raporlar ve kayıt detayı boş açılmasın diye geçmiş tarihli örnek kayıtlar üretiyor.
// Kayıtlar gerçek akıştaki yapıyla aynı: çalışma aralıkları, kişiler, duraklatma, sapma ve
// denetim kayıtları. Elle JSON yazmak yerine üretiyorum ki süreler ve zamanlar tutarlı olsun.
import { makeFieldRef, makeRecordNo } from "./cleaningService";

const MIN = 60 * 1000;
const STEP_GAP = 30 * 1000; // Adımlar arası kısa geçiş süresi

// phaseMinutes: her fazda harcanan gerçek çalışma süresi. Fazın adımlarına eşit bölünüyor.
// pair: hangi fazlarda yardımcı da çalıştı. pause: hangi adımda ne kadar duraklatıldı.
const SCENARIOS = [
  { machineId: "machine1", procedureId: "procedure1", daysAgo: 9, at: "08:10", owner: "user1", helper: "user2", pair: [1], phaseMinutes: [18, 26, 12] },
  { machineId: "machine2", procedureId: "procedure1", daysAgo: 8, at: "10:00", owner: "user4", phaseMinutes: [12, 21, 10], deviationReason: "Parçalar önceki vardiyada sökülmüştü." },
  { machineId: "machine4", procedureId: "procedure2", daysAgo: 7, at: "11:00", owner: "user4", phaseMinutes: [11] },
  { machineId: "machine1", procedureId: "procedure1", daysAgo: 6, at: "13:20", owner: "user2", phaseMinutes: [16, 24, 11] },
  { machineId: "machine2", procedureId: "procedure3", daysAgo: 6, at: "16:05", owner: "user4", phaseMinutes: [7] },
  { machineId: "machine7", procedureId: "procedure1", daysAgo: 5, at: "07:50", owner: "user2", helper: "user4", pair: [0, 1], phaseMinutes: [20, 31, 14] },
  { machineId: "machine6", procedureId: "procedure2", daysAgo: 4, at: "15:15", owner: "user2", phaseMinutes: [13] },
  { machineId: "machine9", procedureId: "procedure2", daysAgo: 3, at: "08:00", owner: "user1", cancelAfterMin: 35 },
  { machineId: "machine2", procedureId: "procedure1", daysAgo: 3, at: "14:40", owner: "user1", phaseMinutes: [17, 20, 13] },
  { machineId: "machine1", procedureId: "procedure1", daysAgo: 2, at: "09:05", owner: "user1", phaseMinutes: [15, 22, 10], pause: { step: 6, minutes: 40, reason: "Mola" } },
  { machineId: "machine5", procedureId: "procedure3", daysAgo: 2, at: "11:45", owner: "user2", phaseMinutes: [4], deviationReason: "Küçük dökülme, hızlı müdahale yeterli oldu." },
  { machineId: "machine8", procedureId: "procedure2", daysAgo: 1, at: "09:30", owner: "user1", phaseMinutes: [8], deviationReason: "Yüzeyler temizdi, kısa kontrol yapıldı." },
];

function toTime(now, daysAgo, at) {
  const [hour, minute] = at.split(":").map(Number);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

function buildRecord(db, scenario, index, now) {
  const machine = db.machines.find((m) => m.id === scenario.machineId);
  const procedure = db.procedures.find((p) => p.id === scenario.procedureId);
  const version = procedure.versions[0];
  const line = db.lines.find((l) => l.id === machine.lineId);
  const facility = db.facilities.find((f) => f.id === line.facilityId);
  const material = db.materials[0];
  const openedAt = toTime(now, scenario.daysAgo, scenario.at);
  const logs = [];
  const log = (at, userId, action, detail = "") => logs.push({ at, userId, action, detail });

  const record = {
    id: `r${db.records.length + 1}`,
    no: makeRecordNo(db, facility, line, machine, procedure.category, openedAt),
    fieldRef: makeFieldRef(db, procedure.category, new Date(openedAt).getFullYear()),
    category: procedure.category,
    status: "completed",
    ownerId: scenario.owner,
    helperIds: scenario.helper ? [scenario.helper] : [],
    machine: { id: machine.id, code: machine.code, name: machine.name, lineName: line.name, facilityName: facility.name },
    procedure: structuredClone({ id: procedure.id, code: procedure.code, name: procedure.name, version: version.version, materialRequired: version.materialRequired, phases: version.phases }),
    materials: version.materialRequired ? [{ code: material.code, name: material.name, ...material.lots[0] }] : [],
    workOrder: `IE-${2400 + index}`,
    note: "",
    openedAt,
    reservedUntil: openedAt + 30 * MIN,
    startedAt: null,
    completedAt: null,
    deviations: [],
    steps: [],
  };
  log(openedAt, scenario.owner, "Kayıt açıldı", record.no);

  // Rezervasyonu dolup sistem tarafından kapatılan kayıt: hiç adım başlamadı.
  if (scenario.cancelAfterMin) {
    record.status = "cancelled";
    record.steps = version.phases.flatMap((phase) =>
      phase.steps.map((step) => ({ stepId: step.id, phaseId: phase.id, title: step.title, status: "pending", people: [scenario.owner], sessions: [], pauses: [] })),
    );
    const at = openedAt + scenario.cancelAfterMin * MIN;
    record.cancel = { at, by: "system", reason: "Rezervasyon süresi doldu." };
    log(at, "system", "Rezervasyon süresi doldu");
    return { record, logs };
  }

  let time = openedAt + 6 * MIN; // Kayıt açıldıktan sonra makinenin başına gelme süresi
  record.startedAt = time;
  let stepNo = 0;
  version.phases.forEach((phase, phaseIndex) => {
    const people = scenario.pair?.includes(phaseIndex) ? [scenario.owner, scenario.helper] : [scenario.owner];
    const stepMs = Math.round((scenario.phaseMinutes[phaseIndex] * MIN) / phase.steps.length);
    phase.steps.forEach((step) => {
      const item = { stepId: step.id, phaseId: phase.id, title: step.title, status: "done", people, sessions: [], pauses: [] };
      log(time, scenario.owner, "Adım başlatıldı", step.title);
      if (scenario.pause?.step === stepNo) {
        // Adımın ortasında duraklatma: çalışma iki aralığa bölünüyor, aradaki süre ara sayılıyor.
        const half = Math.round(stepMs / 2);
        item.sessions.push({ start: time, end: time + half, people: [...people] });
        time += half;
        item.pauses.push({ at: time, reason: scenario.pause.reason });
        log(time, scenario.owner, "Adım duraklatıldı", `${step.title}: ${scenario.pause.reason}`);
        time += scenario.pause.minutes * MIN;
        log(time, scenario.owner, "Adım sürdürüldü", step.title);
        item.sessions.push({ start: time, end: time + stepMs - half, people: [...people] });
        time += stepMs - half;
      } else {
        item.sessions.push({ start: time, end: time + stepMs, people: [...people] });
        time += stepMs;
      }
      log(time, scenario.owner, "Adım tamamlandı", step.title);
      record.steps.push(item);
      time += STEP_GAP;
      stepNo += 1;
    });
    const workMs = scenario.phaseMinutes[phaseIndex] * MIN;
    if (workMs < phase.minMinutes * MIN) {
      record.deviations.push({ phaseName: phase.name, workMs, minMs: phase.minMinutes * MIN, reason: scenario.deviationReason, by: scenario.owner, at: time - STEP_GAP });
    }
  });
  record.completedAt = time - STEP_GAP;
  log(record.completedAt, scenario.owner, "Temizlik tamamlandı");
  return { record, logs };
}

// Kayıt numaraları sıra içerdiği için kayıtlar tarih sırasıyla ekleniyor.
export function addSampleRecords(db, now) {
  SCENARIOS.map((scenario, index) => ({ scenario, index, openedAt: toTime(now, scenario.daysAgo, scenario.at) }))
    .sort((a, b) => a.openedAt - b.openedAt)
    .forEach(({ scenario, index }) => {
      const { record, logs } = buildRecord(db, scenario, index, now);
      db.records.push(record);
      logs.forEach((entry) => db.auditLog.push({ ...entry, recordId: record.id }));
    });
}
