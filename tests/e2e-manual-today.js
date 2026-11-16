const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

async function swipe(page, selector, direction, distance = 95) {
  const row = page.locator(selector);
  await row.waitFor({ state: "visible" });
  await page.waitForFunction(selector => {
    const row = document.querySelector(selector);
    return row && row.isConnected && !row.closest("[hidden]");
  }, selector);
  await row.scrollIntoViewIfNeeded();
  const box = await row.locator(".task-card").boundingBox();
  const y = box.y + box.height / 2;
  const x = box.x + box.width / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + direction * distance, y, { steps: 8 });
  await page.mouse.up();
  if (distance >= 72) assert.equal(await row.locator(".task-card").evaluate(card => getComputedStyle(card).animationName),
    direction > 0 ? "swipe-today-return" : "swipe-delete-out");
}

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const ids = await page.evaluate(async () => {
      const first = createTask({ title: "Ручне сьогодні" });
      const second = createTask({ title: "Свайп видалення" });
      const due = createTask({ title: "Термін сьогодні", dueDate: localDateValue() });
      const dueManual = createTask({ title: "Термін і сонце", dueDate: localDateValue(), addedToTodayDate: localDateValue() });
      const future = createTask({ title: "Майбутній термін", dueDate: nextLocalDate(), addedToTodayDate: localDateValue() });
      await taskDb.putMany([first, second, due, dueManual, future]);
      await refresh();
      return { first: first.id, second: second.id, due: due.id, dueManual: dueManual.id, future: future.id };
    });
    await swipe(page, `[data-id="${ids.first}"]`, 1, 30);
    assert.equal(await page.evaluate(id => tasks.find(task => task.id === id).addedToTodayDate, ids.first), null);
    await swipe(page, `[data-id="${ids.first}"]`, 1);
    await page.waitForFunction(id => tasks.find(task => task.id === id)?.addedToTodayDate === localDateValue(), ids.first);
    await page.locator(`[data-id="${ids.first}"] .task-today-indicator`).waitFor({ state: "visible" });
    await swipe(page, `[data-id="${ids.first}"]`, 1);
    await page.waitForFunction(id => tasks.find(task => task.id === id)?.addedToTodayDate === null, ids.first);
    await page.locator("#toast-action").waitFor({ state: "visible" });
    await page.locator("#toast-action").click();
    await page.waitForFunction(id => tasks.find(task => task.id === id)?.addedToTodayDate === localDateValue(), ids.first);
    await page.waitForFunction(id => {
      const row = document.querySelector(`[data-id="${id}"]`);
      return row && !row.classList.contains("adding-today")
        && Math.abs(row.getBoundingClientRect().left - row.querySelector(".task-card").getBoundingClientRect().left) < 1;
    }, ids.first);
    await page.locator("#nav-today").click();
    await page.locator(`#task-list [data-id="${ids.first}"]`).waitFor();
    await page.locator(`#task-list [data-id="${ids.due}"]`).waitFor();
    assert.equal(await page.locator(`#task-list [data-id="${ids.due}"] .task-today-indicator`).isHidden(), true);
    await page.locator(`#task-list [data-id="${ids.future}"] .task-today-indicator`).waitFor({ state: "visible" });
    assert.equal(await page.locator(`#task-list [data-id="${ids.future}"] .task-date`).isVisible(), true);
    await swipe(page, `#task-list [data-id="${ids.dueManual}"]`, 1);
    await page.waitForFunction(id => tasks.find(task => task.id === id)?.addedToTodayDate === null, ids.dueManual);
    await page.locator(`#task-list [data-id="${ids.dueManual}"]`).waitFor();
    assert.equal(await page.locator(`#task-list [data-id="${ids.dueManual}"] .task-today-indicator`).isHidden(), true);
    assert.equal(await page.locator(`#task-list [data-id="${ids.dueManual}"] .task-date`).isVisible(), true);
    assert.equal(await page.evaluate(id => tasks.find(task => task.id === id).dueDate === localDateValue(), ids.dueManual), true);
    await page.locator("#toast-action").click();
    await page.waitForFunction(id => tasks.find(task => task.id === id)?.addedToTodayDate === localDateValue(), ids.dueManual);
    assert.equal(await page.locator(`#task-list [data-id="${ids.first}"]`).count(), 1);
    await swipe(page, `#task-list [data-id="${ids.first}"]`, 1);
    await page.locator(`#task-list [data-id="${ids.first}"]`).waitFor({ state: "detached" });
    await page.locator(`#task-list [data-id="${ids.due}"]`).waitFor();
    await page.locator("#toast-action").click();
    await page.locator(`#task-list [data-id="${ids.first}"]`).waitFor();
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#nav-today").click();
    await page.locator(`#task-list [data-id="${ids.first}"]`).waitFor();
    await page.locator(`#task-list [data-id="${ids.dueManual}"] .task-open`).click();
    await page.locator("#task-actions-trigger").click();
    await page.locator("#task-add-today").getByText("Зняти ручне додавання").click();
    await page.waitForFunction(id => tasks.find(task => task.id === id)?.addedToTodayDate === null, ids.dueManual);
    await page.locator("#task-editor-back").click();
    await page.locator(`#task-list [data-id="${ids.dueManual}"]`).waitFor();
    assert.equal(await page.locator(`#task-list [data-id="${ids.dueManual}"] .task-today-indicator`).isHidden(), true);
    await page.locator(`#task-list [data-id="${ids.first}"] .task-open`).click();
    await page.locator("#task-actions-trigger").click();
    await page.locator("#task-add-today").getByText("Прибрати зі «Сьогодні»").click();
    await page.waitForFunction(id => tasks.find(task => task.id === id)?.addedToTodayDate === null, ids.first);
    await page.locator("#task-editor-back").click();
    await page.locator(`#task-list [data-id="${ids.first}"]`).waitFor({ state: "detached" });
    await page.locator(`#task-list [data-id="${ids.due}"]`).waitFor();
    await page.locator("#nav-inbox").click();
    await page.locator(`[data-id="${ids.first}"] .task-open`).click();
    await page.locator("#task-actions-trigger").click();
    await page.locator("#task-add-today").getByText("Додати до «Сьогодні»").click();
    await page.waitForFunction(id => tasks.find(task => task.id === id)?.addedToTodayDate === localDateValue(), ids.first);
    await page.locator("#task-editor-back").click();
    await page.locator(`[data-id="${ids.due}"] .task-open`).click();
    await page.locator("#task-actions-trigger").click();
    await page.locator("#task-add-today").getByText("Додати до «Сьогодні»").click();
    await page.waitForFunction(id => tasks.find(task => task.id === id)?.addedToTodayDate === localDateValue(), ids.due);
    assert.equal(await page.evaluate(id => tasks.find(task => task.id === id).dueDate === localDateValue(), ids.due), true);
    await page.locator("#task-actions-trigger").click();
    await page.locator("#task-add-today").getByText("Зняти ручне додавання").click();
    await page.waitForFunction(id => tasks.find(task => task.id === id)?.addedToTodayDate === null, ids.due);
    await page.locator("#task-editor-back").click();
    await swipe(page, `[data-id="${ids.second}"]`, -1);
    await page.waitForFunction(id => !tasks.some(task => task.id === id), ids.second);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
