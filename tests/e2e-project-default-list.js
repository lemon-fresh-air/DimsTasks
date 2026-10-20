"use strict";

const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => { await addList("Робота", { fromMainMenu: false }); });
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Тест списку");
    await page.click("#project-create-form button[type=submit]");
    await page.click("#project-edit-open");
    assert.equal(await page.locator("#project-default-list").inputValue(), "");
    await page.locator("#project-default-list").selectOption({ label: "Робота" });
    await page.click("#project-save");
    await page.fill("#project-step-title", "У фіксованому списку");
    await page.click("#project-step-form button");
    await page.waitForFunction(() => tasks.some(task => task.title === "У фіксованому списку"));
    assert.equal(await page.evaluate(() => lists.find(list => list.id === tasks.find(task => task.title === "У фіксованому списку").listId).title), "Робота");
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    await page.click("#active-projects .project-card");
    await page.click("#project-edit-open");
    assert.equal(await page.locator("#project-default-list option:checked").textContent(), "Робота");
    await page.locator("#project-default-list").selectOption("");
    await page.click("#project-save");
    await page.fill("#project-step-title", "Автоматичний список");
    await page.click("#project-step-form button");
    await page.waitForFunction(() => tasks.some(task => task.title === "Автоматичний список"));
    assert.equal(await page.evaluate(() => lists.find(list => list.id === tasks.find(task => task.title === "Автоматичний список").listId).title), "Робота");
    assert.deepEqual(errors, []);
    console.log("project default list passed: fixed, reload, automatic fallback");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
