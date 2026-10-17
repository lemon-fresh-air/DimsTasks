const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "js", "model.js"), "utf8");
const context = vm.createContext({ crypto: { randomUUID: () => "generated-id" }, INBOX_LIST_ID: "inbox" });
vm.runInContext(`${source}\nthis.model = { createTask, createProject, compareProjects, nextProjectPosition, reorderProjects, reorderProjectBlock, projectCountdown, currentProjectTask, compareProjectTasks, visibleListTasks, reorderProjectSteps, reorderProjectStepBlock, normalizeTaskOrder };`, context);
const { createTask, createProject, compareProjects, nextProjectPosition, reorderProjects, reorderProjectBlock, projectCountdown, currentProjectTask, compareProjectTasks, visibleListTasks, reorderProjectSteps, reorderProjectStepBlock, normalizeTaskOrder } = context.model;

const step = (id, projectPosition, values = {}) => createTask({
  id, projectId: "project", projectPosition, listId: "inbox", title: id,
  createdAt: `2026-10-15T00:00:0${projectPosition}.000Z`, ...values
});

test("a regular list shows only the current project step plus ordinary tasks", () => {
  const records = [step("first", 0), step("second", 1), createTask({ id: "ordinary", listId: "inbox", title: "ordinary" })];
  assert.equal(currentProjectTask(records, "project").id, "first");
  assert.deepEqual(Array.from(visibleListTasks(records, "inbox"), task => task.id).sort(), ["first", "ordinary"]);
});

test("completing a step advances the computed current step", () => {
  const records = [step("first", 0, { status: "completed", completedAt: "2026-10-15T01:00:00.000Z" }), step("second", 1)];
  assert.equal(currentProjectTask(records, "project").id, "second");
  assert.deepEqual(Array.from(records.slice().sort(compareProjectTasks), task => task.id), ["second", "first"]);
});

test("project order is independent from list position and can be reordered", () => {
  const records = [step("first", 0, { position: 9 }), step("second", 1, { position: 0 }), step("third", 2, { position: 4 })];
  const reordered = reorderProjectSteps(records, "project", "third", "first");
  assert.deepEqual(Array.from(reordered.slice().sort((a, b) => a.projectPosition - b.projectPosition), task => task.id), ["third", "first", "second"]);
  assert.deepEqual(Array.from(reordered, task => task.position), [9, 0, 4]);
});

test("several selected project steps move as one ordered block", () => {
  const records = [step("first", 0), step("second", 1), step("third", 2), step("fourth", 3)];
  const reordered = reorderProjectStepBlock(records, "project", new Set(["second", "third"]), null);
  assert.deepEqual(Array.from(reordered.slice().sort((a, b) => a.projectPosition - b.projectPosition), task => task.id), ["first", "fourth", "second", "third"]);
});

test("active projects can be reordered without changing completed projects", () => {
  const records = [
    createProject({ id: "first", title: "first", position: 0 }),
    createProject({ id: "done", title: "done", position: 8, status: "completed" }),
    createProject({ id: "second", title: "second", position: 1 }),
    createProject({ id: "third", title: "third", position: 2 })
  ];
  const reordered = reorderProjects(records, "third", "first");
  assert.deepEqual(Array.from(reordered.filter(project => project.status === "active").sort((a, b) => a.position - b.position), project => project.id), ["third", "first", "second"]);
  assert.equal(reordered.find(project => project.id === "done"), records[1]);
});

test("several selected projects move as one ordered block", () => {
  const records = ["first", "second", "third", "fourth"].map((id, position) => createProject({ id, title: id, position }));
  const reordered = reorderProjectBlock(records, new Set(["second", "third"]), null);
  assert.deepEqual(Array.from(reordered.slice().sort((a, b) => a.position - b.position), project => project.id), ["first", "fourth", "second", "third"]);
});

test("completing a middle project, creating another, and restoring keeps a stable order", () => {
  const records = [
    createProject({ id: "first", title: "first", position: 0, createdAt: "2026-10-15T00:00:00.000Z" }),
    createProject({ id: "middle", title: "middle", position: 1, createdAt: "2026-10-15T00:01:00.000Z" }),
    createProject({ id: "last", title: "last", position: 1, createdAt: "2026-10-15T00:02:00.000Z" })
  ];
  records[1] = { ...records[1], status: "completed" };
  const created = createProject({ id: "new", title: "new", position: nextProjectPosition(records), createdAt: "2026-10-15T00:03:00.000Z" });
  records.push(created);
  records[1] = { ...records[1], status: "active" };

  assert.equal(created.position, 2);
  assert.equal(records.filter(project => project.status === "active" && project.position === created.position).length, 1);
  assert.deepEqual(Array.from(records.filter(project => project.status === "active").sort(compareProjects), project => project.id), ["first", "middle", "last", "new"]);
});

test("legacy tasks are normalized with null project fields without changing identity", () => {
  const legacy = { id: "legacy", listId: "inbox", sectionId: null, title: "legacy", position: 0, createdAt: "2026-01-01T00:00:00.000Z" };
  const normalized = normalizeTaskOrder([legacy])[0];
  assert.equal(normalized.id, legacy.id);
  assert.equal(normalized.projectId, null);
  assert.equal(normalized.projectPosition, null);
});

test("project countdown uses inclusive calendar-day labels and marks past dates overdue", () => {
  assert.deepEqual({ ...projectCountdown("2026-10-15", "2026-10-15") }, { text: "Сьогодні", overdue: false });
  assert.deepEqual({ ...projectCountdown("2026-10-16", "2026-10-15") }, { text: "Завтра", overdue: false });
  assert.deepEqual({ ...projectCountdown("2026-10-17", "2026-10-15") }, { text: "Післязавтра", overdue: false });
  assert.deepEqual({ ...projectCountdown("2026-10-18", "2026-10-15") }, { text: "Лишилося 3 днів", overdue: false });
  assert.deepEqual({ ...projectCountdown("2026-10-14", "2026-10-15") }, { text: "Вчора", overdue: true });
  assert.deepEqual({ ...projectCountdown("2026-10-13", "2026-10-15") }, { text: "Позавчора", overdue: true });
  assert.deepEqual({ ...projectCountdown("2026-10-10", "2026-10-15") }, { text: "Прострочено на 5 днів", overdue: true });
  assert.equal(createProject({ title: "legacy" }).showCountdown, false);
});

test("project remembers a valid last list and legacy projects default safely", () => {
  const legacy = createProject({ title: "legacy" });
  assert.equal(legacy.lastListId, null);
  assert.equal(legacy.addNewTasksFirst, true);
  assert.equal(createProject({ title: "remembered", lastListId: "work" }).lastListId, "work");
  assert.equal(createProject({ title: "append", addNewTasksFirst: false }).addNewTasksFirst, false);
});
