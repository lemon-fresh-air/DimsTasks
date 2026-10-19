const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "js", "model.js"), "utf8");
const context = vm.createContext({ crypto: { randomUUID: () => "id" }, INBOX_LIST_ID: "system-list-inbox" });
vm.runInContext(`${source}\nthis.select = completedTasksInRange;`, context);

test("completed history uses completion time, excludes reactivated tasks and sorts newest first", () => {
  const records = [
    { id: "old", status: "completed", completedAt: "2026-10-12T12:00:00.000Z" },
    { id: "step", status: "completed", projectId: "p", completedAt: "2026-10-19T18:00:00.000Z" },
    { id: "task", status: "completed", completedAt: "2026-10-18T10:00:00.000Z" },
    { id: "restored", status: "active", completedAt: null },
    { id: "legacy", status: "completed", completedAt: null }
  ];
  const selected = context.select(records, new Date("2026-10-14T00:00:00.000Z"), new Date("2026-10-21T00:00:00.000Z"));
  assert.deepEqual(Array.from(selected, task => task.id), ["step", "task"]);
  assert.equal(context.select(records, new Date("2026-10-07T00:00:00.000Z"), new Date("2026-10-14T00:00:00.000Z"))[0].id, "old");
});
