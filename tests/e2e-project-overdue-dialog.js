const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const project = createProject({ id: "overdue-project", title: "Проєкт із простроченням" });
      await projectDb.put(project);
      await taskDb.putMany([
        createTask({ id: "overdue-a", title: "Прострочене А", projectId: project.id, projectPosition: 0, dueDate: localDateValue(yesterday) }),
        createTask({ id: "overdue-b", title: "Прострочене Б", projectId: project.id, projectPosition: 1, dueDate: localDateValue(yesterday) }),
        createTask({ id: "future", title: "Майбутнє", projectId: project.id, projectPosition: 2, dueDate: localDateValue(tomorrow) }),
        createTask({ id: "done", title: "Виконане", projectId: project.id, projectPosition: 3, dueDate: localDateValue(yesterday), status: "completed", completedAt: new Date().toISOString() })
      ]);
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#nav-projects").click();
    const card = page.locator('[data-project-id="overdue-project"]');
    await card.click();
    const dialog = page.locator("#project-overdue-dialog");
    await dialog.waitFor({ state: "visible" });
    assert.match(await page.locator("#project-overdue-dialog-message").textContent(), /2 прострочених/);
    await page.locator("#project-overdue-cancel").click();
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await page.evaluate(async () => (await taskDb.all()).filter(task => task.projectId === "overdue-project").length), 4);

    await page.locator("#project-back").click();
    await card.click();
    await dialog.waitFor({ state: "visible" });
    await page.locator("#project-overdue-clear").click();
    await dialog.waitFor({ state: "hidden" });
    await page.waitForFunction(async () => (await taskDb.all()).filter(task => ["overdue-a", "overdue-b"].includes(task.id)).every(task => task.dueDate === null && task.dueTime === null));
    assert.equal(await page.evaluate(async () => (await taskDb.all()).find(task => task.id === "future").dueDate !== null), true);
    assert.equal(await page.evaluate(async () => (await taskDb.all()).find(task => task.id === "done").status), "completed");
    await page.locator("#toast-action").click();
    await page.waitForFunction(async () => (await taskDb.all()).filter(task => ["overdue-a", "overdue-b"].includes(task.id)).every(task => task.dueDate !== null));

    await page.locator("#project-back").click();
    await card.click();
    await dialog.waitFor({ state: "visible" });
    await page.locator("#project-overdue-clear").click();
    await page.waitForFunction(async () => (await taskDb.all()).filter(task => ["overdue-a", "overdue-b"].includes(task.id)).every(task => task.dueDate === null));
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#nav-projects").click();
    await card.click();
    assert.equal(await dialog.isHidden(), true, "cleared dates must persist after reload");
    await page.evaluate(async () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      await taskDb.putMany((await taskDb.all()).filter(task => ["overdue-a", "overdue-b"].includes(task.id))
        .map(task => ({ ...task, dueDate: localDateValue(date) })));
      await refresh();
    });

    await page.locator("#project-back").click();
    await card.click();
    await dialog.waitFor({ state: "visible" });
    await page.locator("#project-overdue-delete").click();
    await page.waitForFunction(async () => (await taskDb.all()).filter(task => ["overdue-a", "overdue-b"].includes(task.id)).length === 0);
    await page.locator("#toast-action").click();
    await page.waitForFunction(async () => (await taskDb.all()).filter(task => ["overdue-a", "overdue-b"].includes(task.id)).length === 2);
    await page.locator("#project-back").click();
    await card.click();
    await dialog.waitFor({ state: "visible" });
    await page.locator("#project-overdue-delete").click();
    await page.waitForFunction(async () => (await taskDb.all()).filter(task => ["overdue-a", "overdue-b"].includes(task.id)).length === 0);
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#nav-projects").click();
    await card.click();
    assert.equal(await dialog.isHidden(), true);
    assert.deepEqual(await page.evaluate(async () => (await taskDb.all()).filter(task => task.projectId === "overdue-project").map(task => task.id).sort()), ["done", "future"]);
    assert.deepEqual(errors, []);
    console.log("project overdue dialog passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
