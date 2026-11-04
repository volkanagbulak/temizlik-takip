// src/fakeBackend/cleaningService.js
// function fail(message, status = 400, code) {
//   const error = new Error(message);
//   error.status = status;
//   error.code = code;
//   throw error;
// }

export function addLog(db, user, recordId, action, detail = "") {
  db.auditLog.push({
    at: Date.now(),
    userId: user.id,
    recordId,
    action,
    detail,
  });
}

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
