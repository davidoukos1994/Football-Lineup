
/*
  Football Coach v8.0 IndexedDB Storage Layer

  This file keeps the existing app working but moves heavy saved data away
  from LocalStorage into IndexedDB. The app can still call localStorage.getItem()
  and localStorage.setItem(), but those calls are mirrored into IndexedDB.
*/
(function () {
  const DB_NAME = "FootballCoachDB";
  const DB_VERSION = 1;
  const STORE_NAME = "kv";
  const MIGRATION_FLAG = "footballCoachV80IndexedDBMigrationDone";
  const RELOAD_FLAG = "footballCoachV80ReloadedAfterIDBLoad";

  const original = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem,
    clear: Storage.prototype.clear,
    key: Storage.prototype.key,
    get length() { return window.localStorage.length; }
  };

  const cache = new Map();
  let db = null;
  let ready = false;
  let pendingWrites = [];

  function shouldManageKey(key) {
    return /football|coach|lineup|v7|v8|roster|attendance|history|rounds|robust/i.test(String(key || ""));
  }

  function bootCacheFromLocalStorage() {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = original.key.call(window.localStorage, i);
        if (!key) continue;
        const value = original.getItem.call(window.localStorage, key);
        if (shouldManageKey(key)) cache.set(key, value);
      }
    } catch (err) {}
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB not supported"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function () {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };

      request.onsuccess = function () {
        db = request.result;
        ready = true;
        resolve(db);
      };

      request.onerror = function () {
        reject(request.error || new Error("IndexedDB open failed"));
      };
    });
  }

  function idbGetAll() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function idbSet(key, value) {
    if (!ready || !db) {
      pendingWrites.push({ key, value });
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ key, value, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function idbRemove(key) {
    if (!ready || !db) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function flushPendingWrites() {
    const writes = pendingWrites.slice();
    pendingWrites = [];
    writes.forEach((item) => idbSet(item.key, item.value));
  }

  function migrateLocalStorageToIDB() {
    try {
      const done = original.getItem.call(window.localStorage, MIGRATION_FLAG);
      if (done === "1") return;

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = original.key.call(window.localStorage, i);
        if (!key || !shouldManageKey(key)) continue;
        const value = original.getItem.call(window.localStorage, key);
        cache.set(key, value);
        idbSet(key, value);
      }

      original.setItem.call(window.localStorage, MIGRATION_FLAG, "1");
    } catch (err) {}
  }

  function loadIDBIntoCache() {
    return idbGetAll().then((items) => {
      let loadedAny = false;

      items.forEach((item) => {
        if (!item || !item.key) return;
        if (!shouldManageKey(item.key)) return;
        cache.set(item.key, item.value);
        loadedAny = true;
      });

      // If page first loaded before IndexedDB was ready, reload once so the old app
      // can read the now-populated cache synchronously through localStorage.getItem().
      if (loadedAny && sessionStorage.getItem(RELOAD_FLAG) !== "1") {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        setTimeout(() => location.reload(), 250);
      }
    });
  }

  function patchLocalStorage() {
    Storage.prototype.getItem = function (key) {
      if (this === window.localStorage && shouldManageKey(key) && cache.has(String(key))) {
        return cache.get(String(key));
      }
      try {
        return original.getItem.call(this, key);
      } catch (err) {
        return null;
      }
    };

    Storage.prototype.setItem = function (key, value) {
      key = String(key);
      value = String(value);

      if (this === window.localStorage && shouldManageKey(key)) {
        cache.set(key, value);
        idbSet(key, value);

        // Keep only small values in LocalStorage so Safari quota is not filled.
        try {
          if (value.length < 120000) {
            original.setItem.call(this, key, value);
          } else {
            original.removeItem.call(this, key);
          }
        } catch (err) {
          try { original.removeItem.call(this, key); } catch (e) {}
        }
        return;
      }

      return original.setItem.call(this, key, value);
    };

    Storage.prototype.removeItem = function (key) {
      if (this === window.localStorage && shouldManageKey(key)) {
        cache.delete(String(key));
        idbRemove(String(key));
      }
      try {
        return original.removeItem.call(this, key);
      } catch (err) {}
    };

    Storage.prototype.clear = function () {
      if (this === window.localStorage) {
        cache.clear();
        try {
          if (db) {
            const tx = db.transaction(STORE_NAME, "readwrite");
            tx.objectStore(STORE_NAME).clear();
          }
        } catch (err) {}
      }
      return original.clear.call(this);
    };
  }

  function exposeHelpers() {
    window.FootballCoachStorage = {
      type: "IndexedDB",
      dbName: DB_NAME,
      storeName: STORE_NAME,
      isReady: () => ready,
      saveNow: () => {
        cache.forEach((value, key) => idbSet(key, value));
        return true;
      },
      exportAll: async () => {
        if (!ready) await openDb();
        const items = await idbGetAll();
        const out = {};
        items.forEach((item) => { out[item.key] = item.value; });
        return out;
      },
      clearIndexedDB: async () => {
        if (!ready) await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const req = tx.objectStore(STORE_NAME).clear();
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      }
    };
  }

  bootCacheFromLocalStorage();
  patchLocalStorage();
  exposeHelpers();

  openDb()
    .then(() => {
      migrateLocalStorageToIDB();
      flushPendingWrites();
      return loadIDBIntoCache();
    })
    .catch(() => {
      // If IndexedDB is blocked, app will still try LocalStorage.
      ready = false;
    });
})();
