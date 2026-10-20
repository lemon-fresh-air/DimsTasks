const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

const stamp = "2026-10-17T10:00:00.000Z";
const base = id => ({ id, entityVersion: 1, createdAt: stamp, updatedAt: stamp, customFields: {} });
const inbox = { ...base("system-list-inbox"), title: "Інбокс", description: "", kind: "inbox", position: 0 };
const task = { ...base("task-from-folder"), listId: "system-list-inbox", sectionId: null, projectId: null, title: "Із папки", description: "", status: "active", completedAt: null, dueDate: null, dueTime: null, position: 0, projectPosition: null, returnedToInboxAt: null };
const backup = (exportedAt, tasks) => ({ format: "local-first-pwa-backup", appId: "dims-tasks", formatVersion: 9, exportedAt, data: { lists: [inbox], sections: [], projects: [], tasks, settings: [] } });

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    assert.equal(await page.locator("#backup-latest").isChecked(), true);

    await page.evaluate(({ older, newer }) => {
      const files = [
        new File([JSON.stringify(older)], "Dimstasks-old.json", { type: "application/json", lastModified: 2000 }),
        new File([JSON.stringify(newer)], "Dimstasks-new.json", { type: "application/json", lastModified: 1000 }),
        new File(["{}"], "unrelated.json", { type: "application/json", lastModified: 3000 })
      ];
      const handle = {
        name: "DimsTasks backups sync",
        queryPermission: async () => "granted",
        values: async function* () {
          for (const file of files) yield { kind: "file", name: file.name, getFile: async () => file };
        }
      };
      Object.defineProperty(window, "showDirectoryPicker", { configurable: true, value: async () => handle });
    }, { older: backup("2026-10-17T10:00:00.000Z", []), newer: backup("2026-10-18T10:00:00.000Z", [task]) });

    await page.click("#backup-import-open");
    await page.locator("#backup-preview:visible").waitFor();
    assert.match(await page.locator("#backup-summary").innerText(), /1 завдань/);
    await page.click("#backup-cancel");
    await page.locator("#backup-latest").uncheck();
    await page.click("#backup-import-open");
    await page.locator("#backup-file-list:visible button").first().waitFor();
    assert.equal(await page.locator("#backup-file-list button").count(), 3);
    await page.getByRole("button", { name: "Dimstasks-old.json" }).click();
    await page.locator("#backup-preview:visible").waitFor();
    assert.match(await page.locator("#backup-summary").innerText(), /0 завдань/);
    await page.click("#backup-cancel");

    await page.reload({ waitUntil: "networkidle" });
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    assert.equal(await page.locator("#backup-latest").isChecked(), true);
    await page.locator("#backup-file").setInputFiles({ name: "manual.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup(stamp, []))) });
    await page.locator("#backup-preview:visible").waitFor();
    assert.deepEqual(errors, []);
    console.log("backup folder e2e passed: latest, manual selection, cancel, reload default, file input");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
