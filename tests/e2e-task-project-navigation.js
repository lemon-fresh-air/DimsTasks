const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Перевірка переходу");
    await page.click("#project-create-form button[type=submit]");
    await page.fill("#project-step-title", "Початкова назва");
    await page.click("#project-step-form button");
    await page.locator("#project-task-list .task-open").first().click();
    await page.fill("#task-title", "Збережена назва");
    await page.fill("#task-description", "Збережений опис");
    await page.click("#task-project-link");
    await page.waitForFunction(() => document.querySelector("#task-editor").hidden);
    assert.equal(await page.locator("#project-task-list .task-text").first().textContent(), "Збережена назва");
    assert.equal(await page.evaluate(() => tasks.find(task => task.title === "Збережена назва")?.description), "Збережений опис");

    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    await page.click(".project-card");
    await page.locator("#project-task-list .task-open").first().click();
    assert.equal(await page.locator("#task-title").inputValue(), "Збережена назва");
    assert.equal(await page.locator("#task-description").evaluate(node => node.value), "Збережений опис");

    await page.fill("#task-title", "   ");
    await page.click("#task-project-link");
    assert.equal(await page.locator("#task-editor").isVisible(), true);
    assert.equal(await page.locator("#toast .toast-message").textContent(), "Введіть назву завдання");

    await page.fill("#task-title", "Невдала спроба");
    await page.evaluate(() => {
      window.testOriginalPutMany = taskDb.putMany;
      taskDb.putMany = async () => { throw new Error("test write failure"); };
    });
    await page.click("#task-project-link");
    assert.equal(await page.locator("#task-editor").isVisible(), true);
    assert.equal(await page.locator("#toast .toast-message").textContent(), "Не вдалося зберегти завдання");
    await page.evaluate(() => { taskDb.putMany = window.testOriginalPutMany; });

    await page.fill("#task-title", "Збережена назва");
    await page.click("#task-project-link");
    await page.waitForFunction(() => document.querySelector("#task-editor").hidden);
    assert.equal(await page.locator("#project-task-list .task-text").first().textContent(), "Збережена назва");
    await page.locator("#project-task-list .task-open").first().click();
    await page.click("#task-editor-back");
    await page.waitForFunction(() => document.querySelector("#task-editor").hidden);
    assert.deepEqual(errors, []);
    console.log("task project navigation e2e passed");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
