export type IndexedDbKvOptions = {
  dbName?: string;
  storeName?: string;
  version?: number;
};

type OpenedDb = {
  db: IDBDatabase;
  storeName: string;
};

const DEFAULTS: Required<IndexedDbKvOptions> = {
  dbName: "omaya_cache",
  storeName: "kv",
  version: 1,
};

function isIndexedDbAvailable() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(opts?: IndexedDbKvOptions): Promise<OpenedDb> {
  const { dbName, storeName, version } = { ...DEFAULTS, ...(opts || {}) };

  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const req = indexedDB.open(dbName, version);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
    req.onsuccess = () => resolve({ db: req.result, storeName });
    req.onerror = () => reject(req.error || new Error("Failed to open IndexedDB"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction error"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}

export async function idbGet<T>(key: string, opts?: IndexedDbKvOptions): Promise<T | null> {
  try {
    const { db, storeName } = await openDb(opts);
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error || new Error("IndexedDB get failed"));
    });
  } catch {
    return null;
  }
}

export async function idbSet<T>(key: string, value: T, opts?: IndexedDbKvOptions): Promise<boolean> {
  try {
    const { db, storeName } = await openDb(opts);
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value as any, key);
    await txDone(tx);
    return true;
  } catch {
    return false;
  }
}

export async function idbDel(key: string, opts?: IndexedDbKvOptions): Promise<boolean> {
  try {
    const { db, storeName } = await openDb(opts);
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    await txDone(tx);
    return true;
  } catch {
    return false;
  }
}

