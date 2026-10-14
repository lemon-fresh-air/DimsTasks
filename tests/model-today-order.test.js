const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "js", "model.js"), "utf8");
const context = vm.createContext({
  crypto: { randomUUID: () => "generated-id" },
  INBOX_LIST_ID: "inbox"
});
vm.runInContext(`${source}\nthis.model = { compareTasks, compareTodayTasks };`, context);

const { compareTasks, compareTodayTasks } = context.model;
const todayTasks = [
  { id: "older", createdAt: "2026-10-15T08:00:00.000Z", listId: "a", position: 0 },
  { id: "newer-a", createdAt: "2026-10-15T09:00:00.000Z", listId: "a", position: 1 },
  { id: "newer-b", createdAt: "2026-10-15T09:00:00.000Z", listId: "b", position: 5 }
];

function ids(records, comparator) {
  return records.slice().sort(comparator).map(task => task.id);
}

test("today order survives moving one task to another list", () => {
  const before = ids(todayTasks, compareTodayTasks);
  const moved = todayTasks.map(task => task.id === "older"
    ? { ...task, listId: "b", position: 0, updatedAt: "2026-10-15T10:00:00.000Z" }
    : task);

  assert.deepEqual(ids(moved, compareTodayTasks), before);
});

test("today order survives moving a selected block and shifting target positions", () => {
  const before = ids(todayTasks, compareTodayTasks);
  const movedIds = new Set(["older", "newer-a"]);
  const moved = todayTasks.map(task => movedIds.has(task.id)
    ? { ...task, listId: "b", position: task.id === "older" ? 0 : 1, updatedAt: "2026-10-15T10:00:00.000Z" }
    : { ...task, position: task.position + 2, updatedAt: "2026-10-15T10:00:00.000Z" });

  assert.deepEqual(ids(moved, compareTodayTasks), before);
});

test("regular-list order continues to follow position", () => {
  const reordered = todayTasks.map(task => task.id === "older" ? { ...task, position: 9 } : task);

  assert.notDeepEqual(ids(reordered, compareTasks), ids(todayTasks, compareTasks));
});
