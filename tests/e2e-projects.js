const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const python = "C:/Users/38066/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const env = { ...process.env, NO_PROXY: "127.0.0.1,localhost,::1", no_proxy: "127.0.0.1,localhost,::1" };
const fileMode = true;
const server = fileMode ? null : spawn(python, ["-m", "http.server", "8000", "--bind", "127.0.0.1", "--directory", "dist"], { env, stdio: ["ignore", "pipe", "pipe"] });
const appUrl = fileMode ? pathToFileURL(path.resolve("dist/index.html")).href : "http://127.0.0.1:8000";
const errors = [];

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await new Promise((resolve, reject) => {
        const request = http.get("http://127.0.0.1:8000", { agent: false }, response => { response.resume(); response.statusCode < 500 ? resolve() : reject(new Error(String(response.statusCode))); });
        request.on("error", reject);
      });
      return;
    }
    catch (_error) {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("localhost did not become ready");
}

(async () => {
  if (!fileMode) await waitForServer();
  const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--no-proxy-server"] });
  const context = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  if (fileMode) await context.addInitScript(() => Object.defineProperty(navigator, "serviceWorker", { value: { register: () => Promise.resolve() } }));
  const page = await context.newPage();
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  page.on("dialog", dialog => dialog.accept());

  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.click("#nav-projects");
  assert.equal(await page.locator("#projects-empty").isVisible(), true);

  await page.click("#project-add");
  await page.fill("#project-create-title", "Скасований");
  await page.click("#project-create-cancel");
  assert.equal(await page.locator(".project-card").count(), 0);

  await page.click("#project-add");
  await page.fill("#project-create-title", "Запуск MVP");
  await page.click("#project-create-form button[type=submit]");
  await page.click("#project-edit-open");
  await page.fill("#project-goal", "Перевірити послідовний потік");
  await page.fill("#project-description", "Опис проєкту");
  await page.click("#project-date-picker-open");
  await page.click('[data-date="2026-10-31"]');
  await page.click("#time-picker-open");
  await page.fill("#time-display-hour", "18");
  await page.fill("#time-display-minute", "30");
  await page.click("#time-dialog-save");
  await page.click("#date-picker-save");
  await page.check("#project-show-countdown");
  assert.equal(await page.locator("#project-countdown").isVisible(), true);
  assert.equal(await page.locator("#project-countdown").textContent(), await page.evaluate(() => projectCountdown("2026-10-31", localDateValue()).text));
  assert.equal(await page.locator("#project-save-status").textContent(), "Є незбережені зміни");
  await page.click("#project-save");
  await page.waitForFunction(() => document.querySelector("#project-editor").hidden);
  assert.match(await page.locator("#project-goal-summary").textContent(), /Перевірити послідовний потік/);
  await page.click("#project-back");
  assert.equal(await page.locator("#projects-overview").isVisible(), true);
  await page.click(".project-card");
  await page.uncheck("#project-add-new-first");

  await page.fill("#project-step-title", "Перший крок");
  await page.click("#project-step-form button");
  await page.waitForFunction(() => document.querySelectorAll("#project-task-list .swipe-row").length === 1);
  await page.fill("#project-step-title", "Другий крок");
  await page.click("#project-step-form button");
  await page.waitForFunction(() => document.querySelectorAll("#project-task-list .swipe-row").length === 2);
  assert.deepEqual(await page.locator("#project-task-list .task-text").allTextContents(), ["Перший крок", "Другий крок"]);
  await page.evaluate(() => addList("Зелений", { fromMainMenu: false }));
  const secondStep = page.locator("#project-task-list .swipe-row").nth(1);
  await secondStep.evaluate(row => {
    const card = row.querySelector(".task-card");
    card.setPointerCapture = () => {};
    card.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 2, pointerType: "touch", clientX: 40, clientY: 40 }));
  });
  await page.waitForTimeout(520);
  await page.locator("#project-task-list").evaluate(list => list.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 2, pointerType: "touch", clientX: 40, clientY: 40 })));
  assert.equal(await page.locator("#project-selection-toolbar").isVisible(), true);
  await page.click("#project-date-selected");
  await page.click('[data-date-shortcut="today"]');
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector("#date-picker-backdrop").hidden);
  assert.equal(await page.evaluate(() => tasks.find(task => task.title === "Другий крок").dueDate), await page.evaluate(() => localDateValue()));
  const secondStepAgain = page.locator("#project-task-list .swipe-row").nth(1);
  await secondStepAgain.evaluate(row => {
    const card = row.querySelector(".task-card");
    card.setPointerCapture = () => {};
    card.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 3, pointerType: "touch", clientX: 40, clientY: 40 }));
  });
  await page.waitForTimeout(520);
  await page.locator("#project-task-list").evaluate(list => list.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 3, pointerType: "touch", clientX: 40, clientY: 40 })));
  await page.click("#project-list-selected");
  await page.locator("#project-list-options [data-list-id]").filter({ hasText: "Зелений" }).click();
  await page.waitForFunction(() => [...document.querySelectorAll("#project-task-list .task-project-name")].some(node => node.textContent === "Зелений"));
  await page.click("#project-back");
  assert.match(await page.locator(".project-card").innerText(), /0\/2/);
  assert.doesNotMatch(await page.locator(".project-card").innerText(), /Поточний крок:/);

  await page.click("#nav-inbox");
  assert.deepEqual(await page.locator("#task-list .task-text").allTextContents(), ["Перший крок"]);
  await page.locator("#task-list .toggle").evaluate(button => button.click());
  await page.waitForTimeout(900);
  const inboxAfterComplete = await page.locator("#task-list .task-text").allTextContents();
  assert.deepEqual(inboxAfterComplete, []);
  await page.click("#main-menu-open");
  await page.locator("#main-menu-lists [data-list-id]").filter({ hasText: "Зелений" }).click();
  assert.deepEqual(await page.locator("#task-list .task-text").allTextContents(), ["Другий крок"]);

  await page.reload({ waitUntil: "networkidle" });
  await page.click("#nav-projects");
  assert.match(await page.locator(".project-card").innerText(), /1\/2/);
  assert.doesNotMatch(await page.locator(".project-card").innerText(), /Поточний крок:/);
  await page.click(".project-card");
  await page.click("#project-edit-open");
  assert.equal(await page.inputValue("#project-goal"), "Перевірити послідовний потік");
  assert.equal(await page.inputValue("#project-due-time"), "18:30");
  assert.equal(await page.isChecked("#project-show-countdown"), true);
  assert.equal(await page.locator("#project-countdown").isVisible(), true);
  await page.click("#project-edit-close");

  let rows = page.locator("#project-task-list .swipe-row");
  let firstBox = await rows.nth(0).boundingBox();
  let secondBox = await rows.nth(1).boundingBox();
  await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + 4, { steps: 8 });
  await page.mouse.up();
  assert.deepEqual(await page.locator("#project-task-list .task-text").allTextContents(), ["Перший крок", "Другий крок"]);
  rows = page.locator("#project-task-list .swipe-row");
  secondBox = await rows.nth(1).boundingBox();
  await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(520);
  await page.mouse.up();
  assert.equal(await page.locator("#project-selection-toolbar").isVisible(), true);
  rows = page.locator("#project-task-list .swipe-row");
  firstBox = await rows.nth(0).boundingBox();
  secondBox = await rows.nth(1).boundingBox();
  await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + 4, { steps: 8 });
  await page.mouse.up();
  await page.waitForFunction(() => document.querySelector("#project-task-list .task-text")?.textContent === "Другий крок");
  await page.click("#project-selection-close");

  await page.locator("#project-task-list .task-open").first().evaluate(button => button.click());
  assert.equal(await page.locator("#task-editor").isVisible(), true);
  await page.fill("#task-title", "Другий крок — уточнено");
  await page.click("#task-editor-back");
  await page.waitForFunction(() => document.querySelector("#project-task-list .task-text")?.textContent === "Другий крок — уточнено");

  await page.click("#project-edit-open");
  await page.click("#project-complete");
  await page.click("#project-complete-yes");
  await page.click("#project-edit-close");
  await page.click("#project-back");
  assert.equal(await page.locator("#completed-projects").isVisible(), true);
  assert.equal(await page.locator("#active-projects .project-card").count(), 0);
  await page.locator("#completed-projects summary").click();
  await page.click("#completed-project-list .project-card");
  await page.click("#project-edit-open");
  await page.click("#project-delete");
  await page.click("#project-delete-yes");
  await page.waitForFunction(() => document.querySelectorAll(".project-card").length === 0);
  assert.equal(await page.locator(".project-card").count(), 0);
  await page.click("#main-menu-open");
  await page.locator("#main-menu-lists [data-list-id]").filter({ hasText: "Зелений" }).click();
  assert.deepEqual(await page.locator("#task-list .task-text").allTextContents(), ["Другий крок — уточнено"]);

  assert.deepEqual(errors, []);
  await browser.close();
  console.log("projects e2e passed: explicit save, selection date/list actions, reload, current step, drag, modal edit, complete, delete/detach");
})().finally(() => server?.kill());
