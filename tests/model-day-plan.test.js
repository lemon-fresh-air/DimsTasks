const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "js", "model.js"), "utf8");
const context = vm.createContext({ crypto: { randomUUID: () => "new-id" }, INBOX_LIST_ID: "inbox" });
vm.runInContext(`${source}\nthis.plan = { dayPlanId, normalizeDayPlan, reorderDayPlan, isValidDayPlanShape };`, context);
const { dayPlanId, normalizeDayPlan, reorderDayPlan, isValidDayPlanShape } = context.plan;
const tasks = ["a", "b", "c"].map((id, index) => ({ id, createdAt: `2026-10-26T0${index}:00:00Z`, todayPosition: index }));
const ids = plan => Array.from(plan.items, item => item.id);

test("ungrouped order is stored for one date and does not carry to another", () => {
  const monday = "2026-10-26";
  const tuesday = "2026-10-27";
  const first = reorderDayPlan(null, tasks, monday, new Set(["a"]), "c");
  assert.deepEqual(ids(first), ["a", "c", "b"]);
  assert.equal(isValidDayPlanShape({ ...first, id: dayPlanId(monday) }), true);
  assert.equal(normalizeDayPlan(first, tasks, tuesday), null);
  const second = reorderDayPlan(null, tasks, tuesday, new Set(["b"]), null);
  assert.deepEqual(ids(second), ["c", "a", "b"]);
  assert.deepEqual(ids(normalizeDayPlan(first, tasks, monday)), ["a", "c", "b"]);
});

test("newly visible tasks lead their dated plan without losing saved order", () => {
  const date = "2026-10-27";
  const plan = { date, groups: [], items: [{ type: "task", id: "a" }, { type: "task", id: "b" }] };
  assert.deepEqual(ids(normalizeDayPlan(plan, tasks, date)), ["c", "a", "b"]);
  assert.equal(isValidDayPlanShape({ ...plan, id: dayPlanId("2026-10-28") }), false);
});
