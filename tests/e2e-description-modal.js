const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#add-task-btn");
    await page.fill("#task-title", "Тест опису");
    await page.click("#task-description-edit");
    await page.locator(".description-edit-mode").waitFor();
    assert.equal(await page.locator(".description-edit-snapshot .task-title-row").isVisible(), true);
    assert.equal(await page.locator(".description-edit-mode .task-editor-header").isVisible(), true);
    assert.equal(await page.locator(".description-edit-snapshot").getAttribute("aria-hidden"), "true");
    await page.waitForFunction(() => getComputedStyle(document.querySelector("#task-form .detail-fields .rich-toolbar")).opacity === "1");
    await page.locator("#task-description").fill("Перший опис");
    await page.click("#description-edit-save");
    await page.locator("#task-editor").waitFor({ state: "hidden" });
    await page.locator("#task-list .task-open").first().click();
    assert.equal(await page.locator("#task-description").innerText(), "Перший опис");
    assert.ok(await page.locator("#task-description").evaluate(element => element.clientHeight < 60));

    await page.click("#task-description-edit");
    await page.locator("#task-description").fill("Скасований опис");
    await page.click("#description-edit-back");
    assert.equal(await page.locator("#task-description").innerText(), "Перший опис");

    await page.click("#task-description-edit");
    await page.locator("#task-description").fill("Другий опис");
    await page.locator("#task-description").press("Escape");
    await page.locator("#description-save-confirm:not([hidden])").waitFor();
    await page.click("#description-save-yes");
    await page.locator(".description-edit-mode").waitFor({ state: "hidden" });
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#task-list .task-open").first().click();
    assert.equal(await page.locator("#task-description").innerText(), "Другий опис");
    const storedDescription = await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open("dims-tasks-db");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const value = await new Promise((resolve, reject) => {
        const request = db.transaction("tasks").objectStore("tasks").getAll();
        request.onsuccess = () => resolve(request.result.find(task => task.title === "Тест опису")?.description);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return value;
    });
    assert.equal(storedDescription, "Другий опис");

    const longDescription = Array.from({ length: 30 }, (_, index) => `Рядок ${index + 1}`).join("\n");
    await page.click("#task-description-edit");
    await page.locator("#task-description").fill(longDescription);
    await page.locator("#task-description").evaluate(element => { element.scrollTop = element.scrollHeight; });
    await page.click("#description-edit-save");
    await page.locator(".description-edit-mode").waitFor({ state: "hidden" });
    const preview = await page.locator("#task-description").evaluate(element => ({
      height: element.clientHeight, fullHeight: element.scrollHeight, scrollTop: element.scrollTop,
      lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
      truncated: element.classList.contains("is-truncated"), value: element.value
    }));
    assert.equal(preview.truncated, true);
    assert.ok(preview.fullHeight > preview.height);
    assert.equal(preview.scrollTop, 0);
    assert.ok(preview.height > preview.lineHeight * 4 && preview.height < preview.lineHeight * 5 + 14);
    assert.equal(preview.value, longDescription);
    await page.evaluate(() => {
      window.__copiedDescription = null;
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
        writeText: async text => { window.__copiedDescription = text; }
      } });
    });
    const toggle = page.locator("#task-description-toggle");
    const description = page.locator("#task-description");
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-expanded"), "true");
    assert.equal(await description.evaluate(element => element.clientHeight === element.scrollHeight && !element.isContentEditable), true);
    await description.getByText("Рядок 30", { exact: true }).click();
    assert.equal(await page.locator(".description-edit-mode").count(), 0);
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    assert.equal(await description.evaluate(element => element.scrollHeight > element.clientHeight), true);
    await page.click("#task-actions-trigger");
    await page.click("#task-copy-description");
    await page.waitForFunction(value => window.__copiedDescription === value, longDescription);
    await page.click("#task-actions-trigger");
    await page.getByRole("menuitem", { name: "Копіювати опис із назвою" }).click();
    await page.waitForFunction(value => window.__copiedDescription === value, `Тест опису

${longDescription}`);

    await page.click("#task-description-edit");
    await page.click("#task-title");
    await page.waitForFunction(() => getComputedStyle(document.querySelector("#task-form .detail-fields .rich-toolbar")).opacity === "0");
    await page.click("#task-description");
    await page.locator("#task-description").fill("- ");
    await page.locator("#task-description").press("Space");
    await page.locator("#task-description ul li").waitFor();
    await page.keyboard.type("Пункт");
    await page.click("#description-edit-save");
    await page.locator(".description-edit-mode").waitFor({ state: "hidden" });
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#task-list .task-open").first().click();
    await page.locator("#task-description ul li").getByText("Пункт").waitFor();
    assert.deepEqual(errors, []);
    console.log("description modal: pass");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
