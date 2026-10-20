const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";

async function openTestApp() {
  const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--no-proxy-server"] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    const serviceWorker = new EventTarget();
    serviceWorker.controller = {};
    serviceWorker.register = () => Promise.resolve({ update: () => Promise.resolve() });
    Object.defineProperty(navigator, "serviceWorker", { value: serviceWorker });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve("dist/index.html")).href, { waitUntil: "networkidle" });
  return { browser, page, errors };
}

module.exports = { openTestApp };
