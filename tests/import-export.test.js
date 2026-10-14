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
vm.runInContext(`${model}\n${importExport}\nthis.backup = { parseBackup, BACKUP_FORMAT_VERSION };`, context);
const { parseBackup, BACKUP_FORMAT_VERSION } = context.backup;
const file = value => ({ text: async () => JSON.stringify(value) });
const data = {
  lists: [{ id: "inbox", createdAt: "2026-01-01T00:00:00.000Z" }],
  sections: [], projects: [],
  tasks: [{ id: "late", createdAt: "2026-01-01T00:00:00.000Z", returnedToInboxAt: "2026-01-02T00:00:00.000Z" }],
  settings: [{ id: "workflow", createdAt: "2026-01-01T00:00:00.000Z", returnOverdueToInbox: true }]
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
