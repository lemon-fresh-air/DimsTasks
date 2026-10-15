const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  page.on("dialog", dialog => dialog.accept());
  const step = label => console.log(`step: ${label}`);

  step("open projects and create");
  await page.click("#nav-projects");
  await page.click("#project-add");
  await page.fill("#project-create-title", "Осінній запуск");
  await page.click("#project-create-form button[type=submit]");
  await page.waitForFunction(() => document.querySelector("#project-screen-title").textContent === "Осінній запуск");
  assert.equal(await page.locator("#project-screen-title").textContent(), "Осінній запуск");

  step("cancel editor");
  await page.click("#project-edit-open");
  await page.fill("#project-title", "Назва, яку скасували");
  await page.click("#project-edit-close");
  assert.equal(await page.locator("#project-screen-title").textContent(), "Осінній запуск");

  step("save editor");
  await page.click("#project-edit-open");
  await page.fill("#project-goal", "Випустити першу версію");
  await page.fill("#project-description", "Короткий опис, який можна розгорнути прямо на екрані проєкту.");
  await page.click("#project-save");
  await page.waitForFunction(() => document.querySelector("#project-editor").hidden);
  assert.equal(await page.locator("#project-editor").isVisible(), false);
  assert.match(await page.locator("#project-goal-summary").textContent(), /Випустити першу версію/);
  assert.equal(await page.locator("#project-description-toggle").getAttribute("aria-expanded"), "false");
  await page.click("#project-description-toggle");
  assert.equal(await page.locator("#project-description-toggle").getAttribute("aria-expanded"), "true");

  step("add and expand tasks");
  for (let index = 1; index <= 5; index += 1) {
    await page.fill("#project-step-title", `Завдання ${index}`);
    await page.click("#project-step-form button");
  }
  assert.equal(await page.locator("#project-task-list .swipe-row:visible").count(), 4);
  await page.click("#project-tasks-expand");
  assert.equal(await page.locator("#project-task-list .swipe-row:visible").count(), 5);
  assert.equal(await page.locator("#project-steps").getAttribute("class"), "project-steps is-expanded");
  await page.locator("#project-task-list .swipe-row").nth(1).evaluate(row => row.classList.add("selected"));
  await page.evaluate(() => {
    document.querySelector("#project-selection-toolbar").hidden = false;
    document.querySelector("#project-list-options").hidden = false;
  });
  const menuBox = await page.locator("#project-list-options").boundingBox();
  const firstOptionBox = await page.locator("#project-list-options .list-dropdown-option").first().boundingBox();
  const firstIconBox = await page.locator("#project-list-options .list-dropdown-option span").first().boundingBox();
  assert.equal(menuBox.x >= 12 && menuBox.x + menuBox.width <= 378, true);
  assert.equal(firstOptionBox.x >= menuBox.x && firstOptionBox.x + firstOptionBox.width <= menuBox.x + menuBox.width, true);
  assert.equal(firstIconBox.x >= menuBox.x && firstIconBox.x + firstIconBox.width <= menuBox.x + menuBox.width, true);
  await page.evaluate(() => {
    document.querySelector("#project-selection-toolbar").hidden = true;
    document.querySelector("#project-list-options").hidden = true;
  });
  await page.click("#project-tasks-expand");

  step("reload and verify persistence");
  await page.click("#project-back");
  await page.reload({ waitUntil: "networkidle" });
  await page.click("#nav-projects");
  await page.click(".project-card");
  assert.match(await page.locator("#project-goal-summary").textContent(), /Випустити першу версію/);
  assert.equal(await page.locator("#project-task-list .swipe-row").count(), 5);

  step("complete neighbouring task");
  await page.locator("#project-task-list .toggle").first().evaluate(button => button.click());
  await page.waitForFunction(() => document.querySelector("#project-progress").textContent === "1/5");
  assert.equal(await page.locator("#project-progress").textContent(), "1/5");
  assert.equal(await page.locator("#project-main-save").isVisible(), true);
  assert.equal(await page.locator("#project-main-complete").isVisible(), true);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log("project screen e2e passed: back, edit cancel/save, compact description, expanded tasks, persistence, completion");
})().catch(error => { console.error(error); process.exitCode = 1; });
