const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const context = vm.createContext({});
vm.runInContext(readFileSync(path.join(__dirname, "../src/js/search.js"), "utf8"), context);
const { prepareSearchEntries, searchEntries } = context;
const entries = prepareSearchEntries([
  { id: "task", title: "Купити в магазині масло", description: "", type: "task" },
  { id: "list", title: "Магазин", description: "", type: "list" },
  { id: "project", title: "Об’єкт", description: "Знайти магазин", type: "project" },
  { id: "done", title: "Магазинчик", description: "", type: "task", completed: true }
]);
const ids = (query, options) => Array.from(searchEntries(entries, query, options), result => result.entry.id);

test("ranks full titles, literal and partial matches, and filters by type and status", () => {
  assert.deepEqual(ids("МАГАЗИН"), ["list", "task", "project"]);
  assert.deepEqual(ids("магаз", { type: "task", includeCompleted: true }), ["task", "done"]);
  assert.deepEqual(ids("газин").sort(), ["list", "project", "task"]);
  assert.deepEqual(ids("зині"), ["task"]);
  assert.deepEqual(ids("ма"), ["task", "list", "project"]);
  assert.deepEqual(ids("аг"), []);
  assert.deepEqual(ids("м"), []);
});

test("requires every term, allows reordered terms and normalizes Ukrainian apostrophes", () => {
  assert.deepEqual(ids("масло в магаз"), ["task"]);
  assert.deepEqual(ids("масло аптек"), []);
  assert.deepEqual(ids("об'єкт"), ["project"]);
});

test("allows a single adjacent transposition and returns original highlight offsets", () => {
  assert.deepEqual(ids("маагзин"), ["list", "project"]);
  assert.deepEqual(ids("мга"), []);
  const match = searchEntries(entries, "зині")[0].titleMatches[0];
  assert.equal(entries[0].title.slice(match.start, match.end), "зині");
  const accent = prepareSearchEntries([{ title: "І\u0308жа", description: "", type: "task" }]);
  const result = searchEntries(accent, "ЇЖА")[0];
  assert.equal(result.entry.title.slice(result.titleMatches[0].start, result.titleMatches[0].end), "І\u0308жа");
});
