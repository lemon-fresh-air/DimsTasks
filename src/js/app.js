let tasks = [];
let lists = [];
let activeListId = INBOX_LIST_ID;
let todayDefaultListId = INBOX_LIST_ID;
let returnOverdueToInbox = false;
let selectedTaskIds = new Set();
let selectedListIds = new Set();
let completionAudioContext;
let editingSelectedTaskDates = false;
let editingProjectDate = false;
let currentLocalDate = localDateValue();
let currentLocalMinute = localTimeValue();
let overdueProcessing;
let dateChangeTimer;
let listEditorCloseTimer;
let listEditorOpenFrame;
let pendingBackup = null;
let pendingBackupMode = null;
let backupBusy = false;
const todayList = { id: TODAY_LIST_ID, title: "Сьогодні", kind: "today" };

function activeList() {
  if (activeListId === TODAY_LIST_ID) return todayList;
  return lists.find(list => list.id === activeListId) || lists.find(list => list.kind === "inbox");
}

function visibleTasks() {
  if (activeListId === TODAY_LIST_ID) {
    const today = localDateValue();
    const time = localTimeValue();
    return tasks.filter(task => task.dueDate === today && !isTaskOverdue(task, today, time)).sort(compareTodayTasks);
  }
  return visibleListTasks(tasks, activeListId).sort(compareTasks);
}

function renderCurrentTasks() {
  renderTasks(visibleTasks(), selectedTaskIds, lists, projects);
  updateMainMenuTaskCounts(tasks);
  renderSelectedListOptions(lists, activeListId);
  renderProjects();
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
  selectedTaskIds = new Set([...selectedTaskIds].filter(id => tasks.some(task => task.id === id)));
  renderCurrentTasks();
  renderProjects();
  if (previousPositions) animateTaskReflow(previousPositions);
}

async function loadAndNormalizeTaskOrder() {
  const loaded = await taskDb.all();
  const normalized = normalizeTaskOrder(loaded);
  const changed = normalized.filter((task, index) => task !== loaded[index]);
  if (changed.length) await taskDb.putMany(changed);
  tasks = normalized.sort(compareTasks);
  renderCurrentTasks();
}

async function loadLists() {
  lists = (await listDb.all()).sort(compareLists);
  selectedListIds = new Set([...selectedListIds].filter(id => lists.some(list => list.id === id && list.kind === "regular")));
  if (activeListId !== TODAY_LIST_ID && !lists.some(list => list.id === activeListId)) {
    activeListId = lists.find(list => list.kind === "inbox")?.id || INBOX_LIST_ID;
  }
  renderListNavigation();
}

async function initializeApp() {
  await loadLists();
  todayDefaultListId = await settingsDb.todayListId() || INBOX_LIST_ID;
  returnOverdueToInbox = await settingsDb.returnOverdueToInbox();
  els.returnOverdueToggle.checked = returnOverdueToInbox;
  await loadAndNormalizeTaskOrder();
  await loadProjects();
  renderCurrentTasks();
  await processOverdueTasks();
}

function validTodayDefaultListId() {
  return lists.some(list => list.id === todayDefaultListId) ? todayDefaultListId : INBOX_LIST_ID;
}

function clearBackupSelection() {
  pendingBackup = null;
  pendingBackupMode = null;
  els.backupFile.value = "";
  els.backupPreview.hidden = true;
  els.backupConfirm.hidden = true;
  els.backupSafeCopy.checked = false;
  els.backupApply.disabled = true;
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
    els.backupSummary.textContent = `Копія від ${date}. ${backupSummary(parsed.data)}. Формат ${parsed.formatVersion}.`;
    els.backupPreview.hidden = false;
    els.backupStatus.textContent = "Файл перевірено. Оберіть спосіб відновлення.";
  } catch (error) {
    els.backupStatus.textContent = error.message || "Не вдалося перевірити файл";
  }
}

function confirmBackupMode(mode) {
  if (!pendingBackup || backupBusy) return;
  pendingBackupMode = mode;
  els.backupConfirmText.textContent = mode === "replace"
    ? "Усі поточні дані буде замінено вмістом файлу. Спершу завантажте копію поточних даних, якщо вони потрібні."
    : "Дані буде об’єднано за ID. У конфліктах переможе запис із новішим часом зміни; видалення не передаються.";
  els.backupSafeCopy.checked = false;
  els.backupApply.disabled = true;
  els.backupConfirm.hidden = false;
  els.backupSafeCopy.focus();
}

async function applyBackup() {
  if (!pendingBackup || !pendingBackupMode || !els.backupSafeCopy.checked || backupBusy) return;
  backupBusy = true;
  els.backupApply.disabled = true;
  els.backupStatus.textContent = "Відновлення даних…";
  try {
    let result = pendingBackup.data;
    let report = "Дані замінено";
    if (pendingBackupMode === "merge") {
      const merged = await appDb.mergeAll(result, (local, incoming) => mergeBackupData(completeBackupFields(local), incoming));
      result = merged.data;
      report = `Дані злито: додано ${merged.changes.added}, оновлено ${merged.changes.updated}, збережено локальних ${merged.changes.kept}`;
    } else await appDb.replaceAll(result);
    clearBackupSelection();
    selectedTaskIds = new Set();
    selectedListIds = new Set();
    selectedProjectIds = new Set();
    activeProjectId = null;
    await initializeApp();
    applyTheme(await settingsDb.theme());
    els.backupStatus.textContent = `${report}. ${backupSummary(result)}.`;
  } catch (error) {
    els.backupStatus.textContent = error.message || "Не вдалося відновити дані";
    els.backupApply.disabled = !els.backupSafeCopy.checked;
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
  currentLocalDate = today;
  currentLocalMinute = minute;
  if (dayChanged && activeListId === TODAY_LIST_ID) selectedTaskIds = new Set();
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
  refreshDateDependentUI();
  scheduleDateChangeCheck();
}

function openList(listId) {
  closeProjects();
  if (listId !== TODAY_LIST_ID && !lists.some(list => list.id === listId)) return;
  activeListId = listId;
  selectedTaskIds = new Set();
  selectedListIds = new Set();
  renderListNavigation();
  renderCurrentTasks();
  closeMainMenu();
  window.scrollTo(0, 0);
}

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
  history.pushState({ listEditor: true }, "");
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
  if (!fromHistory && history.state?.listEditor) history.back();
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
    toast("Список видалено, задачі перенесено до «Нові»");
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
  const now = new Date().toISOString();
  els.listSelectionDeleteConfirm.disabled = true;
  try {
    await listDb.deleteManyAndMoveTasksToInbox([...ids], now);
    tasks = tasks.map(task => ids.has(task.listId) ? { ...task, listId: INBOX_LIST_ID, sectionId: null, updatedAt: now } : task);
    lists = lists.filter(list => !ids.has(list.id));
    if (ids.has(activeListId)) activeListId = INBOX_LIST_ID;
    selectedListIds = new Set();
    closeSelectedListsDeleteDialog();
    renderListNavigation();
    renderCurrentTasks();
    toast(ids.size === 1 ? "Список видалено, задачі перенесено до «Нові»" : `Видалено списків: ${ids.size}. Задачі перенесено до «Нові»`);
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
  selectedTaskIds = new Set([id]);
  renderCurrentTasks();
}

function toggleTaskSelection(id) {
  const next = new Set(selectedTaskIds);
  if (next.has(id)) next.delete(id); else next.add(id);
  selectedTaskIds = next;
  renderCurrentTasks();
}

function clearTaskSelection() {
  selectedTaskIds = new Set();
  closeSelectedListDropdown();
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
  const title = els.input.value.trim();
  if (!title) { els.input.focus(); return false; }
  const task = createTask({ listId: els.taskListSelect.value || activeListId, title, description: els.description.value.trim(), dueDate: els.date.value || null, dueTime: els.date.value && els.time.value ? els.time.value : null, position: 0 });
  const scope = taskOrderScope(task);
  const shifted = tasks.filter(item => taskOrderScope(item) === scope).map(item => ({ ...item, position: item.position + 1 }));
  await taskDb.putMany([task, ...shifted]);
  await refresh();
  if (els.editor.dataset.originListId === TODAY_LIST_ID) {
    todayDefaultListId = task.listId;
    try { await settingsDb.setTodayListId(task.listId); } catch (_error) {
      // The task is already saved; keep the chosen default for this session.
    }
  }
  return true;
}

async function reorderSelectedTasks({ beforeId }) {
  if (activeListId === TODAY_LIST_ID) return false;
  const selected = tasks.filter(task => selectedTaskIds.has(task.id)).sort(compareTasks);
  if (!selected.length) return false;
  const previous = tasks;
  const scope = taskOrderScope(selected[0]);
  const reordered = reorderTaskBlock(tasks, selectedTaskIds, beforeId, scope);
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
  toast(editing ? "Зміни збережено" : "Задачу додано");
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
  await taskDb.put(completedTask);
  await refresh({ animateTaskReflow: Boolean(toggle?.closest(".swipe-row")) });
  toast("Виконано", {
    duration: 3000,
    action: async () => {
      await taskDb.put({ ...completedTask, status: "active", completedAt: null, updatedAt: new Date().toISOString() });
      await refresh();
      toast("Виконання скасовано");
    }
  });
}

els.add.addEventListener("click", () => openNewTaskEditor(
  activeListId === TODAY_LIST_ID ? validTodayDefaultListId() : activeListId,
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
els.backupExport.addEventListener("click", async () => {
  if (backupBusy) return;
  backupBusy = true;
  els.backupStatus.textContent = "Підготовка копії…";
  try {
    const counts = await downloadBackup();
    els.backupStatus.textContent = `Копію підготовлено: ${counts.tasks} завдань, ${counts.projects} проєктів, ${counts.lists} списків.`;
  } catch (error) {
    els.backupStatus.textContent = error.message || "Не вдалося створити копію";
  } finally { backupBusy = false; }
});
els.backupImportOpen.addEventListener("click", () => { if (!backupBusy) els.backupFile.click(); });
els.backupFile.addEventListener("change", () => chooseBackup(els.backupFile.files[0]));
els.backupMerge.addEventListener("click", () => confirmBackupMode("merge"));
els.backupReplace.addEventListener("click", () => confirmBackupMode("replace"));
els.backupCancel.addEventListener("click", () => { clearBackupSelection(); els.backupStatus.textContent = "Імпорт скасовано"; });
els.backupConfirmCancel.addEventListener("click", () => { pendingBackupMode = null; els.backupConfirm.hidden = true; });
els.backupSafeCopy.addEventListener("change", () => { els.backupApply.disabled = !els.backupSafeCopy.checked; });
els.backupApply.addEventListener("click", applyBackup);
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
  canStart: event => projectEls.overview.hidden && !event.target.closest(".task-card"),
  onSwipe: () => {
    if (selectedTaskIds.size) clearTaskSelection();
    openMainMenu();
  }
});
enableHorizontalSwipe(els.mainMenu.querySelector(".main-menu-panel"), {
  direction: "left",
  canStart: event => !event.target.closest(".main-menu-item"),
  onSwipe: () => {
    if (selectedListIds.size) clearListSelection();
    closeMainMenu();
  }
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
  const previousTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const theme = els.themeToggle.checked ? "dark" : "light";
  applyTheme(theme);
  try {
    await settingsDb.setTheme(theme);
  } catch (_error) {
    applyTheme(previousTheme);
    toast("Не вдалося зберегти тему");
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
els.editorBack.addEventListener("click", () => saveAndLeaveTaskEditor({ allowEmptyNew: true }));
els.desktopSaveTask.addEventListener("click", () => saveAndLeaveTaskEditor({ allowEmptyNew: true }));
els.selectionClose.addEventListener("click", clearTaskSelection);
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
els.input.addEventListener("input", () => { els.input.style.height = "auto"; els.input.style.height = `${Math.min(els.input.scrollHeight, 150)}px`; updateDesktopSaveState(); });
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
  const row = event.target.closest(".swipe-row");
  if (row?.dataset.swiped) { delete row.dataset.swiped; return; }
  if (row?.dataset.longPressed) { delete row.dataset.longPressed; return; }
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

els.taskProjectLink.addEventListener("click", () => {
  const projectId = els.taskProjectLink.dataset.projectId;
  if (!projectId) return;
  hideTaskEditor();
  openProject(projectId);
});

enableTaskGestures({
  onDelete: deleteTask,
  isSelectionMode: () => selectedTaskIds.size > 0,
  isSelected: id => selectedTaskIds.has(id),
  onLongPress: selectTask,
  onSelectOnly: selectTask,
  getSelectedIds: () => new Set(selectedTaskIds),
  onReorder: reorderSelectedTasks
});
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkForDateChange(); });
window.addEventListener("focus", checkForDateChange);
settingsDb.theme().then(applyTheme).catch(() => toast("Не вдалося завантажити тему"));
initializeApp().then(scheduleDateChangeCheck).catch(() => toast("Не вдалося відкрити локальне сховище"));
