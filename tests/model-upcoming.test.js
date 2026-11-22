const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "js", "model.js"), "utf8");
const context = vm.createContext({ crypto: { randomUUID: () => "id" }, INBOX_LIST_ID: "inbox" });
vm.runInContext(`${source}\nthis.compareUpcomingTasks = compareUpcomingTasks; this.reorderUpcomingTasks = reorderUpcomingTasks;`, context);

test("upcoming tasks sort by time, then by stable task order", () => {
  const tasks = [
    { id: "untimed", position: 1, dueTime: null },
    { id: "later", position: 2, dueTime: "14:30" },
    { id: "same-last", position: 3, dueTime: "09:00" },
    { id: "same-first", position: 0, dueTime: "09:00" }
  ];
  assert.deepEqual(tasks.sort(context.compareUpcomingTasks).map(task => task.id),
    ["same-first", "same-last", "later", "untimed"]);
});

test("upcoming reorder keeps a selected block together and scopes positions to its date", () => {
  const date = "2026-11-22";
  const tasks = [
    { id: "early", dueDate: date, dueTime: "09:00", position: 3, customFields: { example: true } },
    { id: "middle", dueDate: date, dueTime: "12:00", position: 1 },
    { id: "last", dueDate: date, dueTime: null, position: 0 }
  ];
  const moved = context.reorderUpcomingTasks(tasks, new Set(["last", "early"]), "middle", true);
  const ordered = Array.from(moved).sort(context.compareUpcomingTasks);
  assert.deepEqual(ordered.map(task => task.id), ["middle", "early", "last"]);
  assert.equal(ordered[1].customFields.example, true);
  assert.equal(ordered[1].position, 3);
  assert.equal(ordered[1].dueTime, "09:00");
  assert.equal(context.reorderUpcomingTasks(ordered, new Set(["early", "last"]), "middle", true).length, 0);
  assert.equal(context.reorderUpcomingTasks(ordered, new Set(["early"]), "early", true).length, 0);
  const nextDate = "2026-11-23";
  assert.ok(context.compareUpcomingTasks({ ...ordered[1], dueDate: nextDate },
    { ...ordered[0], dueDate: nextDate }) < 0);
});
