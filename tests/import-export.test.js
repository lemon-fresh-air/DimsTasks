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
vm.runInContext(`${model}\n${importExport}\nthis.backup = { parseBackup, readBackup, validateBackupData, mergeBackupData, BACKUP_FORMAT_VERSION };`, context);
const { parseBackup, readBackup, validateBackupData, mergeBackupData, BACKUP_FORMAT_VERSION } = context.backup;
const file = value => ({ text: async () => JSON.stringify(value) });
const stamp = "2026-01-01T00:00:00.000Z";
const base = id => ({ id, entityVersion: 1, createdAt: stamp, updatedAt: stamp, customFields: {} });
const data = {
  lists: [{ ...base("inbox"), title: "Інбокс", description: "", kind: "inbox", position: 0 }],
  sections: [], projects: [],
  tasks: [{ ...base("late"), listId: "inbox", sectionId: null, projectId: null, title: "Пізно", description: "", status: "active", completedAt: null, dueDate: null, dueTime: null, position: 0, projectPosition: null, returnedToInboxAt: "2026-01-02T00:00:00.000Z" }],
  settings: [{ ...base("workflow"), returnOverdueToInbox: true }]
};

test("current backup round-trip parser preserves workflow setting and return marker", async () => {
  const restored = await parseBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: BACKUP_FORMAT_VERSION, data }));
  assert.equal(restored.settings[0].returnOverdueToInbox, true);
  assert.equal(restored.tasks[0].returnedToInboxAt, data.tasks[0].returnedToInboxAt);
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
  assert.deepEqual({ ...merged.changes }, { added: 1, updated: 1, kept: 2 });
});

test("future and malformed files are rejected before restoration", async () => {
  await assert.rejects(readBackup(file({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 10, data })), /ще не підтримано/);
  await assert.rejects(readBackup({ text: async () => "{" }), /JSON-файл/);
});
