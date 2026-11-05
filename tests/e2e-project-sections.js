const assert = require("node:assert/strict");
const { openTestApp, seedProjectSections, holdProjectSection } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Проєкт із секціями");
    await page.click("#project-create-form button[type=submit]");
    await page.waitForSelector("#project-screen:not([hidden])");
    const [sectionId] = await seedProjectSections(page, ["Підготовка"]);
    await holdProjectSection(page, sectionId);
    await page.click("#project-section-rename");
    await page.fill("#project-section-rename-input", "Скасована назва");
    await page.click("#project-section-action-cancel");
    assert.match(await page.locator("#project-task-list").innerText(), /Підготовка/);
    await page.click("#project-section-selection-close");
    await page.addProjectStep("Перший крок");
    await page.waitForSelector('#project-task-list [data-id]');
    await page.locator("#project-task-list .task-open").first().click();
    await page.selectOption("#task-project-section-select", { label: "Підготовка" });
    await page.click("#task-editor-back");
    await page.waitForFunction(() => document.querySelector('#project-task-list .project-section-heading:not(.project-root-heading)')?.textContent.includes('Підготовка'));
    assert.equal(await page.locator("#project-task-list .project-section-heading").count(), 2);
    assert.equal(await page.locator("#project-task-list .current-project-step .sr-only").textContent(), "Поточний крок");
    await page.evaluate(async () => {
      const task = tasks.find(item => item.title === "Перший крок");
      const date = localDateValue();
      const updated = { ...task, dueDate: date, updatedAt: new Date().toISOString() };
      await taskDb.put(updated);
      tasks = tasks.map(item => item.id === task.id ? updated : item);
      await appDb.put("settings", { id: dayPlanId(date), entityVersion: 1, date,
        groups: [{ id: "practice-group", color: "#3A7BD5", title: null, collapsed: false, taskIds: [task.id] }],
        items: [{ type: "group", id: "practice-group" }], createdAt: updated.updatedAt, updatedAt: updated.updatedAt });
      renderOpenProject();
    });
    await page.click(`#project-task-list [data-project-section-toggle="${sectionId}"]`);
    await page.waitForFunction(() => document.querySelectorAll('#project-task-list [data-id]').length === 0);
    assert.equal(await page.locator('#project-task-list [data-id]').count(), 0);
    assert.equal((await page.locator(`#project-task-list [data-project-section-toggle="${sectionId}"]`).innerText()).includes('поточний крок'), false);
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    await page.locator(".project-card").first().click();
    assert.equal(await page.locator(`#project-task-list [data-project-section-toggle="${sectionId}"]`).getAttribute('aria-expanded'), 'false');
    await page.click(`#project-task-list [data-project-section-toggle="${sectionId}"]`);
    await page.waitForSelector('#project-task-list [data-id]');
    assert.equal(await page.locator('#project-task-list [data-id]').count(), 1);
    await holdProjectSection(page, sectionId);
    await page.click("#project-section-dissolve");
    await page.click("#project-section-action-confirm");
    await page.waitForFunction(() => document.querySelectorAll('#project-task-list .project-section-heading:not(.project-root-heading)').length === 0);
    assert.equal(await page.locator('#project-task-list [data-id]').count(), 1);
    assert.equal(await page.evaluate(() => tasks.find(task => task.title === "Перший крок").projectSectionId), null);
    assert.deepEqual(errors, []);
    console.log("project sections: passed");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
