const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
        writeText: async value => { window.copiedDescription = value; },
        write: async items => {
          window.copiedDescription = await (await items[0].getType("text/plain")).text();
          window.copiedHtml = await (await items[0].getType("text/html")).text();
        }
      } });
      window.originalFetch = window.fetch;
      window.fetch = async (url, options) => String(url).startsWith("https://www.youtube.com/oembed?")
        ? { ok: true, json: async () => ({ title: "Назва відео" }) } : window.originalFetch(url, options);
    });
    await page.click("#add-task-btn");
    await page.fill("#task-title", "Нотатка");
    await page.locator("#task-description").evaluate(editor => {
      editor.value = "текст";
      const range = document.createRange(); range.selectNodeContents(editor);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    });
    await page.click('#task-form [data-rich-command="bold"]');
    assert.match(await page.locator("#task-description").evaluate(node => node.value), /\*\*текст\*\*/);
    await page.locator("#task-description").evaluate(editor => {
      editor.value = "**Жирний** і *курсив*, <u>підкреслено</u>\n\n- Перший\n- Другий\n\n1. Один\n2. Два\n\n[Приклад](https://example.com/)";
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.equal(await page.locator("#task-description strong").textContent(), "Жирний");
    assert.equal(await page.locator("#task-description em").textContent(), "курсив");
    assert.equal(await page.locator("#task-description u").textContent(), "підкреслено");
    assert.equal(await page.locator("#task-description ul li").count(), 2);
    assert.equal(await page.locator("#task-description ol li").count(), 2);
    await page.click("#task-copy-description");
    await page.waitForFunction(() => Boolean(window.copiedDescription));
    assert.match(await page.evaluate(() => window.copiedDescription), /\*\*Жирний\*\*/);
    assert.match(await page.evaluate(() => window.copiedHtml), /<strong>Жирний<\/strong>/);
    assert.match(await page.locator("#toast .toast-message").textContent(), /Опис скопійовано/);
    await page.locator("#task-description").evaluate(editor => {
      editor.focus();
      const range = document.createRange(); range.selectNodeContents(editor); range.collapse(false);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      const transfer = new DataTransfer(); transfer.setData("text/plain", "https://youtu.be/dQw4w9WgXcQ");
      editor.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }));
    });
    await page.waitForFunction(() => document.querySelector("#task-description a[href*='youtu.be']")?.textContent === "Назва відео");
    await page.click("#task-editor-back");
    await page.locator("#task-editor").waitFor({ state: "hidden" });
    await page.locator(".task-open").first().click();
    assert.equal(await page.locator("#task-description strong").textContent(), "Жирний");
    await page.click('#task-form [data-rich-copy="title-description"]');
    await page.waitForFunction(() => window.copiedDescription?.startsWith("Нотатка\n\n"));
    await page.click("#task-editor-back");
    await page.locator("#task-editor").waitFor({ state: "hidden" });

    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Проєкт");
    await page.click("#project-create-form button[type=submit]");
    await page.click("#project-edit-open");
    await page.locator("#project-description").click();
    await page.locator("#project-description").evaluate(editor => {
      const transfer = new DataTransfer();
      transfer.setData("text/plain", "**Мета**\n\n- Крок");
      editor.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }));
    });
    await page.click("#project-edit-close");
    await page.click("#project-edit-open");
    assert.equal(await page.locator("#project-description strong").textContent(), "Мета");
    assert.equal(await page.locator("#project-description ul li").count(), 1);
    await page.click('[data-rich-target="project-description"]');
    await page.waitForFunction(() => window.copiedDescription?.includes("**Мета**"));
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    await page.locator("[data-project-id]").first().click();
    await page.click("#project-edit-open");
    assert.equal(await page.locator("#project-description strong").textContent(), "Мета");
    assert.deepEqual(errors, []);
    console.log("rich descriptions e2e passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
