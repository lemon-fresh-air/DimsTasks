const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const ids = await page.evaluate(async () => {
      const list = createList({ title: "Список для перевірки", kind: "regular", position: 1 });
      const section = createSection({ listId: list.id, title: "Секція", position: 0 });
      const task = createTask({ title: "Завдання списку", listId: list.id, sectionId: section.id });
      const projectSection = { id: crypto.randomUUID(), title: "Етап", collapsed: false };
      const project = createProject({ title: "Проєкт для перевірки", projectSections: [projectSection] });
      const step = createTask({ title: "Крок", listId: list.id, projectId: project.id, projectSectionId: projectSection.id });
      await listDb.put(list); await sectionDb.put(section); await projectDb.put(project); await taskDb.putMany([task, step]);
      lists.push(list); sections.push(section); projects.push(project); tasks.push(task, step);
      openList(list.id);
      return { listId: list.id, sectionId: section.id, taskId: task.id, projectId: project.id, projectSectionId: projectSection.id, stepId: step.id };
    });
    async function checkPlaceholder(toolbarId) {
      const toolbar = page.locator(toolbarId);
      await toolbar.waitFor({ state: "visible" });
      const dots = toolbar.locator(".selection-more-placeholder");
      assert.equal(await dots.count(), 1);
      assert.equal(await dots.evaluate(button => Math.round(button.getBoundingClientRect().width)), 44);
      assert.equal(await dots.locator(".selection-more-dots").evaluate(dot => getComputedStyle(dot).width), "4px");
      const sizes = await toolbar.locator(".toolbar-action:visible").evaluateAll(buttons => buttons.map(button =>
        [Math.round(button.getBoundingClientRect().width), Math.round(button.getBoundingClientRect().height)]));
      assert.ok(sizes.every(([width, height]) => width === 44 && height === 44));
      const glyphs = await toolbar.locator(".selection-glyph:visible").evaluateAll(icons => icons.map(icon =>
        [getComputedStyle(icon).width, getComputedStyle(icon).strokeWidth]));
      assert.ok(glyphs.every(([width, stroke]) => width === "24px" && stroke === "2px"));
      const centerOffset = await toolbar.evaluate(root => {
        const top = root.querySelector(".selection-more-placeholder").getBoundingClientRect().top;
        const buttons = [...root.querySelectorAll(".toolbar-action")].map(button => button.getBoundingClientRect())
          .filter(rect => rect.width && rect.top > top + 20);
        const bounds = root.getBoundingClientRect();
        return buttons.length ? (buttons[0].left + buttons.at(-1).right - bounds.left - bounds.right) / 2 : 0;
      });
      assert.ok(Math.abs(centerOffset) <= 2, `${toolbarId}: ряд дій має бути по центру`);
      await dots.click();
      assert.equal(await page.locator(".toast-message").textContent(), "В розробці");
    }
    await page.evaluate(id => selectTask(id), ids.taskId);
    await checkPlaceholder("#selection-toolbar");
    await page.evaluate(id => selectListSection(id, true), ids.sectionId);
    await checkPlaceholder("#list-section-selection-toolbar");
    await page.click("#main-menu-open");
    await page.evaluate(id => selectList(id), ids.listId);
    await checkPlaceholder("#main-menu-selection-toolbar");
    await page.evaluate(() => closeMainMenu());
    await page.click("#nav-projects");
    await page.evaluate(id => selectProject(id), ids.projectId);
    await checkPlaceholder("#projects-selection-toolbar");
    await page.evaluate(id => openProject(id), ids.projectId);
    await page.evaluate(id => selectProjectSection(id, true), ids.projectSectionId);
    await checkPlaceholder("#project-section-selection-toolbar");
    await page.setViewportSize({ width: 320, height: 844 });
    await checkPlaceholder("#project-section-selection-toolbar");
    await page.evaluate(id => selectTask(id), ids.stepId);
    await page.locator("#project-selection-toolbar").waitFor({ state: "visible" });
    assert.equal(await page.locator("#project-selection-more-menu button").count(), 3);
    assert.deepEqual(errors, []);
    console.log("selection overflow placeholders: passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
