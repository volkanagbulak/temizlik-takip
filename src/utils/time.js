/// Gerçek çalışma süresi Açık olduğu aralıklar toplanıyor
export function stepWorkMs(step, now) {
  return step.sessions.reduce((total, s) => total + (s.end ?? now) - s.start, 0);
}

//Efor hesaplaması Her aralıkta çalışan kişi sayısı ile çarpılıyor
export function stepEffortMs(step, now) {
  return step.sessions.reduce((total, s) => total + ((s.end ?? now) - s.start) * s.people.length, 0);
}

//fazların süre toplamları
export function phaseStats(record, phase, now) {
  // bu fazın adımları
  const steps = record.steps.filter((s) => s.phaseId === phase.id);
  const sessions = steps.flatMap((s) => s.sessions);
  const workMs = steps.reduce((total, s) => total + stepWorkMs(s, now), 0);
  const effortMs = steps.reduce((total, s) => total + stepEffortMs(s, now), 0);
  // ilk başlangıçtan son bitişe kadar geçen süre
  let elapsedMs = 0;
  if (sessions.length > 0) {
    const firstStart = Math.min(...sessions.map((s) => s.start));
    const lastEnd = Math.max(...sessions.map((s) => s.end ?? now));
    elapsedMs = lastEnd - firstStart;
  }
  // minimumu gerçek çalışmaya göre kontrol ediyorum
  const minMs = phase.minMinutes * 60000;
  return { workMs, effortMs, elapsedMs, gapMs: elapsedMs - workMs, minMs, metMin: workMs >= minMs };
}

export function recordStats(record, now) {
  const phases = record.procedure.phases.map((p) => phaseStats(record, p, now));
  const workMs = phases.reduce((total, p) => total + p.workMs, 0);
  const effortMs = phases.reduce((total, p) => total + p.effortMs, 0);
  const endAt = record.completedAt ?? record.cancel?.at ?? now;
  const elapsedMs = record.startedAt ? endAt - record.startedAt : 0;
  return { phases, workMs, effortMs, elapsedMs, gapMs: Math.max(0, elapsedMs - workMs) };
}

export function formatDuration(ms) {
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours} sa ${minutes} dk ${seconds} sn`;
  if (minutes > 0) return `${minutes} dk ${seconds} sn`;
  return `${seconds} sn`;
}
