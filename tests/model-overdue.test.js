const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "js", "model.js"), "utf8");
const context = vm.createContext({ crypto: { randomUUID: () => "generated-id" }, INBOX_LIST_ID: "inbox" });
vm.runInContext(`${source}\nthis.model = { isTaskOverdue, isTaskDueToday, returnOverdueTasksToInbox, compareTasks };`, context);
const { isTaskOverdue, isTaskDueToday, returnOverdueTasksToInbox, compareTasks } = context.model;

const base = { status: "active", sectionId: null, projectId: null, returnedToInboxAt: null, updatedAt: "2026-10-10T00:00:00.000Z" };
const task = (id, values = {}) => ({ ...base, id, title: id, listId: "work", dueDate: "2026-10-14", dueTime: null, position: 0, createdAt: `2026-10-0${id.length}T00:00:00.000Z`, ...values });
const options = { enabled: true, localDate: "2026-10-15", localTime: "12:00", returnedAt: "2026-10-15T09:00:00.000Z" };

test("disabled setting leaves overdue tasks in place and unchanged", () => {
  const records = [task("late")];
  assert.strictEqual(returnOverdueTasksToInbox(records, { ...options, enabled: false }), records);
});

test("overdue rules cover prior days and elapsed times but not date-only today or completed tasks", () => {
  assert.equal(isTaskOverdue(task("past"), options.localDate, options.localTime), true);
  assert.equal(isTaskOverdue(task("timed", { dueDate: options.localDate, dueTime: "11:59" }), options.localDate, options.localTime), true);
  assert.equal(isTaskOverdue(task("boundary", { dueDate: options.localDate, dueTime: "12:00" }), options.localDate, options.localTime), true);
  assert.equal(isTaskOverdue(task("today", { dueDate: options.localDate }), options.localDate, options.localTime), false);
  assert.equal(isTaskOverdue(task("done", { status: "completed" }), options.localDate, options.localTime), false);
  assert.equal(isTaskOverdue(task("archived", { status: "archived" }), options.localDate, options.localTime), false);
});

test("elapsed timed task stays due today until the next calendar day", () => {
  const timed = task("timed", { dueDate: options.localDate, dueTime: "11:59" });
  assert.equal(isTaskOverdue(timed, options.localDate, options.localTime), true);
  assert.equal(isTaskDueToday(timed, options.localDate), true);
  assert.equal(isTaskDueToday(timed, "2026-10-16"), false);
  assert.equal(isTaskDueToday({ ...timed, status: "completed" }, options.localDate), false);
});

test("auto-return moves an elapsed timed task once without removing its Today membership", () => {
  const timed = task("timed", { dueDate: options.localDate, dueTime: "11:59" });
  const first = returnOverdueTasksToInbox([timed], options);
  const second = returnOverdueTasksToInbox(first, options);
  assert.equal(first.length, 1);
  assert.equal(first[0].listId, "inbox");
  assert.equal(isTaskDueToday(first[0], options.localDate), true);
  assert.strictEqual(second, first);
});

test("two returned tasks precede five inbox tasks in stable order and a new task can precede all", () => {
  const existing = Array.from({ length: 5 }, (_, index) => task(`old-${index + 1}`, { listId: "inbox", dueDate: null, position: index }));
  const late = [task("b", { dueDate: "2026-10-13" }), task("a", { dueDate: "2026-10-12" })];
  const returned = returnOverdueTasksToInbox([...existing, ...late], options).sort(compareTasks);
  assert.deepEqual(returned.map(item => item.id), ["a", "b", "old-1", "old-2", "old-3", "old-4", "old-5"]);
  const withNew = [{ ...task("new", { listId: "inbox", dueDate: null }), position: 0 }, ...returned.map(item => ({ ...item, position: item.position + 1 }))].sort(compareTasks);
  assert.deepEqual(withNew.map(item => item.id), ["new", "a", "b", "old-1", "old-2", "old-3", "old-4", "old-5"]);
});

test("repeat run and setting toggle do not raise returned tasks again", () => {
  const first = returnOverdueTasksToInbox([task("late"), task("old", { listId: "inbox", dueDate: null })], options);
  const second = returnOverdueTasksToInbox(first, options);
  const toggled = returnOverdueTasksToInbox(returnOverdueTasksToInbox(second, { ...options, enabled: false }), options);
  assert.strictEqual(second, first);
  assert.strictEqual(toggled, first);
  assert.equal(first.find(item => item.id === "late").returnedToInboxAt, options.returnedAt);
});
