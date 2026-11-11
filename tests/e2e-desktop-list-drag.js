const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.setViewportSize({ width: 1280, height: 844 });
    await page.evaluate(async () => {
      for (const [position, title] of ["Альфа", "Бета", "Гамма"].entries())
        await listDb.put(createList({ title, position }));
      await taskDb.put(createTask({ title: "Нове завдання" }));
      await taskDb.put(createTask({ title: "На сьогодні", dueDate: localDateValue() }));
      await projectDb.put(createProject({ title: "Тестовий проєкт" }));
      await loadLists();
      await loadProjects();
      await refresh();
    });
    assert.equal(await page.locator("#nav-inbox .desktop-primary-count").innerText(), "2");
    assert.equal(await page.locator("#nav-today .desktop-primary-count").innerText(), "1");
    assert.equal(await page.locator("#nav-projects .desktop-primary-count").innerText(), "1");
    const items = page.locator("#desktop-nav-lists .desktop-list-item");
    const first = items.filter({ hasText: "Альфа" });
    const last = items.filter({ hasText: "Гамма" });
    const start = await first.boundingBox();
    const end = await last.boundingBox();
    await page.mouse.move(start.x + 70, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(end.x + 70, end.y + end.height + 80, { steps: 12 });
    await page.mouse.up();
    await page.waitForFunction(() => lists.filter(list => list.kind === "regular").map(list => list.title).join(",") === "Бета,Гамма,Альфа");
    assert.deepEqual(await items.allTextContents().then(values => values.map(value => value.trim())), ["Бета0", "Гамма0", "Альфа0"]);
    await page.locator("#desktop-list-selection-close").click();
    await items.filter({ hasText: "Бета" }).click({ button: "right" });
    assert.equal(await page.locator("#desktop-list-selection-count").innerText(), "Вибрано: 1");
    await items.filter({ hasText: "Гамма" }).click();
    assert.equal(await page.locator("#desktop-list-selection-count").innerText(), "Вибрано: 2");
    await page.locator("#desktop-list-delete-selected").click();
    await page.locator("#list-selection-delete-backdrop").waitFor({ state: "visible" });
    await page.locator("#list-selection-delete-cancel").click();
    await page.locator("#desktop-list-selection-close").click();
    await page.reload({ waitUntil: "networkidle" });
    assert.deepEqual(await page.locator("#desktop-nav-lists .desktop-list-item").allTextContents().then(values => values.map(value => value.trim())), ["Бета0", "Гамма0", "Альфа0"]);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator("#nav-inbox .desktop-primary-count").isVisible(), false);
    await page.locator("#main-menu-open").click();
    await page.locator("#main-menu-lists [data-list-kind=regular]").first().waitFor({ state: "visible" });
    assert.deepEqual(errors, []);
    console.log("Desktop list drag and actions passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
