const assert = require('node:assert/strict');
const { openTestApp, seedProjectSections, holdProjectSection } = require('./e2e-helper');

(async () => {
  const { browser, page, errors } = await openTestApp();
  page.setDefaultTimeout(10000);
  try {
    await page.click('#nav-projects');
    await page.click('#project-add');
    await page.fill('#project-create-title', 'Спрощені налаштування');
    await page.click('#project-create-form button[type=submit]');
    await seedProjectSections(page, ['Підготовка']);
    await page.click('#project-edit-open');
    assert.equal(await page.locator('#project-save').count(), 0);
    assert.equal(await page.locator('#project-actions-menu').isVisible(), false);
    assert.equal(await page.locator('#project-screen > .project-panel').isVisible(), false);
    assert.equal(await page.locator('#project-section-name').isVisible(), false);
    assert.equal(await page.locator('#project-description').isVisible(), false);
    assert.equal(await page.locator('#project-show-countdown').isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'project-edit-close');

    await page.fill('#project-title', '');
    await page.click('#project-edit-close');
    assert.equal(await page.locator('#project-editor').isVisible(), true);
    assert.match(await page.locator('#project-save-status').innerText(), /Назва не може/);
    await page.fill('#project-title', 'Мій проєкт');
    assert.equal(await page.locator('#project-goal').count(), 0);
    await page.click('#project-description-open');
    await page.fill('#project-description', 'Скасований опис');
    await page.click('#project-description-cancel');
    assert.equal(await page.locator('#project-description-open').innerText(), 'Додати опис…');
    await page.click('#project-description-open');
    await page.fill('#project-description', 'Корисний опис');
    await page.click('#project-description-done');
    assert.equal(await page.locator('#project-description-open').innerText(), 'Корисний опис');
    await page.click('#project-description-open');
    await page.fill('#project-description', 'Скасовано Escape');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#project-description-open').innerText(), 'Корисний опис');

    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedProject = value; } } }));
    await page.click('.project-copy-menu summary');
    await page.click('#project-copy-title-description');
    await page.waitForFunction(() => window.copiedProject === 'Мій проєкт\n\nКорисний опис');
    await page.click('.project-copy-menu summary');
    await page.click('[data-rich-target="project-description"][data-rich-copy="description"]');
    await page.waitForFunction(() => window.copiedProject === 'Корисний опис');

    await page.click('#project-date-picker-open');
    assert.equal(await page.locator('#project-show-countdown').isVisible(), false);
    await page.click('[data-date-shortcut="today"]');
    await page.check('#project-show-countdown');
    await page.click('#date-picker-save');
    await page.click('#project-date-picker-open');
    await page.uncheck('#project-show-countdown');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#project-show-countdown').isChecked(), true);
    assert.equal(await page.locator('#project-section-cards').count(), 0);
    // Browser Back closes the description editor and preserves settings.
    await page.click('#project-description-open');
    await page.fill('#project-description', 'Скасовано назад');
    await page.waitForFunction(() => history.state?.view?.projectDescription === true);
    await page.goBack();
    await page.waitForFunction(() => !document.querySelector('#project-description-dialog').open);
    assert.equal(await page.locator('#project-description-open').innerText(), 'Корисний опис');

    await page.click('#project-actions-trigger');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#project-actions-menu').isVisible(), false);
    for (const [action, cancel] of [['#project-convert-task', '#project-convert-cancel'], ['#project-delete', '#project-delete-no'], ['#project-complete', '#project-complete-no']]) {
      await page.click('#project-actions-trigger');
      await page.click(action);
      await page.click(cancel);
      assert.equal(await page.locator('#project-editor').isVisible(), true);
    }
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.locator('#project-editor').evaluate(element => element.scrollWidth <= element.clientWidth), true, JSON.stringify(await page.locator('#project-editor').evaluate(element => [...element.querySelectorAll('*')].map(node => ({ id: node.id, class: node.className, right: node.getBoundingClientRect().right, width: node.getBoundingClientRect().width })).filter(box => box.right > element.clientWidth))));
      await page.click('#project-description-open');
      const box = await page.locator('#project-description-dialog').boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width && box.y >= 0 && box.y + box.height <= 844);
      await page.click('#project-description-cancel');
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'D:/Downloads/dimstasks-project-editor.png' });
    await page.click('#project-edit-close');
    await page.locator('#project-editor').waitFor({ state: 'hidden' });
    await page.addProjectStep('Сусіднє завдання');
    await page.waitForFunction(() => tasks.some(task => task.title === 'Сусіднє завдання'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.click('#nav-projects');
    await page.locator('.project-card').first().click();
    await page.click('#project-edit-open');
    assert.equal(await page.inputValue('#project-title'), 'Мій проєкт');
    assert.equal(await page.locator('#project-description-open').innerText(), 'Корисний опис');
    const stored = await page.evaluate(async () => (await projectDb.all())[0]);
    assert.equal(stored.showCountdown, true);
    assert.equal(stored.description, 'Корисний опис');
    assert.equal(stored.projectSections[0].title, 'Підготовка');
    assert.deepEqual(errors, []);
    console.log('project editor: save, validation, cancel, copy, countdown, sections, browser back, menus, reload, neighbouring task, 320/390/1280px: passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
