const assert = require("node:assert/strict");
const { openTestApp, seedProjectSections, holdProjectSection } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Перетягування між секціями");
    await page.click("#project-create-form button[type=submit]");
    await seedProjectSections(page, ["Початок", "Продовження"]);
    for (const [title, section] of [["Перший", "Початок"], ["Другий", "Продовження"]]) {
      await page.fill("#project-step-title", title);
      await page.click("#project-step-form button[type=submit]");
      await page.waitForFunction(name => [...document.querySelectorAll("#project-task-list .task-text")].some(node => node.textContent === name), title);
      await page.locator("#project-task-list .swipe-row").filter({ hasText: title }).locator(".task-open").click();
      await page.selectOption("#task-project-section-select", { label: section });
      await page.click("#task-editor-back");
      await page.waitForFunction(name => document.querySelectorAll("#project-task-list .list-section-tasks .swipe-row").length === (name === "Перший" ? 1 : 2), title);
    }
    const source = page.locator('#project-task-list .list-section').first().locator('.task-card');
    const toggleGeometry = await page.locator('#project-task-list .list-section').first().locator('.toggle').evaluate(button => {
      const rect = button.getBoundingClientRect();
      const card = button.closest('.task-card').getBoundingClientRect();
      const style = getComputedStyle(button);
      return { width: rect.width, height: rect.height, insideCard: rect.left >= card.left, borderWidth: style.borderTopWidth, radius: style.borderTopLeftRadius };
    });
    assert.equal(toggleGeometry.width, 32);
    assert.equal(toggleGeometry.insideCard, true);
    assert.equal(toggleGeometry.borderWidth, "2px");
    assert.equal(toggleGeometry.radius, "50%");
    const target = page.locator('#project-task-list .list-section').nth(1).locator('.list-section-heading');
    const id = await source.locator('..').getAttribute('data-id');
    await page.evaluate(taskId => selectTask(taskId), id);
    const a = await source.boundingBox();
    const b = await target.boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2 + 15, { steps: 4 });
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction(taskId => tasks.find(task => task.id === taskId)?.projectSectionId === projects.find(project => project.id === activeProjectId)?.projectSections[1].id, id);
    assert.equal(await page.locator('#project-task-list .list-section').nth(1).locator('.swipe-row').count(), 2);
    await page.evaluate(taskId => selectTask(taskId), id);
    const moved = await page.locator(`#project-task-list [data-id="${id}"] .task-card`).boundingBox();
    const firstHeading = await page.locator('#project-task-list .list-section').first().locator('.list-section-heading').boundingBox();
    await page.mouse.move(moved.x + moved.width / 2, moved.y + moved.height / 2);
    await page.mouse.down();
    await page.mouse.move(moved.x + moved.width / 2, moved.y + moved.height / 2 + 15, { steps: 4 });
    await page.mouse.move(firstHeading.x + firstHeading.width / 2, firstHeading.y - 8, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction(taskId => tasks.find(task => task.id === taskId)?.projectSectionId === null, id);
    assert.equal(await page.locator(`#project-task-list > [data-id="${id}"]`).count(), 1);
    assert.deepEqual(errors, []);
    console.log("project section drag: passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
