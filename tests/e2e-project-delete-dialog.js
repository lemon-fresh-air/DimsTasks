const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Зберегти крок");
    await page.click("#project-create-form button[type=submit]");
    await page.fill("#project-step-title", "Крок лишається");
    await page.click("#project-step-form button");
    await page.click("#project-edit-open");
    await page.click("#project-delete");
    assert.equal(await page.locator("#project-delete-dialog-title").textContent(), "Видалити проєкт?");
    assert.equal(await page.locator("#project-delete-keep-tasks").isChecked(), true);
    await page.click("#project-delete-no");
    assert.equal(await page.locator("#project-delete-dialog-backdrop").isVisible(), false);
    assert.equal(await page.locator("#project-screen").isVisible(), true);

    await page.click("#project-delete");
    assert.equal(await page.locator("#project-delete-keep-tasks").isChecked(), true);
    await page.click("#project-delete-yes");
    await page.waitForFunction(() => document.querySelectorAll("#active-projects .project-card").length === 0);
    assert.deepEqual(await page.evaluate(() => {
      const task = tasks.find(item => item.title === "Крок лишається");
      return { exists: Boolean(task), projectId: task?.projectId ?? null };
    }), { exists: true, projectId: null });
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    assert.deepEqual(await page.evaluate(() => {
      const task = tasks.find(item => item.title === "Крок лишається");
      return { exists: Boolean(task), projectId: task?.projectId ?? null };
    }), { exists: true, projectId: null });

    await page.click("#project-add");
    await page.fill("#project-create-title", "Видалити з кроком");
    await page.click("#project-create-form button[type=submit]");
    await page.fill("#project-step-title", "Крок видаляється");
    await page.click("#project-step-form button");
    await page.click("#project-back");
    await page.evaluate(() => selectProject(projects.find(project => project.title === "Видалити з кроком").id));
    await page.click("#projects-delete-selected");
    assert.equal(await page.locator("#project-delete-keep-tasks").isChecked(), true);
    await page.uncheck("#project-delete-keep-tasks");
    await page.click("#project-delete-yes");
    await page.waitForFunction(() => !tasks.some(task => task.title === "Крок видаляється"));
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => tasks.some(task => task.title === "Крок видаляється")), false);
    assert.deepEqual(errors, []);
    console.log("project delete dialog passed: cancel, default keep, detach, bulk delete with tasks");
  } finally {
    await browser.close();
  }
})();
