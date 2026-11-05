//Mock Datayı Dbden çekmiş gibi göstermek için geçici db
import { mockData } from "./mockData";

const KEY = "temizlikDb";

// Doküman backend beklemiyor ama veri sayfa yenilenince kaybolmamalı.
// O yüzden her şeyi tek nesnede tutup localStorage içine yazıyorum.
export function loadDb() {
  const text = localStorage.getItem(KEY);
  return text ? JSON.parse(text) : structuredClone(mockData);
}

export function saveDb(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function resetDb() {
  localStorage.removeItem(KEY);
}
