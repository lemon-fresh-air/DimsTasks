const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.setViewportSize({ width: 1280, height: 844 });
    await page.evaluate(async () => {
      const list = createList({ title: "Мій тестовий список", kind: "regular", position: 100 });
      await listDb.put(list);
      await taskDb.put(createTask({ title: "Тестове завдання", listId: list.id }));
      for (let index = 0; index < 20; index++) await listDb.put(createList({ title: `Список ${index + 1}`, position: 101 + index }));
      await loadLists();
      await refresh();
    });
    const list = page.locator("#desktop-nav-lists .desktop-list-item", { hasText: "Мій тестовий список" });
    await list.waitFor({ state: "visible" });
    assert.equal(await list.locator(".desktop-list-count").innerText(), "1");
    const settingsTop = await page.locator("#desktop-settings-open").evaluate(element => element.getBoundingClientRect().top);
    await page.locator("#desktop-nav-lists").evaluate(element => { element.scrollTop = element.scrollHeight; });
    assert.equal(await page.locator("#desktop-settings-open").evaluate(element => element.getBoundingClientRect().top), settingsTop);
    await list.scrollIntoViewIfNeeded();
    await list.click();
    assert.equal(await page.locator("#current-list-heading").innerText(), "Мій тестовий список");
    assert.equal(await list.getAttribute("aria-current"), "page");
    await page.locator("#desktop-settings-open").click();
    await page.locator("#settings-screen.is-open").waitFor({ state: "visible" });
    await page.locator("#settings-close").click();
    await page.locator("#settings-screen").waitFor({ state: "hidden" });
    await page.locator("#desktop-new-list-open").click();
    await page.locator("#desktop-new-list-title").fill("Скасований список");
    await page.locator("#desktop-new-list-cancel").click();
    assert.equal(await page.locator("#desktop-new-list-form").isVisible(), false);
    await page.locator("#desktop-new-list-open").click();
    await page.locator("#desktop-new-list-title").fill("Створений список");
    await page.locator("#desktop-new-list-form button[type=submit]").click();
    assert.equal(await page.locator("#current-list-heading").innerText(), "Створений список");
    await page.locator("#desktop-nav-lists .desktop-list-item", { hasText: "Створений список" }).waitFor({ state: "visible" });
    await page.keyboard.press("m");
    assert.equal(await page.locator("#desktop-nav-toggle").getAttribute("aria-expanded"), "false");
    await page.locator("#desktop-nav-toggle").click();
    assert.equal(await page.locator("#desktop-nav-toggle").getAttribute("aria-expanded"), "true");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#desktop-nav-lists .desktop-list-item", { hasText: "Мій тестовий список" }).waitFor({ state: "visible" });
    await page.locator("#desktop-nav-lists .desktop-list-item", { hasText: "Створений список" }).waitFor({ state: "visible" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#main-menu-open").waitFor({ state: "visible" });
    assert.equal(await page.locator("#desktop-settings-open").isVisible(), false);
    assert.deepEqual(errors, []);
    console.log("Desktop navigation passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
