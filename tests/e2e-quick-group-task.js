const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      await taskDb.put(createTask({ id: "quick-group-seed", title: "Початкове", dueDate: localDateValue() }));
      await refresh();
    });
    await page.click("#nav-today");
    await page.evaluate(() => selectTask("quick-group-seed"));
    await page.click("#group-selected");
    await page.click('[data-color="#3A7BD5"]');
    await page.locator(".today-group-add").waitFor();
    await page.click(".today-group-toggle");
    await page.waitForFunction(() => document.querySelector(".today-group-toggle")?.getAttribute("aria-expanded") === "false");
    assert.equal(await page.locator(".today-group-toggle").getAttribute("aria-expanded"), "false");
    await page.click(".today-group-toggle");
    await page.waitForFunction(() => document.querySelector(".today-group-toggle")?.getAttribute("aria-expanded") === "true");
    assert.equal(await page.locator(".today-group-toggle").getAttribute("aria-expanded"), "true");
    await page.click(".today-group-add");
    await page.fill("#quick-task-title", "Скасоване");
    await page.click("#quick-task-cancel");
    assert.equal(await page.locator("#quick-task-backdrop").isVisible(), false);
    await page.click(".today-group-add");
    await page.fill("#quick-task-title", "Швидке завдання");
    await page.fill("#quick-task-description", "Короткий опис");
    await page.click('#quick-task-form [type="submit"]');
    await page.locator('.today-group-tasks .swipe-row').nth(1).waitFor();
    const saved = await page.evaluate(async () => {
      const task = (await taskDb.all()).find(item => item.title === "Швидке завдання");
      const layout = await settingsDb.todayLayout(localDateValue());
      return { task, grouped: layout.groups[0].taskIds.includes(task.id) };
    });
    assert.equal(saved.task.description, "Короткий опис");
    assert.equal(saved.task.dueDate, await page.evaluate(() => localDateValue()));
    assert.equal(saved.grouped, true);
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    await page.locator('.today-group-tasks .swipe-row').nth(1).waitFor();
    assert.equal(await page.locator('.today-group-tasks .swipe-row').count(), 2);
    assert.deepEqual(errors, []);
    console.log("Quick group task scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
