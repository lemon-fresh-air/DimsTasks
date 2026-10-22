const els = {
  shell: document.querySelector(".app-shell"),
  normalHeader: document.querySelector("#normal-header"),
  selectionToolbar: document.querySelector("#selection-toolbar"),
  selectionClose: document.querySelector("#selection-close"),
  selectionCount: document.querySelector("#selection-count"),
  selectAllTasks: document.querySelector("#select-all-tasks"),
  dateSelected: document.querySelector("#date-selected"),
  listSelected: document.querySelector("#list-selected"),
  selectedListOptions: document.querySelector("#selected-list-options"),
  deleteSelected: document.querySelector("#delete-selected"),
  form: document.querySelector("#task-form"),
  input: document.querySelector("#task-title"),
  description: document.querySelector("#task-description"),
  taskProjectLink: document.querySelector("#task-project-link"),
  taskConvertProject: document.querySelector("#task-convert-project"),
  taskDetachProject: document.querySelector("#task-detach-project"),
  taskDetachDialogBackdrop: document.querySelector("#task-detach-dialog-backdrop"),
  taskDetachDialog: document.querySelector("#task-detach-dialog"),
  taskDetachCancel: document.querySelector("#task-detach-cancel"),
  taskDetachConfirm: document.querySelector("#task-detach-confirm"),
  taskProjectValue: document.querySelector("#task-project-value"),
  date: document.querySelector("#task-date"),
  time: document.querySelector("#task-time"),
  dateLabel: document.querySelector("#date-label"),
  datePickerOpen: document.querySelector("#date-picker-open"),
  datePickerBackdrop: document.querySelector("#date-picker-backdrop"),
  datePicker: document.querySelector("#date-picker"),
  datePickerClose: document.querySelector("#date-picker-close"),
  datePickerValue: document.querySelector("#date-picker-value span:last-child"),
  datePickerSave: document.querySelector("#date-picker-save"),
  timePickerOpen: document.querySelector("#time-picker-open"),
  timePickerLabel: document.querySelector("#time-picker-label"),
  timePickerClear: document.querySelector("#time-picker-clear"),
  timeDialogBackdrop: document.querySelector("#time-dialog-backdrop"),
  timeDialog: document.querySelector("#time-dialog"),
  timeDialogClose: document.querySelector("#time-dialog-close"),
  timeDialogCancel: document.querySelector("#time-dialog-cancel"),
  timeDialogSave: document.querySelector("#time-dialog-save"),
  timeDisplayHour: document.querySelector("#time-display-hour"),
  timeDisplayMinute: document.querySelector("#time-display-minute"),
  timeDial: document.querySelector("#time-dial"),
  timeDialOptions: document.querySelector("#time-dial-options"),
  calendarPrevious: document.querySelector("#calendar-previous"),
  calendarNext: document.querySelector("#calendar-next"),
  calendarMonth: document.querySelector("#calendar-month"),
  calendarGrid: document.querySelector("#calendar-grid"),
  todayWeekday: document.querySelector("#today-weekday"),
  tomorrowWeekday: document.querySelector("#tomorrow-weekday"),
  editor: document.querySelector("#task-editor"),
  detailFields: document.querySelector(".detail-fields"),
  taskListSelect: document.querySelector("#task-list-select"),
  taskListTrigger: document.querySelector("#task-list-trigger"),
  taskListValue: document.querySelector("#task-list-value"),
  taskListOptions: document.querySelector("#task-list-options"),
  desktopSaveTask: document.querySelector("#desktop-save-task"),
  detailToggle: document.querySelector("#detail-toggle"),
  editorBack: document.querySelector("#task-editor-back"),
  mainMenu: document.querySelector("#main-menu"),
  mainMenuOpen: document.querySelector("#main-menu-open"),
  navToday: document.querySelector("#nav-today"),
  navUpcoming: document.querySelector("#nav-upcoming"),
  navProjects: document.querySelector("#nav-projects"),
  navInbox: document.querySelector("#nav-inbox"),
  mainMenuClose: document.querySelector("#main-menu-close"),
  mainMenuNormalHeader: document.querySelector("#main-menu-normal-header"),
  mainMenuSelectionToolbar: document.querySelector("#main-menu-selection-toolbar"),
  mainMenuSelectionClose: document.querySelector("#main-menu-selection-close"),
  mainMenuSelectionCount: document.querySelector("#main-menu-selection-count"),
  mainMenuDeleteSelected: document.querySelector("#main-menu-delete-selected"),
  listSelectionDeleteBackdrop: document.querySelector("#list-selection-delete-backdrop"),
  listSelectionDeleteDialog: document.querySelector("#list-selection-delete-dialog"),
  listSelectionDeleteTitle: document.querySelector("#list-selection-delete-title"),
  listSelectionDeleteCancel: document.querySelector("#list-selection-delete-cancel"),
  listSelectionDeleteConfirm: document.querySelector("#list-selection-delete-confirm"),
  mainMenuLists: document.querySelector("#main-menu-lists"),
  mainMenuSwipeZone: document.querySelector("#main-menu-swipe-zone"),
  newListOpen: document.querySelector("#new-list-open"),
  newListForm: document.querySelector("#new-list-form"),
  newListTitle: document.querySelector("#new-list-title"),
  newListCancel: document.querySelector("#new-list-cancel"),
  settingsOpen: document.querySelector("#settings-open"),
  settingsScreen: document.querySelector("#settings-screen"),
  settingsClose: document.querySelector("#settings-close"),
  completedTasksOpen: document.querySelector("#completed-tasks-open"),
  completedTasksScreen: document.querySelector("#completed-tasks-screen"),
  completedTasksClose: document.querySelector("#completed-tasks-close"),
  completedTasksOverview: document.querySelector("#completed-tasks-overview"),
  completedTasksNewer: document.querySelector("#completed-tasks-newer"),
  completedTasksOlder: document.querySelector("#completed-tasks-older"),
  completedTasksRange: document.querySelector("#completed-tasks-range"),
  completedTasksEmpty: document.querySelector("#completed-tasks-empty"),
  completedTasksList: document.querySelector("#completed-tasks-list"),
  completedTaskDetail: document.querySelector("#completed-task-detail"),
  completedTaskDetailBack: document.querySelector("#completed-task-detail-back"),
  completedTaskDetailTitle: document.querySelector("#completed-task-detail-title"),
  completedTaskDetailMeta: document.querySelector("#completed-task-detail-meta"),
  completedTaskDetailDescription: document.querySelector("#completed-task-detail-description"),
  completedTaskRestore: document.querySelector("#completed-task-restore"),
  listEditorOpen: document.querySelector("#list-editor-open"),
  listEditor: document.querySelector("#list-editor"),
  listEditorClose: document.querySelector("#list-editor-close"),
  listEditorForm: document.querySelector("#list-editor-form"),
  listEditorName: document.querySelector("#list-editor-name"),
  listEditorError: document.querySelector("#list-editor-error"),
  listDeleteOpen: document.querySelector("#list-delete-open"),
  listDeleteConfirm: document.querySelector("#list-delete-confirm"),
  listDeleteCancel: document.querySelector("#list-delete-cancel"),
  listDeleteConfirmButton: document.querySelector("#list-delete-confirm-button"),
  systemThemeToggle: document.querySelector("#system-theme-toggle"),
  themeToggle: document.querySelector("#theme-toggle"),
  themeLabel: document.querySelector("#theme-label"),
  returnOverdueToggle: document.querySelector("#return-overdue-toggle"),
  startScreenSelect: document.querySelector("#start-screen-select"),
  backupExport: document.querySelector("#backup-export"),
  backupPrefix: document.querySelector("#backup-prefix"),
  backupDownloadLink: document.querySelector("#backup-download-link"),
  backupImportOpen: document.querySelector("#backup-import-open"),
  backupFile: document.querySelector("#backup-file"),
  backupLatest: document.querySelector("#backup-latest"),
  backupFolderChoose: document.querySelector("#backup-folder-choose"),
  backupFolderName: document.querySelector("#backup-folder-name"),
  backupFileList: document.querySelector("#backup-file-list"),
  backupStatus: document.querySelector("#backup-status"),
  backupPreview: document.querySelector("#backup-preview"),
  backupSummary: document.querySelector("#backup-summary"),
  backupMerge: document.querySelector("#backup-merge"),
  backupReplace: document.querySelector("#backup-replace"),
  backupCancel: document.querySelector("#backup-cancel"),
  listSwipeZone: document.querySelector("#list-swipe-zone"),
  currentListHeading: document.querySelector("#current-list-heading"),
  editorListLabel: document.querySelector("#editor-list-label"),
  editorListIcon: document.querySelector("#editor-list-icon"),
  add: document.querySelector("#add-task-btn"),
  list: document.querySelector("#task-list"),
  empty: document.querySelector("#empty-state"),
  count: document.querySelector("#task-count"),
  template: document.querySelector("#task-template"),
  toast: document.querySelector("#toast"),
  toastMessage: document.querySelector(".toast-message"),
  toastAction: document.querySelector("#toast-action")
};

const dateFormatter = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short" });
const fullDateFormatter = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("uk-UA", { weekday: "short" });
let toastTimer;
let toastAction;

function localDateValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function readableDate(value) {
  if (!value) return "Без дати";
  if (value === localDateValue()) return "Сьогодні";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (value === localDateValue(yesterday)) return "Вчора";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (value === localDateValue(tomorrow)) return "Завтра";
  return dateFormatter.format(new Date(`${value}T12:00:00`));
}

function dateTone(value, time = "") {
  if (!value) return "none";
  const today = localDateValue();
  if (value < today) return "overdue";
  if (value === today && time && new Date(`${value}T${time}:00`).getTime() < Date.now()) return "overdue";
  if (value === today) return "today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (value === localDateValue(tomorrow)) return "tomorrow";
  return "future";
}

function applyDateTone(element, value, time = "") {
  element.dataset.dateTone = dateTone(value, time);
  const icon = element.querySelector(".calendar-icon, .sun-icon");
  if (icon) icon.className = value === localDateValue() ? "sun-icon" : "calendar-icon";
}

function readableDueDate(date, time = "") {
  return `${readableDate(date)}${date && time ? ` · ${time}` : ""}`;
}

function renderTaskDueDate(element, task) {
  const hasDueDate = Boolean(task.dueDate);
  element.hidden = !hasDueDate;
  element.textContent = hasDueDate ? readableDueDate(task.dueDate, task.dueTime) : "";
  if (hasDueDate) applyDateTone(element, task.dueDate, task.dueTime);
  else delete element.dataset.dateTone;
}

function editorState() {
  return JSON.stringify({ title: els.input.value, description: els.description.value, dueDate: els.date.value, dueTime: els.time.value, listId: els.taskListSelect.value });
}

function rememberEditorState() {
  els.editor.dataset.initialState = editorState();
  updateDesktopSaveState();
}

function updateDesktopSaveState() {
  const editing = Boolean(els.editor.dataset.taskId);
  const hasTitle = Boolean(els.input.value.trim());
  const isDirty = els.editor.dataset.initialState !== editorState();
  els.desktopSaveTask.disabled = editing ? !isDirty : !hasTitle;
}

let editorCloseTimer;
let menuCloseTimer;
let menuOpenFrame;
let settingsCloseTimer;
let settingsOpenFrame;

function applyTheme(theme, { manualTheme = theme, useSystemTheme = false } = {}) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  const normalizedManualTheme = manualTheme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalizedTheme;
  els.systemThemeToggle.checked = useSystemTheme;
  els.themeToggle.disabled = useSystemTheme;
  els.themeToggle.checked = normalizedManualTheme === "dark";
  els.themeLabel.textContent = useSystemTheme
    ? `Системна · ${normalizedTheme === "dark" ? "нічна" : "денна"}`
    : normalizedManualTheme === "dark" ? "Нічна" : "Денна";
  els.themeToggle.setAttribute("aria-label", normalizedManualTheme === "dark" ? "Увімкнено нічну тему" : "Увімкнути нічну тему");
}

function taskCountsByList(tasks) {
  const counts = new Map();
  let todayCount = 0;
  const today = localDateValue();
  for (const task of visibleProjectTasks(tasks)) {
    if (isTaskCompleted(task)) continue;
    const listId = task.listId || INBOX_LIST_ID;
    counts.set(listId, (counts.get(listId) || 0) + 1);
    if (isTaskDueToday(task, today)) todayCount += 1;
  }
  counts.set(TODAY_LIST_ID, todayCount);
  return counts;
}

function renderMainMenuLists(lists, activeListId, selectedIds = new Set(), tasks = []) {
  const counts = taskCountsByList(tasks);
  els.mainMenuLists.classList.toggle("selection-mode", selectedIds.size > 0);
  els.mainMenuNormalHeader.hidden = selectedIds.size > 0;
  els.mainMenuSelectionToolbar.hidden = selectedIds.size === 0;
  els.mainMenuSelectionCount.textContent = `Вибрано: ${selectedIds.size}`;
  els.mainMenuLists.replaceChildren(...lists.map(list => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "main-menu-item";
    button.dataset.listId = list.id;
    button.dataset.listKind = list.kind;
    const active = list.id === activeListId;
    const selected = selectedIds.has(list.id);
    button.classList.toggle("active", active);
    button.classList.toggle("selected", selected);
    if (active) button.setAttribute("aria-current", "page");
    button.setAttribute("aria-selected", String(selected));
    const icon = document.createElement("span");
    icon.className = list.kind === "inbox" ? "inbox-icon" : list.kind === "today" ? "sun-icon" : "list-menu-icon";
    icon.setAttribute("aria-hidden", "true");
    const count = document.createElement("span");
    count.className = "main-menu-count";
    count.textContent = String(counts.get(list.id) || 0);
    count.setAttribute("aria-label", `Завдань: ${count.textContent}`);
    const label = document.createElement("span");
    label.className = "main-menu-label";
    label.textContent = displayListTitle(list);
    button.append(icon, count, label);
    return button;
  }));
}

function updateMainMenuTaskCounts(tasks) {
  const counts = taskCountsByList(tasks);
  for (const item of els.mainMenuLists.querySelectorAll("[data-list-id]")) {
    const count = item.querySelector(".main-menu-count");
    if (!count) continue;
    count.textContent = String(counts.get(item.dataset.listId) || 0);
    count.setAttribute("aria-label", `Завдань: ${count.textContent}`);
  }
}

function setActiveListUI(list) {
  const title = displayListTitle(list);
  els.currentListHeading.textContent = title;
  const primaryNav = list.kind === "today" ? "today" : list.kind === "inbox" ? "inbox" : "overview";
  els.mainMenuOpen.dataset.currentPrimaryNav = primaryNav;
  if (els.mainMenu.hidden) setActivePrimaryNav(primaryNav);
  els.editorListIcon.className = list.kind === "inbox" ? "inbox-icon" : list.kind === "today" ? "sun-icon" : "list-menu-icon";
  els.editorListLabel.textContent = title;
  els.listEditorOpen.hidden = list.kind !== "regular";
}

function setActivePrimaryNav(name) {
  for (const item of document.querySelectorAll(".bottom-nav [data-nav]")) {
    const active = item.dataset.nav === name;
    item.classList.toggle("active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  }
}

function createListDropdownOption(list) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "list-dropdown-option";
    option.dataset.listId = list.id;
    option.setAttribute("role", "option");
    const icon = document.createElement("span");
    icon.className = list.kind === "inbox" ? "inbox-icon" : "list-menu-icon";
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = displayListTitle(list);
    option.append(icon, label);
    return option;
}

function createListDropdownCreator(context) {
  const wrapper = document.createElement("span");
  wrapper.className = "list-dropdown-create";
  wrapper.dataset.listCreator = context;
  wrapper.setAttribute("role", "group");
  const open = document.createElement("button");
  open.type = "button";
  open.className = "list-dropdown-add";
  open.dataset.listCreateOpen = "";
  open.innerHTML = '<span class="list-dropdown-plus" aria-hidden="true">＋</span><span>Додати список</span>';
  const row = document.createElement("span");
  row.className = "list-dropdown-create-row";
  row.hidden = true;
  const input = document.createElement("input");
  input.className = "list-dropdown-create-input";
  input.type = "text";
  input.maxLength = 80;
  input.autocomplete = "off";
  input.setAttribute("aria-label", "Назва нового списку");
  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = "list-dropdown-create-submit";
  submit.dataset.listCreateSubmit = "";
  submit.setAttribute("aria-label", "Створити список");
  submit.textContent = "✓";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "list-dropdown-create-cancel";
  cancel.dataset.listCreateCancel = "";
  cancel.setAttribute("aria-label", "Скасувати створення списку");
  cancel.textContent = "×";
  row.append(input, submit, cancel);
  wrapper.append(open, row);
  return wrapper;
}

function showDropdownListCreator(container) {
  const creator = container.querySelector("[data-list-creator]");
  if (!creator) return;
  creator.querySelector("[data-list-create-open]").hidden = true;
  creator.querySelector(".list-dropdown-create-row").hidden = false;
  requestAnimationFrame(() => creator.querySelector(".list-dropdown-create-input").focus());
}

function hideDropdownListCreator(container, { returnFocus = true } = {}) {
  const creator = container.querySelector("[data-list-creator]");
  if (!creator) return;
  const input = creator.querySelector(".list-dropdown-create-input");
  input.value = "";
  creator.querySelector(".list-dropdown-create-row").hidden = true;
  const open = creator.querySelector("[data-list-create-open]");
  open.hidden = false;
  if (returnFocus) open.focus({ preventScroll: true });
}

function renderTaskListOptions(lists) {
  const selectedListId = els.taskListSelect.value;
  els.taskListOptions.replaceChildren(...lists.map(createListDropdownOption), createListDropdownCreator("task"));
  if (lists.some(list => list.id === selectedListId)) els.taskListSelect.value = selectedListId;
  setTaskEditorListUI(els.taskListSelect.value || lists[0]?.id);
}

function renderSelectedListOptions(lists, currentListId) {
  els.selectedListOptions.replaceChildren(...lists.map(createListDropdownOption), createListDropdownCreator("selection"));
  for (const option of els.selectedListOptions.children) {
    const selected = option.dataset.listId === currentListId;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-selected", String(selected));
  }
}

function closeSelectedListDropdown({ returnFocus = false } = {}) {
  els.selectedListOptions.hidden = true;
  els.listSelected.setAttribute("aria-expanded", "false");
  if (returnFocus) els.listSelected.focus({ preventScroll: true });
}

function openSelectedListDropdown() {
  els.selectedListOptions.hidden = false;
  els.listSelected.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => els.selectedListOptions.querySelector(".is-selected")?.focus({ preventScroll: true }));
}

function setTaskEditorListUI(listId) {
  const option = els.taskListOptions.querySelector(`[data-list-id="${CSS.escape(listId)}"]`);
  if (!option) return;
  els.taskListSelect.value = listId;
  const title = option.querySelector("span:nth-child(2)").textContent;
  const list = lists.find(item => item.id === listId);
  els.taskListValue.textContent = title;
  els.editorListIcon.className = list?.kind === "inbox" ? "inbox-icon" : list?.kind === "today" ? "sun-icon" : "list-menu-icon";
  els.editorListLabel.textContent = title;
  for (const item of els.taskListOptions.children) {
    const selected = item.dataset.listId === listId;
    item.classList.toggle("is-selected", selected);
    item.setAttribute("aria-selected", String(selected));
  }
}

function closeTaskListDropdown({ returnFocus = false } = {}) {
  els.taskListOptions.hidden = true;
  els.taskListTrigger.setAttribute("aria-expanded", "false");
  if (returnFocus) els.taskListTrigger.focus({ preventScroll: true });
}

function openTaskListDropdown() {
  els.taskListOptions.hidden = false;
  els.taskListTrigger.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => els.taskListOptions.querySelector(".is-selected")?.focus({ preventScroll: true }));
}

function showNewListForm() {
  els.newListForm.hidden = false;
  els.newListOpen.setAttribute("aria-expanded", "true");
  els.newListTitle.value = "";
  requestAnimationFrame(() => els.newListTitle.focus());
}

function hideNewListForm({ returnFocus = true } = {}) {
  els.newListForm.hidden = true;
  els.newListOpen.setAttribute("aria-expanded", "false");
  els.newListTitle.value = "";
  if (returnFocus) els.newListOpen.focus({ preventScroll: true });
}

function openMainMenu() {
  clearTimeout(menuCloseTimer);
  cancelAnimationFrame(menuOpenFrame);
  els.mainMenu.hidden = false;
  els.mainMenu.classList.remove("is-open");
  els.mainMenuOpen.setAttribute("aria-expanded", "true");
  setActivePrimaryNav("overview");
  document.body.classList.add("main-menu-open");
  menuOpenFrame = requestAnimationFrame(() => {
    menuOpenFrame = requestAnimationFrame(() => {
      els.mainMenu.classList.add("is-open");
      els.mainMenuClose.focus({ preventScroll: true });
    });
  });
  if (!mobileNavigationEnabled()) history.pushState({ mainMenu: true }, "");
}

function closeMainMenu({ fromHistory = false } = {}) {
  if (els.mainMenu.hidden) return;
  cancelAnimationFrame(menuOpenFrame);
  els.mainMenu.classList.remove("is-open");
  els.mainMenuOpen.setAttribute("aria-expanded", "false");
  setActivePrimaryNav(els.mainMenuOpen.dataset.currentPrimaryNav || "inbox");
  document.body.classList.remove("main-menu-open");
  menuCloseTimer = setTimeout(() => {
    els.mainMenu.hidden = true;
    hideNewListForm({ returnFocus: false });
    els.mainMenuOpen.focus();
  }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 240);
  if (!mobileNavigationEnabled() && !fromHistory && history.state?.mainMenu) history.back();
}

function openSettings() {
  clearTimeout(settingsCloseTimer);
  cancelAnimationFrame(settingsOpenFrame);
  els.settingsScreen.hidden = false;
  els.settingsScreen.classList.remove("is-open");
  els.settingsOpen.setAttribute("aria-expanded", "true");
  document.body.classList.add("settings-open");
  settingsOpenFrame = requestAnimationFrame(() => {
    settingsOpenFrame = requestAnimationFrame(() => {
      els.settingsScreen.classList.add("is-open");
      els.settingsClose.focus({ preventScroll: true });
    });
  });
  if (!mobileNavigationEnabled()) history.pushState({ settings: true }, "");
}

function closeSettings({ fromHistory = false } = {}) {
  if (els.settingsScreen.hidden) return;
  cancelAnimationFrame(settingsOpenFrame);
  els.settingsScreen.classList.remove("is-open");
  els.settingsOpen.setAttribute("aria-expanded", "false");
  document.body.classList.remove("settings-open");
  settingsCloseTimer = setTimeout(() => {
    els.settingsScreen.hidden = true;
    els.settingsOpen.focus({ preventScroll: true });
  }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 240);
  if (!mobileNavigationEnabled() && !fromHistory && history.state?.settings) history.back();
}

function hideToast() {
  clearTimeout(toastTimer);
  toastAction = null;
  els.toast.classList.remove("show", "undoable");
}

function toast(message, options = {}) {
  clearTimeout(toastTimer);
  toastAction = options.action || null;
  els.toastMessage.textContent = message;
  els.toast.classList.remove("show", "undoable");
  void els.toast.offsetWidth;
  if (toastAction) {
    els.toast.classList.add("undoable");
    els.toast.style.setProperty("--toast-duration", `${options.duration || 3000}ms`);
  }
  els.toast.classList.add("show");
  toastTimer = setTimeout(hideToast, options.duration || 1800);
}

els.toastAction.addEventListener("click", async () => {
  const action = toastAction;
  hideToast();
  if (action) await action();
});

function renderTasks(tasks, selectedIds = new Set(), taskLists = [], taskProjects = [], contextList = null) {
  const active = tasks.filter(task => !isTaskCompleted(task));
  const selectionMode = selectedIds.size > 0;
  els.shell.classList.toggle("selection-active", selectionMode);
  els.normalHeader.hidden = selectionMode;
  els.selectionToolbar.hidden = !selectionMode;
  els.selectionCount.textContent = `Вибрано: ${selectedIds.size}`;
  const allSelected = active.length > 0 && active.every(task => selectedIds.has(task.id));
  els.selectAllTasks.setAttribute("aria-pressed", String(allSelected));
  els.selectAllTasks.setAttribute("aria-label", allSelected ? "Зняти вибір з усіх завдань" : "Вибрати всі завдання");
  els.list.classList.toggle("selection-mode", selectionMode);
  els.list.replaceChildren(...active.map(task => {
    const row = els.template.content.firstElementChild.cloneNode(true);
    row.dataset.id = task.id;
    const selected = selectedIds.has(task.id);
    row.classList.toggle("selected", selected);
    row.setAttribute("aria-selected", String(selected));
    row.querySelector(".task-text").textContent = task.title;
    const description = task.description?.trim();
    const preview = row.querySelector(".task-description-preview");
    preview.hidden = !description;
    preview.textContent = description || "";
    const taskDate = row.querySelector(".task-date");
    renderTaskDueDate(taskDate, task);
    const taskProject = taskProjects.find(project => project.id === task.projectId);
    const projectBadge = row.querySelector(".task-project");
    projectBadge.hidden = !taskProject;
    row.querySelector(".task-project-name").textContent = taskProject?.title || "";
    const taskList = taskLists.find(list => list.id === (task.listId || INBOX_LIST_ID))
      || taskLists.find(list => list.kind === "inbox");
    const taskListBadge = row.querySelector(".task-list");
    const showTaskList = contextList?.kind !== "regular" || taskList?.id !== contextList.id;
    taskListBadge.hidden = !showTaskList;
    row.querySelector(".task-list-name").textContent = displayListTitle(taskList);
    const taskListIcon = taskListBadge.querySelector(".inbox-icon");
    taskListIcon.className = taskList?.kind === "regular" ? "list-menu-icon" : "inbox-icon";
    row.querySelector(".task-meta-primary").hidden = !task.dueDate && !showTaskList;
    row.querySelector(".task-meta").hidden = !task.dueDate && !taskProject && !showTaskList;
    row.querySelector(".task-open").setAttribute("aria-label", `Відкрити деталі: ${task.title}`);
    return row;
  }));
  els.list.hidden = active.length === 0;
  els.empty.hidden = active.length > 0;
  els.count.textContent = selectionMode
    ? `Вибрано: ${selectedIds.size}`
    : `${active.length} ${active.length === 1 ? "задача" : active.length > 1 && active.length < 5 ? "задачі" : "задач"}`;
}

function showTaskEditor() {
  clearTimeout(editorCloseTimer);
  els.shell.hidden = true;
  els.editor.hidden = false;
  els.editor.classList.remove("is-closing");
  document.body.classList.add("task-editor-open");
  els.editor.scrollTop = 0;
}

function hideTaskEditor() {
  els.shell.hidden = false;
  document.body.classList.remove("task-editor-open");
  window.scrollTo(0, 0);
  els.editor.classList.add("is-closing");
  clearTimeout(editorCloseTimer);
  editorCloseTimer = setTimeout(() => {
    els.editor.hidden = true;
    els.editor.classList.remove("is-closing");
  }, 180);
}

function resizeDescription() {
  els.description.style.height = "auto";
  const maxHeight = Math.min(window.innerHeight * 0.58, 620);
  els.description.style.height = `${Math.min(els.description.scrollHeight, maxHeight)}px`;
}

function resizeTaskTitle() {
  els.input.style.height = "auto";
  els.input.style.height = `${els.input.scrollHeight}px`;
  els.input.scrollTop = 0;
}

function openNewTaskEditor(listId, originListId = listId) {
  els.editor.classList.remove("detail-mode");
  els.editor.dataset.taskId = "";
  els.editor.dataset.originListId = originListId;
  els.form.reset();
  els.detailFields.hidden = false;
  els.detailToggle.hidden = true;
  els.taskProjectLink.hidden = true;
  els.taskConvertProject.hidden = true;
  els.taskDetachProject.hidden = true;
  delete els.taskProjectLink.dataset.projectId;
  setTaskEditorListUI(listId);
  els.date.value = originListId === TODAY_LIST_ID ? localDateValue() : "";
  els.time.value = "";
  els.dateLabel.textContent = readableDueDate(els.date.value);
  applyDateTone(els.datePickerOpen, els.date.value, els.time.value);
  rememberEditorState();
  showTaskEditor();
  requestAnimationFrame(() => { resizeTaskTitle(); resizeDescription(); els.input.focus(); });
}

function openTaskDetails(task) {
  els.editor.classList.add("detail-mode");
  els.editor.dataset.taskId = task.id;
  delete els.editor.dataset.originListId;
  els.form.reset();
  els.detailFields.hidden = false;
  els.detailToggle.hidden = false;
  const project = projects.find(item => item.id === task.projectId);
  els.taskProjectLink.hidden = !project;
  els.taskConvertProject.hidden = task.status !== "active" || Boolean(task.projectId);
  els.taskDetachProject.hidden = task.status !== "active" || !project;
  els.taskProjectLink.dataset.projectId = project?.id || "";
  els.taskProjectValue.textContent = project?.title || "";
  setTaskEditorListUI(task.listId || INBOX_LIST_ID);
  els.input.value = task.title;
  els.description.value = task.description || "";
  els.date.value = task.dueDate || "";
  els.time.value = task.dueDate ? (task.dueTime || "") : "";
  els.dateLabel.textContent = readableDueDate(task.dueDate, task.dueTime);
  applyDateTone(els.datePickerOpen, els.date.value, els.time.value);
  rememberEditorState();
  showTaskEditor();
  requestAnimationFrame(() => {
    resizeTaskTitle();
    resizeDescription();
  });
}
