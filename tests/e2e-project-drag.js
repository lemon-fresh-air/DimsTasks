const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";

(async () => {
  const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--no-proxy-server"] });
  const context = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  await context.addInitScript(() => Object.defineProperty(navigator, "serviceWorker", { value: { register: () => Promise.resolve() } }));
  const page = await context.newPage();
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve("dist/index.html")).href, { waitUntil: "networkidle" });

  await page.click("#nav-projects");
  await page.click("#project-add");
  await page.fill("#project-create-title", "Drag test");
  await page.click("#project-create-form button[type=submit]");
  for (const title of ["Перший", "Другий", "Третій", "Четвертий"]) {
    await page.fill("#project-step-title", title);
    await page.click("#project-step-form button");
    await page.waitForFunction(expected => document.querySelectorAll("#project-task-list .swipe-row").length === expected, ["Перший", "Другий", "Третій", "Четвертий"].indexOf(title) + 1);
  }

  await page.evaluate(() => {
    const ids = tasks.filter(task => ["Другий", "Третій"].includes(task.title)).map(task => task.id);
    selectedTaskIds = new Set(ids);
    renderOpenProject();
  });
  const rows = page.locator("#project-task-list .swipe-row");
  const second = await rows.nth(1).boundingBox();
  const fourth = await rows.nth(3).boundingBox();
  await page.mouse.move(second.x + second.width / 2, second.y + second.height / 2);
  await page.mouse.down();
  await page.mouse.move(fourth.x + fourth.width / 2, fourth.y + fourth.height - 2, { steps: 4 });
  await page.mouse.move(fourth.x + fourth.width / 2, fourth.y + fourth.height + 8, { steps: 2 });

  assert.equal(await page.locator(".drag-preview").isVisible(), true);
  assert.equal(await page.locator(".drag-placeholder").isVisible(), true);
  assert.equal(await page.locator(".drag-preview .drag-count").textContent(), "2");
  await page.mouse.up();
  await page.waitForFunction(() => [...document.querySelectorAll("#project-task-list .task-text")].map(node => node.textContent).join("|") === "Перший|Четвертий|Другий|Третій");
  assert.deepEqual(await page.locator("#project-task-list .task-text").allTextContents(), ["Перший", "Четвертий", "Другий", "Третій"]);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log("project drag passed: animated preview, placeholder, count badge, multi-step block order");
})();
