const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

async function readNavigationSetting(page) {
  return page.evaluate(async () => {
    const request = indexedDB.open("dims-tasks-db", 3);
    const db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const get = db.transaction("settings", "readonly").objectStore("settings").get("navigation");
    const value = await new Promise((resolve, reject) => {
      get.onsuccess = () => resolve(get.result);
      get.onerror = () => reject(get.error);
    });
    db.close();
    return value;
  });
}

(async () => {
  const { browser, page, errors } = await openTestApp();

  await page.waitForSelector("#nav-inbox.active");
  const activeField = page.locator("#nav-inbox .nav-icon-field");
  assert.notEqual(await activeField.evaluate(element => getComputedStyle(element).backgroundColor), "rgba(0, 0, 0, 0)", "active navigation icon must have a visible field");

  await page.click("#main-menu-open");
  await page.waitForSelector("#main-menu.is-open");
  await page.click("#settings-open");
  await page.waitForSelector("#settings-screen.is-open");
  assert.equal(await page.locator("#start-screen-select").inputValue(), "inbox", "legacy data must default to Inbox");
  await page.selectOption("#start-screen-select", "projects");
  await page.waitForFunction(async () => {
    const request = indexedDB.open("dims-tasks-db", 3);
    const db = await new Promise(resolve => { request.onsuccess = () => resolve(request.result); });
    const get = db.transaction("settings", "readonly").objectStore("settings").get("navigation");
    const value = await new Promise(resolve => { get.onsuccess = () => resolve(get.result); });
    db.close();
    return value?.startScreen === "projects";
  });
  assert.equal((await readNavigationSetting(page)).startScreen, "projects");

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("#projects-overview:not([hidden])");
  assert.equal(await page.locator("#nav-projects").getAttribute("aria-current"), "page", "saved Projects destination must open after reload");

  await page.click("#nav-inbox");
  await page.waitForSelector("#nav-inbox.active");
  assert.equal(await page.locator("#projects-overview").isHidden(), true, "neighbouring navigation must still close Projects");
  await page.setViewportSize({ width: 1024, height: 900 });
  assert.notEqual(await page.locator("#nav-inbox .nav-icon-field").evaluate(element => getComputedStyle(element).backgroundColor), "rgba(0, 0, 0, 0)", "active field must remain visible at desktop width");
  assert.deepEqual(errors, []);

  await browser.close();
  console.log("E2E start screen and navigation highlight passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
