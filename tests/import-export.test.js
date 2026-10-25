const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const model = fs.readFileSync(path.join(__dirname, "..", "src", "js", "model.js"), "utf8");
const importExport = fs.readFileSync(path.join(__dirname, "..", "src", "js", "import-export.js"), "utf8");
const context = vm.createContext({
  crypto: { randomUUID: () => "generated-id" },
  INBOX_LIST_ID: "inbox",
  DB_VERSION: 3,
  STORE_NAMES: ["lists", "sections", "projects", "tasks", "settings"],
  appDb: {},
  Blob,
  URL: { createObjectURL: () => "blob:test", revokeObjectURL: () => {} },
  document: { createElement: () => ({ click() {} }) }
});
vm.runInContext(`${model}\n${importExport}\nthis.backup = { parseBackup, readBackup, validateBackupData, mergeBackupData, completeBackupFields, backupFileName, withBackupNaming, preserveBackupNaming, normalizeBackupTodayLayout, BACKUP_FORMAT_VERSION };`, context);
const { parseBackup, readBackup, validateBackupData, mergeBackupData, completeBackupFields, backupFileName, withBackupNaming, preserveBackupNaming, normalizeBackupTodayLayout, BACKUP_FORMAT_VERSION } = context.backup;
const file = (value, name) => ({ name, text: async () => JSON.stringify(value) });
const stamp = "2026-01-01T00:00:00.000Z";
const base = id => ({ id, entityVersion: 1, createdAt: stamp, updatedAt: stamp, customFields: {} });
const data = {
  lists: [{ ...base("inbox"), title: "Інбокс", description: "", kind: "inbox", position: 0 }],
  sections: [], projects: [],
  tasks: [{ ...base("late"), listId: "inbox", sectionId: null, projectId: null, title: "Пізно", description: "", status: "active", completedAt: null, dueDate: null, dueTime: null, position: 0, todayPosition: 2, projectPosition: null, returnedToInboxAt: "2026-01-02T00:00:00.000Z" }],
  settings: [{ ...base("appearance"), theme: "dark", useSystemTheme: false }, { ...base("workflow"), returnOverdueToInbox: true }, { ...base("navigation"), startScreen: "projects" }]
};

test("current backup round-trip parser preserves appearance, workflow, and return marker", async () => {
  const restored = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: BACKUP_FORMAT_VERSION, data }));
  assert.equal(restored.settings[0].useSystemTheme, false);
  assert.equal(restored.settings[1].returnOverdueToInbox, true);
  assert.equal(restored.settings[2].startScreen, "projects");
  assert.equal(restored.tasks[0].returnedToInboxAt, data.tasks[0].returnedToInboxAt);
  assert.equal(restored.tasks[0].todayPosition, 2);
});

test("project fixed list survives format 14 and format 13 defaults to automatic", async () => {
  const current = structuredClone(data);
  current.lists.push({ ...base("work"), title: "Робота", description: "", kind: "regular", position: 1 });
  current.projects.push({ ...base("project"), title: "Проєкт", goal: "", description: "", status: "active", dueDate: null, dueTime: null, showCountdown: false, lastListId: "inbox", defaultListId: "work", addNewTasksFirst: true, completedAt: null, position: 0 });
  const restored = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: BACKUP_FORMAT_VERSION, data: current }));
  assert.equal(restored.projects[0].defaultListId, "work");
  delete current.projects[0].defaultListId;
  const older = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 13, data: current }));
  assert.equal(older.projects[0].defaultListId, null);
});

test("format 14 remains importable without a daily layout", async () => {
  const restored = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 14, data }));
  assert.equal(restored.settings.some(record => record.id === "today-layout"), false);
});

test("format 15 keeps its daily groups when imported into format 16", async () => {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const old = structuredClone(data);
  old.tasks[0].dueDate = date;
  old.settings.push({ ...base("today-layout"), date,
    groups: [{ id: "green", color: "#2D9E6B", collapsed: true, taskIds: ["late"] }],
    items: [{ type: "group", id: "green" }] });
  const restored = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 15, data: old }));
  assert.equal(restored.settings.find(record => record.id === "today-layout").groups[0].title, null);
});

test("current layout survives only its local date and loses missing or invisible references", async () => {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const current = structuredClone(data);
  current.tasks[0].dueDate = date;
  current.tasks.push({ ...current.tasks[0], id: "hidden", status: "completed" });
  current.settings.push({ ...base("today-layout"), date,
    groups: [{ id: "green", color: "#2D9E6B", title: "Мої справи", collapsed: false, taskIds: ["late", "hidden", "missing"] }],
    items: [{ type: "group", id: "green" }, { type: "task", id: "lost-outside" }] });
  const payload = { format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: BACKUP_FORMAT_VERSION, data: current };
  const restored = await parseBackup(file(payload));
  const layout = restored.settings.find(record => record.id === "today-layout");
  assert.deepEqual(Array.from(layout.groups[0].taskIds), ["late"]);
  assert.equal(layout.groups[0].title, "Мої справи");
  assert.deepEqual(Array.from(layout.items, item => item.type), ["group"]);
  assert.equal(normalizeBackupTodayLayout(restored, "2000-01-01").settings.some(record => record.id === "today-layout"), false);
});

test("malformed current layout is rejected before import and merge keeps one whole record", async () => {
  const current = structuredClone(data);
  current.settings.push({ ...base("today-layout"), date: "2026-01-01", groups: [], items: [] });
  const payload = { format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: BACKUP_FORMAT_VERSION, data: current };
  await assert.rejects(parseBackup(file(payload)), /денне компонування/);
  const local = structuredClone(data);
  local.settings.push({ ...base("today-layout"), date: "2026-01-01", groups: [{ id: "g", color: "#2D9E6B", collapsed: false, taskIds: [] }], items: [{ type: "group", id: "g" }] });
  const incoming = structuredClone(local);
  incoming.settings.find(record => record.id === "today-layout").groups = [{ id: "b", color: "#3A7BD5", collapsed: true, taskIds: [] }];
  incoming.settings.find(record => record.id === "today-layout").items = [{ type: "group", id: "b" }];
  incoming.settings.find(record => record.id === "today-layout").updatedAt = "2099-01-01T00:00:00.000Z";
  const merged = mergeBackupData(local, incoming);
  assert.equal(merged.data.settings.some(record => record.id === "today-layout"), false);
  const sameDay = new Date();
  const date = `${sameDay.getFullYear()}-${String(sameDay.getMonth() + 1).padStart(2, "0")}-${String(sameDay.getDate()).padStart(2, "0")}`;
  local.settings.find(record => record.id === "today-layout").date = date;
  incoming.settings.find(record => record.id === "today-layout").date = date;
  local.tasks[0].dueDate = date;
  incoming.tasks[0].dueDate = date;
  local.settings.find(record => record.id === "today-layout").groups[0].taskIds = ["late"];
  incoming.settings.find(record => record.id === "today-layout").groups[0].taskIds = ["late"];
  const selected = mergeBackupData(local, incoming).data.settings.find(record => record.id === "today-layout");
  assert.deepEqual(Array.from(selected.groups, group => group.id), ["b"]);
  assert.deepEqual(Array.from(selected.items, item => item.id), ["b"]);
});

test("format 9 remains importable without today positions", async () => {
  const old = structuredClone(data);
  delete old.tasks[0].todayPosition;
  const restored = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 9, data: old }));
  assert.equal(restored.tasks[0].todayPosition, null);
});

test("format 10 remains importable without backup naming settings", async () => {
  const restored = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 10, data }));
  assert.equal(restored.settings.some(record => record.id === "backup-naming"), false);
});

test("format 11 remains importable without navigation settings", async () => {
  const old = structuredClone(data);
  old.settings = old.settings.filter(record => record.id !== "navigation");
  const restored = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 11, data: old }));
  assert.equal(restored.settings.some(record => record.id === "navigation"), false);
});

test("format 12 appearance defaults to the system theme", async () => {
  const old = structuredClone(data);
  delete old.settings.find(record => record.id === "appearance").useSystemTheme;
  const restored = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 12, data: old }));
  assert.equal(restored.settings.find(record => record.id === "appearance").useSystemTheme, true);
});

test("export normalizes a legacy local appearance record", () => {
  const local = structuredClone(data);
  delete local.settings.find(record => record.id === "appearance").useSystemTheme;
  const completed = completeBackupFields(local);
  assert.equal(completed.settings.find(record => record.id === "appearance").useSystemTheme, true);
  assert.doesNotThrow(() => validateBackupData(completed));
});

test("backup filename uses a safe prefix, sequence number, and readable date", () => {
  assert.equal(backupFileName("Dimstasks", 1, new Date(2026, 9, 18)), "Dimstasks-1---18-Oct-2026.json");
  assert.equal(backupFileName(" Мої/справи ", 3, new Date(2026, 0, 2)), "Мої-справи-3---02-Jan-2026.json");
});

test("an exported backup carries the next version to another device", () => {
  const exported = withBackupNaming(structuredClone(data), "Робота", 4);
  assert.equal(exported.settings.find(record => record.id === "backup-naming").nextVersion, 4);
  assert.equal(exported.settings.find(record => record.id === "backup-naming").prefix, "Робота");
  assert.doesNotThrow(() => validateBackupData(exported));
});

test("import continues after the version in an older backup filename", async () => {
  const payload = { format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 10, data };
  const restored = await parseBackup(file(payload, "Dimstasks-3---18-Oct-2026.json"));
  assert.equal(restored.settings.find(record => record.id === "backup-naming").nextVersion, 4);
});

test("filename and JSON keep the higher next version", async () => {
  const payload = { format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: BACKUP_FORMAT_VERSION,
    data: withBackupNaming(structuredClone(data), "Робота", 7) };
  const restored = await parseBackup(file(payload, "Робота-3---18-Oct-2026.json"));
  assert.equal(restored.settings.find(record => record.id === "backup-naming").nextVersion, 7);
  const stale = await parseBackup(file({ ...payload, data: withBackupNaming(structuredClone(data), "Робота", 3) }, "Робота-3---18-Oct-2026.json"));
  assert.equal(stale.settings.find(record => record.id === "backup-naming").nextVersion, 4);
});

test("replacing from an older backup retains the highest local version", () => {
  const older = withBackupNaming(structuredClone(data), "Із файлу", 3);
  const local = withBackupNaming(structuredClone(data), "Локально", 8).settings.find(record => record.id === "backup-naming");
  const replaced = preserveBackupNaming(older, local);
  assert.equal(replaced.settings.find(record => record.id === "backup-naming").nextVersion, 8);
  assert.equal(replaced.settings.find(record => record.id === "backup-naming").prefix, "Із файлу");
  assert.equal(preserveBackupNaming(structuredClone(data), local).settings.find(record => record.id === "backup-naming").nextVersion, 8);
});

test("merging devices retains the highest version despite a newer timestamp on the lower one", () => {
  const local = withBackupNaming(structuredClone(data), "Локально", 8);
  const incoming = withBackupNaming(structuredClone(data), "Із файлу", 3);
  incoming.settings.find(record => record.id === "backup-naming").updatedAt = "2099-01-01T00:00:00.000Z";
  const merged = mergeBackupData(local, incoming).data;
  assert.equal(merged.settings.find(record => record.id === "backup-naming").nextVersion, 8);
});

test("format 4 remains importable and invalid backup is rejected before writing", async () => {
  const restored = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 4, data }));
  assert.equal(restored.tasks.length, 1);
  await assert.rejects(parseBackup(file({ format: "foreign", appId: "dims-tasks", formatVersion: 5, data })), /не резервна копія/);
});

test("format 5 remains importable after project countdown is added", async () => {
  const restored = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 5, data }));
  assert.equal(restored.tasks.length, 1);
});

test("format 6 remains importable after project list memory is added", async () => {
  const restored = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 6, data }));
  assert.equal(restored.tasks.length, 1);
});

test("format 7 remains importable after project step placement is added", async () => {
  const restored = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 7, data }));
  assert.equal(restored.tasks.length, 1);
});

test("format 8 remains importable and receives safe defaults", async () => {
  const old = structuredClone(data);
  delete old.tasks[0].projectPosition;
  const restored = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 8, data: old }));
  assert.equal(restored.tasks[0].projectPosition, null);
  assert.equal(restored.tasks[0].returnedToInboxAt, data.tasks[0].returnedToInboxAt);
});

test("current backup rejects duplicate IDs and broken references", async () => {
  const duplicate = structuredClone(data);
  duplicate.tasks.push({ ...duplicate.tasks[0] });
  assert.throws(() => validateBackupData(duplicate), /Повторний id/);
  const broken = structuredClone(data);
  broken.tasks[0].projectId = "missing";
  assert.throws(() => validateBackupData(broken), /Порушений зв’язок/);
  const invalidPosition = structuredClone(data);
  invalidPosition.tasks[0].todayPosition = -1;
  assert.throws(() => validateBackupData(invalidPosition), /Некоректне завдання/);
});

test("merge keeps local on equal time, uses newer records, and retains unique records", () => {
  const local = structuredClone(data);
  local.tasks[0].title = "Локально";
  const incoming = structuredClone(data);
  incoming.tasks[0].title = "Із файлу";
  incoming.lists.push({ ...base("other"), title: "Інший", description: "", kind: "regular", position: 1 });
  let merged = mergeBackupData(local, incoming);
  assert.equal(merged.data.tasks[0].title, "Локально");
  assert.equal(merged.data.lists.length, 2);
  incoming.tasks[0].updatedAt = "2026-01-02T00:00:00.000Z";
  merged = mergeBackupData(local, incoming);
  assert.equal(merged.data.tasks[0].title, "Із файлу");
  assert.deepEqual({ ...merged.changes }, { added: 1, updated: 1, kept: 4 });
});

test("future and malformed files are rejected before restoration", async () => {
  await assert.rejects(readBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: BACKUP_FORMAT_VERSION + 1, data })), /ще не підтримано/);
  await assert.rejects(readBackup({ text: async () => "{" }), /JSON-файл/);
});
