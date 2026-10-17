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
vm.runInContext(`${source}\nthis.model = { compareTasks, compareTodayTasks, reorderTodayTaskBlock };`, context);

const { compareTasks, compareTodayTasks, reorderTodayTaskBlock } = context.model;
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

test("today reorder spans lists and leaves list positions unchanged", () => {
  const selectedIds = new Set(["older"]);
  const reordered = reorderTodayTaskBlock(todayTasks, todayTasks, selectedIds, "newer-a");
  assert.deepEqual(ids(reordered, compareTodayTasks), ["older", "newer-a", "newer-b"]);
  assert.deepEqual(reordered.map(task => task.position), todayTasks.map(task => task.position));
  assert.deepEqual(ids(reordered.map(task => ({ ...task })), compareTodayTasks), ["older", "newer-a", "newer-b"]);
});

test("new tasks appear before saved today order", () => {
  const reordered = reorderTodayTaskBlock(todayTasks, todayTasks, new Set(["older"]), null);
  const added = { id: "fresh", createdAt: "2026-10-15T10:00:00.000Z", listId: "a", position: 0, todayPosition: null };
  assert.deepEqual(ids([...reordered, added], compareTodayTasks), ["fresh", "newer-a", "newer-b", "older"]);
});
