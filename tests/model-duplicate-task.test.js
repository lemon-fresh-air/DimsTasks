const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../src/js/model.js"), "utf8");
const context = vm.createContext({ crypto: { randomUUID: () => "new-id" }, INBOX_LIST_ID: "inbox" });
const duplicateTask = vm.runInContext(source + "\nduplicateTask", context);

test("task copy carries content into the chosen scope with a fresh identity", () => {
  const source = {
    id: "original", title: "План", description: "- [x] Готовий крок",
    status: "completed", completedAt: "2026-01-01T09:00:00Z",
    listId: "original-list", sectionId: "original-section",
    projectId: "project", projectSectionId: "project-section", projectPosition: 5,
    dueDate: "2026-01-03", dueTime: "08:15", addedToTodayDate: "2026-01-01",
    todayPosition: 2, returnedToInboxAt: "2026-01-01T10:00:00Z"
  };
  const copy = duplicateTask(source, { listId: "target", sectionId: "target-section", position: 4 });
  assert.equal(copy.id, "new-id");
  assert.equal(copy.title, source.title);
  assert.equal(copy.description, source.description);
  assert.equal(copy.dueDate, source.dueDate);
  assert.equal(copy.dueTime, source.dueTime);
  assert.equal(copy.listId, "target");
  assert.equal(copy.sectionId, "target-section");
  assert.equal(copy.position, 4);
  assert.equal(copy.status, "active");
  for (const field of ["completedAt", "projectId", "projectSectionId", "projectPosition", "addedToTodayDate", "todayPosition", "returnedToInboxAt"]) {
    assert.equal(copy[field], null, field);
  }
  assert.equal(source.status, "completed");
});

test("task copy retains saved project content and supports older tasks with no optional fields", () => {
  const savedSteps = [{ title: "Збережений крок" }];
  const savedProjectLayout = { projectSections: [] };
  const copy = duplicateTask({ title: "Архів", savedSteps, savedProjectLayout }, { listId: "inbox" });
  assert.equal(copy.sectionId, null);
  assert.equal(copy.savedSteps, savedSteps);
  assert.equal(copy.savedProjectLayout, savedProjectLayout);
  const older = duplicateTask({ title: "Давнє" }, { listId: "inbox" });
  assert.equal(older.description, "");
  assert.equal(older.savedSteps.length, 0);
  assert.equal(older.savedProjectLayout, null);
});
