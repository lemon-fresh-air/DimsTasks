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
  page.addProjectStep = async (title, sectionId = null) => {
    const selector = sectionId ? `[data-section-id="${sectionId}"] .list-section-add` : ".project-root-heading .list-section-add";
    await page.locator(selector).click();
    await page.fill("#quick-task-title", title);
    await page.click("#quick-task-form button[type=submit]");
    await page.locator("#quick-task-backdrop").waitFor({ state: "hidden" });
  };
  page.holdProjectSectionAdd = async (sectionId = null) => {
    const selector = sectionId ? `[data-section-id="${sectionId}"] .list-section-add` : ".project-root-heading .list-section-add";
    const button = page.locator(selector);
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.locator("#project-attach-backdrop").waitFor({ state: "visible" });
    await page.mouse.up();
  };
  return { browser, page, errors };
}

async function seedProjectSections(page, titles) {
  await page.locator("#project-screen").waitFor({ state: "visible" });
  return page.evaluate(async titles => {
    const original = projects.find(project => project.id === activeProjectId);
    const sections = titles.map(title => ({ id: crypto.randomUUID(), title, collapsed: false }));
    const updated = { ...original, projectSections: sections, updatedAt: new Date().toISOString() };
    await projectDb.put(updated);
    projects = projects.map(project => project.id === updated.id ? updated : project);
    renderOpenProject();
    return sections.map(section => section.id);
  }, titles);
}
async function holdProjectSection(page, id) {
  const header = page.locator(`#project-task-list [data-project-section-toggle="${id}"]`);
  await header.scrollIntoViewIfNeeded();
  const box = await header.boundingBox();
  await page.mouse.move(box.x + 30, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForFunction(id => selectedProjectSectionIds.has(id), id);
  await page.mouse.up();
}
module.exports = { openTestApp, seedProjectSections, holdProjectSection };
