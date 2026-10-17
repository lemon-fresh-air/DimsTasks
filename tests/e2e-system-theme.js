const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    await page.waitForSelector("#settings-screen.is-open");

    assert.equal(await page.locator("#system-theme-toggle").isChecked(), true);
    assert.equal(await page.locator("#theme-toggle").isDisabled(), true);
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    assert.equal(await page.locator("#theme-label").textContent(), "Системна · нічна");

    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
    assert.equal(await page.locator("#theme-label").textContent(), "Системна · денна");

    await page.uncheck("#system-theme-toggle");
    await page.waitForFunction(() => !document.querySelector("#theme-toggle").disabled);
    await page.check("#theme-toggle");
    await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
    let appearance = await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open("dims-tasks-db");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return new Promise((resolve, reject) => {
        const request = db.transaction("settings", "readonly").objectStore("settings").get("appearance");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
    assert.equal(appearance.theme, "dark");
    assert.equal(appearance.useSystemTheme, false);

    await page.reload({ waitUntil: "networkidle" });
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    assert.equal(await page.locator("#system-theme-toggle").isChecked(), false);
    assert.equal(await page.locator("#theme-toggle").isEnabled(), true);
    assert.equal(await page.locator("#theme-toggle").isChecked(), true);
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    assert.deepEqual(errors, []);
    console.log("system theme passed: default, live system changes, manual override, persistence");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
