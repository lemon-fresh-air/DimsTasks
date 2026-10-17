const DB_NAME = "dims-tasks-db";
const DB_VERSION = 3;
const STORE_NAMES = ["lists", "sections", "projects", "tasks", "settings"];
const INBOX_LIST_ID = "system-list-inbox";
const TODAY_LIST_ID = "system-list-today";
const APPEARANCE_SETTINGS_ID = "appearance";
const TASK_DEFAULTS_SETTINGS_ID = "task-defaults";
const WORKFLOW_SETTINGS_ID = "workflow";
const BACKUP_NAMING_SETTINGS_ID = "backup-naming";

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
      projectPosition: Number.isFinite(task.projectPosition) ? task.projectPosition : null,
      returnedToInboxAt: task.returnedToInboxAt ?? null
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
  exportAll: async () => {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAMES, "readonly");
      const data = {};
      for (const name of STORE_NAMES) {
        tx.objectStore(name).getAll().onsuccess = event => { data[name] = event.target.result; };
      }
      tx.oncomplete = () => { db.close(); resolve(data); };
      tx.onerror = () => { db.close(); reject(tx.error); };
      tx.onabort = () => { db.close(); reject(tx.error || new Error("Не вдалося прочитати дані")); };
    });
  },
  replaceAll: data => transact(STORE_NAMES, "readwrite", (_tx, stores) => {
    for (const name of STORE_NAMES) {
      stores[name].clear();
      for (const record of data[name] || []) stores[name].put(record);
    }
    if (!(data.lists || []).some(list => list.id === INBOX_LIST_ID)) {
      const now = new Date().toISOString();
      stores.lists.put({ id: INBOX_LIST_ID, entityVersion: 1, title: "Інбокс", description: "", kind: "inbox", position: 0, customFields: {}, createdAt: now, updatedAt: now });
    }
  }),
  mergeAll: async (incoming, merge) => {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAMES, "readwrite");
      const stores = Object.fromEntries(STORE_NAMES.map(name => [name, tx.objectStore(name)]));
      const local = {};
      let result;
      let failure;
      for (const name of STORE_NAMES) {
        stores[name].getAll().onsuccess = event => {
          local[name] = event.target.result;
          if (Object.keys(local).length !== STORE_NAMES.length) return;
          try {
            result = merge(local, incoming);
            for (const storeName of STORE_NAMES) {
              stores[storeName].clear();
              for (const record of result.data[storeName]) stores[storeName].put(record);
            }
          } catch (error) {
            failure = error;
            tx.abort();
          }
        };
      }
      tx.oncomplete = () => { db.close(); resolve(result); };
      tx.onerror = () => { db.close(); reject(tx.error); };
      tx.onabort = () => { db.close(); reject(failure || tx.error || new Error("Злиття скасовано")); };
    });
  }
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
  }),
  deleteAndMoveTasksToInbox: (listId, updatedAt) => transact(["lists", "sections", "tasks"], "readwrite", (_tx, stores) => {
    const taskRequest = stores.tasks.index("by-list").openCursor(IDBKeyRange.only(listId));
    taskRequest.onsuccess = () => {
      const cursor = taskRequest.result;
      if (!cursor) {
        stores.lists.delete(listId);
        return;
      }
      cursor.update({ ...cursor.value, listId: INBOX_LIST_ID, sectionId: null, updatedAt });
      cursor.continue();
    };
    const sectionRequest = stores.sections.index("by-list").openKeyCursor(IDBKeyRange.only(listId));
    sectionRequest.onsuccess = () => {
      const cursor = sectionRequest.result;
      if (!cursor) return;
      stores.sections.delete(cursor.primaryKey);
      cursor.continue();
    };
  }),
  deleteManyAndMoveTasksToInbox: (listIds, updatedAt) => transact(["lists", "sections", "tasks"], "readwrite", (_tx, stores) => {
    for (const listId of listIds) {
      stores.lists.delete(listId);
      const taskRequest = stores.tasks.index("by-list").openCursor(IDBKeyRange.only(listId));
      taskRequest.onsuccess = () => {
        const cursor = taskRequest.result;
        if (!cursor) return;
        cursor.update({ ...cursor.value, listId: INBOX_LIST_ID, sectionId: null, updatedAt });
        cursor.continue();
      };
      const sectionRequest = stores.sections.index("by-list").openKeyCursor(IDBKeyRange.only(listId));
      sectionRequest.onsuccess = () => {
        const cursor = sectionRequest.result;
        if (!cursor) return;
        stores.sections.delete(cursor.primaryKey);
        cursor.continue();
      };
    }
  })
};

const projectDb = {
  all: () => appDb.all("projects"),
  put: project => appDb.put("projects", project),
  putMany: projects => transact("projects", "readwrite", (_tx, stores) => {
    for (const project of projects) stores.projects.put(project);
  }),
  completeManyWithTasks: (projectUpdates, updatedAt, completeTasks) => transact(["projects", "tasks"], "readwrite", (_tx, stores) => {
    const ids = new Set(projectUpdates.map(project => project.id));
    for (const project of projectUpdates) stores.projects.put(project);
    const request = stores.tasks.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      const task = cursor.value;
      if (ids.has(task.projectId) && task.status === "active") {
        cursor.update(completeTasks
          ? { ...task, status: "completed", completedAt: updatedAt, updatedAt }
          : { ...task, projectId: null, projectPosition: null, updatedAt });
      }
      cursor.continue();
    };
  }),
  deleteManyWithTasks: (projectIds, updatedAt, detachTasks) => transact(["projects", "tasks"], "readwrite", (_tx, stores) => {
    const ids = new Set(projectIds);
    const request = stores.tasks.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      if (ids.has(cursor.value.projectId)) {
        if (detachTasks) cursor.update({ ...cursor.value, projectId: null, projectPosition: null, updatedAt });
        else cursor.delete();
      }
      cursor.continue();
    };
    for (const projectId of ids) stores.projects.delete(projectId);
  }),
  deleteAndDetachTasks: (projectId, updatedAt) => transact(["projects", "tasks"], "readwrite", (_tx, stores) => {
    const request = stores.tasks.index("by-project").openCursor(IDBKeyRange.only(projectId));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        stores.projects.delete(projectId);
        return;
      }
      cursor.update({ ...cursor.value, projectId: null, projectPosition: null, updatedAt });
      cursor.continue();
    };
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
  },
  todayListId: async () => {
    const settings = await appDb.get("settings", TASK_DEFAULTS_SETTINGS_ID);
    return typeof settings?.todayListId === "string" ? settings.todayListId : null;
  },
  setTodayListId: async listId => {
    const current = await appDb.get("settings", TASK_DEFAULTS_SETTINGS_ID);
    const now = new Date().toISOString();
    await appDb.put("settings", {
      id: TASK_DEFAULTS_SETTINGS_ID,
      entityVersion: 1,
      todayListId: typeof listId === "string" ? listId : INBOX_LIST_ID,
      createdAt: current?.createdAt || now,
      updatedAt: now
    });
  },
  returnOverdueToInbox: async () => {
    const settings = await appDb.get("settings", WORKFLOW_SETTINGS_ID);
    return settings?.returnOverdueToInbox === true;
  },
  setReturnOverdueToInbox: async enabled => {
    const current = await appDb.get("settings", WORKFLOW_SETTINGS_ID);
    const now = new Date().toISOString();
    await appDb.put("settings", {
      id: WORKFLOW_SETTINGS_ID,
      entityVersion: 1,
      returnOverdueToInbox: enabled === true,
      createdAt: current?.createdAt || now,
      updatedAt: now
    });
  },
  backupNaming: async () => {
    const settings = await appDb.get("settings", BACKUP_NAMING_SETTINGS_ID);
    return {
      prefix: typeof settings?.prefix === "string" && settings.prefix.trim() ? settings.prefix : "Dimstasks",
      nextVersion: Number.isSafeInteger(settings?.nextVersion) && settings.nextVersion > 0 ? settings.nextVersion : 1
    };
  },
  setBackupNaming: async (prefix, nextVersion) => {
    const current = await appDb.get("settings", BACKUP_NAMING_SETTINGS_ID);
    const now = new Date().toISOString();
    await appDb.put("settings", {
      id: BACKUP_NAMING_SETTINGS_ID,
      entityVersion: 1,
      prefix: typeof prefix === "string" && prefix.trim() ? prefix : "Dimstasks",
      nextVersion: Number.isSafeInteger(nextVersion) && nextVersion > 0 ? nextVersion : 1,
      createdAt: current?.createdAt || now,
      updatedAt: now
    });
  }
};

