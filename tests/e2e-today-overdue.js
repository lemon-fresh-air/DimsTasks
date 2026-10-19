const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const dates = await page.evaluate(() => {
      const today = localDateValue();
      const next = new Date(`${today}T12:00:00`);
      next.setDate(next.getDate() + 1);
      return { today, tomorrow: localDateValue(next) };
    });
    await page.evaluate(async today => {
      await listDb.put(createList({ id: "work", title: "Робота", position: 1 }));
      await taskDb.put(createTask({ id: "timed-today", listId: "work", title: "Прострочене сьогодні", dueDate: today, dueTime: "00:00" }));
      await settingsDb.setReturnOverdueToInbox(true);
    }, dates.today);

    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    assert.equal(await page.locator('[data-id="timed-today"]').count(), 1, "elapsed task must stay in Today");
    assert.equal(await page.locator('[data-id="timed-today"] .task-date').getAttribute("data-date-tone"), "overdue");
    assert.equal(await page.evaluate(() => tasks.find(task => task.id === "timed-today")?.listId), "system-list-inbox", "auto-return must move the task to Inbox");

    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    assert.equal(await page.locator('[data-id="timed-today"]').count(), 1, "Today membership must persist after reload");
    assert.equal(await page.evaluate(async () => (await taskDb.all()).filter(task => task.id === "timed-today").length), 1, "reload must not duplicate the task");

    await page.evaluate(async tomorrow => {
      localDateValue = () => tomorrow;
      currentLocalDate = "previous-day";
      currentLocalMinute = "";
      await refreshDateDependentUI();
    }, dates.tomorrow);
    assert.equal(await page.locator('[data-id="timed-today"]').count(), 0, "task must leave Today on the next calendar day");
    assert.equal(await page.evaluate(async () => (await taskDb.all()).filter(task => task.id === "timed-today").length), 1, "day change must not duplicate or delete the stored task");

    assert.deepEqual(errors, []);
    console.log("today overdue e2e passed: elapsed time, overdue tone, auto-return, reload, next day, no duplicates");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
