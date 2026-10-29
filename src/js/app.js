let tasks = [];
let lists = [];
let activeListId = INBOX_LIST_ID;
let todayDefaultListId = INBOX_LIST_ID;
let returnOverdueToInbox = false;
let startScreen = "inbox";
let manualTheme = "light";
let useSystemTheme = true;
const systemThemeQuery = matchMedia("(prefers-color-scheme: dark)");
let selectedTaskIds = new Set();
let selectedTodayGroupIds = new Set();
let selectedListIds = new Set();
let completionAudioContext;
let editingSelectedTaskDates = false;
let editingProjectDate = false;
let currentLocalDate = localDateValue();
let todayLayout = null;
let dayChangePending = false;
let currentLocalMinute = localTimeValue();
let overdueProcessing;
let dateChangeTimer;
let listEditorCloseTimer;
let listEditorOpenFrame;
let pendingBackup = null;
let backupBusy = false;
let backupNextVersion = 1;
let backupDirectoryHandle = null;
let completedWeekOffset = 0;
let completedDetailId = null;
let skipCompletedPopstate = false;

function completedWeekBounds(offset = completedWeekOffset) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1 - offset * 7);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return { start, end };
}

function completedTaskMeta(task) {
  const list = lists.find(item => item.id === task.listId);
  const project = projects.find(item => item.id === task.projectId);
  const when = new Intl.DateTimeFormat("uk-UA", { dateStyle: "long", timeStyle: "short" }).format(new Date(task.completedAt));
  return `Список: ${list?.title || "Нові"}${project ? ` · Проєкт: ${project.title}` : ""} · Завершено: ${when}`;
}

function renderCompletedTasks() {
  if (els.completedTasksScreen.hidden) return;
  const { start, end } = completedWeekBounds();
  const entries = completedTasksInRange(tasks, start, end);
  const format = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short" });
  const last = new Date(end);
  last.setDate(last.getDate() - 1);
  els.completedTasksRange.textContent = `${format.format(start)} – ${format.format(last)}`;
  els.completedTasksNewer.hidden = completedWeekOffset === 0;
  els.completedTasksOlder.hidden = !tasks.some(task => task.status === "completed" && task.completedAt && new Date(task.completedAt) < start);
  els.completedTasksEmpty.hidden = entries.length > 0;
  els.completedTasksList.replaceChildren();
  let previousDay = "";
  for (const task of entries) {
    const day = localDateValue(new Date(task.completedAt));
    if (day !== previousDay) {
      const heading = document.createElement("h3");
      heading.className = "completed-tasks-day";
      heading.textContent = new Intl.DateTimeFormat("uk-UA", { weekday: "long", day: "numeric", month: "long" }).format(new Date(task.completedAt));
      els.completedTasksList.append(heading);
      previousDay = day;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "completed-task-row";
    button.dataset.taskId = task.id;
    const title = document.createElement("strong");
    title.textContent = task.title;
    const meta = document.createElement("small");
    meta.textContent = completedTaskMeta(task);
    button.append(title, meta);
    els.completedTasksList.append(button);
  }
  if (completedDetailId) {
    const task = tasks.find(item => item.id === completedDetailId && item.status === "completed");
    if (task) {
      els.completedTaskDetailTitle.textContent = task.title;
      els.completedTaskDetailMeta.textContent = completedTaskMeta(task);
      els.completedTaskDetailDescription.textContent = task.description || "";
      els.completedTaskDetailDescription.hidden = !task.description;
    } else completedDetailId = null;
  }
  els.completedTasksOverview.hidden = Boolean(completedDetailId);
  els.completedTaskDetail.hidden = !completedDetailId;
}

function openCompletedTasks() {
  completedWeekOffset = 0;
  completedDetailId = null;
  els.completedTasksScreen.hidden = false;
  document.body.classList.add("completed-tasks-open");
  renderCompletedTasks();
  if (!mobileNavigationEnabled()) history.pushState({ completedTasks: true }, "");
  els.completedTasksClose.focus({ preventScroll: true });
}

function closeCompletedTasks({ fromHistory = false } = {}) {
  if (els.completedTasksScreen.hidden) return;
  els.completedTasksScreen.hidden = true;
  document.body.classList.remove("completed-tasks-open");
  completedDetailId = null;
  els.completedTasksOpen.focus({ preventScroll: true });
  if (!mobileNavigationEnabled() && !fromHistory && history.state?.completedTasks) {
    skipCompletedPopstate = true;
    history.back();
  }
}

function renderAppearanceSettings() {
  const theme = useSystemTheme ? (systemThemeQuery.matches ? "dark" : "light") : manualTheme;
  applyTheme(theme, { manualTheme, useSystemTheme });
}

async function loadAppearanceSettings() {
  const appearance = await settingsDb.appearance();
  manualTheme = appearance.theme;
  useSystemTheme = appearance.useSystemTheme;
  renderAppearanceSettings();
}
function clearPreparedBackupDownload() {
  if (!els.backupDownloadLink?.href) return;
  const url = els.backupDownloadLink.href;
  els.backupDownloadLink.removeAttribute("href");
  els.backupDownloadLink.removeAttribute("download");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
const todayList = { id: TODAY_LIST_ID, title: "Сьогодні", kind: "today" };
const tomorrowList = { id: TOMORROW_LIST_ID, title: "Завтра", kind: "today" };
function isDayList(id = activeListId) { return id === TODAY_LIST_ID || id === TOMORROW_LIST_ID; }
function activePlanDate() { return activeListId === TOMORROW_LIST_ID ? nextLocalDate() : localDateValue(); }
function ensureCurrentDay() {
  if (localDateValue() === currentLocalDate && !dayChangePending) return true;
  showDayChangePrompt();
  return false;
}
function showDayChangePrompt() {
  dayChangePending = true;
  els.dayChangeBackdrop.hidden = false;
  els.dayChangeConfirm.focus({ preventScroll: true });
}

function activeList() {
  if (activeListId === TODAY_LIST_ID) return todayList;
  if (activeListId === TOMORROW_LIST_ID) return tomorrowList;
  return lists.find(list => list.id === activeListId) || lists.find(list => list.kind === "inbox");
}

function visibleTasks() {
  if (isDayList()) {
    const date = activePlanDate();
    return visibleProjectTasks(tasks).filter(task => isTaskDueToday(task, date)).sort(compareDayTasks);
  }
  return visibleListTasks(tasks, activeListId).sort(compareTasks);
}

function renderCurrentTasks() {
  if (!isDayList() || todayLayout?.date !== activePlanDate()) selectedTodayGroupIds = new Set();
  else selectedTodayGroupIds = new Set([...selectedTodayGroupIds].filter(id =>
    todayLayout.groups.some(group => group.id === id && group.collapsed)));
  renderTasks(visibleTasks(), selectedTaskIds, lists, projects, activeList(),
    isDayList() && todayLayout?.date === activePlanDate() ? todayLayout : null, selectedTodayGroupIds);
  updateMainMenuTaskCounts(tasks);
  renderSelectedListOptions(lists, activeListId);
  renderProjects();
  els.daySwitch.hidden = !isDayList();
  els.daySwitch.textContent = activeListId === TOMORROW_LIST_ID ? "← Сьогодні" : "Завтра →";
}

function renderListNavigation() {
  const current = activeList();
  if (!current) return;
  setActiveListUI(current);
  renderListMenu();
}

function renderListMenu() {
  const inboxIndex = lists.findIndex(list => list.kind === "inbox");
  const menuLists = lists.slice();
  menuLists.splice(inboxIndex < 0 ? 0 : inboxIndex + 1, 0, todayList);
  menuLists.splice(inboxIndex < 0 ? 1 : inboxIndex + 2, 0, tomorrowList);
  renderMainMenuLists(menuLists, activeListId, selectedListIds, tasks);
  renderTaskListOptions(lists);
}

function playCompletionSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    completionAudioContext ||= new AudioContextClass();
    const context = completionAudioContext;
    if (context.state === "suspended") context.resume().catch(() => {});
    const now = context.currentTime;
    [[659.25, 0], [880, 0.09]].forEach(([frequency, offset]) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + offset;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.055, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.14);
    });
  } catch (_error) {
    // Sound is optional: a browser may block audio until it is enabled by the user.
  }
}

function startCompletionFeedback(toggle) {
  toggle?.classList.add("completing");
  const container = toggle?.closest(".task-card, .task-title-row");
  container?.classList.add("completing");
  container?.closest(".swipe-row")?.classList.add("completing");
  if (toggle?.animate) {
    toggle.animate([
      { transform: "scale(.72)" },
      { transform: "scale(1.14)", offset: .52 },
      { transform: "scale(1)" }
    ], { duration: 320, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
    toggle.querySelector("span")?.animate([
      { opacity: 0, transform: "scale(.45) rotate(-18deg)" },
      { opacity: 1, transform: "scale(1) rotate(0)" }
    ], { duration: 230, delay: 60, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
    container?.animate([
      { opacity: 1, transform: "scale(1)" },
      { opacity: .72, transform: "scale(.994)", offset: .72 },
      { opacity: 0, transform: "scale(.98)" }
    ], { duration: 400, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
  }
  playCompletionSound();
}

function captureTaskPositions() {
  return new Map([...els.list.children].map(row => [row.dataset.id, row.getBoundingClientRect().top]));
}

function animateTaskReflow(previousPositions) {
  for (const row of els.list.children) {
    const previousTop = previousPositions.get(row.dataset.id);
    if (previousTop === undefined || !row.animate) continue;
    const distance = previousTop - row.getBoundingClientRect().top;
    if (Math.abs(distance) < 1) continue;
    row.animate([
      { transform: `translateY(${distance}px)` },
      { transform: "translateY(0)" }
    ], { duration: 280, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
  }
}

async function animateBulkDateChange(selectedIds, previousPositions) {
  animateTaskReflow(previousPositions);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const animations = [...els.list.children]
    .filter(row => selectedIds.has(row.dataset.id))
    .map(row => row.querySelector(".task-card")?.animate([
      { opacity: .72, transform: "scale(.985)" },
      { opacity: 1, transform: "scale(1)" }
    ], { duration: 240, easing: "cubic-bezier(.22,1,.36,1)" }))
    .filter(Boolean);
  await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
}

async function refresh({ animateTaskReflow: shouldAnimateTaskReflow = false } = {}) {
  const previousPositions = shouldAnimateTaskReflow ? captureTaskPositions() : null;
  tasks = (await taskDb.all()).sort(compareTasks);
  await syncTodayLayout();
  selectedTaskIds = new Set([...selectedTaskIds].filter(id => tasks.some(task => task.id === id)));
  renderCurrentTasks();
  renderProjects();
  renderCompletedTasks();
  if (previousPositions) animateTaskReflow(previousPositions);
}

async function loadAndNormalizeTaskOrder() {
  const loaded = await taskDb.all();
  const normalized = normalizeTaskOrder(loaded);
  const changed = normalized.filter((task, index) => task !== loaded[index]);
  if (changed.length) await taskDb.putMany(changed);
  tasks = normalized.sort(compareTasks);
  await syncTodayLayout();
  renderCurrentTasks();
}

function visibleTodayLayoutTasks(date) {
  return visibleProjectTasks(tasks).filter(task => isTaskDueToday(task, date))
    .map(task => ({ ...task, todayPosition: null }));
}

async function syncTodayLayout() {
  if (!isDayList()) { todayLayout = null; return null; }
  const date = activePlanDate();
  const screen = activeListId;
  const stored = await settingsDb.todayLayout(date);
  if (!ensureCurrentDay() || screen !== activeListId) return null;
  if (!stored || !isValidDayPlanShape(stored)) {
    todayLayout = null;
    return null;
  }
  const normalized = normalizeDayPlan(stored, visibleTodayLayoutTasks(date), date);
  if (!normalized) {
    todayLayout = null;
    await settingsDb.saveTodayLayout(null, date);
    return null;
  }
  if (JSON.stringify({ date: stored.date, groups: stored.groups, items: stored.items }) !== JSON.stringify(normalized)) {
    await settingsDb.saveTodayLayout(normalized, date);
    if (!ensureCurrentDay() || screen !== activeListId) return null;
  }
  todayLayout = normalized;
  return normalized;
}

async function changeTodayLayout(change) {
  if (!ensureCurrentDay()) throw new Error("Настала нова доба");
  const date = activePlanDate();
  await syncTodayLayout();
  if (!ensureCurrentDay() || date !== activePlanDate()) throw new Error("Дата змінилася під час дії");
  const next = change(todayLayout, visibleTodayLayoutTasks(date), date);
  const plan = next || flattenDayPlan(todayLayout, date);
  if (!ensureCurrentDay()) throw new Error("Дата змінилася під час дії");
  await settingsDb.saveTodayLayout(plan, date);
  todayLayout = plan;
  return plan;
}
function flattenDayPlan(layout, date, omitted = new Set()) {
  if (!layout) return null;
  return { date, groups: [], items: layout.items.flatMap(item =>
    item.type === "task" ? [item] : (layout.groups.find(group => group.id === item.id)?.taskIds || []).map(id => ({ type: "task", id })))
    .filter(item => !omitted.has(item.id)) };
}

async function loadLists() {
  lists = (await listDb.all()).sort(compareLists);
  selectedListIds = new Set([...selectedListIds].filter(id => lists.some(list => list.id === id && list.kind === "regular")));
  if (!isDayList() && !lists.some(list => list.id === activeListId)) {
    activeListId = lists.find(list => list.kind === "inbox")?.id || INBOX_LIST_ID;
  }
  renderListNavigation();
}

async function initializeApp({ openStartScreen = false } = {}) {
  await loadLists();
  await settingsDb.migrateTodayLayout();
  await settingsDb.migrateTodayOrder();
  await loadAppearanceSettings();
  todayDefaultListId = await settingsDb.todayListId() || INBOX_LIST_ID;
  returnOverdueToInbox = await settingsDb.returnOverdueToInbox();
  startScreen = await settingsDb.startScreen();
  const backupNaming = await settingsDb.backupNaming();
  els.backupPrefix.value = backupNaming.prefix;
  backupNextVersion = backupNaming.nextVersion;
  await loadBackupDirectory();
  els.returnOverdueToggle.checked = returnOverdueToInbox;
  els.startScreenSelect.value = startScreen;
  await loadAndNormalizeTaskOrder();
  await loadProjects();
  renderCurrentTasks();
  await processOverdueTasks();
  if (openStartScreen) applyStartScreen();
}

function applyStartScreen() {
  if (startScreen === "today") openList(TODAY_LIST_ID);
  else if (startScreen === "projects") openProjects();
  else if (startScreen === "overview") openMainMenu();
  else if (startScreen === "upcoming") {
    closeProjects();
    setActivePrimaryNav("upcoming");
    toast("Розділ «Скоро» з’явиться згодом");
  } else openList(INBOX_LIST_ID);
}

function validTodayDefaultListId() {
  return lists.some(list => list.id === todayDefaultListId) ? todayDefaultListId : INBOX_LIST_ID;
}

function clearBackupSelection() {
  pendingBackup = null;
  els.backupFile.value = "";
  els.backupPreview.hidden = true;
  els.backupFileList.hidden = true;
  els.backupFileList.replaceChildren();
}

function openBackupDirectoryDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("dims-tasks-local-files", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("handles");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storedBackupDirectory(value) {
  const db = await openBackupDirectoryDb();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("handles", value === undefined ? "readonly" : "readwrite");
      const request = value === undefined
        ? transaction.objectStore("handles").get("backup-directory")
        : transaction.objectStore("handles").put(value, "backup-directory");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

function showBackupDirectory() {
  const supported = typeof window.showDirectoryPicker === "function";
  els.backupFolderChoose.hidden = !supported;
  els.backupLatest.closest("label").hidden = !supported;
  els.backupFolderName.hidden = !supported || !backupDirectoryHandle;
  if (backupDirectoryHandle) els.backupFolderName.textContent = `Папка: ${backupDirectoryHandle.name}`;
}

async function loadBackupDirectory() {
  if (typeof window.showDirectoryPicker !== "function") {
    showBackupDirectory();
    return;
  }
  try { backupDirectoryHandle = await storedBackupDirectory(); }
  catch (_error) { backupDirectoryHandle = null; }
  showBackupDirectory();
}

async function pickBackupDirectory() {
  const handle = await window.showDirectoryPicker({ mode: "read" });
  backupDirectoryHandle = handle;
  showBackupDirectory();
  try { await storedBackupDirectory(handle); }
  catch (_error) { els.backupStatus.textContent = "Папку відкрито, але її не вдалося запам’ятати для наступного запуску."; }
  return handle;
}

async function writeBackupToDirectory(handle, fileName, blob) {
  const baseName = fileName.slice(0, -5);
  let selectedName = fileName;
  let suffix = 2;
  while (true) {
    try { await handle.getFileHandle(selectedName); }
    catch (error) {
      if (error.name === "NotFoundError") break;
      throw error;
    }
    selectedName = `${baseName} (${suffix++}).json`;
  }
  const file = await handle.getFileHandle(selectedName, { create: true });
  const writable = await file.createWritable();
  try {
    await writable.write(blob);
    await writable.close();
  } catch (error) {
    try { await writable.abort(); } catch (_ignored) { /* Keep the original write error. */ }
    throw error;
  }
  return selectedName;
}

async function importFromBackupDirectory() {
  if (backupBusy) return;
  if (typeof window.showDirectoryPicker !== "function") {
    els.backupFile.click();
    return;
  }
  backupBusy = true;
  clearBackupSelection();
  try {
    const handle = backupDirectoryHandle || await pickBackupDirectory();
    if ((await handle.queryPermission({ mode: "read" })) !== "granted" &&
        (await handle.requestPermission({ mode: "read" })) !== "granted") {
      throw new Error("Доступ до папки не надано. Виберіть папку бекапів ще раз.");
    }
    els.backupStatus.textContent = "Пошук бекапів у папці…";
    const files = [];
    for await (const entry of handle.values()) {
      if (entry.kind !== "file" || !entry.name.toLowerCase().endsWith(".json")) continue;
      try { files.push({ file: await entry.getFile(), entry }); }
      catch (_error) { /* A file may disappear while Syncthing updates the folder. */ }
    }
    if (!files.length) {
      els.backupStatus.textContent = "У вибраній папці немає JSON-файлів.";
      return;
    }
    if (els.backupLatest.checked) {
      let newest = null;
      for (const item of files) {
        try {
          const parsed = await readBackup(item.file);
          const time = parsed.exportedAt ? Date.parse(parsed.exportedAt) : item.file.lastModified;
          if (!newest || time > newest.time) newest = { ...item, time };
        } catch (_error) { /* Ignore unrelated or damaged JSON files. */ }
      }
      if (!newest) {
        els.backupStatus.textContent = "У папці немає придатних бекапів DimsTasks.";
        return;
      }
      await chooseBackup(newest.file);
    } else {
      files.sort((a, b) => b.file.lastModified - a.file.lastModified || a.file.name.localeCompare(b.file.name));
      for (const item of files) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = item.file.name;
        button.addEventListener("click", () => chooseBackup(item.file));
        els.backupFileList.append(button);
      }
      els.backupFileList.hidden = false;
      els.backupStatus.textContent = "Оберіть файл із папки бекапів.";
    }
  } catch (error) {
    els.backupStatus.textContent = error.name === "AbortError" ? "Вибір папки скасовано." : error.message || "Не вдалося відкрити папку бекапів.";
  } finally { backupBusy = false; }
}

function backupSummary(data) {
  const counts = backupCounts(data);
  return `${counts.tasks} завдань, ${counts.projects} проєктів, ${counts.lists} списків, ${counts.sections} секцій, ${counts.settings} налаштувань`;
}

async function chooseBackup(file) {
  clearBackupSelection();
  if (!file) return;
  els.backupStatus.textContent = "Перевірка файлу…";
  try {
    const parsed = await readBackup(file);
    pendingBackup = parsed;
    const date = parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString("uk-UA") : "дата невідома";
    els.backupSummary.textContent = `${file.name}. Копія від ${date}. ${backupSummary(parsed.data)}. Формат ${parsed.formatVersion}.`;
    els.backupPreview.hidden = false;
    els.backupStatus.textContent = "Файл перевірено. Оберіть спосіб відновлення.";
  } catch (error) {
    els.backupStatus.textContent = error.message || "Не вдалося перевірити файл";
  }
}

async function applyBackup(mode) {
  if (!pendingBackup || backupBusy) return;
  backupBusy = true;
  els.backupStatus.textContent = "Відновлення даних…";
  try {
    const previous = await appDb.exportAll();
    let result = normalizeBackupTodayLayout(pendingBackup.data);
    let report = "Дані замінено";
    if (mode === "merge") {
      const merged = await appDb.mergeAll(result, (local, incoming) => mergeBackupData(completeBackupFields(local), incoming));
      result = merged.data;
      report = `Дані злито: додано ${merged.changes.added}, оновлено ${merged.changes.updated}, збережено локальних ${merged.changes.kept}`;
    } else {
      result = preserveBackupNaming(result, await appDb.get("settings", BACKUP_NAMING_SETTINGS_ID));
      await appDb.replaceAll(result);
    }
    clearPreparedBackupDownload();
    clearBackupSelection();
    selectedTaskIds = new Set();
    selectedListIds = new Set();
    selectedProjectIds = new Set();
    activeProjectId = null;
    await initializeApp();
    els.backupStatus.textContent = `${report}. ${backupSummary(result)}.`;
    toast(report, { duration: 3000, action: async () => {
      backupBusy = true;
      try {
        await appDb.replaceAll(previous);
        clearPreparedBackupDownload();
        await initializeApp();
        els.backupStatus.textContent = "Імпорт відмінено. Попередні дані відновлено.";
        toast("Імпорт відмінено");
      } catch (error) {
        els.backupStatus.textContent = error.message || "Не вдалося відмінити імпорт";
        toast("Не вдалося відмінити імпорт");
      } finally {
        backupBusy = false;
      }
    } });
  } catch (error) {
    els.backupStatus.textContent = error.message || "Не вдалося відновити дані";
  } finally {
    backupBusy = false;
  }
}

function localTimeValue(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

async function processOverdueTasks() {
  if (overdueProcessing) return overdueProcessing;
  overdueProcessing = (async () => {
    const returnedAt = new Date().toISOString();
    const updated = returnOverdueTasksToInbox(tasks, { enabled: returnOverdueToInbox, localDate: localDateValue(), localTime: localTimeValue(), returnedAt });
    const changed = updated.filter((task, index) => task !== tasks[index]);
    if (!changed.length) return false;
    await taskDb.putMany(changed);
    tasks = updated.sort(compareTasks);
    renderCurrentTasks();
    return true;
  })().finally(() => { overdueProcessing = null; });
  return overdueProcessing;
}

async function refreshDateDependentUI() {
  const today = localDateValue();
  const minute = localTimeValue();
  if (today === currentLocalDate && minute === currentLocalMinute) return;
  const dayChanged = today !== currentLocalDate;
  if (dayChanged) { showDayChangePrompt(); return; }
  currentLocalDate = today;
  currentLocalMinute = minute;
  await processOverdueTasks();
  renderCurrentTasks();
  if (!els.editor.hidden) {
    els.dateLabel.textContent = readableDueDate(els.date.value, els.time.value);
    applyDateTone(els.datePickerOpen, els.date.value, els.time.value);
  }
  if (!els.datePickerBackdrop.hidden) {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    els.todayWeekday.textContent = weekdayFormatter.format(now);
    els.tomorrowWeekday.textContent = weekdayFormatter.format(tomorrow);
    setPendingDate(pendingDateValue);
  }
}

function scheduleDateChangeCheck() {
  clearTimeout(dateChangeTimer);
  const now = new Date();
  const nextMinute = new Date(now);
  nextMinute.setSeconds(60, 0);
  dateChangeTimer = setTimeout(() => {
    refreshDateDependentUI();
    scheduleDateChangeCheck();
  }, nextMinute.getTime() - now.getTime() + 50);
}

function checkForDateChange() {
  refreshDateDependentUI().catch(() => { todayLayout = null; });
  scheduleDateChangeCheck();
}

function openList(listId) {
  closeProjects();
  if (!isDayList(listId) && !lists.some(list => list.id === listId)) return;
  activeListId = listId;
  todayLayout = null;
  selectedTaskIds = new Set();
  selectedTodayGroupIds = new Set();
  selectedListIds = new Set();
  renderListNavigation();
  renderCurrentTasks();
  if (isDayList()) syncTodayLayout().then(() => renderCurrentTasks()).catch(() => { todayLayout = null; });
  closeMainMenu();
  window.scrollTo(0, 0);
}
els.daySwitch.addEventListener("click", () => {
  openList(activeListId === TODAY_LIST_ID ? TOMORROW_LIST_ID : TODAY_LIST_ID);
  clearTimeout(mobileNavTimer);
  recordMobileNavigation(true);
});
els.dayChangeConfirm.addEventListener("click", () => window.location.reload());
document.addEventListener("click", event => {
  if (ensureCurrentDay() || event.target.closest("#day-change-confirm")) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}, true);
document.addEventListener("submit", event => {
  if (ensureCurrentDay()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}, true);

async function addList(title, { fromMainMenu = true } = {}) {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) return null;
  if (lists.some(list => displayListTitle(list).localeCompare(normalizedTitle, "uk", { sensitivity: "accent" }) === 0)) {
    toast("Список із такою назвою вже існує");
    if (fromMainMenu) els.newListTitle.focus();
    return null;
  }
  const nextPosition = Math.max(-1, ...lists.filter(list => list.kind !== "inbox").map(list => Number.isFinite(list.position) ? list.position : -1)) + 1;
  const list = createList({ title: normalizedTitle, kind: "regular", position: nextPosition });
  try {
    await listDb.put(list);
    lists = [...lists, list].sort(compareLists);
    renderListMenu();
    if (fromMainMenu) hideNewListForm();
    toast("Список додано");
    return list;
  } catch (_error) {
    toast("Не вдалося додати список");
    return null;
  }
}

function showListEditorError(message = "") {
  els.listEditorError.textContent = message;
  els.listEditorError.hidden = !message;
}

function openListEditor() {
  const list = activeList();
  if (list?.kind !== "regular") return;
  clearTimeout(listEditorCloseTimer);
  cancelAnimationFrame(listEditorOpenFrame);
  els.listEditorName.value = displayListTitle(list);
  els.listDeleteOpen.hidden = false;
  els.listDeleteConfirm.hidden = true;
  showListEditorError();
  els.listEditor.hidden = false;
  els.listEditor.classList.remove("is-open");
  els.listEditorOpen.setAttribute("aria-expanded", "true");
  document.body.classList.add("list-editor-open");
  listEditorOpenFrame = requestAnimationFrame(() => {
    listEditorOpenFrame = requestAnimationFrame(() => {
      els.listEditor.classList.add("is-open");
      els.listEditorName.focus({ preventScroll: true });
      els.listEditorName.select();
    });
  });
  if (!mobileNavigationEnabled()) history.pushState({ listEditor: true }, "");
}

function closeListEditor({ fromHistory = false } = {}) {
  if (els.listEditor.hidden) return;
  cancelAnimationFrame(listEditorOpenFrame);
  els.listEditor.classList.remove("is-open");
  els.listEditorOpen.setAttribute("aria-expanded", "false");
  document.body.classList.remove("list-editor-open");
  listEditorCloseTimer = setTimeout(() => {
    els.listEditor.hidden = true;
    if (!els.listEditorOpen.hidden) els.listEditorOpen.focus({ preventScroll: true });
  }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 240);
  if (!mobileNavigationEnabled() && !fromHistory && history.state?.listEditor) history.back();
}

async function saveActiveListName(event, { fromHistory = false } = {}) {
  event?.preventDefault();
  const list = activeList();
  if (list?.kind !== "regular") return;
  const title = els.listEditorName.value.trim();
  if (!title) {
    showListEditorError("Введіть назву списку");
    els.listEditorName.focus();
    return;
  }
  if (lists.some(item => item.id !== list.id && displayListTitle(item).localeCompare(title, "uk", { sensitivity: "accent" }) === 0)) {
    showListEditorError("Список із такою назвою вже існує");
    els.listEditorName.focus();
    return;
  }
  const updated = { ...list, title, updatedAt: new Date().toISOString() };
  try {
    await listDb.put(updated);
    lists = lists.map(item => item.id === updated.id ? updated : item).sort(compareLists);
    renderListNavigation();
    renderCurrentTasks();
    closeListEditor({ fromHistory });
    toast("Назву списку змінено");
  } catch (_error) {
    showListEditorError("Не вдалося зберегти назву. Спробуйте ще раз.");
  }
}

async function deleteActiveList() {
  const list = activeList();
  if (list?.kind !== "regular") return;
  const now = new Date().toISOString();
  els.listDeleteConfirmButton.disabled = true;
  try {
    await listDb.deleteAndMoveTasksToInbox(list.id, now);
    tasks = tasks.map(task => task.listId === list.id ? { ...task, listId: INBOX_LIST_ID, sectionId: null, updatedAt: now } : task);
    lists = lists.filter(item => item.id !== list.id);
    activeListId = INBOX_LIST_ID;
    selectedTaskIds = new Set();
    closeListEditor();
    renderListNavigation();
    renderCurrentTasks();
    window.scrollTo(0, 0);
    toast("Список видалено, завдання перенесено до «Нові»");
  } catch (_error) {
    showListEditorError("Не вдалося видалити список. Спробуйте ще раз.");
  } finally {
    els.listDeleteConfirmButton.disabled = false;
  }
}

function selectList(id) {
  if (!lists.some(list => list.id === id && list.kind === "regular")) return;
  selectedListIds = new Set([id]);
  renderListMenu();
}

function toggleListSelection(id) {
  if (!lists.some(list => list.id === id && list.kind === "regular")) return;
  const next = new Set(selectedListIds);
  if (next.has(id)) next.delete(id); else next.add(id);
  selectedListIds = next;
  renderListMenu();
}

function clearListSelection() {
  selectedListIds = new Set();
  renderListMenu();
}

function closeSelectedListsDeleteDialog() {
  els.listSelectionDeleteBackdrop.hidden = true;
  document.body.classList.remove("project-delete-dialog-open");
  els.mainMenuDeleteSelected.focus({ preventScroll: true });
}

async function deleteSelectedLists() {
  const ids = new Set(selectedListIds);
  if (!ids.size) return;
  const deletedLists = lists.filter(list => ids.has(list.id));
  const deletedTasks = tasks.filter(task => ids.has(task.listId));
  const previousActiveListId = activeListId;
  const now = new Date().toISOString();
  els.listSelectionDeleteConfirm.disabled = true;
  try {
    const deletedSections = (await appDb.all("sections")).filter(section => ids.has(section.listId));
    await listDb.deleteManyAndMoveTasksToInbox([...ids], now);
    tasks = tasks.map(task => ids.has(task.listId) ? { ...task, listId: INBOX_LIST_ID, sectionId: null, updatedAt: now } : task);
    lists = lists.filter(list => !ids.has(list.id));
    if (ids.has(activeListId)) activeListId = INBOX_LIST_ID;
    selectedListIds = new Set();
    closeSelectedListsDeleteDialog();
    renderListNavigation();
    renderCurrentTasks();
    toast(ids.size === 1 ? "Список видалено, завдання перенесено до «Нові»" : `Видалено списків: ${ids.size}. Завдання перенесено до «Нові»`, {
      duration: 3000,
      action: async () => {
        try {
          await listDb.restoreDeleted({ lists: deletedLists, sections: deletedSections, tasks: deletedTasks });
          const restoredTasks = new Map(deletedTasks.map(task => [task.id, task]));
          lists = [...lists.filter(list => !ids.has(list.id)), ...deletedLists].sort(compareLists);
          tasks = tasks.map(task => restoredTasks.get(task.id) || task);
          activeListId = previousActiveListId;
          renderListNavigation();
          renderCurrentTasks();
          toast(ids.size === 1 ? "Список відновлено" : `Відновлено списків: ${ids.size}`);
        } catch (_error) {
          toast("Не вдалося відновити списки");
        }
      }
    });
  } catch (_error) {
    toast("Не вдалося видалити списки. Спробуйте ще раз.");
  } finally {
    els.listSelectionDeleteConfirm.disabled = false;
  }
}

async function reorderTaskLists({ selectedIds, beforeId }) {
  const previous = lists;
  const reordered = reorderLists(lists, selectedIds, beforeId);
  const changed = reordered.filter(list => {
    const old = lists.find(item => item.id === list.id);
    return old && old !== list;
  });
  if (!changed.length) {
    renderListMenu();
    return false;
  }
  lists = reordered;
  renderListMenu();
  try {
    await listDb.putMany(changed);
    return true;
  } catch (_error) {
    lists = previous;
    renderListMenu();
    toast("Не вдалося зберегти порядок списків");
    return false;
  }
}

function selectTask(id) {
  if (selectedTodayGroupIds.size) { toast("Завдання виділяються окремо від груп"); return; }
  selectedTaskIds = new Set([id]);
  renderCurrentTasks();
}

function toggleTaskSelection(id) {
  if (selectedTodayGroupIds.size) { toast("Завдання виділяються окремо від груп"); return; }
  const next = new Set(selectedTaskIds);
  if (next.has(id)) next.delete(id); else next.add(id);
  selectedTaskIds = next;
  renderCurrentTasks();
}

function clearTaskSelection() {
  selectedTaskIds = new Set();
  selectedTodayGroupIds = new Set();
  closeSelectedListDropdown();
  closeTodayGroupDialog();
  closeTodayGroupRenameDialog();
  renderCurrentTasks();
}

function closeTodayGroupRenameDialog() {
  if (els.todayGroupRenameBackdrop.hidden) return;
  els.todayGroupRenameBackdrop.hidden = true;
  els.todayGroupRenameError.hidden = true;
  if (selectedTodayGroupIds.size === 1) els.renameSelectedGroup.focus({ preventScroll: true });
}

function openTodayGroupRenameDialog() {
  const group = todayLayout?.groups.find(item => selectedTodayGroupIds.has(item.id));
  if (!group) return;
  els.todayGroupRenameInput.value = group.title || TODAY_GROUP_NAMES.get(group.color);
  els.todayGroupRenameError.hidden = true;
  els.todayGroupRenameBackdrop.hidden = false;
  els.todayGroupRenameInput.focus();
  els.todayGroupRenameInput.select();
}

async function saveTodayGroupName(event) {
  event.preventDefault();
  const title = els.todayGroupRenameInput.value.trim();
  if (!title) {
    els.todayGroupRenameError.textContent = "Введіть назву групи";
    els.todayGroupRenameError.hidden = false;
    els.todayGroupRenameInput.focus();
    return;
  }
  const groupId = [...selectedTodayGroupIds][0];
  try {
    await changeTodayLayout((layout, visible, date) => setTodayGroupTitle(layout, visible, date, groupId, title));
    closeTodayGroupRenameDialog();
    renderCurrentTasks();
    toast("Групу перейменовано");
  } catch (_error) {
    els.todayGroupRenameError.textContent = "Не вдалося зберегти назву групи";
    els.todayGroupRenameError.hidden = false;
  }
}

function closeTodayGroupDeleteDialog() {
  if (els.todayGroupDeleteBackdrop.hidden) return;
  els.todayGroupDeleteBackdrop.hidden = true;
  els.deleteSelectedGroup.focus({ preventScroll: true });
}

function openTodayGroupDeleteDialog() {
  if (!isDayList() || !selectedTodayGroupIds.size) return;
  const count = selectedTodayGroupIds.size;
  els.todayGroupDeleteTitle.textContent = count === 1 ? "Видалити групу?" : `Видалити групи (${count})?`;
  els.todayGroupDeleteKeepTasks.checked = true;
  els.todayGroupDeleteBackdrop.hidden = false;
  requestAnimationFrame(() => els.todayGroupDeleteDialog.focus());
}

async function deleteSelectedTodayGroups() {
  const keepTasks = els.todayGroupDeleteKeepTasks.checked;
  const ids = new Set(selectedTodayGroupIds);
  closeTodayGroupDeleteDialog();
  if (!ids.size) return;
  try {
    await syncTodayLayout();
    const date = activePlanDate();
    const before = todayLayout;
    const groups = before?.groups.filter(group => ids.has(group.id)) || [];
    if (groups.length !== ids.size) throw new Error("Групу не знайдено");
    const deletedIds = new Set(groups.flatMap(group => group.taskIds));
    const deletedTasks = keepTasks ? [] : tasks.filter(task => deletedIds.has(task.id));
    let next = before;
    const visible = visibleTodayLayoutTasks(date);
    for (const group of groups) next = ungroupTodayGroup(next, visible, date, group.id);
    if (!keepTasks && next) next = normalizeTodayGroups(next, visible.filter(task => !deletedIds.has(task.id)), date);
    if (!next) next = flattenDayPlan(before, date, keepTasks ? new Set() : deletedIds);
    await settingsDb.changeTodayLayoutAndTasks(before, next, date, deletedTasks.map(task => ({ id: task.id, remove: true })));
    todayLayout = next;
    if (!keepTasks) tasks = tasks.filter(task => !deletedIds.has(task.id));
    selectedTodayGroupIds = new Set();
    renderCurrentTasks();
    toast(keepTasks ? "Групи видалено, завдання збережено" : "Групи та їхні завдання видалено", {
      duration: 3000,
      action: async () => {
        try {
          await settingsDb.changeTodayLayoutAndTasks(next, before, date, deletedTasks);
          todayLayout = before;
          if (deletedTasks.length) tasks = [...tasks, ...deletedTasks];
          renderCurrentTasks();
          toast("Видалення груп скасовано");
        } catch (_error) { toast("Не вдалося скасувати видалення груп"); }
      }
    });
  } catch (_error) { toast("Не вдалося видалити групи"); }
}

let pendingTodayGroupMerge = null;

function closeTodayGroupRecolorDialog() {
  if (els.todayGroupRecolorBackdrop.hidden) return;
  els.todayGroupRecolorBackdrop.hidden = true;
  els.recolorSelectedGroup.focus({ preventScroll: true });
}

function closeTodayGroupMergeDialog() {
  if (els.todayGroupMergeBackdrop.hidden) return;
  els.todayGroupMergeBackdrop.hidden = true;
  pendingTodayGroupMerge = null;
  els.recolorSelectedGroup.focus({ preventScroll: true });
}

function todayGroupColorOption(color, name) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.color = color;
  const swatch = document.createElement("span");
  swatch.className = "today-group-swatch";
  swatch.style.backgroundColor = color;
  const existing = todayLayout?.groups.find(group => group.color === color);
  const label = document.createElement("span");
  label.textContent = existing?.title || name;
  if (existing) {
    label.className = "today-group-existing-name";
    label.style.setProperty("--group-color", color);
  }
  button.append(swatch, label);
  return button;
}

function openTodayGroupRecolorDialog() {
  if (!isDayList() || selectedTodayGroupIds.size !== 1) return;
  const source = todayLayout?.groups.find(group => selectedTodayGroupIds.has(group.id));
  if (!source) return;
  els.todayGroupRecolorOptions.replaceChildren(...[...TODAY_GROUP_NAMES].map(([color, name]) => {
    const button = todayGroupColorOption(color, name);
    if (color === source.color) button.disabled = true;
    return button;
  }));
  els.todayGroupRecolorBackdrop.hidden = false;
  els.todayGroupRecolorOptions.querySelector("button:not(:disabled)")?.focus();
}

function chooseTodayGroupColor(color) {
  const source = todayLayout?.groups.find(group => selectedTodayGroupIds.has(group.id));
  if (!source || source.color === color || !TODAY_GROUP_NAMES.has(color)) return;
  const target = todayLayout.groups.find(group => group.color === color);
  closeTodayGroupRecolorDialog();
  if (!target) { applyTodayGroupColor(source.id, color, source.id); return; }
  pendingTodayGroupMerge = { sourceId: source.id, targetId: target.id, color };
  els.todayGroupMergeOptions.replaceChildren(...[source, target].map(group => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.keepId = group.id;
    const swatch = document.createElement("span");
    swatch.className = "today-group-swatch today-group-merge-swatch";
    swatch.style.backgroundColor = group.color;
    button.append(swatch, group.title || TODAY_GROUP_NAMES.get(group.color));
    return button;
  }));
  els.todayGroupMergeBackdrop.hidden = false;
  els.todayGroupMergeOptions.querySelector("button")?.focus();
}

async function applyTodayGroupColor(sourceId, color, keepId) {
  try {
    await syncTodayLayout();
    const date = activePlanDate();
    const before = todayLayout;
    const merging = before.groups.some(group => group.color === color && group.id !== sourceId);
    const next = recolorTodayGroup(before, visibleTodayLayoutTasks(date), date, sourceId, color, keepId);
    await settingsDb.changeTodayLayoutAndTasks(before, next, date);
    todayLayout = next;
    selectedTodayGroupIds = new Set();
    renderCurrentTasks();
    toast(merging ? "Групи злито" : "Колір групи змінено", {
      duration: 3000,
      action: async () => {
        try {
          await settingsDb.changeTodayLayoutAndTasks(next, before, date);
          todayLayout = before;
          renderCurrentTasks();
          toast(merging ? "Злиття груп скасовано" : "Зміну кольору скасовано");
        } catch (_error) { toast("Не вдалося скасувати зміну групи"); }
      }
    });
  } catch (_error) { toast("Не вдалося змінити групу"); }
}

async function selectTodayGroup(id) {
  const group = todayLayout?.groups.find(item => item.id === id);
  if (!group || !isDayList()) return false;
  if (selectedTaskIds.size) { toast("Групи виділяються окремо від завдань"); return false; }
  if (!group.collapsed) {
    const wrapper = [...els.list.children].find(item => item.dataset.groupId === id);
    const members = wrapper?.querySelector(".today-group-tasks");
    if (members && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const expandedHeight = wrapper.getBoundingClientRect().height;
      members.hidden = true;
      const collapsedHeight = wrapper.getBoundingClientRect().height;
      members.hidden = false;
      wrapper.style.overflow = "hidden";
      const collapse = wrapper.animate([{ height: `${expandedHeight}px` }, { height: `${collapsedHeight}px` }],
        { duration: 220, easing: "ease-in-out", fill: "forwards" });
      const fade = members.animate([{ opacity: 1 }, { opacity: 0 }],
        { duration: 180, easing: "ease-in", fill: "forwards" });
      await Promise.all([collapse.finished.catch(() => {}), fade.finished.catch(() => {})]);
      members.hidden = true;
    }
    try { await changeTodayLayout((layout, visible, date) => setTodayGroupCollapsed(layout, visible, date, id, true)); }
    catch (_error) { renderCurrentTasks(); toast("Не вдалося згорнути групу"); return false; }
  }
  selectedTaskIds = new Set();
  const next = new Set(selectedTodayGroupIds);
  if (next.has(id)) next.delete(id); else next.add(id);
  selectedTodayGroupIds = next;
  renderCurrentTasks();
  return true;
}

async function reorderSelectedTodayGroup(beforeType, beforeId, groupId) {
  if (!groupId) return false;
  try {
    await changeTodayLayout((layout, visible, date) => moveTodayOuterItem(layout, visible, date, "group", groupId, beforeType, beforeId));
    renderCurrentTasks();
    return true;
  } catch (_error) {
    renderCurrentTasks();
    toast("Не вдалося зберегти порядок групи");
    return false;
  }
}

function closeTodayGroupDialog() {
  if (els.todayGroupBackdrop.hidden) return;
  els.todayGroupBackdrop.hidden = true;
  els.groupSelected.focus({ preventScroll: true });
}

function openTodayGroupDialog() {
  if (!isDayList() || !selectedTaskIds.size) return;
  closeSelectedListDropdown();
  els.todayGroupOptions.replaceChildren(...[...TODAY_GROUP_NAMES].map(([color, name]) => todayGroupColorOption(color, name)));
  const clear = document.createElement("button");
  clear.type = "button";
  clear.dataset.color = "none";
  clear.textContent = "Без групи";
  els.todayGroupOptions.append(clear);
  els.todayGroupBackdrop.hidden = false;
  els.todayGroupOptions.querySelector("button")?.focus();
}

async function applyTodayGroupSelection(color) {
  if (!isDayList() || !selectedTaskIds.size) return;
  const selected = new Set(visibleTasks().filter(task => !isTaskCompleted(task) && selectedTaskIds.has(task.id)).map(task => task.id));
  closeTodayGroupDialog();
  if (!selected.size) return;
  try {
    await syncTodayLayout();
    const membership = new Map(todayLayout?.groups.flatMap(group => group.taskIds.map(id => [id, group.id])) || []);
    const target = todayLayout?.groups.find(group => group.color === color);
    if (color === "none" && ![...selected].some(id => membership.has(id))) return;
    if (target && [...selected].every(id => membership.get(id) === target.id)) return;
    await changeTodayLayout((layout, visible, date) => {
      let next = layout;
      if (color === "none" || !target) {
        for (const group of layout?.groups || []) {
          const ids = group.taskIds.filter(id => selected.has(id));
          if (ids.length) next = removeTodayGroupTasks(next, visible, date, group.id, ids);
        }
      }
      if (color === "none") return next;
      if (target) return assignTodayGroupTasks(next, visible, date, target.id, selected);
      return createTodayGroup(next, visible, date, color, selected, crypto.randomUUID());
    });
    selectedTaskIds = new Set();
    renderCurrentTasks();
  } catch (_error) {
    toast("Не вдалося змінити групу");
    renderCurrentTasks();
  }
}

function toggleAllVisibleTasks() {
  const visibleIds = visibleTasks().filter(task => !isTaskCompleted(task)).map(task => task.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedTaskIds.has(id));
  selectedTaskIds = allSelected ? new Set() : new Set(visibleIds);
  renderCurrentTasks();
}

async function deleteSelectedTasks() {
  const deletedTasks = tasks.filter(task => selectedTaskIds.has(task.id));
  if (!deletedTasks.length) return;
  const deletedIds = deletedTasks.map(task => task.id);
  tasks = tasks.filter(task => !selectedTaskIds.has(task.id));
  selectedTaskIds = new Set();
  renderCurrentTasks();
  try {
    await taskDb.deleteMany(deletedIds);
    const message = deletedTasks.length === 1 ? "Завдання видалено" : `Видалено завдань: ${deletedTasks.length}`;
    toast(message, {
      duration: 3000,
      action: async () => {
        await taskDb.putMany(deletedTasks);
        await refresh();
        toast("Завдання відновлено");
      }
    });
  } catch (_error) {
    tasks.push(...deletedTasks);
    await refresh();
    toast("Не вдалося видалити завдання");
  }
}

function openSelectedTaskDatePicker() {
  const selected = tasks.filter(task => selectedTaskIds.has(task.id));
  if (!selected.length) return;
  const firstDate = selected[0].dueDate || "";
  const sharedDate = selected.every(task => (task.dueDate || "") === firstDate) ? firstDate : "";
  const firstTime = selected[0].dueTime || "";
  const sharedTime = sharedDate && selected.every(task => (task.dueTime || "") === firstTime) ? firstTime : "";
  editingSelectedTaskDates = true;
  editingProjectDate = false;
  openDatePicker(sharedDate, sharedTime);
}

async function updateSelectedTaskDates(dueDate, dueTime) {
  const selectedIds = new Set(selectedTaskIds);
  const previousPositions = captureTaskPositions();
  const updatedAt = new Date().toISOString();
  const updatedTasks = tasks.map(task => selectedIds.has(task.id) ? { ...task, dueDate: dueDate || null, dueTime: dueDate && dueTime ? dueTime : null, updatedAt } : task);
  const changed = updatedTasks.filter(task => selectedIds.has(task.id));
  if (!changed.length) return;
  try {
    await taskDb.putMany(changed);
    tasks = updatedTasks.sort(compareTasks);
    renderCurrentTasks();
    await animateBulkDateChange(selectedIds, previousPositions);
    clearTaskSelection();
    toast(changed.length === 1 ? "Дату завдання змінено" : `Змінено дату завдань: ${changed.length}`);
  } catch (_error) {
    await refresh();
    toast("Не вдалося змінити дату");
  }
}

async function animateSelectedTasksToList(selectedIds, previousPositions) {
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const animations = [...els.list.children]
      .filter(row => selectedIds.has(row.dataset.id))
      .map(row => {
        row.classList.add("bulk-moving");
        return row.querySelector(".task-card")?.animate([
          { opacity: 1, transform: "translateX(0) scale(1)" },
          { opacity: 0, transform: "translateX(36px) scale(.985)" }
        ], { duration: 260, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" });
      })
      .filter(Boolean);
    await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
  }
  renderCurrentTasks();
  animateTaskReflow(previousPositions);
}

async function moveSelectedTasksToList(listId) {
  if (!lists.some(list => list.id === listId)) {
    closeSelectedListDropdown({ returnFocus: true });
    return;
  }
  const selectedIds = new Set(selectedTaskIds);
  const selected = tasks.filter(task => selectedIds.has(task.id)).sort(compareTasks);
  if (!selected.length) return;
  const updatedAt = new Date().toISOString();
  const movedTasks = selected.map((task, position) => ({ ...task, listId, sectionId: null, position, updatedAt }));
  const movedById = new Map(movedTasks.map(task => [task.id, task]));
  const targetCount = movedTasks.length;
  const shiftedTasks = tasks
    .filter(task => !selectedIds.has(task.id) && (task.listId || INBOX_LIST_ID) === listId && !task.sectionId)
    .map(task => ({ ...task, position: (Number.isFinite(task.position) ? task.position : 0) + targetCount, updatedAt }));
  const shiftedById = new Map(shiftedTasks.map(task => [task.id, task]));
  const previousPositions = captureTaskPositions();
  closeSelectedListDropdown();
  try {
    await taskDb.putMany([...movedTasks, ...shiftedTasks]);
    await rememberProjectLists(movedTasks, listId);
    tasks = tasks.map(task => movedById.get(task.id) || shiftedById.get(task.id) || task).sort(compareTasks);
    selectedTaskIds = new Set();
    await animateSelectedTasksToList(selectedIds, previousPositions);
    const target = lists.find(list => list.id === listId);
    toast(selected.length === 1 ? `Завдання переміщено до «${displayListTitle(target)}»` : `Переміщено завдань: ${selected.length}`);
  } catch (_error) {
    closeSelectedListDropdown();
    toast("Не вдалося перемістити завдання");
  }
}

async function moveOpenTaskImmediatelyToList(listId) {
  const task = tasks.find(item => item.id === els.editor.dataset.taskId);
  if (!task || task.listId === listId) {
    setTaskEditorListUI(listId);
    updateDesktopSaveState();
    return;
  }
  const updatedAt = new Date().toISOString();
  const movedTask = { ...task, listId, sectionId: null, position: 0, updatedAt };
  const shiftedTasks = tasks
    .filter(item => item.id !== task.id && taskOrderScope(item) === taskOrderScope(movedTask))
    .map(item => ({ ...item, position: (Number.isFinite(item.position) ? item.position : 0) + 1, updatedAt }));
  const replacements = new Map([movedTask, ...shiftedTasks].map(item => [item.id, item]));
  try {
    await taskDb.putMany([movedTask, ...shiftedTasks]);
    await rememberProjectLists([movedTask], listId);
    tasks = tasks.map(item => replacements.get(item.id) || item).sort(compareTasks);
    setTaskEditorListUI(listId);
    updateDesktopSaveState();
    renderCurrentTasks();
  } catch (_error) {
    toast("Не вдалося перемістити завдання");
  }
}

async function createListFromDropdown(container) {
  const creator = container.querySelector("[data-list-creator]");
  const input = creator?.querySelector(".list-dropdown-create-input");
  if (!creator || !input) return;
  const list = await addList(input.value, { fromMainMenu: false });
  if (!list) { input.focus(); return; }
  if (creator.dataset.listCreator === "selection") {
    await moveSelectedTasksToList(list.id);
    return;
  }
  if (els.editor.dataset.taskId) await moveOpenTaskImmediatelyToList(list.id);
  else {
    setTaskEditorListUI(list.id);
    updateDesktopSaveState();
  }
  closeTaskListDropdown({ returnFocus: true });
}

function handleDropdownListCreation(event, container) {
  if (event.target.closest("[data-list-create-open]")) {
    showDropdownListCreator(container);
    return true;
  }
  if (event.target.closest("[data-list-create-cancel]")) {
    hideDropdownListCreator(container);
    return true;
  }
  if (event.target.closest("[data-list-create-submit]")) {
    createListFromDropdown(container);
    return true;
  }
  return false;
}

function handleDropdownListCreationKeydown(event, container) {
  if (!event.target.matches(".list-dropdown-create-input")) return false;
  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    createListFromDropdown(container);
    return true;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    hideDropdownListCreator(container);
    return true;
  }
  return false;
}

async function addTask() {
  if (!ensureCurrentDay()) return false;
  const title = els.input.value.trim();
  if (!title) { els.input.focus(); return false; }
  const origin = els.editor.dataset.originListId;
  const date = isDayList(origin) && els.editor.dataset.dateChosen !== "true"
    ? origin === TOMORROW_LIST_ID ? nextLocalDate() : localDateValue() : els.date.value;
  const task = createTask({ listId: els.taskListSelect.value || INBOX_LIST_ID, title, description: els.description.value.trim(), dueDate: date || null, dueTime: date && els.time.value ? els.time.value : null, position: 0 });
  const scope = taskOrderScope(task);
  const shifted = tasks.filter(item => taskOrderScope(item) === scope).map(item => ({ ...item, position: item.position + 1 }));
  await taskDb.putMany([task, ...shifted]);
  await refresh();
  if (isDayList(els.editor.dataset.originListId)) {
    todayDefaultListId = task.listId;
    try { await settingsDb.setTodayListId(task.listId); } catch (_error) {
      // The task is already saved; keep the chosen default for this session.
    }
  }
  return true;
}

async function reorderSelectedTasks({ beforeType = "task", beforeId, groupId = null }) {
  if (!ensureCurrentDay()) return false;
  const isToday = isDayList();
  if (isToday && todayLayout?.groups?.length) {
    if (!groupId) {
      try {
        const date = activePlanDate();
        const next = reorderTodayOuterTaskBlock(todayLayout, visibleTodayLayoutTasks(date), date, selectedTaskIds, beforeType, beforeId);
        if (JSON.stringify(next.items) === JSON.stringify(todayLayout.items)) return false;
        await changeTodayLayout((layout, visible, currentDate) =>
          reorderTodayOuterTaskBlock(layout, visible, currentDate, selectedTaskIds, beforeType, beforeId));
        renderCurrentTasks();
        return true;
      } catch (_error) {
        renderCurrentTasks();
        toast("Не вдалося зберегти порядок");
        return false;
      }
    }
    const group = todayLayout.groups.find(item => item.id === groupId);
    if (!group) return false;
    const selectedIds = new Set(selectedTaskIds);
    try {
      const date = activePlanDate();
      const next = reorderTodayGroupTaskBlock(todayLayout, visibleTodayLayoutTasks(date), date, groupId, selectedIds, beforeId);
      if (JSON.stringify(next.groups.find(item => item.id === groupId).taskIds) === JSON.stringify(group.taskIds)) return false;
      await changeTodayLayout((layout, visible, currentDate) =>
        reorderTodayGroupTaskBlock(layout, visible, currentDate, groupId, selectedIds, beforeId));
      renderCurrentTasks();
      return true;
    } catch (_error) {
      toast("Не вдалося зберегти порядок");
      renderCurrentTasks();
      return false;
    }
  }
  if (isToday) {
    const date = activePlanDate();
    const next = reorderDayPlan(todayLayout, visibleTodayLayoutTasks(date), date, selectedTaskIds, beforeId);
    await changeTodayLayout(() => next);
    renderCurrentTasks();
    return true;
  }
  const selected = tasks.filter(task => selectedTaskIds.has(task.id)).sort(compareTasks);
  if (!selected.length) return false;
  const previous = tasks;
  const reordered = reorderTaskBlock(tasks, selectedTaskIds, beforeId, taskOrderScope(selected[0]));
  const changed = reordered.filter((task, index) => task !== tasks[index]);
  if (!changed.length) return false;
  tasks = reordered.sort(compareTasks);
  renderCurrentTasks();
  try {
    await taskDb.putMany(changed);
    return true;
  } catch (_error) {
    tasks = previous;
    renderCurrentTasks();
    toast("Не вдалося зберегти порядок");
    return false;
  }
}

async function saveOpenTask() {
  if (!ensureCurrentDay()) return false;
  const id = els.editor.dataset.taskId;
  if (!id) return false;
  const task = tasks.find(item => item.id === id);
  const title = els.input.value.trim();
  if (!task || !title) return false;
  const listId = lists.some(list => list.id === els.taskListSelect.value) ? els.taskListSelect.value : task.listId;
  const changedList = listId !== task.listId;
  const updatedTask = { ...task, listId, sectionId: changedList ? null : task.sectionId, position: changedList ? 0 : task.position, title, description: els.description.value.trim(), dueDate: els.date.value || null, dueTime: els.date.value && els.time.value ? els.time.value : null, updatedAt: new Date().toISOString() };
  const shiftedTasks = changedList
    ? tasks.filter(item => item.id !== task.id && taskOrderScope(item) === taskOrderScope(updatedTask)).map(item => ({ ...item, position: (Number.isFinite(item.position) ? item.position : 0) + 1 }))
    : [];
  await taskDb.putMany([updatedTask, ...shiftedTasks]);
  await refresh();
  return true;
}

async function convertOpenTaskToProject() {
  const task = tasks.find(item => item.id === els.editor.dataset.taskId);
  if (!task || task.status !== "active" || task.projectId) return;
  const title = els.input.value.trim();
  if (!title) {
    toast("Введіть назву завдання");
    els.input.focus();
    return;
  }
  const editedTask = { ...task, title, description: els.description.value.trim(),
    dueDate: els.date.value || null, dueTime: els.date.value && els.time.value ? els.time.value : null };
  const project = projectFromTask(editedTask, projects);
  els.taskConvertProject.disabled = true;
  try {
    await projectDb.convertTask(task.id, project);
    tasks = tasks.filter(item => item.id !== task.id);
    selectedTaskIds.delete(task.id);
    projects.push(project);
    els.editor.dataset.taskId = "";
    hideTaskEditor();
    openProjects();
    openProject(project.id);
    toast("Проєкт створено");
  } catch (_error) {
    toast("Не вдалося створити проєкт. Завдання залишилося без змін");
  } finally {
    els.taskConvertProject.disabled = false;
  }
}

async function detachOpenTaskFromProject(task, editedTask) {
  const updates = detachProjectTask(editedTask, tasks, new Date().toISOString());
  const changedIds = new Set(updates.map(item => item.id));
  const originals = tasks.filter(item => changedIds.has(item.id))
    .map(item => item.id === task.id ? { ...editedTask, updatedAt: new Date().toISOString() } : item);
  els.taskDetachProject.disabled = true;
  try {
    await taskDb.putMany(updates);
    const replacements = new Map(updates.map(item => [item.id, item]));
    tasks = tasks.map(item => replacements.get(item.id) || item).sort(compareTasks);
    await closeProject();
    openList(updates[0].listId);
    openTaskDetails(updates[0]);
    toast(`Завдання перенесено до «${displayListTitle(lists.find(list => list.id === updates[0].listId))}»`, {
      duration: 3000,
      action: async () => {
        try {
          await taskDb.restoreDetached(originals, updates, task.projectId);
          const restored = new Map(originals.map(item => [item.id, item]));
          tasks = tasks.map(item => restored.get(item.id) || item).sort(compareTasks);
          renderCurrentTasks();
          openProjects();
          openProject(task.projectId);
          openTaskDetails(restored.get(task.id));
          toast("Від’єднання скасовано");
        } catch (_error) { toast("Не вдалося скасувати від’єднання"); }
      }
    });
  } catch (_error) {
    toast("Не вдалося від’єднати завдання. Зміни не збережено");
  } finally {
    els.taskDetachProject.disabled = false;
  }
}

async function convertOpenStepToProject(task, editedTask) {
  const project = projectFromTask(editedTask, projects);
  els.taskDetachProject.disabled = true;
  try {
    await projectDb.convertStep(task.id, task.projectId, project);
    tasks = tasks.filter(item => item.id !== task.id);
    selectedTaskIds.delete(task.id);
    projects.push(project);
    els.editor.dataset.taskId = "";
    hideTaskEditor();
    openProjects();
    openProject(project.id);
    toast("Новий проєкт створено", {
      duration: 3000,
      action: async () => {
        const restoredTask = { ...editedTask, updatedAt: new Date().toISOString() };
        try {
          await projectDb.undoConvertedStep(project, restoredTask);
          projects = projects.filter(item => item.id !== project.id);
          tasks = [...tasks, restoredTask].sort(compareTasks);
          await closeProject();
          renderCurrentTasks();
          openProjects();
          openProject(task.projectId);
          openTaskDetails(restoredTask);
          toast("Перетворення скасовано");
        } catch (_error) { toast("Не вдалося скасувати перетворення"); }
      }
    });
  } catch (_error) {
    toast("Не вдалося створити проєкт. Крок залишився на місці");
  } finally {
    els.taskDetachProject.disabled = false;
  }
}

function closeTaskDetachDialog() {
  els.taskDetachDialogBackdrop.hidden = true;
  document.body.classList.remove("project-delete-dialog-open");
  els.taskDetachProject.focus();
}

function openTaskDetachDialog() {
  const task = tasks.find(item => item.id === els.editor.dataset.taskId);
  if (!task || task.status !== "active" || !projects.some(project => project.id === task.projectId)) return;
  els.taskDetachDialog.querySelector('input[value="task"]').checked = true;
  els.taskDetachDialogBackdrop.hidden = false;
  document.body.classList.add("project-delete-dialog-open");
  requestAnimationFrame(() => els.taskDetachDialog.focus());
}

function confirmTaskDetachChoice() {
  const task = tasks.find(item => item.id === els.editor.dataset.taskId);
  if (!task || task.status !== "active" || !projects.some(project => project.id === task.projectId)) {
    closeTaskDetachDialog();
    return;
  }
  const title = els.input.value.trim();
  if (!title) {
    closeTaskDetachDialog();
    toast("Введіть назву завдання");
    els.input.focus();
    return;
  }
  const editedTask = { ...task, title, description: els.description.value.trim(),
    dueDate: els.date.value || null, dueTime: els.date.value && els.time.value ? els.time.value : null };
  const choice = els.taskDetachDialog.querySelector('input[name="task-detach-choice"]:checked').value;
  closeTaskDetachDialog();
  if (choice === "project") convertOpenStepToProject(task, editedTask);
  else detachOpenTaskFromProject(task, editedTask);
}

async function saveAndLeaveTaskEditor({ allowEmptyNew = false } = {}) {
  const editing = Boolean(els.editor.dataset.taskId);
  const title = els.input.value.trim();
  if (!editing && !title && allowEmptyNew) {
    hideTaskEditor();
    return;
  }
  const saved = editing ? await saveOpenTask() : await addTask();
  if (!saved) { els.input.focus(); return; }
  els.editor.dataset.taskId = "";
  hideTaskEditor();
  toast(editing ? "Зміни збережено" : "Завдання додано");
}

async function deleteTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  tasks = tasks.filter(item => item.id !== id);
  selectedTaskIds.delete(id);
  renderCurrentTasks();
  try {
    await taskDb.delete(id);
    toast("Завдання видалено", {
      duration: 3000,
      action: async () => {
        await taskDb.put(task);
        await refresh();
        toast("Завдання відновлено");
      }
    });
  } catch (_error) {
    tasks.push(task);
    renderCurrentTasks();
    toast("Не вдалося видалити завдання");
  }
}

async function completeTask(task, changes = {}, toggle) {
  if (!task) return;
  if (toggle) toggle.disabled = true;
  startCompletionFeedback(toggle);
  await new Promise(resolve => setTimeout(resolve, 400));
  const completedAt = new Date().toISOString();
  const completedTask = { ...task, ...changes, status: "completed", completedAt, updatedAt: completedAt };
  const groupDate = activeListId === TODAY_LIST_ID ? activePlanDate() : null;
  const previousGroupLayout = groupDate && todayLayout?.date === groupDate ? todayLayout : null;
  const groupSuccessor = previousGroupLayout
    ? carryTodayProjectGroup(previousGroupLayout, tasks, completedTask, groupDate) : null;
  await taskDb.put(completedTask);
  if (groupSuccessor) await settingsDb.saveTodayLayout(groupSuccessor, groupDate);
  await refresh({ animateTaskReflow: Boolean(toggle?.closest(".swipe-row")) });
  toast("Виконано", {
    duration: 3000,
    action: async () => {
      await taskDb.put({ ...completedTask, status: "active", completedAt: null, updatedAt: new Date().toISOString() });
      if (groupSuccessor && groupDate === localDateValue()) await settingsDb.saveTodayLayout(previousGroupLayout, groupDate);
      await refresh();
      toast("Виконання скасовано");
    }
  });
}

els.add.addEventListener("click", () => openNewTaskEditor(
  isDayList() ? validTodayDefaultListId() : activeListId,
  activeListId
));
els.navToday.addEventListener("click", () => openList(TODAY_LIST_ID));
els.navInbox.addEventListener("click", () => openList(INBOX_LIST_ID));
els.navProjects.addEventListener("click", openProjects);
[els.navUpcoming].forEach(button => button.addEventListener("click", () => {
  toast(`Розділ «${button.querySelector("span:last-child").textContent}» з’явиться згодом`);
}));
els.mainMenuOpen.addEventListener("click", () => {
  if (selectedTaskIds.size) clearTaskSelection();
  openMainMenu();
});
els.mainMenuClose.addEventListener("click", () => {
  if (selectedListIds.size) clearListSelection();
  closeMainMenu();
});
els.mainMenuSelectionClose.addEventListener("click", clearListSelection);
els.mainMenuDeleteSelected.addEventListener("click", () => {
  els.listSelectionDeleteTitle.textContent = selectedListIds.size === 1 ? "Видалити список?" : `Видалити списки (${selectedListIds.size})?`;
  els.listSelectionDeleteBackdrop.hidden = false;
  document.body.classList.add("project-delete-dialog-open");
  requestAnimationFrame(() => els.listSelectionDeleteDialog.focus());
});
els.listSelectionDeleteCancel.addEventListener("click", closeSelectedListsDeleteDialog);
els.listSelectionDeleteConfirm.addEventListener("click", deleteSelectedLists);
els.listSelectionDeleteBackdrop.addEventListener("click", event => { if (event.target === els.listSelectionDeleteBackdrop) closeSelectedListsDeleteDialog(); });
els.mainMenuLists.addEventListener("click", event => {
  const button = event.target.closest("[data-list-id]");
  if (els.mainMenuLists.dataset.suppressListClick === button?.dataset.listId) {
    delete els.mainMenuLists.dataset.suppressListClick;
    return;
  }
  delete els.mainMenuLists.dataset.suppressListClick;
  if (!button) return;
  if (selectedListIds.size && button.dataset.listKind === "regular") {
    toggleListSelection(button.dataset.listId);
    return;
  }
  openList(button.dataset.listId);
});
els.newListOpen.addEventListener("click", showNewListForm);
els.newListCancel.addEventListener("click", () => hideNewListForm());
els.newListForm.addEventListener("submit", event => {
  event.preventDefault();
  addList(els.newListTitle.value);
});
els.newListTitle.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    event.preventDefault();
    hideNewListForm();
  }
});
els.settingsOpen.addEventListener("click", openSettings);
els.settingsClose.addEventListener("click", () => closeSettings());
els.completedTasksOpen.addEventListener("click", openCompletedTasks);
els.completedTasksClose.addEventListener("click", () => closeCompletedTasks());
els.completedTasksOlder.addEventListener("click", () => { completedWeekOffset++; renderCompletedTasks(); });
els.completedTasksNewer.addEventListener("click", () => { completedWeekOffset--; renderCompletedTasks(); });
els.completedTasksList.addEventListener("click", event => {
  const row = event.target.closest("[data-task-id]");
  if (!row) return;
  completedDetailId = row.dataset.taskId;
  renderCompletedTasks();
  els.completedTaskDetailBack.focus({ preventScroll: true });
});
els.completedTaskDetailBack.addEventListener("click", () => { completedDetailId = null; renderCompletedTasks(); });
els.completedTaskRestore.addEventListener("click", async () => {
  const task = tasks.find(item => item.id === completedDetailId && item.status === "completed");
  if (!task) return;
  els.completedTaskRestore.disabled = true;
  try {
    await taskDb.put({ ...task, status: "active", completedAt: null, updatedAt: new Date().toISOString() });
    completedDetailId = null;
    await refresh();
    toast("Завдання повернуто в активні");
  } catch (_error) { toast("Не вдалося повернути завдання"); }
  finally { els.completedTaskRestore.disabled = false; }
});
els.backupExport.addEventListener("click", async () => {
  if (backupBusy) return;
  const useFolder = !!backupDirectoryHandle && typeof window.showDirectoryPicker === "function";
  if (!useFolder && els.backupDownloadLink.href) {
    els.backupDownloadLink.click();
    clearPreparedBackupDownload();
    els.backupStatus.textContent = "Завантаження бекапу повторено.";
    return;
  }
  backupBusy = true;
  els.backupStatus.textContent = "Підготовка копії…";
  try {
    if (useFolder && (await backupDirectoryHandle.queryPermission({ mode: "readwrite" })) !== "granted" &&
        (await backupDirectoryHandle.requestPermission({ mode: "readwrite" })) !== "granted") {
      throw new Error("Доступ до запису в папку не надано. Виберіть папку бекапів ще раз.");
    }
    const prefix = normalizeBackupPrefix(els.backupPrefix.value);
    els.backupPrefix.value = prefix;
    const version = backupNextVersion;
    let counts;
    let savedName;
    if (useFolder) {
      clearPreparedBackupDownload();
      const prepared = await prepareBackup({ prefix, version });
      savedName = await writeBackupToDirectory(backupDirectoryHandle, prepared.fileName, prepared.blob);
      counts = prepared.counts;
    } else {
      counts = await downloadBackup(els.backupDownloadLink, { prefix, version });
    }
    backupNextVersion = version + 1;
    try { await settingsDb.setBackupNaming(prefix, backupNextVersion); } catch (_error) {
      // The file is ready; keep the next number for this session.
    }
    els.backupStatus.textContent = useFolder
      ? `Бекап ${savedName} збережено в папці ${backupDirectoryHandle.name}: ${counts.tasks} завдань, ${counts.projects} проєктів, ${counts.lists} списків.`
      : `Бекап підготовлено: ${counts.tasks} завдань, ${counts.projects} проєктів, ${counts.lists} списків. Якщо завантаження не почалося, натисніть «Експорт бекапу» ще раз.`;
  } catch (error) {
    els.backupStatus.textContent = error.name === "NotAllowedError"
      ? "Не вдалося записати бекап у папку. Перевірте дозвіл Chrome або виберіть папку ще раз."
      : error.message || "Не вдалося створити копію";
  } finally { backupBusy = false; }
});
els.backupImportOpen.addEventListener("click", importFromBackupDirectory);
els.backupFolderChoose.addEventListener("click", async () => {
  if (backupBusy) return;
  try {
    await pickBackupDirectory();
    clearBackupSelection();
    els.backupStatus.textContent = "Папку бекапів вибрано.";
  } catch (error) {
    els.backupStatus.textContent = error.name === "AbortError" ? "Вибір папки скасовано." : error.message || "Не вдалося вибрати папку.";
  }
});
els.backupPrefix.addEventListener("input", clearPreparedBackupDownload);
els.backupFile.addEventListener("change", () => chooseBackup(els.backupFile.files[0]));
els.backupMerge.addEventListener("click", () => applyBackup("merge"));
els.backupReplace.addEventListener("click", () => applyBackup("replace"));
els.backupCancel.addEventListener("click", () => { clearBackupSelection(); els.backupStatus.textContent = "Імпорт скасовано"; });
els.listEditorOpen.addEventListener("click", openListEditor);
els.listEditorClose.addEventListener("click", saveActiveListName);
els.listEditorForm.addEventListener("submit", saveActiveListName);
els.listEditorName.addEventListener("input", () => showListEditorError());
els.listDeleteOpen.addEventListener("click", () => {
  els.listDeleteOpen.hidden = true;
  els.listDeleteConfirm.hidden = false;
  els.listDeleteCancel.focus();
});
els.listDeleteCancel.addEventListener("click", () => {
  els.listDeleteConfirm.hidden = true;
  els.listDeleteOpen.hidden = false;
  els.listDeleteOpen.focus();
});
els.listDeleteConfirmButton.addEventListener("click", deleteActiveList);
window.addEventListener("popstate", () => {
  if (mobileNavigationEnabled()) return;
  if (skipCompletedPopstate) { skipCompletedPopstate = false; return; }
  if (!els.completedTasksScreen.hidden) {
    closeCompletedTasks({ fromHistory: true });
    return;
  }
  if (!els.listEditor.hidden) {
    saveActiveListName(null, { fromHistory: true });
    return;
  }
  if (!els.settingsScreen.hidden) {
    closeSettings({ fromHistory: true });
    return;
  }
  if (!els.mainMenu.hidden) closeMainMenu({ fromHistory: true });
});
enableHorizontalSwipe(els.shell, {
  direction: "right",
  canStart: event => projectEls.overview.hidden && selectedTaskIds.size === 0 && !event.target.closest(".task-card"),
  canComplete: () => selectedTaskIds.size === 0,
  onSwipe: openMainMenu
});
enableHorizontalSwipe(els.mainMenu.querySelector(".main-menu-panel"), {
  direction: "left",
  canStart: event => selectedListIds.size === 0 && !event.target.closest(".main-menu-footer"),
  canComplete: () => selectedListIds.size === 0,
  onSwipe: closeMainMenu
});
enableListReordering({
  onReorder: reorderTaskLists,
  isSelectionMode: () => selectedListIds.size > 0,
  isSelected: id => selectedListIds.has(id),
  onLongPress: selectList,
  onSelectOnly: selectList,
  getSelectedIds: () => new Set(selectedListIds)
});
els.themeToggle.addEventListener("change", async () => {
  const previousTheme = manualTheme;
  manualTheme = els.themeToggle.checked ? "dark" : "light";
  renderAppearanceSettings();
  try {
    await settingsDb.setTheme(manualTheme);
  } catch (_error) {
    manualTheme = previousTheme;
    renderAppearanceSettings();
    toast("Не вдалося зберегти тему");
  }
});
els.systemThemeToggle.addEventListener("change", async () => {
  const previous = useSystemTheme;
  useSystemTheme = els.systemThemeToggle.checked;
  renderAppearanceSettings();
  try {
    await settingsDb.setUseSystemTheme(useSystemTheme);
  } catch (_error) {
    useSystemTheme = previous;
    renderAppearanceSettings();
    toast("Не вдалося зберегти режим теми");
  }
});
els.returnOverdueToggle.addEventListener("change", async () => {
  const previous = returnOverdueToInbox;
  returnOverdueToInbox = els.returnOverdueToggle.checked;
  try {
    await settingsDb.setReturnOverdueToInbox(returnOverdueToInbox);
    await processOverdueTasks();
  } catch (_error) {
    returnOverdueToInbox = previous;
    els.returnOverdueToggle.checked = previous;
    toast("Не вдалося зберегти налаштування");
  }
});
els.startScreenSelect.addEventListener("change", async () => {
  const previous = startScreen;
  startScreen = els.startScreenSelect.value;
  try {
    await settingsDb.setStartScreen(startScreen);
    toast("Стартовий екран збережено");
  } catch (_error) {
    startScreen = previous;
    els.startScreenSelect.value = previous;
    toast("Не вдалося зберегти стартовий екран");
  }
});
els.editorBack.addEventListener("click", () => saveAndLeaveTaskEditor({ allowEmptyNew: true }));
els.desktopSaveTask.addEventListener("click", () => saveAndLeaveTaskEditor({ allowEmptyNew: true }));
els.selectionClose.addEventListener("click", clearTaskSelection);
els.selectAllTasks.addEventListener("click", toggleAllVisibleTasks);
els.groupSelected.addEventListener("click", openTodayGroupDialog);
els.renameSelectedGroup.addEventListener("click", openTodayGroupRenameDialog);
els.deleteSelectedGroup.addEventListener("click", openTodayGroupDeleteDialog);
els.recolorSelectedGroup.addEventListener("click", openTodayGroupRecolorDialog);
els.todayGroupRecolorCancel.addEventListener("click", closeTodayGroupRecolorDialog);
els.todayGroupRecolorBackdrop.addEventListener("click", event => { if (event.target === els.todayGroupRecolorBackdrop) closeTodayGroupRecolorDialog(); });
els.todayGroupRecolorDialog.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); closeTodayGroupRecolorDialog(); } });
els.todayGroupRecolorOptions.addEventListener("click", event => {
  const option = event.target.closest("button[data-color]");
  if (option && !option.disabled) chooseTodayGroupColor(option.dataset.color);
});
els.todayGroupMergeCancel.addEventListener("click", closeTodayGroupMergeDialog);
els.todayGroupMergeBackdrop.addEventListener("click", event => { if (event.target === els.todayGroupMergeBackdrop) closeTodayGroupMergeDialog(); });
els.todayGroupMergeDialog.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); closeTodayGroupMergeDialog(); } });
els.todayGroupMergeOptions.addEventListener("click", event => {
  const option = event.target.closest("button[data-keep-id]");
  if (!option || !pendingTodayGroupMerge) return;
  const { sourceId, color } = pendingTodayGroupMerge;
  const keepId = option.dataset.keepId;
  closeTodayGroupMergeDialog();
  applyTodayGroupColor(sourceId, color, keepId);
});
els.todayGroupDeleteNo.addEventListener("click", closeTodayGroupDeleteDialog);
els.todayGroupDeleteYes.addEventListener("click", deleteSelectedTodayGroups);
els.todayGroupDeleteBackdrop.addEventListener("click", event => { if (event.target === els.todayGroupDeleteBackdrop) closeTodayGroupDeleteDialog(); });
els.todayGroupDeleteDialog.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); closeTodayGroupDeleteDialog(); } });
els.todayGroupRenameForm.addEventListener("submit", saveTodayGroupName);
els.todayGroupRenameCancel.addEventListener("click", closeTodayGroupRenameDialog);
els.todayGroupRenameBackdrop.addEventListener("click", event => { if (event.target === els.todayGroupRenameBackdrop) closeTodayGroupRenameDialog(); });
els.todayGroupRenameDialog.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); closeTodayGroupRenameDialog(); } });
els.todayGroupCancel.addEventListener("click", closeTodayGroupDialog);
els.todayGroupBackdrop.addEventListener("click", event => { if (event.target === els.todayGroupBackdrop) closeTodayGroupDialog(); });
els.todayGroupDialog.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); closeTodayGroupDialog(); } });
els.todayGroupOptions.addEventListener("click", event => {
  const option = event.target.closest("button[data-color]");
  if (option) applyTodayGroupSelection(option.dataset.color);
});
els.dateSelected.addEventListener("click", openSelectedTaskDatePicker);
els.listSelected.addEventListener("click", () => els.selectedListOptions.hidden ? openSelectedListDropdown() : closeSelectedListDropdown());
els.selectedListOptions.addEventListener("click", event => {
  if (handleDropdownListCreation(event, els.selectedListOptions)) return;
  const option = event.target.closest("[data-list-id]");
  if (option) moveSelectedTasksToList(option.dataset.listId);
});
els.selectedListOptions.addEventListener("keydown", event => {
  if (handleDropdownListCreationKeydown(event, els.selectedListOptions)) return;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeSelectedListDropdown({ returnFocus: true });
  }
});
els.deleteSelected.addEventListener("click", deleteSelectedTasks);
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !els.listSelectionDeleteBackdrop.hidden) {
    event.preventDefault();
    closeSelectedListsDeleteDialog();
    return;
  }
  if (event.key === "Escape" && !els.listEditor.hidden) {
    event.preventDefault();
    if (!els.listDeleteConfirm.hidden) {
      els.listDeleteConfirm.hidden = true;
      els.listDeleteOpen.hidden = false;
      els.listDeleteOpen.focus();
      return;
    }
    closeListEditor();
    return;
  }
  if (event.key === "Escape" && !els.settingsScreen.hidden) {
    if (!els.completedTasksScreen.hidden) {
      event.preventDefault();
      if (completedDetailId) { completedDetailId = null; renderCompletedTasks(); }
      else closeCompletedTasks();
      return;
    }
    event.preventDefault();
    closeSettings();
    return;
  }
  if (event.key === "Escape" && !els.mainMenu.hidden) {
    event.preventDefault();
    if (selectedListIds.size) {
      clearListSelection();
      return;
    }
    closeMainMenu();
    return;
  }
  if (event.key !== "Escape" || !selectedTaskIds.size || !matchMedia("(min-width: 760px)").matches) return;
  if (!els.editor.hidden || !els.datePickerBackdrop.hidden) return;
  event.preventDefault();
  clearTaskSelection();
});
els.datePickerOpen.addEventListener("click", () => { editingSelectedTaskDates = false; editingProjectDate = false; openDatePicker(); });
els.datePickerClose.addEventListener("click", () => {
  if (matchMedia("(max-width: 759px)").matches) {
    savePendingDateSelection();
    return;
  }
  editingSelectedTaskDates = false;
  editingProjectDate = false;
  closeDatePicker();
});
els.datePickerBackdrop.addEventListener("click", event => { if (event.target === els.datePickerBackdrop) { editingSelectedTaskDates = false; editingProjectDate = false; closeDatePicker(); } });
els.datePicker.addEventListener("keydown", async event => {
  if (event.key === "Escape") { event.preventDefault(); editingSelectedTaskDates = false; editingProjectDate = false; closeDatePicker(); }
  if (event.key === "Enter" && matchMedia("(min-width: 760px)").matches) {
    event.preventDefault();
    const taskEditorWasOpen = !els.editor.hidden;
    const dateSaved = await savePendingDateSelection();
    if (dateSaved && taskEditorWasOpen) await saveAndLeaveTaskEditor();
  }
});
document.addEventListener("keydown", async event => {
  if (event.key !== "Enter" || els.datePickerBackdrop.hidden || !matchMedia("(min-width: 760px)").matches) return;
  if (!els.timeDialogBackdrop.hidden || event.target.closest("#time-dialog")) return;
  event.preventDefault();
  event.stopPropagation();
  await savePendingDateSelection();
}, true);
document.querySelectorAll("[data-date-shortcut]").forEach(button => button.addEventListener("click", () => {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const value = button.dataset.dateShortcut === "today" ? localDateValue()
    : button.dataset.dateShortcut === "tomorrow" ? localDateValue(tomorrow) : "";
  if (value) { const date = dateFromValue(value); visibleCalendarMonth = new Date(date.getFullYear(), date.getMonth(), 1); }
  setPendingDate(value);
}));
els.calendarGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-date]");
  if (button) setPendingDate(button.dataset.date);
});
els.calendarPrevious.addEventListener("click", () => { visibleCalendarMonth.setMonth(visibleCalendarMonth.getMonth() - 1); renderCalendar(); });
els.calendarNext.addEventListener("click", () => { visibleCalendarMonth.setMonth(visibleCalendarMonth.getMonth() + 1); renderCalendar(); });
async function savePendingDateSelection() {
  if (editingProjectDate) {
    editingProjectDate = false;
    projectEls.dueDate.value = pendingDateValue || "";
    projectEls.dueTime.value = pendingDateValue ? pendingTimeValue : "";
    projectEls.dateLabel.textContent = readableDueDate(pendingDateValue, pendingTimeValue);
    applyDateTone(projectEls.datePickerOpen, pendingDateValue, pendingTimeValue);
    renderProjectCountdown();
    markProjectDirty();
    closeDatePicker();
    return true;
  }
  if (editingSelectedTaskDates) {
    editingSelectedTaskDates = false;
    closeDatePicker();
    await updateSelectedTaskDates(pendingDateValue, pendingTimeValue);
    return true;
  }
  els.date.value = pendingDateValue;
  els.editor.dataset.dateChosen = "true";
  els.time.value = pendingDateValue ? pendingTimeValue : "";
  els.dateLabel.textContent = readableDueDate(pendingDateValue, pendingTimeValue);
  applyDateTone(els.datePickerOpen, pendingDateValue, pendingTimeValue);
  updateDesktopSaveState();
  closeDatePicker();
  return true;
}
els.datePickerSave.addEventListener("click", savePendingDateSelection);
els.timePickerOpen.addEventListener("click", openTimeDialog);
els.timePickerClear.addEventListener("click", () => {
  pendingTimeValue = "";
  setPendingDate(pendingDateValue);
  els.timePickerOpen.focus();
});
els.timeDialogClose.addEventListener("click", closeTimeDialog);
els.timeDialogCancel.addEventListener("click", closeTimeDialog);
els.timeDialogSave.addEventListener("click", saveTimeDialog);
els.timeDialogBackdrop.addEventListener("click", event => { if (event.target === els.timeDialogBackdrop) closeTimeDialog(); });
els.timeDialog.addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); closeTimeDialog(); }
  if (event.key === "Enter" && matchMedia("(min-width: 760px)").matches) { event.preventDefault(); saveTimeDialog(); }
});
function activateTimeInput(input, phase) {
  timePickerPhase = phase;
  renderTimeDial({ preserveDisplay: true });
  input.select();
}
els.timeDisplayHour.addEventListener("click", () => activateTimeInput(els.timeDisplayHour, "hour"));
els.timeDisplayMinute.addEventListener("click", () => activateTimeInput(els.timeDisplayMinute, "minute"));
els.timeDisplayHour.addEventListener("input", () => updateDraftTimeInput(els.timeDisplayHour, "hour"));
els.timeDisplayMinute.addEventListener("input", () => updateDraftTimeInput(els.timeDisplayMinute, "minute"));
els.timeDisplayHour.addEventListener("blur", normalizeDraftTimeInputs);
els.timeDisplayMinute.addEventListener("blur", normalizeDraftTimeInputs);
els.timeDialOptions.addEventListener("click", event => {
  const option = event.target.closest("[data-time-value]");
  if (!option) return;
  const value = Number(option.dataset.timeValue);
  if (timePickerPhase === "hour") {
    draftTimeHour = value;
    timePickerPhase = "minute";
  } else {
    draftTimeMinute = value;
  }
  renderTimeDial();
});
els.input.addEventListener("input", () => { resizeTaskTitle(); updateDesktopSaveState(); });
els.description.addEventListener("input", () => { resizeDescription(); updateDesktopSaveState(); });
els.taskListTrigger.addEventListener("click", () => els.taskListOptions.hidden ? openTaskListDropdown() : closeTaskListDropdown());
els.taskListOptions.addEventListener("click", async event => {
  if (handleDropdownListCreation(event, els.taskListOptions)) return;
  const option = event.target.closest("[data-list-id]");
  if (!option) return;
  closeTaskListDropdown({ returnFocus: true });
  if (els.editor.dataset.taskId) await moveOpenTaskImmediatelyToList(option.dataset.listId);
  else {
    setTaskEditorListUI(option.dataset.listId);
    updateDesktopSaveState();
  }
});
els.taskListOptions.addEventListener("keydown", event => {
  if (handleDropdownListCreationKeydown(event, els.taskListOptions)) return;
  if (event.key === "Escape") { event.preventDefault(); closeTaskListDropdown({ returnFocus: true }); }
});
document.addEventListener("pointerdown", event => {
  if (!els.taskListOptions.hidden && !event.target.closest(".list-dropdown")) closeTaskListDropdown();
  if (!els.selectedListOptions.hidden && !event.target.closest(".bulk-list-dropdown")) closeSelectedListDropdown();
});
els.form.addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); saveAndLeaveTaskEditor({ allowEmptyNew: true }); return; }
  if (event.key === "Enter" && !event.shiftKey && event.target.matches("#task-title")) {
    event.preventDefault();
    saveAndLeaveTaskEditor();
  }
});
els.form.addEventListener("submit", event => { event.preventDefault(); saveAndLeaveTaskEditor(); });
els.list.addEventListener("click", async event => {
  const groupToggle = event.target.closest(".today-group-toggle");
  if (groupToggle && els.list.contains(groupToggle)) {
    const wrapper = groupToggle.closest(".today-group");
    const groupId = wrapper?.dataset.groupId;
    if (els.list.dataset.suppressGroupClick === groupId) { delete els.list.dataset.suppressGroupClick; return; }
    if (selectedTaskIds.size) { toast("Групи виділяються окремо від завдань"); return; }
    if (selectedTodayGroupIds.size) { await selectTodayGroup(groupId); return; }
    const group = todayLayout?.groups.find(item => item.id === groupId);
    if (!group || groupToggle.disabled) return;
    groupToggle.disabled = true;
    try {
      const collapsed = !group.collapsed;
      await changeTodayLayout((layout, visible, date) =>
        setTodayGroupCollapsed(layout, visible, date, groupId, collapsed));
      wrapper.querySelector(".today-group-tasks").hidden = collapsed;
      groupToggle.setAttribute("aria-expanded", String(!collapsed));
      groupToggle.setAttribute("aria-label", `${collapsed ? "Розгорнути" : "Згорнути"} групу «${group.title || TODAY_GROUP_NAMES.get(group.color)}»`);
    } catch (_error) {
      toast("Не вдалося зберегти стан групи");
    } finally {
      groupToggle.disabled = false;
    }
    return;
  }
  const row = event.target.closest(".swipe-row");
  if (!row || !els.list.contains(row)) return;
  if (row?.dataset.swiped) { delete row.dataset.swiped; return; }
  if (row?.dataset.longPressed) { delete row.dataset.longPressed; return; }
  if (selectedTodayGroupIds.size) { toast("Завдання виділяються окремо від груп"); return; }
  if (selectedTaskIds.size && row) {
    toggleTaskSelection(row.dataset.id);
    return;
  }
  const toggle = event.target.closest(".toggle");
  if (toggle && row) {
    const task = tasks.find(item => item.id === row.dataset.id);
    await completeTask(task, {}, toggle);
    return;
  }
  const card = event.target.closest(".task-card");
  if (card && row) {
    const task = tasks.find(item => item.id === row.dataset.id);
    if (task) openTaskDetails(task);
  }
});

els.detailToggle.addEventListener("click", async () => {
  const task = tasks.find(item => item.id === els.editor.dataset.taskId);
  if (!task) return;
  const changes = { title: els.input.value.trim() || task.title, description: els.description.value.trim(), dueDate: els.date.value || null, dueTime: els.date.value && els.time.value ? els.time.value : null };
  await completeTask(task, changes, els.detailToggle);
  els.editor.dataset.taskId = "";
  hideTaskEditor();
});

els.taskProjectLink.addEventListener("click", async () => {
  const projectId = els.taskProjectLink.dataset.projectId;
  if (!projectId) return;
  if (!els.input.value.trim()) {
    toast("Введіть назву завдання");
    els.input.focus();
    return;
  }
  try {
    if (!await saveOpenTask()) {
      toast("Не вдалося зберегти завдання");
      return;
    }
  } catch (_error) {
    toast("Не вдалося зберегти завдання");
    return;
  }
  els.editor.dataset.taskId = "";
  hideTaskEditor();
  openProject(projectId);
});

els.taskConvertProject.addEventListener("click", convertOpenTaskToProject);
els.taskDetachProject.addEventListener("click", openTaskDetachDialog);
els.taskDetachCancel.addEventListener("click", closeTaskDetachDialog);
els.taskDetachConfirm.addEventListener("click", confirmTaskDetachChoice);
els.taskDetachDialogBackdrop.addEventListener("click", event => {
  if (event.target === els.taskDetachDialogBackdrop) closeTaskDetachDialog();
});
els.taskDetachDialog.addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); closeTaskDetachDialog(); }
});

enableTaskGestures({
  onDelete: deleteTask,
  isSelectionMode: () => selectedTaskIds.size > 0,
  isSelected: id => selectedTaskIds.has(id),
  onLongPress: selectTask,
  onSelectOnly: selectTask,
  getSelectedIds: () => new Set(selectedTaskIds),
  onReorder: reorderSelectedTasks,
  canDragRow: row => isDayList() && todayLayout?.groups?.length
    ? row.parentElement === els.list || Boolean(row.parentElement?.classList.contains("today-group-tasks"))
    : row.parentElement === els.list
});
enableTodayGroupReordering({ isSelected: id => selectedTodayGroupIds.has(id), onSelect: selectTodayGroup, onReorder: reorderSelectedTodayGroup });
let appServiceWorkerRegistration = null;
let lastAppUpdateCheck = 0;

function checkForAppUpdate() {
  if (!appServiceWorkerRegistration || typeof appServiceWorkerRegistration.update !== "function") return;
  if (Date.now() - lastAppUpdateCheck < 30000) return;
  lastAppUpdateCheck = Date.now();
  appServiceWorkerRegistration.update().catch(() => {});
}

async function manuallyCheckForAppUpdate() {
  if (els.checkAppUpdate.disabled) return;
  if (!("serviceWorker" in navigator)) { toast("Перевірка оновлень недоступна в цьому браузері"); return; }
  if (!document.getElementById("app-update").hidden) { toast("Оновлення готове — натисніть «Оновити»"); return; }
  els.checkAppUpdate.disabled = true;
  els.checkAppUpdate.textContent = "Перевіряю…";
  try {
    const registration = appServiceWorkerRegistration || await navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" });
    appServiceWorkerRegistration = registration;
    let updateFound = false;
    registration.addEventListener?.("updatefound", () => { updateFound = true; }, { once: true });
    const previousController = navigator.serviceWorker.controller;
    await registration.update();
    lastAppUpdateCheck = Date.now();
    const ready = !document.getElementById("app-update").hidden || navigator.serviceWorker.controller !== previousController;
    toast(ready ? "Оновлення готове — натисніть «Оновити»" : updateFound || registration.installing || registration.waiting
      ? "Оновлення знайдено — дочекайтеся кнопки «Оновити»" : "У вас найновіша версія");
  } catch (_error) { toast("Не вдалося перевірити оновлення. Перевірте з’єднання"); }
  finally {
    els.checkAppUpdate.disabled = false;
    els.checkAppUpdate.textContent = "Перевірити оновлення";
  }
}

els.checkAppUpdate.addEventListener("click", manuallyCheckForAppUpdate);

if ("serviceWorker" in navigator) {
  let hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController) document.getElementById("app-update").hidden = false;
    hadController = true;
  });
  document.getElementById("app-update-reload").addEventListener("click", () => window.location.reload());
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" })
      .then(registration => { appServiceWorkerRegistration = registration; })
      .catch(() => {});
  });
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) { checkForDateChange(); checkForAppUpdate(); }
});
window.addEventListener("focus", () => { checkForDateChange(); checkForAppUpdate(); });
systemThemeQuery.addEventListener("change", () => { if (useSystemTheme) renderAppearanceSettings(); });
// Android Back traverses real views. Keep browser history limited to this session's UI states.
let mobileNavSession = null;
let mobileNavEntries = [];
let mobileNavIndex = 0;
let mobileNavApplying = false;
let mobileNavTimer = null;

function mobileNavigationEnabled() {
  return matchMedia("(max-width: 759px)").matches;
}

function mobileNavigationState() {
  const menuOpen = els.mainMenuOpen.getAttribute("aria-expanded") === "true";
  const settingsOpen = els.settingsOpen.getAttribute("aria-expanded") === "true";
  const listEditorOpen = els.listEditorOpen.getAttribute("aria-expanded") === "true";
  return {
    screen: projectEls.shell.classList.contains("projects-mode") ? "projects" : "list",
    listId: activeListId,
    projectId: !projectEls.screen.hidden ? activeProjectId : null,
    menu: menuOpen,
    settings: settingsOpen,
    completed: !els.completedTasksScreen.hidden,
    completedWeek: !els.completedTasksScreen.hidden ? completedWeekOffset : 0,
    completedDetail: !els.completedTasksScreen.hidden ? completedDetailId : null,
    listEditor: listEditorOpen,
    projectEditor: !projectEls.editor.hidden,
    taskEditor: !els.editor.hidden && !els.editor.classList.contains("is-closing")
      ? (els.editor.dataset.taskId || "new") : null,
    taskListId: !els.editor.hidden && !els.editor.classList.contains("is-closing")
      ? els.taskListSelect.value : null,
    datePicker: !els.datePickerBackdrop.hidden,
    timeDialog: !els.timeDialogBackdrop.hidden,
    attachDialog: !projectEls.attachBackdrop.hidden,
    convertDialog: !projectEls.convertDialogBackdrop.hidden,
    completeDialog: !projectEls.completeDialogBackdrop.hidden,
    deleteDialog: !projectEls.deleteDialogBackdrop.hidden,
    overdueDialog: !projectEls.overdueDialogBackdrop.hidden,
    detachDialog: !els.taskDetachDialogBackdrop.hidden,
    listDeleteDialog: !els.listSelectionDeleteBackdrop.hidden
  };
}

function sameMobileNavigation(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function mobileNavigationEntry(index, view) {
  return { dimsTasksNavigation: mobileNavSession, index, view };
}

function recordMobileNavigation(alwaysPush = false) {
  if (!mobileNavSession || mobileNavApplying || !mobileNavigationEnabled()) return;
  const view = mobileNavigationState();
  if (sameMobileNavigation(view, mobileNavEntries[mobileNavIndex])) return;
  if (!alwaysPush && mobileNavIndex > 0 && sameMobileNavigation(view, mobileNavEntries[mobileNavIndex - 1])) {
    history.back();
    return;
  }
  mobileNavEntries = mobileNavEntries.slice(0, mobileNavIndex + 1);
  mobileNavEntries.push(view);
  mobileNavIndex++;
  history.pushState(mobileNavigationEntry(mobileNavIndex, view), "");
}

function scheduleMobileNavigationRecord() {
  if (!mobileNavSession || mobileNavApplying || !mobileNavigationEnabled()) return;
  clearTimeout(mobileNavTimer);
  mobileNavTimer = setTimeout(recordMobileNavigation, 0);
}

async function restoreMobileNavigation(view) {
  mobileNavApplying = true;
  clearTimeout(mobileNavTimer);
  try {
    const current = mobileNavigationState();
    const sameParent = ["screen", "listId", "projectId", "menu", "settings", "completed",
      "listEditor", "projectEditor", "taskEditor"].every(key => current[key] === view[key]);
    if (sameParent) {
      if (current.timeDialog && !view.timeDialog) closeTimeDialog();
      if (current.datePicker && !view.datePicker) closeDatePicker();
      if (current.attachDialog && !view.attachDialog) closeAttachDialog();
      if (current.convertDialog && !view.convertDialog) closeProjectConvertDialog();
      if (current.detachDialog && !view.detachDialog) closeTaskDetachDialog();
      if (current.listDeleteDialog && !view.listDeleteDialog) closeSelectedListsDeleteDialog();
      if (current.completeDialog && !view.completeDialog) closeProjectCompleteDialog(null);
      if (current.deleteDialog && !view.deleteDialog) closeProjectDeleteDialog(null);
      if (current.overdueDialog && !view.overdueDialog) closeProjectOverdueDialog();
      if (view.completed) {
        completedWeekOffset = view.completedWeek;
        completedDetailId = tasks.some(task => task.id === view.completedDetail && task.status === "completed")
          ? view.completedDetail : null;
        renderCompletedTasks();
      }
      if (view.datePicker && !current.datePicker) {
        editingProjectDate = view.projectEditor;
        openDatePicker(view.projectEditor ? projectEls.dueDate.value : els.date.value,
          view.projectEditor ? projectEls.dueTime.value : els.time.value);
      }
      if (view.timeDialog && !current.timeDialog) openTimeDialog();
      if (view.attachDialog && !current.attachDialog) projectEls.attachOpen.click();
      if (view.convertDialog && !current.convertDialog) openProjectConvertDialog();
      if (view.detachDialog && !current.detachDialog) openTaskDetachDialog();
      if (view.completeDialog && !current.completeDialog) requestProjectCompletion(Math.max(1, selectedProjectIds.size));
      if (view.deleteDialog && !current.deleteDialog) requestProjectDeletion(Math.max(1, selectedProjectIds.size));
      if (view.overdueDialog && !current.overdueDialog) openProjectOverdueDialog();
      if (view.listDeleteDialog && !current.listDeleteDialog) els.mainMenuDeleteSelected.click();
      return;
    }
    if (!els.timeDialogBackdrop.hidden) closeTimeDialog();
    if (!els.datePickerBackdrop.hidden) closeDatePicker();
    if (!projectEls.attachBackdrop.hidden) closeAttachDialog();
    if (!projectEls.convertDialogBackdrop.hidden) closeProjectConvertDialog();
    if (!els.taskDetachDialogBackdrop.hidden) closeTaskDetachDialog();
    if (!els.listSelectionDeleteBackdrop.hidden) closeSelectedListsDeleteDialog();
    if (!projectEls.completeDialogBackdrop.hidden) closeProjectCompleteDialog(null);
    if (!projectEls.deleteDialogBackdrop.hidden) closeProjectDeleteDialog(null);
    if (!projectEls.overdueDialogBackdrop.hidden) closeProjectOverdueDialog();
    if (!els.editor.hidden && !els.editor.classList.contains("is-closing")) {
      await saveAndLeaveTaskEditor({ allowEmptyNew: true });
      if (!els.editor.classList.contains("is-closing")) {
        history.pushState(mobileNavigationEntry(mobileNavIndex, mobileNavigationState()), "");
        return;
      }
    }
    if (!projectEls.editor.hidden) {
      await saveProjectFields({ closeAfter: true });
      if (!projectEls.editor.hidden) return;
    }
    if (!els.listEditor.hidden && els.listEditor.classList.contains("is-open")) {
      await saveActiveListName(null, { fromHistory: true });
      if (els.listEditor.classList.contains("is-open")) return;
    }
    if (!els.completedTasksScreen.hidden) closeCompletedTasks({ fromHistory: true });
    if (!els.settingsScreen.hidden) closeSettings({ fromHistory: true });
    if (!els.mainMenu.hidden) closeMainMenu({ fromHistory: true });
    if (!projectEls.screen.hidden) await closeProject();

    if (view.screen === "projects") {
      openProjects();
      if (view.projectId && projects.some(project => project.id === view.projectId)) openProject(view.projectId, { showOverdue: false });
    } else {
      openList(lists.some(list => list.id === view.listId) || isDayList(view.listId)
        ? view.listId : INBOX_LIST_ID);
    }
    if (view.menu) openMainMenu();
    if (view.settings) openSettings();
    if (view.completed) {
      openCompletedTasks();
      completedWeekOffset = view.completedWeek;
      completedDetailId = tasks.some(task => task.id === view.completedDetail && task.status === "completed")
        ? view.completedDetail : null;
      renderCompletedTasks();
    }
    if (view.listEditor && activeList()?.kind === "regular") openListEditor();
    if (view.projectEditor && view.projectId && !projectEls.screen.hidden) openProjectEditor();
    if (view.taskEditor) {
      const task = tasks.find(item => item.id === view.taskEditor);
      if (task) openTaskDetails(task);
      else if (view.taskEditor === "new") openNewTaskEditor(view.taskListId || activeListId);
    }
    if (view.datePicker) openDatePicker();
    if (view.timeDialog && view.datePicker) openTimeDialog();
    if (view.attachDialog && view.projectId) projectEls.attachOpen.click();
    if (view.convertDialog && view.projectId) openProjectConvertDialog();
    if (view.detachDialog && view.taskEditor) openTaskDetachDialog();
    if (view.completeDialog) requestProjectCompletion(Math.max(1, selectedProjectIds.size));
    if (view.deleteDialog) requestProjectDeletion(Math.max(1, selectedProjectIds.size));
    if (view.overdueDialog && view.projectId) openProjectOverdueDialog();
    if (view.listDeleteDialog) els.mainMenuDeleteSelected.click();
  } finally {
    // The snapshot ignores closing animation frames, so the next user action can be recorded immediately.
    setTimeout(() => { mobileNavApplying = false; scheduleMobileNavigationRecord(); }, 0);
  }
}

function initializeMobileNavigation() {
  if (!mobileNavigationEnabled()) return;
  mobileNavSession = crypto.randomUUID();
  const initial = mobileNavigationState();
  mobileNavEntries = [initial];
  mobileNavIndex = 0;
  history.replaceState(mobileNavigationEntry(0, initial), "");
  new MutationObserver(scheduleMobileNavigationRecord).observe(document.body, {
    subtree: true, childList: true, attributes: true, attributeFilter: ["hidden", "class"]
  });
}

window.addEventListener("popstate", event => {
  if (!mobileNavigationEnabled() || !mobileNavSession) return;
  const entry = event.state;
  if (entry?.dimsTasksNavigation !== mobileNavSession) return;
  mobileNavIndex = entry.index;
  restoreMobileNavigation(entry.view);
});

initializeApp({ openStartScreen: true }).then(() => {
  initializeMobileNavigation();
  scheduleDateChangeCheck();
}).catch(() => toast("Не вдалося відкрити локальне сховище"));
