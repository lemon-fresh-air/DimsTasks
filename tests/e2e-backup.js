const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

const stamp = "2026-10-17T10:00:00.000Z";
const localFileDate = () => {
  const value = new Date();
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][value.getMonth()];
  return `${String(value.getDate()).padStart(2, "0")}-${month}-${value.getFullYear()}`;
};
const base = id => ({ id, entityVersion: 1, createdAt: stamp, updatedAt: stamp, customFields: {} });
const inbox = { ...base("system-list-inbox"), title: "Інбокс", description: "", kind: "inbox", position: 0 };
const data = {
  lists: [inbox, ...Array.from({ length: 100 }, (_, i) => ({ ...base(`list-${i}`), title: `Список ${i}`, description: "", kind: "regular", position: i + 1 }))],
  sections: [],
  projects: Array.from({ length: 100 }, (_, i) => ({ ...base(`project-${i}`), title: `Проєкт ${i}`, goal: "", description: "", status: "active", dueDate: null, dueTime: null, showCountdown: false, lastListId: null, addNewTasksFirst: true, completedAt: null, position: i })),
  tasks: Array.from({ length: 1000 }, (_, i) => ({ ...base(`task-${i}`), listId: `list-${i % 100}`, sectionId: null, projectId: `project-${i % 100}`, title: `Крок ${i}`, description: "", status: "active", completedAt: null, dueDate: null, dueTime: null, position: Math.floor(i / 100), projectPosition: Math.floor(i / 100), returnedToInboxAt: null })),
  settings: [
    { id: "appearance", entityVersion: 1, createdAt: stamp, updatedAt: stamp, theme: "dark" },
    { id: "navigation", entityVersion: 1, createdAt: stamp, updatedAt: stamp, startScreen: "projects" }
  ]
};
const backup = records => ({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 9, exportedAt: stamp, data: records });

async function upload(page, payload) {
  await page.locator("#backup-file").setInputFiles({ name: "dims-tasks.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(payload)) });
  await page.locator("#backup-preview:visible").waitFor();
}

async function readStore(page, name) {
  return page.evaluate(async storeName => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("dims-tasks-db");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const result = await new Promise((resolve, reject) => {
      const request = db.transaction(storeName).objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  }, name);
}

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    assert.deepEqual(await page.locator(".backup-setting > .backup-actions > button").allTextContents(), ["Експорт бекапу", "Імпорт бекапу"]);
    const downloadPromise = page.waitForEvent("download");
    await page.click("#backup-export");
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), `Dimstasks-1---${localFileDate()}.json`);
    assert.equal(await page.locator("#backup-download-link").isHidden(), true);
    const directDownloadPromise = page.waitForEvent("download");
    await page.click("#backup-export");
    const directDownload = await directDownloadPromise;
    assert.equal(directDownload.suggestedFilename(), download.suggestedFilename());

    await page.reload({ waitUntil: "networkidle" });
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    assert.equal(await page.locator("#backup-prefix").inputValue(), "Dimstasks");
    const nextDownloadPromise = page.waitForEvent("download");
    await page.click("#backup-export");
    const nextDownload = await nextDownloadPromise;
    assert.equal(nextDownload.suggestedFilename(), `Dimstasks-2---${localFileDate()}.json`);
    await page.locator("#backup-prefix").fill("Робота");
    const renamedDownloadPromise = page.waitForEvent("download");
    await page.click("#backup-export");
    const renamedDownload = await renamedDownloadPromise;
    assert.equal(renamedDownload.suggestedFilename(), `Робота-3---${localFileDate()}.json`);
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    assert.equal(await page.locator("#backup-prefix").inputValue(), "Робота");

    await upload(page, backup(data));
    assert.match(await page.locator("#backup-summary").innerText(), /1000 завдань, 100 проєктів, 101 списків/);
    await page.click("#backup-cancel");
    assert.equal(await page.locator("#backup-preview").isVisible(), false);
    assert.equal((await readStore(page, "tasks")).length, 0);

    await upload(page, backup(data));
    await page.click("#backup-replace");
    assert.equal(await page.locator("#backup-apply").isDisabled(), true);
    await page.check("#backup-safe-copy");
    await page.click("#backup-apply");
    await page.waitForFunction(() => document.querySelector("#backup-status").textContent.includes("Дані замінено"));
    assert.equal((await readStore(page, "tasks")).length, 1000);
    assert.equal((await readStore(page, "projects")).length, 100);
    assert.equal((await readStore(page, "lists")).length, 101);
    const replacedSettings = await readStore(page, "settings");
    assert.equal(replacedSettings.find(item => item.id === "appearance").theme, "dark");
    assert.equal(replacedSettings.find(item => item.id === "navigation").startScreen, "projects");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal((await readStore(page, "tasks")).length, 1000);
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");

    await page.click("#main-menu-open");
    await page.click("#settings-open");
    await page.evaluate(() => {
      const original = URL.createObjectURL.bind(URL);
      URL.createObjectURL = blob => { window.lastBackupBlob = blob; return original(blob); };
    });
    const fullDownloadPromise = page.waitForEvent("download");
    await page.click("#backup-export");
    await fullDownloadPromise;
    const exported = await page.evaluate(async () => JSON.parse(await window.lastBackupBlob.text()));
    assert.equal(exported.formatVersion, 12);
    assert.equal(exported.data.tasks.length, 1000);
    assert.equal(exported.data.tasks[0].todayPosition, null);
    assert.equal(exported.data.projects.length, 100);
    assert.equal(exported.data.settings.find(item => item.id === "navigation").startScreen, "projects");
    await upload(page, exported);
    await page.click("#backup-replace");
    await page.check("#backup-safe-copy");
    await page.click("#backup-apply");
    await page.waitForFunction(() => document.querySelector("#backup-status").textContent.includes("Дані замінено"));
    assert.equal((await readStore(page, "tasks")).length, 1000);

    const incoming = structuredClone(data);
    incoming.tasks[0].title = "Оновлений крок";
    incoming.tasks[0].updatedAt = "2026-10-18T10:00:00.000Z";
    incoming.tasks.push({ ...incoming.tasks[0], id: "task-new", title: "Доданий крок", projectPosition: 10, position: 10 });
    await upload(page, backup(incoming));
    await page.click("#backup-merge");
    await page.check("#backup-safe-copy");
    await page.click("#backup-apply");
    await page.waitForFunction(() => document.querySelector("#backup-status").textContent.includes("Дані злито"));
    const tasks = await readStore(page, "tasks");
    assert.equal(tasks.length, 1001);
    assert.equal(tasks.find(item => item.id === "task-0").title, "Оновлений крок");
    assert.equal(tasks.find(item => item.id === "task-new").projectId, "project-0");

    await page.locator("#backup-file").setInputFiles({ name: "broken.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup({ ...data, tasks: [data.tasks[0], data.tasks[0]] }))) });
    await page.waitForFunction(() => document.querySelector("#backup-status").textContent.includes("Повторний id"));
    assert.equal(await page.locator("#backup-preview").isVisible(), false);
    assert.match(await page.locator("#backup-status").innerText(), /Повторний id/);
    assert.equal((await readStore(page, "tasks")).length, 1001);
    assert.deepEqual(errors, []);
    console.log("backup e2e passed: export, preview, cancel, replace, reload, merge, invalid file, 1000 tasks");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
