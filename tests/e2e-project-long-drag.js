const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Довгий проєкт");
    await page.click("#project-create-form button[type=submit]");
    await page.uncheck("#project-add-new-first");
    for (let index = 1; index <= 15; index++) {
      await page.fill("#project-step-title", `Крок ${index}`);
      await page.click("#project-step-form button");
      await page.waitForFunction(count => document.querySelectorAll("#project-task-list .swipe-row").length === count, index);
    }
    assert.equal(await page.locator("#project-task-list .swipe-row:visible").count(), 3);
    await page.click("#project-tasks-expand");
    assert.equal(await page.locator("#project-task-list .swipe-row:visible").count(), 15);
    assert.equal(await page.locator("#project-steps").evaluate(node => getComputedStyle(node).position), "static");

    const first = page.locator("#project-task-list .task-card").first();
    const box = await first.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForFunction(() => !document.querySelector("#project-selection-toolbar").hidden);
    await page.mouse.up();
    await page.click("#project-select-all-tasks");
    assert.equal(await page.locator("#project-selection-count").textContent(), "Вибрано: 15");
    await page.click("#project-select-all-tasks");
    assert.equal(await page.locator("#project-selection-toolbar").isVisible(), false);

    await page.evaluate(() => { selectedTaskIds = new Set([projectSteps(activeProjectId)[0].id]); renderOpenProject(); });
    const source = await page.locator("#project-task-list .task-card").first().boundingBox();
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await page.mouse.down();
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2 + 20, { steps: 4 });
    await page.waitForFunction(() => !!document.querySelector(".drag-preview"));
    await page.mouse.move(195, 826, { steps: 8 });
    await page.waitForFunction(() => document.querySelector("#project-screen").scrollTop > 100);
    await page.waitForFunction(() => [...document.querySelector("#project-task-list").children].indexOf(document.querySelector(".drag-placeholder")) > 3);
    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector("#project-task-list .task-text").textContent !== "Крок 1");
    const order = await page.locator("#project-task-list .task-text").allTextContents();
    const stored = await page.evaluate(async () => (await taskDb.all()).filter(task => task.projectId === activeProjectId).sort(compareProjectTasks).map(task => task.title));
    assert.deepEqual(stored, order);
    await page.click("#project-selection-close");
    await page.click("#project-back");
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    await page.locator(".project-card").filter({ hasText: "Довгий проєкт" }).click();
    assert.deepEqual(await page.locator("#project-task-list .task-text").allTextContents(), order);
    assert.deepEqual(errors, []);
    console.log("project long drag passed: compact/expanded, select all, auto scroll, stored order, reload");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
