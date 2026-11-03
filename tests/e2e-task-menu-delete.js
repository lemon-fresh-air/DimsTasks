const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      await taskDb.put(createTask({ id: "menu-delete-test", title: "Для видалення", dueDate: localDateValue() }));
      await refresh();
    });
    await page.click("#nav-today");
    await page.locator('.swipe-row[data-id="menu-delete-test"]').waitFor();
    await page.locator('.swipe-row[data-id="menu-delete-test"] .task-open').click();
    await page.click("#task-actions-trigger");
    await page.locator("#task-delete").waitFor({ state: "visible" });
    await page.click("#task-delete");
    await page.locator('.swipe-row[data-id="menu-delete-test"]').waitFor({ state: "detached" });
    assert.equal((await page.evaluate(() => taskDb.all())).some(task => task.id === "menu-delete-test"), false);
    await page.evaluate(() => refresh());
    assert.equal(await page.locator("#toast .toast-message").innerText(), "Завдання видалено");
    await page.click("#toast-action");
    await page.locator('.swipe-row[data-id="menu-delete-test"]').waitFor();
    assert.equal((await page.evaluate(() => taskDb.all())).some(task => task.id === "menu-delete-test"), true);
    await page.click("#nav-today");
    await page.locator('.swipe-row[data-id="menu-delete-test"]').waitFor();
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    await page.locator('.swipe-row[data-id="menu-delete-test"]').waitFor();
    const card = await page.locator('.swipe-row[data-id="menu-delete-test"] .task-card').boundingBox();
    await page.mouse.move(card.x + card.width - 30, card.y + card.height / 2);
    await page.mouse.down();
    await page.mouse.move(card.x + card.width - 150, card.y + card.height / 2, { steps: 5 });
    await page.mouse.up();
    await page.locator('.swipe-row[data-id="menu-delete-test"]').waitFor({ state: "detached" });
    await page.click("#toast-action");
    await page.locator('.swipe-row[data-id="menu-delete-test"]').waitFor();
    assert.deepEqual(errors, []);
    console.log("Task menu delete scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
