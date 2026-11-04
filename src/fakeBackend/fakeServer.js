//Servisten data geliyor gibi davranmak için API
import { loadDb, saveDb } from "./fakeDb";
import * as cleaningService from "./cleaningService";

const routes = [
  {
    method: "get",
    path: /^\/users$/,
    run: (db) => db.users.filter((u) => u.active),
  },
  {
    method: "get",
    path: /^\/definitions$/,
    run: (db) => ({
      facilities: db.facilities,
      lines: db.lines,
      machines: db.machines,
      materials: db.materials,
      procedures: db.procedures,
      users: db.users,
    }),
  },

  {
    method: "post",
    path: /^\/machines$/,
    run: (db, user, _params, body) =>
      cleaningService.addMachine(db, user, body),
  },
  {
    method: "post",
    path: /^\/machines\/(\w+)\/active$/,
    run: (db, user, [id], body) =>
      cleaningService.setMachineActive(db, user, id, body.active),
  },
];
export async function fakeAdapter(config) {
  const route = routes.find(
    (r) => r.method === config.method && r.path.test(config.url),
  );
  const params = route ? config.url.match(route.path).slice(1) : [];
  const body = config.data ? JSON.parse(config.data) : {};

  try {
    if (!route) throw new Error("Adres bulunamadı.");
    const db = loadDb();
    const user = db.users.find((u) => u.id === config.headers["x-user-id"]);
    const data = route.run(db, user, params, body);
    saveDb(db);
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
