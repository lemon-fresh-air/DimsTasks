const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "js", "model.js"), "utf8");
const context = vm.createContext({ crypto: { randomUUID: () => "id" }, INBOX_LIST_ID: "inbox" });
vm.runInContext(`${source}\nthis.move = moveTaskBlockToSection;`, context);
const task = (id, sectionId, position) => ({ id, listId: "work", sectionId, position, createdAt: "2026-10-30T00:00:00.000Z" });
const scopes = records => records.filter(item => item.listId === "work")
  .map(item => [item.id, item.sectionId, item.position]);

test("selected tasks reorder within a section and move between sections and root", () => {
  const initial = [task("a", null, 0), task("b", null, 1), task("c", "one", 0), task("d", "one", 1), task("e", "two", 0)];
  const within = context.move(initial, ["d"], "work", "one", "c");
  assert.deepEqual(scopes(within), [["a", null, 0], ["b", null, 1], ["c", "one", 1], ["d", "one", 0], ["e", "two", 0]]);
  const across = context.move(within, ["d", "c"], "work", "two", "e");
  assert.deepEqual(scopes(across), [["a", null, 0], ["b", null, 1], ["c", "two", 1], ["d", "two", 0], ["e", "two", 2]]);
  const root = context.move(across, ["d"], "work", null, "b");
  assert.deepEqual(scopes(root), [["a", null, 0], ["b", null, 2], ["c", "two", 0], ["d", null, 1], ["e", "two", 1]]);
  const back = context.move(root, ["b"], "work", "one");
  assert.deepEqual(scopes(back), [["a", null, 0], ["b", "one", 0], ["c", "two", 0], ["d", null, 1], ["e", "two", 1]]);
});
