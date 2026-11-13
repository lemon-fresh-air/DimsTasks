const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.setViewportSize({ width: 1100, height: 900 });
    const ids = await page.evaluate(async () => {
      const list = createList({ title: "Перевірка", position: 0 });
      const tasksToAdd = ["А", "Б", "В", "Г"].map((title, position) => createTask({ listId: list.id, title, position }));
      await listDb.put(list);
      await taskDb.putMany(tasksToAdd);
      await loadLists();
      await refresh();
      openList(list.id);
      return { list: list.id, tasks: tasksToAdd.map(task => task.id) };
    });
    const order = () => page.locator("#task-list > .swipe-row[data-id]").evaluateAll(rows => rows.map(row => row.dataset.id));
    await page.evaluate(id => selectTask(id), ids.tasks[1]);
    await page.evaluate(() => {
      window.keyboardAnimations = 0;
      const original = Element.prototype.animate;
      Element.prototype.animate = function (...args) { window.keyboardAnimations += 1; return original.apply(this, args); };
      const save = taskDb.putMany;
      taskDb.putMany = async function (...args) {
        await new Promise(resolve => { window.releaseKeyboardSave = resolve; });
        taskDb.putMany = save;
        return save.apply(this, args);
      };
    });
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(() => window.releaseKeyboardSave && window.keyboardAnimations > 0);
    await page.evaluate(() => window.releaseKeyboardSave());
    await page.waitForFunction(expected => tasks.filter(task => task.listId === expected.list).sort(compareTasks)[2].id === expected.tasks[1], ids);
    assert.deepEqual(await order(), [ids.tasks[0], ids.tasks[2], ids.tasks[1], ids.tasks[3]]);
    await page.evaluate(id => toggleTaskSelection(id), ids.tasks[3]);
    await page.keyboard.press("ArrowUp");
    await page.waitForFunction(expected => tasks.filter(task => task.listId === expected.list).sort(compareTasks)[1].id === expected.tasks[1], ids);
    assert.deepEqual(await order(), [ids.tasks[0], ids.tasks[1], ids.tasks[3], ids.tasks[2]]);
    await page.reload({ waitUntil: "networkidle" });
    await page.evaluate(id => openList(id), ids.list);
    assert.deepEqual(await order(), [ids.tasks[0], ids.tasks[1], ids.tasks[3], ids.tasks[2]]);
    const more = await page.evaluate(async () => {
      const newLists = ["Л1", "Л2", "Л3"].map((title, index) => createList({ title, position: index + 1 }));
      await listDb.putMany(newLists);
      await loadLists();
      selectedListIds = new Set([newLists[0].id, newLists[1].id]);
      renderListMenu();
      const newProjects = ["П1", "П2", "П3"].map((title, position) => createProject({ title, position }));
      await projectDb.putMany(newProjects);
      await loadProjects();
      return { lists: newLists.map(item => item.id), projects: newProjects.map(item => item.id) };
    });
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(expected => lists.filter(list => expected.includes(list.id)).sort(compareLists)[0].id === expected[2], more.lists);
    assert.deepEqual(await page.locator("#desktop-nav-lists [data-list-kind=regular]").evaluateAll(rows => rows.map(row => row.dataset.listId).filter(id => id)), [ids.list, more.lists[2], more.lists[0], more.lists[1]]);
    await page.evaluate(() => { selectedListIds = new Set(); renderListMenu(); openProjects(); selectProject(projects.find(project => project.title === "П1").id); });
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(expected => projects.filter(project => expected.includes(project.id)).sort(compareProjects)[1].id === expected[0], more.projects);
    assert.deepEqual(await page.locator("#active-projects [data-project-id]").evaluateAll(rows => rows.map(row => row.dataset.projectId).filter(id => id)), [more.projects[1], more.projects[0], more.projects[2]]);
    await page.evaluate(id => {
      clearProjectSelection();
      Element.prototype.setPointerCapture = function () {};
      window.touchProject = (type, y) => {
        const target = type === "pointerdown" ? projectEls.activeList.querySelector(`[data-project-id="${id}"]`) : projectEls.activeList;
        target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 41, pointerType: "touch", isPrimary: true, clientX: 100, clientY: y }));
      };
      window.touchProject("pointerdown", 100);
    }, more.projects[0]);
    await page.waitForFunction(id => selectedProjectIds.has(id), more.projects[0]);
    await page.evaluate(() => window.touchProject("pointermove", 125));
    assert.equal(await page.locator("#active-projects").evaluate(element => element.classList.contains("dragging")), false);
    await page.evaluate(() => { window.touchProject("pointerup", 125); window.touchProject("pointerdown", 100); window.touchProject("pointermove", 125); });
    assert.equal(await page.locator("#active-projects").evaluate(element => element.classList.contains("dragging")), true);
    await page.evaluate(() => window.touchProject("pointercancel", 125));
    const stepIds = await page.evaluate(async projectId => {
      const steps = ["К1", "К2", "К3"].map((title, projectPosition) => createTask({ title, projectId, projectPosition, listId: INBOX_LIST_ID }));
      await taskDb.putMany(steps);
      await refresh();
      openProject(projectId);
      selectTask(steps[0].id);
      return steps.map(step => step.id);
    }, more.projects[0]);
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(expected => tasks.filter(task => task.projectId === expected.project).sort(compareProjectTasks)[1].id === expected.steps[0], { project: more.projects[0], steps: stepIds });
    assert.deepEqual(await page.locator("#project-task-list .swipe-row[data-id]").evaluateAll(rows => rows.map(row => row.dataset.id)), [stepIds[1], stepIds[0], stepIds[2]]);
    const projectSectionIds = await page.evaluate(async projectId => {
      const original = projects.find(project => project.id === projectId);
      const projectSections = ["Р1", "Р2", "Р3"].map(title => ({ id: crypto.randomUUID(), title, collapsed: false }));
      const updated = { ...original, projectSections };
      await projectDb.put(updated);
      projects = projects.map(project => project.id === projectId ? updated : project);
      clearTaskSelection();
      renderOpenProject();
      selectProjectSection(projectSections[0].id);
      selectedProjectSectionIds.add(projectSections[1].id);
      syncProjectSectionSelection();
      return projectSections.map(section => section.id);
    }, more.projects[0]);
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(expected => projects.find(project => project.id === expected.project).projectSections[0].id === expected.sections[2], { project: more.projects[0], sections: projectSectionIds });
    assert.deepEqual(await page.locator("#project-task-list > .project-section-heading:not(.project-root-heading)").evaluateAll(rows => rows.map(row => row.dataset.sectionId)), [projectSectionIds[2], projectSectionIds[0], projectSectionIds[1]]);
    await page.evaluate(async () => { clearProjectSelection(); await closeProject(); closeProjects(); openList(lists.find(list => list.title === "Перевірка").id); });
    const sectionIds = await page.evaluate(async listId => {
      const added = ["С1", "С2", "С3"].map((title, position) => createSection({ listId, title, position }));
      await sectionDb.putMany(added);
      sections = await sectionDb.all();
      renderCurrentTasks();
      selectListSection(added[0].id);
      selectedListSectionIds.add(added[1].id);
      syncListSectionSelection();
      return added.map(section => section.id);
    }, ids.list);
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(expected => sections.filter(section => expected.includes(section.id)).sort((a, b) => a.position - b.position)[0].id === expected[2], sectionIds);
    assert.deepEqual(await page.locator("#task-list > .list-section[data-section-id]").evaluateAll(rows => rows.map(row => row.dataset.sectionId)), [sectionIds[2], sectionIds[0], sectionIds[1]]);
    await page.evaluate(() => { clearListSectionSelection(); renderCurrentTasks(); });
    const sectionTaskId = await page.evaluate(async ({ listId, sectionId }) => {
      const task = createTask({ title: "Через порожню секцію", listId, sectionId, position: 0 });
      await taskDb.put(task);
      await refresh();
      selectTask(task.id);
      return task.id;
    }, { listId: ids.list, sectionId: sectionIds[2] });
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(expected => tasks.find(task => task.id === expected.task)?.sectionId === expected.section, { task: sectionTaskId, section: sectionIds[0] });
    assert.equal(await page.locator(`#list-section-tasks-${sectionIds[0]} > [data-id="${sectionTaskId}"]`).count(), 1);
    await page.evaluate(() => clearTaskSelection());
    await page.evaluate(async listId => {
      const project = createProject({ title: "Макет", projectSections: [{ id: "visual-section", title: "Міністр зовнішніх справ", collapsed: false }] });
      const task = createTask({ title: "Крок", listId, projectId: project.id, projectSectionId: "visual-section", projectPosition: 0 });
      await projectDb.put(project);
      await taskDb.put(task);
      await loadProjects();
      await refresh();
      openTaskDetails(task);
    }, ids.list);
    for (const width of [1100, 850]) {
      await page.setViewportSize({ width, height: 900 });
      const bounds = await page.evaluate(() => {
        const label = document.querySelector("#task-project-section-row");
        const range = document.createRange();
        range.selectNodeContents(label.firstChild);
        const text = range.getBoundingClientRect();
        const select = label.querySelector("select").getBoundingClientRect();
        return { textBottom: text.bottom, selectTop: select.top, labelWidth: label.getBoundingClientRect().width, selectWidth: select.width };
      });
      assert.ok(bounds.textBottom <= bounds.selectTop, JSON.stringify(bounds));
      assert.ok(bounds.selectWidth <= bounds.labelWidth, JSON.stringify(bounds));
    }
    await page.evaluate(id => openTaskDetails(tasks.find(task => task.id === id)), ids.tasks[0]);
    await page.evaluate(() => els.taskAttachProject.click());
    await page.locator("#task-attach-dialog-backdrop").waitFor({ state: "visible" });
    await page.click("#task-attach-project-trigger");
    const pickerOrder = await page.locator("#task-attach-project-options [data-project-id]").evaluateAll(options => options.map(option => option.dataset.projectId));
    const expectedOrder = await page.evaluate(() => projects.filter(project => project.status === "active").sort(compareProjects).map(project => project.id));
    assert.deepEqual(pickerOrder, expectedOrder);
    await page.click(`#task-attach-project-options [data-project-id="${more.projects[2]}"]`);
    await page.click("#task-attach-cancel");
    await page.locator("#task-attach-dialog-backdrop").waitFor({ state: "hidden" });
    await page.evaluate(() => els.taskAttachProject.click());
    await page.click("#task-attach-project-trigger");
    await page.click(`#task-attach-project-options [data-project-id="${more.projects[2]}"]`);
    await page.click("#task-attach-confirm");
    await page.waitForFunction(expected => tasks.find(task => task.id === expected.task)?.projectId === expected.project, { task: ids.tasks[0], project: more.projects[2] });
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.evaluate(id => tasks.find(task => task.id === id)?.projectId, ids.tasks[0]), more.projects[2]);
    const groupId = await page.evaluate(async () => {
      const date = localDateValue();
      const pair = ["Групове 1", "Групове 2", "Окреме"].map((title, index) => createTask({ title, dueDate: date, listId: INBOX_LIST_ID, position: index + 100 }));
      await taskDb.putMany(pair);
      const id = crypto.randomUUID();
      await settingsDb.saveTodayLayout({ date, groups: [{ id, color: TODAY_GROUP_COLORS[0], collapsed: true, taskIds: [pair[0].id, pair[1].id] }], items: [{ type: "group", id }, { type: "task", id: pair[2].id }] }, date);
      await refresh();
      openList(TODAY_LIST_ID);
      await syncTodayLayout();
      selectedTodayGroupIds = new Set([id]);
      renderCurrentTasks();
      return { id, members: pair.slice(0, 2).map(task => task.id) };
    });
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(value => todayLayout?.items.at(-1)?.id === value.id, groupId);
    assert.equal(await page.locator("#task-list > [data-group-id]").count(), 1);
    await page.evaluate(async value => {
      selectedTodayGroupIds = new Set();
      await changeTodayLayout(layout => ({ ...layout, groups: layout.groups.map(group => group.id === value.id ? { ...group, collapsed: false } : group) }));
      renderCurrentTasks();
      selectTask(value.members[0]);
    }, groupId);
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(value => todayLayout.groups.find(group => group.id === value.id).taskIds[0] === value.members[1], groupId);
    await page.evaluate(() => {
      const editor = document.createElement("div");
      editor.id = "keyboard-checklist-test";
      editor.contentEditable = "true";
      editor.innerHTML = '<ul class="rich-checklist"><li><span class="checklist-item-text">Перший</span></li><li><span class="checklist-item-text">Другий</span></li></ul>';
      document.body.append(editor);
      installChecklistDrag(editor);
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      editor.querySelector(".checklist-drag-handle").focus();
    });
    await page.keyboard.press("ArrowDown");
    assert.deepEqual(await page.locator("#keyboard-checklist-test li .checklist-item-text").allTextContents(), ["Другий", "Перший"]);
    assert.deepEqual(errors, []);
    console.log("Keyboard reorder and project picker: tasks, lists, projects, steps, sections, groups, layout, save and reload passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
