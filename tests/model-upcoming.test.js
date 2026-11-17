const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "js", "model.js"), "utf8");
const context = vm.createContext({ crypto: { randomUUID: () => "id" }, INBOX_LIST_ID: "inbox" });
vm.runInContext(`${source}\nthis.compareUpcomingTasks = compareUpcomingTasks;`, context);

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
