const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

async function selectText(page, selector, text) {
  await page.evaluate(({ selector, text }) => {
    const editor = document.querySelector(selector);
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const index = node.textContent.indexOf(text);
      if (index < 0) continue;
      const range = document.createRange();
      range.setStart(node, index); range.setEnd(node, index + text.length);
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(range);
      editor.dispatchEvent(new Event("keyup", { bubbles: true }));
      return;
    }
    throw new Error(`Text not found: ${text}`);
  }, { selector, text });
}

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const taskId = await page.evaluate(async () => {
      const task = createTask({ title: "Посилання в описі", description: "Цей фрагмент буде посиланням" });
      await taskDb.put(task);
      await refresh();
      return task.id;
    });
    await page.locator(`#task-list [data-id="${taskId}"] .task-open`).click();
    await page.locator("#task-description").click();
    await selectText(page, "#task-description", "фрагмент");
    const linkButton = page.locator('#task-description').locator('xpath=..').locator('[data-rich-command="link"]');
    assert.equal(await linkButton.evaluate(button => getComputedStyle(button, "::before").content), "none");
    await linkButton.click();
    await page.locator("#rich-link-dialog").waitFor({ state: "visible" });
    assert.equal(await page.locator("#rich-link-text").inputValue(), "фрагмент");
    await page.locator("#rich-link-url").fill("file:///bad");
    await page.locator("#rich-link-form button[type=submit]").click();
    await page.locator("#rich-link-error").waitFor({ state: "visible" });
    await page.locator("#rich-link-cancel").click();
    assert.equal(await page.locator("#task-description a").count(), 0);
    await selectText(page, "#task-description", "фрагмент");
    await linkButton.click();
    assert.equal(await page.locator("#rich-link-text").inputValue(), "фрагмент");
    await page.locator("#rich-link-text").fill("Дуже довгий текст посилання, який має акуратно скорочуватися у невеликому попапі");
    await page.locator("#rich-link-url").fill("https://example.com/path");
    await page.locator("#rich-link-form button[type=submit]").click();
    const link = page.locator("#task-description a");
    await link.waitFor();
    assert.equal(await link.getAttribute("href"), "https://example.com/path");
    await link.click();
    await page.locator("#rich-link-preview").waitFor({ state: "visible" });
    assert.equal(await page.locator("#rich-link-preview-open").getAttribute("href"), "https://example.com/path");
    assert.equal(await page.locator("#rich-link-preview-label").evaluate(el => el.scrollWidth > el.clientWidth), true);
    await page.mouse.click(5, 5);
    await page.locator("#rich-link-preview").waitFor({ state: "hidden" });
    await page.locator("#description-edit-save").click();
    await page.locator("#task-editor-back").click();
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(`#task-list [data-id="${taskId}"] .task-open`).click();
    assert.equal(await page.locator("#task-description a").count(), 1);
    await page.locator("#task-editor-back").click();
    await page.locator("#nav-projects").click();
    await page.locator("#project-add").click();
    await page.locator("#project-create-title").fill("Посилання в проєкті");
    await page.locator("#project-create-form button[type=submit]").click();
    await page.waitForFunction(() => activeProjectId && projects.some(project => project.id === activeProjectId));
    await page.locator("#project-edit-open").click();
    await page.locator("#project-description-open").click();
    await page.locator("#project-description").fill("Важливий текст проєкту");
    await selectText(page, "#project-description", "текст проєкту");
    await page.locator('#project-description-dialog [data-rich-command="link"]').click();
    assert.equal(await page.locator("#rich-link-text").inputValue(), "текст проєкту");
    await page.locator("#rich-link-url").fill("https://example.org/project");
    await page.locator("#rich-link-form button[type=submit]").click();
    await page.locator("#project-description a").click();
    await page.locator("#rich-link-preview").waitFor({ state: "visible" });
    assert.equal(await page.locator("#rich-link-preview-open").getAttribute("href"), "https://example.org/project");
    assert.deepEqual(errors.filter(error => !/favicon\.ico|ERR_NAME_NOT_RESOLVED/.test(error)), []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
