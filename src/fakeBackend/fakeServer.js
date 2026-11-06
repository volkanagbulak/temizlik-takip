//Servisten data geliyor gibi davranmak için API
import { loadDb, saveDb } from "./fakeDb";
import * as cleaningService from "./cleaningService";

// "/records/:id" yazımını adresle karşılaştırılabilecek regex'e çevirir.
const toRegex = (path) => new RegExp(`^${path.replace(/:\w+/g, "(\\w+)")}$`);

function getDefinitions(db) {
  const { facilities, lines, machines, materials, procedures, users } = db;
  return { facilities, lines, machines, materials, procedures, users };
}

function getRecordDetail(db, id, user) {
  const record = db.records.find((r) => r.id === id);
  if (!record) cleaningService.fail("Kayıt bulunamadı.", 404);
  // Kaydın yapıldığı versiyon ile güncel versiyonu karşılaştırabilmek için.
  const procedure = db.procedures.find((p) => p.id === record.procedure.id);
  return {
    record,
    auditLog: db.auditLog.filter((l) => l.recordId === id),
    users: db.users,
    latestVersion: procedure.versions.at(-1).version,
    // Bu kullanıcı bu kayıtta neleri yapabilir. Ekran butonları buna göre gösteriyor.
    permissions: cleaningService.getPermissions(record, user),
  };
}

// Gerçek projede bu adresleri backend verirdi. Burada hangi adresin hangi işi yaptığını
// ben tanımlıyorum, sayfalar ise normal bir servise istek atıyormuş gibi çalışıyor.
const routes = [
  // Kullanıcı ve tanımlar
  // Giriş ekranı oturum açılmadan kullanıcıları okuyor, bu yüzden açık rota.
  { method: "get", path: "/users", public: true, run: (db) => db.users.filter((u) => u.active) },
  { method: "get", path: "/users/availability", run: (db) => cleaningService.getAvailability(db) },
  { method: "get", path: "/definitions", run: (db) => getDefinitions(db) },

  // Makineler
  { method: "get", path: "/machines", run: (db) => cleaningService.getMachines(db, Date.now()) },
  { method: "post", path: "/machines", run: (db, user, _params, body) => cleaningService.addMachine(db, user, body) },
  { method: "post", path: "/machines/:id/active", run: (db, user, [id], body) => cleaningService.setMachineActive(db, user, id, body.active) },

  // Kayıtlar
  { method: "get", path: "/records", run: (db, user) => db.records.map((r) => ({ ...r, permissions: cleaningService.getPermissions(r, user) })) },
  { method: "get", path: "/records/:id", run: (db, user, [id]) => getRecordDetail(db, id, user) },
  { method: "post", path: "/records", run: (db, user, _params, body) => cleaningService.openRecord(db, user, body) },
  { method: "post", path: "/records/:id/cancel", run: (db, user, [id], body) => cleaningService.cancelRecord(db, user, id, body.reason, body.detail) },

  // Adımlar
  { method: "post", path: "/records/:id/steps/:stepId/start", run: (db, user, [id, stepId]) => cleaningService.startStep(db, user, id, stepId) },
  { method: "post", path: "/records/:id/steps/:stepId/finish", run: (db, user, [id, stepId], body) => cleaningService.finishStep(db, user, id, stepId, body.reason) },
  { method: "post", path: "/records/:id/steps/:stepId/people", run: (db, user, [id, stepId], body) => cleaningService.setStepPeople(db, user, id, stepId, body.userIds) },
  // adım durdur devam et
  { method: "post", path: "/records/:id/steps/:stepId/pause", run: (db, user, [id, stepId], body) => cleaningService.pauseStep(db, user, id, stepId, body.reason) },
  { method: "post", path: "/records/:id/steps/:stepId/resume", run: (db, user, [id, stepId]) => cleaningService.resumeStep(db, user, id, stepId) },
];

// axios isteği ağa çıkmadan buraya geliyor. Kural hata fırlatırsa saveDb çalışmıyor,
// yani yanlış bir değişiklik veriye yazılmıyor.
export async function fakeAdapter(config) {
  const route = routes.find((r) => r.method === config.method && toRegex(r.path).test(config.url));
  const params = route ? config.url.match(toRegex(route.path)).slice(1) : [];
  const body = config.data ? JSON.parse(config.data) : {};

  try {
    if (!route) throw new Error("Adres bulunamadı.");
    const db = loadDb();
    const user = db.users.find((u) => u.id === config.headers["x-user-id"] && u.active);
    // Oturumu olmayan istek kurala hiç ulaşmıyor.
    if (!route.public && !user) cleaningService.fail("Oturum bulunamadı, tekrar giriş yap.", 401);
    const data = route.run(db, user, params, body);
    // Okuma isteği veriyi değiştirmiyor. Yazarsa başka sekmenin yeni verisini ezebilir.
    if (config.method !== "get") saveDb(db);
    return { data, status: 200, statusText: "OK", headers: {}, config };
  } catch (err) {
    const error = new Error(err.message);
    error.response = {
      status: err.status ?? 400,
      data: { code: err.code, message: err.message },
    };
    throw error;
  }
}
