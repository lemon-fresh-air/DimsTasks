const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "js", "model.js"), "utf8");
const context = vm.createContext({ crypto: { randomUUID: () => "generated" }, INBOX_LIST_ID: "inbox" });
vm.runInContext(`${source}\nthis.model = { isValidTodayLayoutShape, normalizeTodayGroups, createTodayGroup, assignTodayGroupTasks, removeTodayGroupTasks, ungroupTodayGroup, setTodayGroupCollapsed, moveTodayOuterItem, shiftTodayGroupTask, reorderTodayGroupTaskBlock };`, context);
const m = context.model;
const date = "2026-10-23";
const tasks = ["a", "b", "c", "d", "e"].map((id, i) => ({ id, todayPosition: i, createdAt: `2026-10-23T0${i}:00:00Z` }));
const plain = value => JSON.parse(JSON.stringify(value));
const ids = layout => Array.from(layout.items, item => `${item.type}:${item.id}`);

test("creation takes the first selected slot and preserves visible member order without touching tasks", () => {
  const before = plain(tasks);
  const group = m.createTodayGroup(null, tasks, date, "#2D9E6B", ["d", "b"], "green");
  assert.deepEqual(ids(group), ["task:a", "group:green", "task:c", "task:e"]);
  assert.deepEqual(plain(group.groups[0]), { id: "green", color: "#2D9E6B", collapsed: false, taskIds: ["b", "d"] });
  assert.deepEqual(tasks, before);
  assert.equal(m.normalizeTodayGroups(group, tasks, "2026-10-24"), null);
  assert.throws(() => m.createTodayGroup(group, tasks, date, "#2D9E6B", ["a"], "another"));
});

test("assignment, removal, and ungrouping preserve positions and return baseline after last group", () => {
  const first = m.createTodayGroup(null, tasks, date, "#2D9E6B", ["b", "d"], "green");
  const second = m.createTodayGroup(first, tasks, date, "#3A7BD5", ["e"], "blue");
  const assigned = m.assignTodayGroupTasks(second, tasks, date, "green", ["c", "e"]);
  assert.deepEqual(plain(assigned.groups[0].taskIds), ["b", "d", "c", "e"]);
  assert.equal(assigned.groups.length, 1);
  assert.deepEqual(ids(assigned), ["task:a", "group:green"]);
  const removed = m.removeTodayGroupTasks(assigned, tasks, date, "green", ["d", "e"]);
  assert.deepEqual(ids(removed), ["task:a", "group:green", "task:d", "task:e"]);
  assert.equal(m.ungroupTodayGroup(removed, tasks, date, "green"), null);
  assert.deepEqual(plain(second.groups[0].taskIds), ["b", "d"]);
});

test("removing the final member removes its group and the final group restores baseline", () => {
  const first = m.createTodayGroup(null, tasks, date, "#3A7BD5", ["b"], "blue");
  const second = m.createTodayGroup(first, tasks, date, "#E05A3A", ["d"], "orange");
  const withoutBlue = m.removeTodayGroupTasks(second, tasks, date, "blue", ["b"]);
  assert.deepEqual(plain(withoutBlue.groups.map(group => group.id)), ["orange"]);
  assert.deepEqual(ids(withoutBlue), ["task:a", "task:b", "task:c", "group:orange", "task:e"]);
  assert.equal(m.removeTodayGroupTasks(withoutBlue, tasks, date, "orange", ["d"]), null);
  assert.equal(m.normalizeTodayGroups(first, tasks.filter(task => task.id !== "b"), date), null);
});

test("group drag reorders only members of that group; removed tasks return to base order", () => {
  const first = m.createTodayGroup(null, tasks, date, "#3A7BD5", ["b", "c", "d"], "blue");
  const second = m.createTodayGroup(first, tasks, date, "#E05A3A", ["e"], "orange");
  const reordered = m.reorderTodayGroupTaskBlock(second, tasks, date, "blue", new Set(["c", "d", "e"]), "b");
  assert.deepEqual(plain(reordered.groups.map(group => group.taskIds)), [["c", "d", "b"], ["e"]]);
  const removed = m.removeTodayGroupTasks(reordered, tasks, date, "blue", ["d"]);
  assert.deepEqual(ids(removed), ["task:a", "group:blue", "task:d", "group:orange"]);
  assert.deepEqual(plain(removed.groups[0].taskIds), ["c", "b"]);
  assert.deepEqual(plain(second.groups[0].taskIds), ["b", "c", "d"]);
});

test("outer movement, collapse, and one-step member shift stay in the daily layout", () => {
  const group = m.createTodayGroup(null, tasks, date, "#2D9E6B", ["b", "c"], "green");
  const moved = m.moveTodayOuterItem(group, tasks, date, "group", "green", "task", "e");
  assert.deepEqual(ids(moved), ["task:a", "task:d", "group:green", "task:e"]);
  const collapsed = m.setTodayGroupCollapsed(moved, tasks, date, "green", true);
  assert.equal(collapsed.groups[0].collapsed, true);
  assert.deepEqual(plain(m.shiftTodayGroupTask(collapsed, tasks, date, "green", "c", -1).groups[0].taskIds), ["c", "b"]);
  assert.deepEqual(plain(m.shiftTodayGroupTask(collapsed, tasks, date, "green", "b", -1).groups[0].taskIds), ["b", "c"]);
});

test("normalization removes stale and duplicate references and prepends newly visible tasks", () => {
  const group = m.createTodayGroup(null, tasks, date, "#2D9E6B", ["b"], "green");
  const bad = { ...group, groups: [
    { ...group.groups[0], taskIds: ["b", "b", "gone", "c"] },
    { id: "duplicate-color", color: "#2D9E6B", collapsed: false, taskIds: ["d"] }
  ], items: [{ type: "group", id: "green" }, { type: "group", id: "green" },
    { type: "task", id: "c" }, { type: "task", id: "a" }, { type: "task", id: "a" },
    { type: "task", id: "gone" }, { type: "group", id: "missing" }] };
  const fresh = { id: "fresh", todayPosition: null, createdAt: "2026-10-23T10:00:00Z" };
  const normalized = m.normalizeTodayGroups(bad, [...tasks, fresh], date);
  assert.deepEqual(plain(normalized.groups.map(item => item.id)), ["green"]);
  assert.deepEqual(plain(normalized.groups[0].taskIds), ["b", "c"]);
  assert.deepEqual(ids(normalized), ["task:fresh", "task:d", "task:e", "group:green", "task:a"]);
  const hidden = m.normalizeTodayGroups(group, tasks.filter(task => task.id !== "b"), date);
  assert.equal(hidden, null);
  assert.throws(() => m.assignTodayGroupTasks(group, tasks, date, "green", ["gone"]));
});

test("stored shape rejects duplicate colors, members, outer references, and malformed groups", () => {
  const good = m.createTodayGroup(null, tasks, date, "#2D9E6B", ["b"], "green");
  assert.equal(m.isValidTodayLayoutShape(good), true);
  assert.equal(m.isValidTodayLayoutShape({ ...good, groups: [...good.groups, { ...good.groups[0], id: "other" }] }), false);
  assert.equal(m.isValidTodayLayoutShape({ ...good, items: [...good.items, good.items[0]] }), false);
  assert.equal(m.isValidTodayLayoutShape({ ...good, groups: [{ ...good.groups[0], taskIds: ["b", "b"] }] }), false);
  assert.equal(m.isValidTodayLayoutShape({ ...good, groups: [{ ...good.groups[0], collapsed: "yes" }] }), false);
});
