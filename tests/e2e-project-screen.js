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

  step("save editor with back");
  await page.click("#project-edit-open");
  await page.fill("#project-title", "Осінній запуск — оновлено");
  await page.click("#project-edit-close");
  await page.waitForFunction(() => document.querySelector("#project-editor").hidden && document.querySelector("#project-screen-title").textContent === "Осінній запуск — оновлено");
  assert.equal(await page.locator("#project-screen-title").textContent(), "Осінній запуск — оновлено");

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
  await page.fill("#project-step-title", "Завдання 1");
  await page.click("#project-step-form button");
  await page.evaluate(() => addList("Робота", { fromMainMenu: false }));
  await page.locator("#project-task-list .task-open").first().click();
  await page.click("#task-list-trigger");
  await page.locator("#task-list-options [data-list-id]").filter({ hasText: "Робота" }).click();
  await page.waitForFunction(() => document.querySelector("#task-list-value").textContent === "Робота");
  await page.click("#task-editor-back");
  for (let index = 2; index <= 5; index += 1) {
    await page.fill("#project-step-title", `Завдання ${index}`);
    await page.click("#project-step-form button");
  }
  await page.waitForFunction(() => tasks.filter(task => task.projectId === activeProjectId).length === 5);
  assert.equal(await page.evaluate(() => tasks.filter(task => task.projectId === activeProjectId && task.title !== "Завдання 1").every(task => lists.find(list => list.id === task.listId)?.title === "Робота")), true);
  await page.evaluate(async () => {
    for (let index = 6; index <= 10; index += 1) await addProjectStep(`Завдання ${index}`);
  });
  assert.equal(await page.locator("#project-task-list .swipe-row:visible").count(), 4);
  await page.click("#project-tasks-expand");
  assert.equal(await page.locator("#project-task-list .swipe-row:visible").count(), 10);
  assert.equal(await page.locator("#project-steps").getAttribute("class"), "project-steps is-expanded");
  const expandedScroll = await page.evaluate(() => {
    const card = document.querySelector("#project-task-list .task-card");
    const list = document.querySelector("#project-task-list");
    const panel = document.querySelector("#project-steps");
    const setPointerCapture = card.setPointerCapture;
    card.setPointerCapture = () => {};
    card.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 41, pointerType: "touch", clientX: 180, clientY: 650 }));
    list.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, cancelable: true, pointerId: 41, pointerType: "touch", clientX: 180, clientY: 450 }));
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 41, pointerType: "touch", clientX: 180, clientY: 450 }));
    card.setPointerCapture = setPointerCapture;
    return { top: panel.scrollTop, scrollHeight: panel.scrollHeight, clientHeight: panel.clientHeight };
  });
  assert.ok(expandedScroll.scrollHeight > expandedScroll.clientHeight);
  assert.ok(expandedScroll.top > 0);
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
  assert.equal(await page.locator("#project-task-list .swipe-row").count(), 10);
  await page.fill("#project-step-title", "Завдання 11");
  await page.click("#project-step-form button");
  await page.waitForFunction(() => tasks.some(task => task.title === "Завдання 11"));
  assert.equal(await page.evaluate(() => lists.find(list => list.id === tasks.find(task => task.title === "Завдання 11").listId)?.title), "Робота");

  step("complete neighbouring task");
  await page.locator("#project-task-list .toggle").first().evaluate(button => button.click());
  await page.waitForFunction(() => document.querySelector("#project-progress").textContent === "1/11");
  assert.equal(await page.locator("#project-progress").textContent(), "1/11");
  assert.equal(await page.locator("#project-main-save").count(), 0);
  assert.equal(await page.locator("#project-main-complete").isVisible(), true);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log("project screen e2e passed: back, edit cancel/save, compact description, expanded tasks, persistence, completion");
})().catch(error => { console.error(error); process.exitCode = 1; });
