//Mock Datayı Dbden çekmiş gibi göstermek için geçici db
import { mockData } from "./mockData";
import { addSampleRecords } from "./sampleRecords";

const KEY = "temizlikDb";
// Veri yapısı değişince artırılıyor. Tarayıcıda eski yapıda veri varsa ekranlar çökmesin diye
// otomatik olarak yeni örnek veriyle başlanıyor.
const SCHEMA_VERSION = 4;

// Örnek tanımlar ve geçmiş tarihli örnek kayıtlarla yeni bir veri nesnesi üretir.
export function createDb() {
  const db = structuredClone(mockData);
  addSampleRecords(db, Date.now());
  db.schemaVersion = SCHEMA_VERSION;
  return db;
}

// Doküman backend beklemiyor ama veri sayfa yenilenince kaybolmamalı.
// O yüzden her şeyi tek nesnede tutup localStorage içine yazıyorum.
export function loadDb() {
  const text = localStorage.getItem(KEY);
  const stored = text ? JSON.parse(text) : null;
  if (stored?.schemaVersion === SCHEMA_VERSION) return stored;
  // İlk açılışta ya da eski yapıda veri varsa bir kez üretilip kaydediliyor.
  // Kaydetmezsem her okumada zamanlar biraz farklı üretilirdi.
  const db = createDb();
  saveDb(db);
  return db;
}

export function saveDb(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Tarayıcının veri alanı dolarsa işlem kaydedilmiyor.
    const error = new Error("Tarayıcının veri alanı doldu. Örnek veriye dönmeyi dene.");
    error.status = 413;
    throw error;
  }
}

export function resetDb() {
  localStorage.removeItem(KEY);
}
