const DB_NAME = "dims-tasks-db";
const DB_VERSION = 3;
const STORE_NAMES = ["lists", "sections", "projects", "tasks", "settings"];
const INBOX_LIST_ID = "system-list-inbox";
const TODAY_LIST_ID = "system-list-today";
const APPEARANCE_SETTINGS_ID = "appearance";

function ensureIndex(store, name, keyPath, options = {}) {
  if (!store.indexNames.contains(name)) store.createIndex(name, keyPath, options);
}

function configureStore(db, transaction, name) {
  const store = db.objectStoreNames.contains(name)
    ? transaction.objectStore(name)
    : db.createObjectStore(name, { keyPath: "id" });
  if (name === "lists") {
    ensureIndex(store, "by-kind", "kind");
    ensureIndex(store, "by-position", "position");
  }
  if (name === "sections") {
    ensureIndex(store, "by-list", "listId");
    ensureIndex(store, "by-list-position", ["listId", "position"]);
  }
  if (name === "projects") {
    ensureIndex(store, "by-status", "status");
    ensureIndex(store, "by-position", "position");
  }
  if (name === "tasks") {
    ensureIndex(store, "by-list", "listId");
    ensureIndex(store, "by-section", "sectionId");
    ensureIndex(store, "by-project", "projectId");
    ensureIndex(store, "by-status", "status");
    ensureIndex(store, "by-due-date", "dueDate");
    ensureIndex(store, "by-list-status", ["listId", "status"]);
    ensureIndex(store, "by-project-position", ["projectId", "projectPosition"]);
  }
  return store;
}

function migrateLegacyTasks(store) {
  const request = store.openCursor();
  request.onsuccess = () => {
    const cursor = request.result;
    if (!cursor) return;
    const task = cursor.value;
    const completed = task.status === "completed" || task.done === true;
    cursor.update({
      ...task,
      entityVersion: task.entityVersion || 1,
      customFields: task.customFields || {},
      listId: task.listId || INBOX_LIST_ID,
      sectionId: task.sectionId ?? null,
      projectId: task.projectId ?? null,
      description: task.description || "",
      status: completed ? "completed" : "active",
      completedAt: completed ? (task.completedAt || task.updatedAt || new Date().toISOString()) : null,
      dueTime: task.dueTime ?? null,
      position: Number.isFinite(task.position) ? task.position : 0,
      projectPosition: Number.isFinite(task.projectPosition) ? task.projectPosition : null
    });
    cursor.continue();
  };
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = event => {
      const db = request.result;
      const transaction = request.transaction;
      const stores = Object.fromEntries(STORE_NAMES.map(name => [name, configureStore(db, transaction, name)]));
      if (event.oldVersion < 2) {
        const now = new Date().toISOString();
        stores.lists.put({ id: INBOX_LIST_ID, entityVersion: 1, title: "Інбокс", description: "", kind: "inbox", position: 0, customFields: {}, createdAt: now, updatedAt: now });
        migrateLegacyTasks(stores.tasks);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Оновлення бази заблоковане іншою вкладкою DimsTasks"));
  });
}

async function transact(storeNames, mode, action) {
  const names = Array.isArray(storeNames) ? storeNames : [storeNames];
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(names, mode);
    try {
      action(tx, Object.fromEntries(names.map(name => [name, tx.objectStore(name)])));
    } catch (error) {
      tx.abort();
      db.close();
      reject(error);
      return;
    }
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error("Транзакцію скасовано")); };
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const appDb = {
  all: async storeName => {
    const db = await openDatabase();
    try { return await requestResult(db.transaction(storeName, "readonly").objectStore(storeName).getAll()); }
    finally { db.close(); }
  },
  get: async (storeName, id) => {
    const db = await openDatabase();
    try { return await requestResult(db.transaction(storeName, "readonly").objectStore(storeName).get(id)); }
    finally { db.close(); }
  },
  put: (storeName, record) => transact(storeName, "readwrite", (_tx, stores) => stores[storeName].put(record)),
  delete: (storeName, id) => transact(storeName, "readwrite", (_tx, stores) => stores[storeName].delete(id)),
  exportAll: async () => Object.fromEntries(await Promise.all(STORE_NAMES.map(async name => [name, await appDb.all(name)]))),
  replaceAll: data => transact(STORE_NAMES, "readwrite", (_tx, stores) => {
    for (const name of STORE_NAMES) {
      stores[name].clear();
      for (const record of data[name] || []) stores[name].put(record);
    }
    if (!(data.lists || []).some(list => list.id === INBOX_LIST_ID)) {
      const now = new Date().toISOString();
      stores.lists.put({ id: INBOX_LIST_ID, entityVersion: 1, title: "Інбокс", description: "", kind: "inbox", position: 0, customFields: {}, createdAt: now, updatedAt: now });
    }
  })
};

const taskDb = {
  all: () => appDb.all("tasks"),
  put: task => appDb.put("tasks", task),
  delete: id => appDb.delete("tasks", id),
  putMany: tasks => transact("tasks", "readwrite", (_tx, stores) => {
    for (const task of tasks) stores.tasks.put(task);
  }),
  deleteMany: ids => transact("tasks", "readwrite", (_tx, stores) => {
    for (const id of ids) stores.tasks.delete(id);
  }),
  replaceAll: tasks => transact("tasks", "readwrite", (_tx, stores) => {
    stores.tasks.clear();
    for (const task of tasks) stores.tasks.put(task);
  })
};

const listDb = {
  all: () => appDb.all("lists"),
  put: list => appDb.put("lists", list),
  putMany: lists => transact("lists", "readwrite", (_tx, stores) => {
    for (const list of lists) stores.lists.put(list);
  })
};

const settingsDb = {
  theme: async () => {
    const settings = await appDb.get("settings", APPEARANCE_SETTINGS_ID);
    return settings?.theme === "dark" ? "dark" : "light";
  },
  setTheme: async theme => {
    const current = await appDb.get("settings", APPEARANCE_SETTINGS_ID);
    const now = new Date().toISOString();
    await appDb.put("settings", {
      id: APPEARANCE_SETTINGS_ID,
      entityVersion: 1,
      theme: theme === "dark" ? "dark" : "light",
      createdAt: current?.createdAt || now,
      updatedAt: now
    });
  }
};

