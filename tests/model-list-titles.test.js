const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "js", "model.js"), "utf8");
const context = vm.createContext({ crypto: { randomUUID: () => "id" }, INBOX_LIST_ID: "system-list-inbox" });
vm.runInContext(`${source}\nthis.displayListTitle = displayListTitle;`, context);

test("day screens have distinct titles", () => {
  assert.equal(context.displayListTitle({ id: "system-list-today", kind: "today", title: "Сьогодні" }), "Сьогодні");
  assert.equal(context.displayListTitle({ id: "system-list-tomorrow", kind: "today", title: "Завтра" }), "Завтра");
});
