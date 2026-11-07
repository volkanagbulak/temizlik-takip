// src/fakeBackend/mediaStore.js
// Sahte dosya sunucusu. Görsel ve videolar localStorage'a sığmadığı için tarayıcının
// büyük dosyalar için olan deposunda (IndexedDB) tutuluyor. Kayıtlarda yalnızca dosyanın
// adresi ("media:...") duruyor. Gerçek sistemde dosya sunucuya yüklenir, kayıtta adresi tutulur.
const DB_NAME = "temizlikMedia";
const STORE = "files";

function openStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run(mode, action) {
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMediaFile(file) {
  const id = `media:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await run("readwrite", (store) => store.put(file, id));
  return id;
}

export const loadMediaFile = (id) => run("readonly", (store) => store.get(id));

export const clearMediaFiles = () => run("readwrite", (store) => store.clear());
