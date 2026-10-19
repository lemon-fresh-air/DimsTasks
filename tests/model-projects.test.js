const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "js", "model.js"), "utf8");
const context = vm.createContext({ crypto: { randomUUID: () => "generated-id" }, INBOX_LIST_ID: "inbox" });
vm.runInContext(`${source}\nthis.model = { createTask, createProject, projectFromTask, taskFromProject, projectToTaskChanges, detachProjectTask, compareProjects, nextProjectPosition, reorderProjects, reorderProjectBlock, projectCountdown, currentProjectTask, compareProjectTasks, visibleProjectTasks, visibleListTasks, reorderProjectSteps, reorderProjectStepBlock, normalizeTaskOrder };`, context);
const { createTask, createProject, projectFromTask, taskFromProject, projectToTaskChanges, detachProjectTask, compareProjects, nextProjectPosition, reorderProjects, reorderProjectBlock, projectCountdown, currentProjectTask, compareProjectTasks, visibleProjectTasks, visibleListTasks, reorderProjectSteps, reorderProjectStepBlock, normalizeTaskOrder } = context.model;

test("project conversion creates an Inbox task and keeps steps in their own lists", () => {
  const project = createProject({ id: "project", title: " Назва ", description: "Опис", goal: "Мета",
    dueDate: "2026-10-25", dueTime: "14:30", customFields: { projectOnly: true } });
  const work = createTask({ id: "work", title: "Робочий крок", projectId: project.id, projectPosition: 0,
    listId: "work", sectionId: "section", status: "completed", completedAt: "2026-10-20T10:00:00Z" });
  const inboxStep = createTask({ id: "inbox-step", title: "Крок у Нові", projectId: project.id,
    listId: "inbox", projectPosition: 1, position: 0 });
  const other = createTask({ id: "other", title: "Самостійне", listId: "inbox", position: 1 });
  const plan = projectToTaskChanges(project, [work, inboxStep, other], true, "2026-10-20T12:00:00Z");
  assert.equal(plan.task.id, "generated-id");
  assert.equal(plan.task.title, "Назва");
  assert.equal(plan.task.description, "Опис");
  assert.equal(plan.task.dueDate, "2026-10-25");
  assert.equal(plan.task.dueTime, "14:30");
  assert.equal(plan.task.listId, "inbox");
  assert.equal(plan.task.position, 0);
  assert.equal(plan.task.status, "active");
  assert.deepEqual({ ...plan.task.customFields }, {});
  assert.equal(Object.hasOwn(plan.task, "goal"), false);
  assert.deepEqual(Array.from(plan.deletedIds), []);
  const changed = new Map(plan.updates.map(task => [task.id, task]));
  assert.equal(changed.get("work").listId, "work");
  assert.equal(changed.get("work").sectionId, "section");
  assert.equal(changed.get("work").status, "completed");
  assert.equal(changed.get("work").completedAt, work.completedAt);
  assert.equal(changed.get("work").projectId, null);
  assert.equal(changed.get("work").projectPosition, null);
  assert.equal(changed.get("inbox-step").position, 1);
  assert.equal(changed.get("inbox-step").projectId, null);
  assert.equal(changed.get("other").position, 2);
});

test("project conversion can delete steps without shifting their positions", () => {
  const project = createProject({ id: "project", title: "Проєкт" });
  const stepInInbox = createTask({ id: "step-inbox", title: "Крок", projectId: project.id, listId: "inbox", position: 0 });
  const stepElsewhere = createTask({ id: "step-work", title: "Крок", projectId: project.id, listId: "work", position: 4 });
  const survivor = createTask({ id: "survivor", title: "Інше", listId: "inbox", position: 1 });
  const plan = projectToTaskChanges(project, [stepInInbox, stepElsewhere, survivor], false, "2026-10-20T12:00:00Z");
  assert.deepEqual(Array.from(plan.deletedIds), ["step-inbox", "step-work"]);
  assert.deepEqual(Array.from(plan.updates, task => task.id), ["survivor"]);
  assert.equal(plan.updates[0].position, 2);
  assert.throws(() => taskFromProject(createProject({ title: "Завершений", status: "completed" })));
});

test("detaching a step preserves identity and task data while placing it first in its list", () => {
  const source = createTask({ id: "step", title: "Крок", description: "Опис", projectId: "project", projectPosition: 3,
    listId: "work", sectionId: "section", position: 8, dueDate: "2026-10-22", dueTime: "10:15",
    createdAt: "2026-10-01T00:00:00.000Z", customFields: { taskOnly: 7 }, todayPosition: 4 });
  const inbox = createTask({ id: "inbox", title: "У Нові", listId: "inbox", position: 0 });
  const workRoot = createTask({ id: "work-root", title: "У роботі", listId: "work", position: 0 });
  const otherStep = createTask({ id: "other-step", title: "Інший крок", projectId: "project", projectPosition: 4,
    listId: "work", sectionId: "section", position: 9 });
  const changes = detachProjectTask(source, [source, inbox, workRoot, otherStep], "2026-10-20T12:00:00.000Z");
  assert.equal(changes.length, 2);
  assert.equal(changes[0].id, source.id);
  assert.equal(changes[0].createdAt, source.createdAt);
  assert.equal(changes[0].description, source.description);
  assert.equal(changes[0].dueDate, source.dueDate);
  assert.equal(changes[0].dueTime, source.dueTime);
  assert.equal(changes[0].todayPosition, 4);
  assert.deepEqual({ ...changes[0].customFields }, { taskOnly: 7 });
  assert.equal(changes[0].listId, "work");
  assert.equal(changes[0].sectionId, null);
  assert.equal(changes[0].projectId, null);
  assert.equal(changes[0].projectPosition, null);
  assert.equal(changes[0].position, 0);
  assert.equal(changes[0].updatedAt, "2026-10-20T12:00:00.000Z");
  assert.equal(changes[1].id, "work-root");
  assert.equal(changes[1].position, 1);
  assert.equal(changes.some(item => item.id === inbox.id), false);
  assert.equal(changes.some(item => item.id === otherStep.id), false);
  assert.equal(otherStep.projectPosition, 4);
});

test("detachment shifts only root Inbox tasks and rejects nonsteps", () => {
  const source = createTask({ id: "step", title: "Крок", projectId: "project", listId: "inbox", sectionId: "section" });
  const root = createTask({ id: "root", title: "Корінь", listId: "inbox", position: 2 });
  const section = createTask({ id: "section", title: "Секція", listId: "inbox", sectionId: "section", position: 0 });
  const changes = detachProjectTask(source, [source, root, section], "2026-10-20T12:00:00.000Z");
  assert.deepEqual(Array.from(changes, item => item.id), ["step", "root"]);
  assert.equal(changes[1].position, 3);
  assert.throws(() => detachProjectTask(createTask({ title: "Самостійне" }), [], "now"));
});

test("conversion copies only shared fields into a fresh active project", () => {
  const task = createTask({ id: "source", title: " Назва ", description: "Опис", dueDate: "2026-10-21", dueTime: "09:30",
    listId: "other", sectionId: "section", todayPosition: 3, returnedToInboxAt: "2026-10-19T00:00:00Z",
    completedAt: "2026-10-18T00:00:00Z", customFields: { taskOnly: true } });
  const project = projectFromTask(task, [createProject({ id: "first", title: "Перший", position: 4 })]);
  assert.equal(project.id, "generated-id");
  assert.notEqual(project.id, task.id);
  assert.equal(project.title, "Назва");
  assert.equal(project.description, "Опис");
  assert.equal(project.dueDate, "2026-10-21");
  assert.equal(project.dueTime, "09:30");
  assert.equal(project.position, 5);
  assert.equal(project.status, "active");
  assert.equal(project.completedAt, null);
  assert.deepEqual({ ...project.customFields }, {});
  for (const field of ["listId", "sectionId", "todayPosition", "returnedToInboxAt", "projectId"]) assert.equal(Object.hasOwn(project, field), false);
});

test("shared conversion supports a project step but rejects completed and untitled tasks", () => {
  const fromStep = projectFromTask(createTask({ title: "Крок", projectId: "p" }), []);
  assert.equal(Object.hasOwn(fromStep, "projectId"), false);
  assert.throws(() => projectFromTask(createTask({ title: "Завершене", status: "completed" }), []));
  assert.throws(() => projectFromTask(createTask({ title: "  " }), []));
  const dateOnly = projectFromTask(createTask({ title: "Дата", dueDate: "2026-10-21" }), []);
  assert.equal(dateOnly.dueTime, null);
});

test("converting the current step leaves the source project and advances its next active step", () => {
  const source = createProject({ id: "source", title: "Вихідний", description: "Опис", dueDate: "2026-10-30", position: 2 });
  const current = step("current", 0, { title: "Поточний", description: "Новий опис", dueDate: "2026-10-25", dueTime: "12:00" });
  const next = step("next", 1);
  const last = step("last", 2);
  const created = projectFromTask(current, [source]);
  const remaining = [current, next, last].filter(task => task.id !== current.id);
  assert.equal(created.id, "generated-id");
  assert.equal(created.position, 3);
  assert.equal(created.title, "Поточний");
  assert.equal(created.description, "Новий опис");
  assert.equal(created.dueDate, "2026-10-25");
  assert.equal(created.dueTime, "12:00");
  assert.equal(created.status, "active");
  assert.equal(currentProjectTask(remaining, "project").id, "next");
  assert.deepEqual(Array.from(remaining, task => task.projectPosition), [1, 2]);
  assert.equal(source.title, "Вихідний");
  assert.equal(source.description, "Опис");
  assert.equal(source.dueDate, "2026-10-30");
  assert.equal(remaining.some(task => task.projectId === created.id), false);
});

const step = (id, projectPosition, values = {}) => createTask({
  id, projectId: "project", projectPosition, listId: "inbox", title: id,
  createdAt: `2026-10-15T00:00:0${projectPosition}.000Z`, ...values
});

test("a regular list shows only the current project step plus ordinary tasks", () => {
  const records = [step("first", 0), step("second", 1), createTask({ id: "ordinary", listId: "inbox", title: "ordinary" })];
  assert.equal(currentProjectTask(records, "project").id, "first");
  assert.deepEqual(Array.from(visibleListTasks(records, "inbox"), task => task.id).sort(), ["first", "ordinary"]);
});

test("today candidates contain only the first unfinished project step across lists", () => {
  const records = [
    step("first", 0, { dueDate: "2026-10-19", listId: "inbox" }),
    step("second", 1, { dueDate: "2026-10-19", listId: "other" }),
    createTask({ id: "ordinary", listId: "other", dueDate: "2026-10-19", title: "ordinary" })
  ];
  assert.deepEqual(Array.from(visibleProjectTasks(records), task => task.id), ["first", "ordinary"]);
  records[0] = { ...records[0], status: "completed" };
  assert.deepEqual(Array.from(visibleProjectTasks(records), task => task.id), ["second", "ordinary"]);
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
