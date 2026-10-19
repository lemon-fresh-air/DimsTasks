const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    await page.click("#completed-tasks-open");
    await page.locator("#completed-tasks-empty").waitFor({ state: "visible" });
    await page.click("#completed-tasks-close");
    await page.locator("#completed-tasks-screen").waitFor({ state: "hidden" });

    await page.evaluate(async () => {
      const now = new Date();
      const older = new Date(now); older.setDate(older.getDate() - 9);
      const stamp = now.toISOString();
      const rows = [
        createTask({ id: "done-task", title: "Готове завдання", status: "completed", completedAt: stamp }),
        createTask({ id: "done-step", title: "Крок проєкту", projectId: "test-project", status: "completed", completedAt: stamp }),
        createTask({ id: "older-task", title: "Старе завдання", status: "completed", completedAt: older.toISOString() }),
        createTask({ id: "active-task", title: "Активне завдання" })
      ];
      await projectDb.put(createProject({ id: "test-project", title: "Мій проєкт" }));
      await taskDb.putMany(rows);
      await loadProjects();
      await refresh();
    });
    await page.click("#completed-tasks-open");
    await page.locator(".completed-task-row").first().waitFor();
    assert.equal(await page.locator(".completed-task-row").count(), 2);
    assert.match(await page.locator('[data-task-id="done-step"]').textContent(), /Проєкт: Мій проєкт/);
    assert.match(await page.locator('[data-task-id="done-task"]').textContent(), /Список: Інбокс/);
    await page.click("#completed-tasks-older");
    assert.equal(await page.locator(".completed-task-row").count(), 1);
    assert.match(await page.locator(".completed-task-row").textContent(), /Старе завдання/);
    await page.click("#completed-tasks-newer");
    await page.click('[data-task-id="done-step"]');
    await page.locator("#completed-task-detail").waitFor({ state: "visible" });
    await page.click("#completed-task-detail-back");
    await page.click('[data-task-id="done-task"]');
    await page.click("#completed-task-restore");
    await page.locator('[data-task-id="done-task"]').waitFor({ state: "detached" });
    const restored = await page.evaluate(() => appDb.get("tasks", "done-task"));
    assert.equal(restored.status, "active");
    assert.equal(restored.completedAt, null);
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    await page.click("#completed-tasks-open");
    assert.equal(await page.locator('[data-task-id="done-task"]').count(), 0);
    assert.equal(await page.locator('[data-task-id="done-step"]').count(), 1);
    assert.equal(await page.locator('[data-task-id="active-task"]').count(), 0);
    assert.deepEqual(errors, []);
    console.log("Completed task history: passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
