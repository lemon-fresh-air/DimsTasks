const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = vm.createContext({ crypto: require("node:crypto").webcrypto, INBOX_LIST_ID: "system-list-inbox" });
vm.runInContext(`${fs.readFileSync("src/js/model.js", "utf8")}\nthis.api = { createTask, setTaskAddedToToday, isTaskInDayPlan, visibleProjectTasks, normalizeDayPlan, carryTodayProjectGroup };`, context);
const { createTask, setTaskAddedToToday, isTaskInDayPlan, visibleProjectTasks, normalizeDayPlan, carryTodayProjectGroup } = context.api;
const today = "2026-11-16", tomorrow = "2026-11-17";

test("manual today is idempotent, preserves source and expires on the next day", () => {
  const original = createTask({ title: "Без терміну", listId: "work", position: 4 });
  const added = setTaskAddedToToday(original, today, true);
  assert.equal(isTaskInDayPlan(added, today, today), true);
  assert.equal(isTaskInDayPlan(added, tomorrow, today), false);
  assert.equal(isTaskInDayPlan(added, tomorrow, tomorrow), false);
  assert.equal(setTaskAddedToToday(added, today, true), added);
  assert.equal(added.listId, original.listId);
  assert.equal(added.position, original.position);
  assert.equal(added.dueDate, null);
  assert.equal(isTaskInDayPlan(setTaskAddedToToday(added, today, false), today, today), false);
});

test("due date wins over removal and future due date remains intact", () => {
  const due = createTask({ title: "Термін сьогодні", dueDate: today, addedToTodayDate: today });
  const removed = setTaskAddedToToday(due, today, false);
  assert.equal(removed.dueDate, today);
  assert.equal(isTaskInDayPlan(removed, today, today), true);
  const future = setTaskAddedToToday(createTask({ title: "Майбутнє", dueDate: tomorrow }), today, true);
  assert.equal(isTaskInDayPlan(future, today, today), true);
  assert.equal(isTaskInDayPlan(future, tomorrow, today), true);
  assert.equal(future.dueDate, tomorrow);
  assert.equal(isTaskInDayPlan({ ...future, status: "archived" }, today, today), false);
  assert.equal(setTaskAddedToToday({ ...future, status: "completed" }, today, false).status, "completed");
});

test("project current step and day group use one visible task", () => {
  const first = createTask({ id: "first", title: "Перший", projectId: "project", projectPosition: 0, addedToTodayDate: today });
  const next = createTask({ id: "next", title: "Другий", projectId: "project", projectPosition: 1, addedToTodayDate: today });
  const visible = visibleProjectTasks([first, next]).filter(task => isTaskInDayPlan(task, today, today));
  assert.deepEqual(Array.from(visible, task => task.id), ["first"]);
  const plan = { date: today, groups: [{ id: "group", color: "#3A7BD5", title: null, collapsed: false, taskIds: ["first"] }], items: [{ type: "group", id: "group" }] };
  assert.deepEqual(Array.from(normalizeDayPlan(plan, visible, today).groups[0].taskIds), ["first"]);
  const carried = carryTodayProjectGroup(plan, [{ ...first, status: "completed" }, next], { ...first, status: "completed" }, today);
  assert.deepEqual(Array.from(carried.groups[0].taskIds), ["next"]);
});
