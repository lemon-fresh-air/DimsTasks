const els = {
  shell: document.querySelector(".app-shell"),
  normalHeader: document.querySelector("#normal-header"),
  selectionToolbar: document.querySelector("#selection-toolbar"),
  selectionClose: document.querySelector("#selection-close"),
  selectionCount: document.querySelector("#selection-count"),
  selectionControls: document.querySelector("#selection-controls"),
  selectAllTasks: document.querySelector("#select-all-tasks"),
  dateSelected: document.querySelector("#date-selected"),
  listSelected: document.querySelector("#list-selected"),
  selectedListOptions: document.querySelector("#selected-list-options"),
  deleteSelected: document.querySelector("#delete-selected"),
  groupSelected: document.querySelector("#group-selected"),
  selectedGroupActions: document.querySelector("#selected-group-actions"),
  renameSelectedGroup: document.querySelector("#rename-selected-group"),
  deleteSelectedGroup: document.querySelector("#delete-selected-group"),
  recolorSelectedGroup: document.querySelector("#recolor-selected-group"),
  todayGroupRecolorBackdrop: document.querySelector("#today-group-recolor-backdrop"),
  todayGroupRecolorDialog: document.querySelector("#today-group-recolor-dialog"),
  todayGroupRecolorOptions: document.querySelector("#today-group-recolor-options"),
  todayGroupRecolorCancel: document.querySelector("#today-group-recolor-cancel"),
  todayGroupMergeBackdrop: document.querySelector("#today-group-merge-backdrop"),
  todayGroupMergeDialog: document.querySelector("#today-group-merge-dialog"),
  todayGroupMergeOptions: document.querySelector("#today-group-merge-options"),
  todayGroupMergeCancel: document.querySelector("#today-group-merge-cancel"),
  todayGroupDeleteBackdrop: document.querySelector("#today-group-delete-backdrop"),
  todayGroupDeleteDialog: document.querySelector("#today-group-delete-dialog"),
  todayGroupDeleteTitle: document.querySelector("#today-group-delete-title"),
  todayGroupDeleteKeepTasks: document.querySelector("#today-group-delete-keep-tasks"),
  todayGroupDeleteNo: document.querySelector("#today-group-delete-no"),
  todayGroupDeleteYes: document.querySelector("#today-group-delete-yes"),
  taskRestoreGroupBackdrop: document.querySelector("#task-restore-group-backdrop"),
  taskRestoreGroupDialog: document.querySelector("#task-restore-group-dialog"),
  taskRestoreGroupTitle: document.querySelector("#task-restore-group-title"),
  taskRestoreWithoutGroup: document.querySelector("#task-restore-without-group"),
  taskRestoreToGroup: document.querySelector("#task-restore-to-group"),
  todayGroupRenameBackdrop: document.querySelector("#today-group-rename-backdrop"),
  todayGroupRenameDialog: document.querySelector("#today-group-rename-dialog"),
  todayGroupRenameForm: document.querySelector("#today-group-rename-form"),
  todayGroupRenameInput: document.querySelector("#today-group-rename-input"),
  todayGroupRenameError: document.querySelector("#today-group-rename-error"),
  todayGroupRenameCancel: document.querySelector("#today-group-rename-cancel"),
  todayOrderHint: document.querySelector("#today-order-hint"),
  todayGroupBackdrop: document.querySelector("#today-group-backdrop"),
  todayGroupDialog: document.querySelector("#today-group-dialog"),
  todayGroupOptions: document.querySelector("#today-group-options"),
  todayGroupCancel: document.querySelector("#today-group-cancel"),
  quickTaskBackdrop: document.querySelector("#quick-task-backdrop"),
  quickTaskForm: document.querySelector("#quick-task-form"),
  quickTaskTitle: document.querySelector("#quick-task-title"),
  quickTaskDescription: document.querySelector("#quick-task-description"),
  quickTaskCancel: document.querySelector("#quick-task-cancel"),
  form: document.querySelector("#task-form"),
  input: document.querySelector("#task-title"),
  description: document.querySelector("#task-description"),
  savedSteps: document.querySelector("#task-saved-steps"),
  savedStepsTitle: document.querySelector("#task-saved-steps-title"),
  savedStepsList: document.querySelector("#task-saved-steps-list"),
  taskProjectLink: document.querySelector("#task-project-link"),
  taskProjectRow: document.querySelector("#task-project-row"),
  taskProjectTrigger: document.querySelector("#task-project-trigger"),
  taskProjectOptions: document.querySelector("#task-project-options"),
  taskAttachProject: document.querySelector("#task-attach-project"),
  taskAttachDialogBackdrop: document.querySelector("#task-attach-dialog-backdrop"),
  taskAttachDialog: document.querySelector("#task-attach-dialog"),
  taskAttachProjectTrigger: document.querySelector("#task-attach-project-trigger"),
  taskAttachProjectValue: document.querySelector("#task-attach-project-value"),
  taskAttachProjectOptions: document.querySelector("#task-attach-project-options"),
  taskAttachCancel: document.querySelector("#task-attach-cancel"),
  taskAttachConfirm: document.querySelector("#task-attach-confirm"),
  taskConvertProject: document.querySelector("#task-convert-project"),
  taskConvertStepsCount: document.querySelector("#task-convert-steps-count"),
  taskDetachProject: document.querySelector("#task-detach-project"),
  taskActionsTrigger: document.querySelector("#task-actions-trigger"),
  taskAddToday: document.querySelector("#task-add-today"),
  taskActionsMenu: document.querySelector("#task-actions-menu"),
  taskDelete: document.querySelector("#task-delete"),
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
  taskListLink: document.querySelector("#task-list-link"),
  taskListValue: document.querySelector("#task-list-value"),
  taskListOptions: document.querySelector("#task-list-options"),
  taskSectionRow: document.querySelector("#task-section-row"),
  taskProjectSectionRow: document.querySelector("#task-project-section-row"),
  taskProjectSectionSelect: document.querySelector("#task-project-section-select"),
  taskSectionSelect: document.querySelector("#task-section-select"),
  taskSectionTrigger: document.querySelector("#task-section-trigger"),
  taskSectionValue: document.querySelector("#task-section-value"),
  taskSectionOptions: document.querySelector("#task-section-options"),
  desktopSaveTask: document.querySelector("#desktop-save-task"),
  detailToggle: document.querySelector("#detail-toggle"),
  editorBack: document.querySelector("#task-editor-back"),
  mainMenu: document.querySelector("#main-menu"),
  mainMenuOpen: document.querySelector("#main-menu-open"),
  navToday: document.querySelector("#nav-today"),
  daySwitch: document.querySelector("#day-switch"),
  dayChangeBackdrop: document.querySelector("#day-change-backdrop"),
  dayChangeConfirm: document.querySelector("#day-change-confirm"),
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
  checkAppUpdate: document.querySelector("#check-app-update"),
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
  projectPreviewToggle: document.querySelector("#project-preview-toggle"),
  todayTaskCreationSelect: document.querySelector("#today-task-creation-select"),
  startScreenSelect: document.querySelector("#start-screen-select"),
  calendarRangeSelect: document.querySelector("#calendar-range-select"),
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
function renderTaskTodayIndicator(element, task) {
  element.hidden = task.status !== "active" || task.addedToTodayDate !== localDateValue();
}

function editorState() {
  return JSON.stringify({ title: els.input.value, description: els.description.value, dueDate: els.date.value, dueTime: els.time.value, listId: els.taskListSelect.value, sectionId: els.taskSectionSelect.value, projectSectionId: els.taskProjectSectionSelect.value });
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
  for (const task of visibleProjectTasks(tasks, projects)) {
    if (isTaskCompleted(task)) continue;
    const listId = task.listId || INBOX_LIST_ID;
    counts.set(listId, (counts.get(listId) || 0) + 1);
    if (isTaskInDayPlan(task, today, today)) todayCount += 1;
  }
  counts.set(TODAY_LIST_ID, todayCount);
  counts.set(TOMORROW_LIST_ID, visibleProjectTasks(tasks, projects).filter(task => isTaskDueToday(task, nextLocalDate())).length);
  return counts;
}

function appendSearchHighlight(container, text, matches, start = 0, end = text.length) {
  let offset = start;
  for (const match of [...matches].sort((a, b) => a.start - b.start)) {
    const from = Math.max(offset, match.start);
    const to = Math.min(end, match.end);
    if (from >= to) continue;
    container.append(text.slice(offset, from));
    const highlight = document.createElement("mark");
    highlight.textContent = text.slice(from, to);
    container.append(highlight);
    offset = to;
  }
  container.append(text.slice(offset, end));
}

function searchControl(action, text, label = text, iconClass) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.searchAction = action;
  button.textContent = text;
  button.setAttribute("aria-label", label);
  if (iconClass) {
    const icon = document.createElement("span");
    icon.className = iconClass;
    icon.setAttribute("aria-hidden", "true");
    button.prepend(icon);
  }
  return button;
}

function taskTodayActionLabel(manuallyToday, dueToday) {
  if (!manuallyToday) return "Додати до «Сьогодні»";
  return dueToday ? "Зняти ручне додавання" : "Прибрати зі «Сьогодні»";
}

function renderSearchResult({ entry, titleMatches, descriptionMatches }) {
  const row = document.createElement("li");
  row.className = "global-search-result";
  row.dataset.searchKey = `${entry.type}:${entry.id}`;
  const open = searchControl("open", "", entry.title);
  open.className = "global-search-open";
  const title = document.createElement("strong");
  appendSearchHighlight(title, entry.title, titleMatches);
  const meta = document.createElement("span");
  meta.className = "global-search-meta";
  meta.textContent = entry.meta;
  if (entry.manuallyToday) {
    const sun = document.createElement("span");
    sun.className = "task-today-indicator sun-icon";
    sun.setAttribute("role", "img");
    sun.setAttribute("aria-label", "Додано до «Сьогодні»");
    meta.append(sun);
  }
  open.append(title, meta);
  open.setAttribute("aria-label", [entry.title, entry.meta, entry.manuallyToday ? "Додано до «Сьогодні»" : null].filter(Boolean).join(" · "));
  if (entry.type === "task" && !entry.completed) {
    const toggle = searchControl("complete", "", "Виконати завдання");
    toggle.className = "toggle";
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    toggle.append(icon);
    row.append(toggle);
  }
  row.append(open);

  if (entry.type === "task") {
    const actions = document.createElement("div");
    actions.className = "global-search-actions";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "global-search-more-actions";
    trigger.textContent = "⋯";
    trigger.setAttribute("aria-label", "Дії із завданням");
    const menu = document.createElement("div");
    menu.className = "global-search-action-menu";
    menu.setAttribute("popover", "auto");
    trigger.popoverTargetElement = menu;
    if (!entry.completed) {
      const label = taskTodayActionLabel(entry.manuallyToday, entry.dueToday);
      menu.append(searchControl(entry.manuallyToday ? "remove-today" : "add-today", label, label, "sun-icon"));
    }
    if (entry.canMoveList) {
      const label = "Перемістити в інший список";
      menu.append(searchControl("pick-list", label, label, "inbox-icon"));
    }
    if (entry.canMoveProject) {
      const label = entry.projectId ? "Перемістити до проєкту" : "Додати до проєкту";
      menu.append(searchControl("pick-project", label, label, "projects-icon"));
    }
    menu.append(searchControl("delete", "Видалити", "Видалити", "trash-icon"));
    menu.addEventListener("beforetoggle", event => {
      if (event.newState !== "open") return;
      const anchor = trigger.getBoundingClientRect();
      const bounds = row.closest("dialog").getBoundingClientRect();
      menu.style.right = `${document.documentElement.clientWidth - anchor.right}px`;
      const height = 16 + menu.childElementCount * 50;
      const openAbove = anchor.bottom + height > bounds.bottom && anchor.top - bounds.top > bounds.bottom - anchor.bottom;
      menu.style.top = `${openAbove ? anchor.top - 6 : anchor.bottom + 6}px`;
      menu.classList.toggle("opens-above", openAbove);
    });
    actions.append(trigger, menu);
    row.append(actions);
  }
  if (entry.description) {
    const preview = document.createElement("details");
    preview.className = "global-search-preview";
    const summary = document.createElement("summary");
    summary.textContent = "Опис";
    const description = document.createElement("p");
    appendSearchHighlight(description, entry.description, descriptionMatches);
    if (descriptionMatches.length) {
      const excerpt = document.createElement("span");
      excerpt.className = "global-search-meta";
      const firstMatch = Math.min(...descriptionMatches.map(match => match.start));
      const start = Math.max(0, firstMatch - 24);
      const end = Math.min(entry.description.length, firstMatch + 68);
      if (start) excerpt.append("…");
      appendSearchHighlight(excerpt, entry.description, descriptionMatches, start, end);
      if (end < entry.description.length) excerpt.append("…");
      open.append(excerpt);
    }
    preview.append(summary, description);
    row.append(preview);
  }
  return row;
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
    icon.className = list.kind === "inbox" ? "inbox-icon" : list.id === TOMORROW_LIST_ID ? "calendar-icon" : list.kind === "today" ? "sun-icon" : "list-menu-icon";
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
  for (const [selector, listId] of [["#nav-today", TODAY_LIST_ID], ["#nav-inbox", INBOX_LIST_ID]]) {
    const count = document.querySelector(`${selector} .desktop-primary-count`);
    count.textContent = String(counts.get(listId) || 0);
    count.setAttribute("aria-label", `Завдань: ${count.textContent}`);
  }
  for (const item of els.mainMenuLists.querySelectorAll("[data-list-id]")) {
    const count = item.querySelector(".main-menu-count");
    if (!count) continue;
    count.textContent = String(counts.get(item.dataset.listId) || 0);
    count.setAttribute("aria-label", `Завдань: ${count.textContent}`);
  }
  for (const item of document.querySelectorAll("#desktop-nav-lists [data-list-id]")) {
    const count = item.querySelector(".desktop-list-count");
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
  for (const item of document.querySelectorAll("#desktop-nav-lists [data-list-id]")) {
    const active = name === "overview" && item.dataset.listId === activeListId;
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

function createListDropdownSearch() {
  const row = document.createElement("span");
  row.className = "list-dropdown-search-row";
  const input = document.createElement("input");
  input.type = "search";
  input.className = "list-dropdown-search";
  input.placeholder = "Пошук списку";
  input.setAttribute("aria-label", "Пошук списку");
  input.autocomplete = "off";
  input.addEventListener("input", () => {
    const container = row.parentElement;
    container.querySelectorAll(".list-dropdown-keyboard-active").forEach(option => option.classList.remove("list-dropdown-keyboard-active"));
    const query = input.value.trim().toLocaleLowerCase("uk-UA");
    const options = container.querySelectorAll("[data-list-id]");
    let visible = 0;
    for (const option of options) {
      option.hidden = !option.textContent.toLocaleLowerCase("uk-UA").includes(query);
      if (!option.hidden) visible++;
    }
    container.querySelector(".list-dropdown-empty").hidden = visible > 0;
  });
  input.addEventListener("keydown", event => {
    if (!["ArrowDown", "ArrowUp", "Enter"].includes(event.key) || event.isComposing) return;
    const options = [...row.parentElement.querySelectorAll("[data-list-id]")].filter(option => !option.hidden);
    if (!options.length) return;
    event.preventDefault();
    event.stopPropagation();
    const current = options.findIndex(option => option.classList.contains("list-dropdown-keyboard-active"));
    if (event.key === "Enter") {
      (options[current < 0 ? 0 : current]).click();
      return;
    }
    const next = current < 0 ? event.key === "ArrowDown" ? 0 : options.length - 1
      : (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    options.forEach(option => option.classList.remove("list-dropdown-keyboard-active"));
    options[next].classList.add("list-dropdown-keyboard-active");
    options[next].scrollIntoView({ block: "nearest" });
  });
  input.addEventListener("focus", () => positionListDropdownForKeyboard(row.parentElement));
  const back = document.createElement("button");
  back.type = "button";
  back.className = "list-dropdown-search-back";
  back.setAttribute("aria-label", "Назад до завдань");
  back.innerHTML = '<span aria-hidden="true">←</span>';
  back.addEventListener("click", () => {
    const container = row.parentElement;
    if (container === els.selectedListOptions) closeSelectedListDropdown();
    else if (container === els.taskListOptions) closeTaskListDropdown();
    else {
      resetListDropdownKeyboard(container);
      container.hidden = true;
      projectEls.listSelected.setAttribute("aria-expanded", "false");
    }
  });
  const empty = document.createElement("span");
  empty.className = "list-dropdown-empty";
  empty.textContent = "Списків не знайдено";
  empty.hidden = true;
  row.append(back, input);
  return [row, empty];
}

function positionListDropdownForKeyboard(container) {
  if (matchMedia("(min-width: 760px)").matches || container.hidden) return;
  const viewport = window.visualViewport;
  const top = (viewport?.offsetTop || 0) + 8;
  const height = (viewport?.height || window.innerHeight) - 16;
  container.style.setProperty("--list-search-top", `${top}px`);
  container.style.setProperty("--list-search-height", `${Math.max(120, height)}px`);
  container.classList.add("list-dropdown-keyboard");
}

function resetListDropdownKeyboard(container) {
  container.classList.remove("list-dropdown-keyboard");
  container.querySelector(".list-dropdown-search")?.blur();
}

window.visualViewport?.addEventListener("resize", () => document.querySelectorAll(".list-dropdown-keyboard").forEach(positionListDropdownForKeyboard));
window.visualViewport?.addEventListener("scroll", () => document.querySelectorAll(".list-dropdown-keyboard").forEach(positionListDropdownForKeyboard));

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
  const selectedSectionId = els.taskSectionSelect.value;
  els.taskListOptions.replaceChildren(...createListDropdownSearch(), ...lists.map(createListDropdownOption), createListDropdownCreator("task"));
  for (const option of els.taskListOptions.querySelectorAll("[data-list-id]")) {
    if (sections.some(section => section.listId === option.dataset.listId))
      option.querySelector("span:nth-child(2)").textContent += "…";
  }
  if (lists.some(list => list.id === selectedListId)) els.taskListSelect.value = selectedListId;
  setTaskEditorListUI(els.taskListSelect.value || lists[0]?.id);
  setTaskEditorSectionUI(els.taskListSelect.value, selectedSectionId);
}

function selectedTasksListId(tasks, selectedIds) {
  const selected = tasks.filter(task => selectedIds.has(task.id));
  return selected.length && selected.every(task => task.listId === selected[0].listId)
    ? selected[0].listId : null;
}

function renderSelectedListOptions(lists, currentListId) {
  els.selectedListOptions.replaceChildren(...createListDropdownSearch(), ...lists.map(createListDropdownOption), createListDropdownCreator("selection"));
  for (const option of els.selectedListOptions.querySelectorAll("[data-list-id]")) {
    const selected = option.dataset.listId === currentListId;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-selected", String(selected));
  }
}

function closeSelectedListDropdown({ returnFocus = false } = {}) {
  resetListDropdownKeyboard(els.selectedListOptions);
  els.selectedListOptions.hidden = true;
  els.listSelected.setAttribute("aria-expanded", "false");
  if (returnFocus) els.listSelected.focus({ preventScroll: true });
}

function openSelectedListDropdown() {
  els.selectedListOptions.hidden = false;
  els.listSelected.setAttribute("aria-expanded", "true");
  if (matchMedia("(max-width: 759px)").matches) {
    positionListDropdownForKeyboard(els.selectedListOptions);
    requestAnimationFrame(() => els.selectedListOptions.querySelector(".list-dropdown-search")?.focus({ preventScroll: true }));
  } else requestAnimationFrame(() => els.selectedListOptions.querySelector(".is-selected")?.focus({ preventScroll: true }));
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
  for (const item of els.taskListOptions.querySelectorAll("[data-list-id]")) {
    const selected = item.dataset.listId === listId;
    item.classList.toggle("is-selected", selected);
    item.setAttribute("aria-selected", String(selected));
  }
  setTaskEditorSectionUI(listId, null);
}

function setTaskEditorSectionUI(listId, sectionId) {
  const available = sections.filter(section => section.listId === listId)
    .sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  els.taskSectionRow.hidden = available.length === 0;
  els.taskSectionOptions.hidden = true;
  els.taskSectionTrigger.setAttribute("aria-expanded", "false");
  const chosen = available.find(section => section.id === sectionId);
  els.taskSectionSelect.value = chosen?.id || "";
  els.taskSectionValue.textContent = chosen?.title || "Без секції";
  els.taskSectionOptions.replaceChildren(...[["", "Без секції"], ...available.map(section => [section.id, section.title])].map(([id, title]) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "list-dropdown-option";
    option.dataset.sectionId = id;
    option.setAttribute("role", "option");
    option.classList.toggle("is-selected", id === els.taskSectionSelect.value);
    option.setAttribute("aria-selected", String(id === els.taskSectionSelect.value));
    const icon = document.createElement("span");
    icon.className = "list-menu-icon";
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = title;
    option.append(icon, label);
    return option;
  }));
}

function openTaskSectionDropdown() {
  els.taskSectionOptions.hidden = false;
  els.taskSectionTrigger.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => els.taskSectionOptions.querySelector(".is-selected")?.focus({ preventScroll: true }));
}

function closeTaskSectionDropdown({ returnFocus = false } = {}) {
  els.taskSectionOptions.hidden = true;
  els.taskSectionTrigger.setAttribute("aria-expanded", "false");
  if (returnFocus) els.taskSectionTrigger.focus({ preventScroll: true });
}

function closeTaskListDropdown({ returnFocus = false } = {}) {
  resetListDropdownKeyboard(els.taskListOptions);
  els.taskListOptions.hidden = true;
  els.taskListTrigger.setAttribute("aria-expanded", "false");
  if (returnFocus) els.taskListTrigger.focus({ preventScroll: true });
}

function openTaskListDropdown() {
  closeTaskSectionDropdown();
  els.taskListOptions.hidden = false;
  els.taskListTrigger.setAttribute("aria-expanded", "true");
  if (matchMedia("(max-width: 759px)").matches) {
    positionListDropdownForKeyboard(els.taskListOptions);
    requestAnimationFrame(() => els.taskListOptions.querySelector(".list-dropdown-search")?.focus({ preventScroll: true }));
  } else requestAnimationFrame(() => els.taskListOptions.querySelector(".is-selected")?.focus({ preventScroll: true }));
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
  document.querySelector("#desktop-settings-open").setAttribute("aria-expanded", "true");
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
  document.querySelector("#desktop-settings-open").setAttribute("aria-expanded", "false");
  document.body.classList.remove("settings-open");
  settingsCloseTimer = setTimeout(() => {
    els.settingsScreen.hidden = true;
    (matchMedia("(min-width: 760px)").matches && els.mainMenu.hidden
      ? document.querySelector("#desktop-settings-open") : els.settingsOpen).focus({ preventScroll: true });
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

function renderTasks(tasks, selectedIds = new Set(), taskLists = [], taskProjects = [], contextList = null, layout = null, selectedGroupIds = new Set(), listSections = []) {
  const active = tasks.filter(task => !isTaskCompleted(task));
  const groupSelection = selectedGroupIds.size > 0;
  const selectionMode = selectedIds.size > 0 || groupSelection;
  const groupedToday = contextList?.kind === "today" && layout?.groups?.length > 0;
  const animateSelectionShift = groupedToday && selectionMode !== els.list.classList.contains("selection-mode")
    && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const taskSection = animateSelectionShift ? els.list.closest(".task-section") : null;
  const previousSectionTop = taskSection?.getBoundingClientRect().top;
  taskSection?.getAnimations().forEach(animation => animation.cancel());
  els.shell.classList.toggle("selection-active", selectionMode);
  els.normalHeader.hidden = selectionMode;
  els.selectionToolbar.hidden = !selectionMode;
  els.selectionCount.textContent = groupSelection ? `Вибрано груп: ${selectedGroupIds.size}` : `Вибрано: ${selectedIds.size}`;
  els.selectionControls.hidden = groupSelection;
  els.selectedGroupActions.hidden = !groupSelection;
  els.renameSelectedGroup.disabled = selectedGroupIds.size !== 1;
  els.recolorSelectedGroup.disabled = selectedGroupIds.size !== 1;
  els.groupSelected.hidden = contextList?.kind !== "today" || !selectedIds.size;
  els.todayOrderHint.hidden = !groupedToday || !selectionMode;
  const allSelected = active.length > 0 && active.every(task => selectedIds.has(task.id));
  els.selectAllTasks.setAttribute("aria-pressed", String(allSelected));
  els.selectAllTasks.setAttribute("aria-label", allSelected ? "Зняти вибір з усіх завдань" : "Вибрати всі завдання");
  els.list.classList.toggle("selection-mode", selectionMode);
  const rows = new Map(active.map(task => {
    const row = els.template.content.firstElementChild.cloneNode(true);
    row.dataset.id = task.id;
    row.querySelector(".today-reveal span:last-child").textContent = task.addedToTodayDate === localDateValue()
      ? task.dueDate === localDateValue() ? "Зняти сонце" : "Із «Сьогодні»" : "До «Сьогодні»";
    const selected = selectedIds.has(task.id);
    row.classList.toggle("selected", selected);
    row.setAttribute("aria-selected", String(selected));
    row.querySelector(".task-text").textContent = task.title;
    const description = task.description?.trim();
    const preview = row.querySelector(".task-description-preview");
    const checklist = [...(description || "").matchAll(/^\s*[-*+] \[([ xX])\](?: |$)/gm)];
    const note = (description || "").split("\n").filter(line => !/^\s*[-*+] \[[ xX]\](?: |$)/.test(line)).join("\n").trim();
    preview.hidden = !note;
    preview.textContent = note ? richPreviewText(note) : "";
    const progress = row.querySelector(".task-checklist-progress");
    progress.hidden = checklist.length === 0;
    progress.querySelector(".task-checklist-count").textContent = `${checklist.filter(match => match[1].toLowerCase() === "x").length}/${checklist.length}`;
    const taskDate = row.querySelector(".task-date");
    renderTaskDueDate(taskDate, task);
    renderTaskTodayIndicator(row.querySelector(".task-today-indicator"), task);
    const taskProject = taskProjects.find(project => project.id === task.projectId);
    const projectBadge = row.querySelector(".task-project");
    projectBadge.hidden = !taskProject;
    row.querySelector(".task-project-name").textContent = taskProject?.title || "";
    const taskList = taskLists.find(list => list.id === (task.listId || INBOX_LIST_ID))
      || taskLists.find(list => list.kind === "inbox");
    const taskListBadge = row.querySelector(".task-list");
    const showTaskList = contextList?.kind !== "regular" || taskList?.id !== contextList.id;
    taskListBadge.hidden = !showTaskList;
    const taskSection = contextList?.kind === "today" && taskList?.kind === "regular"
      ? listSections.find(section => section.id === task.sectionId && section.listId === taskList.id) : null;
    const listLabel = `${displayListTitle(taskList)}${taskSection ? ` / ${taskSection.title}` : ""}`;
    row.querySelector(".task-list-name").textContent = listLabel;
    taskListBadge.title = listLabel;
    const taskListIcon = taskListBadge.querySelector(".inbox-icon");
    taskListIcon.className = taskList?.kind === "regular" ? "list-menu-icon" : "inbox-icon";
    const manualToday = task.status === "active" && task.addedToTodayDate === localDateValue();
    row.querySelector(".task-meta-primary").hidden = !task.dueDate && !manualToday && !showTaskList;
    row.querySelector(".task-meta").hidden = !task.dueDate && !manualToday && !taskProject && !showTaskList;
    row.querySelector(".task-open").setAttribute("aria-label", `Відкрити деталі: ${task.title}`);
    return [task.id, row];
  }));
  if (groupedToday) {
    const groups = new Map(layout.groups.map(group => [group.id, group]));
    const placedIds = new Set(layout.groups.flatMap(group => group.taskIds));
    for (const item of layout.items) if (item.type === "task") placedIds.add(item.id);
    const newlyVisible = active.filter(task => !placedIds.has(task.id)).map(task => rows.get(task.id));
    els.list.replaceChildren(...newlyVisible, ...layout.items.map(item => {
      if (item.type === "task") return rows.get(item.id);
      const group = groups.get(item.id);
      if (!group) return null;
      const wrapper = document.createElement("li");
      wrapper.className = "today-group";
      wrapper.dataset.groupId = group.id;
      wrapper.classList.toggle("selected", selectedGroupIds.has(group.id));
      wrapper.setAttribute("aria-selected", String(selectedGroupIds.has(group.id)));
      wrapper.style.setProperty("--group-color", group.color);
      const heading = document.createElement("h2");
      heading.className = "today-group-heading";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "today-group-toggle";
      toggle.setAttribute("aria-controls", `today-group-tasks-${group.id}`);
      toggle.setAttribute("aria-expanded", String(!group.collapsed));
      const groupTitle = group.title || TODAY_GROUP_NAMES.get(group.color);
      toggle.setAttribute("aria-label", `${group.collapsed ? "Розгорнути" : "Згорнути"} групу «${groupTitle}»`);
      const label = document.createElement("span");
      label.className = "today-group-label";
      const count = document.createElement("span");
      count.className = "today-group-count";
      count.textContent = group.taskIds.filter(id => rows.has(id)).length;
      const name = document.createElement("span");
      name.className = "today-group-name";
      name.textContent = groupTitle;
      label.append(name, " · ", count);
      toggle.append(label);
      const add = document.createElement("button");
      add.type = "button";
      add.className = "today-group-add";
      add.setAttribute("aria-label", `Додати завдання до групи «${groupTitle}»`);
      add.setAttribute("aria-haspopup", "dialog");
      heading.append(toggle, add);
      const members = document.createElement("ul");
      members.className = "today-group-tasks";
      members.id = `today-group-tasks-${group.id}`;
      members.hidden = group.collapsed;
      members.append(...group.taskIds.map(id => rows.get(id)).filter(Boolean));
      wrapper.append(heading, members);
      return wrapper;
    }).filter(Boolean));
  } else if (contextList?.kind === "today" && layout?.items?.length) {
    const placed = new Set(layout.items.map(item => item.id));
    els.list.replaceChildren(...active.filter(task => !placed.has(task.id)).map(task => rows.get(task.id)),
      ...layout.items.map(item => rows.get(item.id)).filter(Boolean));
  } else if (contextList?.kind === "regular" && listSections.some(section => section.listId === contextList.id)) {
    const currentSections = listSectionOrder(listSections, contextList.id);
    const validIds = new Set(currentSections.map(section => section.id));
    const rootRows = active.filter(task => !task.sectionId || !validIds.has(task.sectionId)).map(task => rows.get(task.id));
    const sectionRows = currentSections.map(section => {
      const wrapper = document.createElement("li");
      wrapper.className = "list-section";
      wrapper.dataset.sectionId = section.id;
      const heading = document.createElement("h2");
      heading.className = "list-section-heading";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "list-section-toggle";
      toggle.setAttribute("aria-expanded", String(section.collapsed !== true));
      toggle.setAttribute("aria-label", `${section.collapsed === true ? "Розгорнути" : "Згорнути"} секцію «${section.title}»`);
      const label = document.createElement("span");
      label.className = "list-section-label";
      label.textContent = section.title;
      const count = document.createElement("span");
      count.className = "list-section-count";
      const sectionTasks = active.filter(task => task.sectionId === section.id);
      count.textContent = String(sectionTasks.length);
      toggle.append(label, count);
      const add = document.createElement("button");
      add.type = "button";
      add.className = "today-group-add list-section-add";
      add.setAttribute("aria-label", `Додати завдання до секції «${section.title}»`);
      add.setAttribute("aria-haspopup", "dialog");
      heading.append(toggle, add);
      const members = document.createElement("ul");
      members.className = "list-section-tasks";
      members.id = `list-section-tasks-${section.id}`;
      toggle.setAttribute("aria-controls", members.id);
      members.hidden = section.collapsed === true;
      members.append(...sectionTasks.map(task => rows.get(task.id)));
      wrapper.append(heading, members);
      return wrapper;
    });
    els.list.replaceChildren(...rootRows, ...sectionRows);
  } else els.list.replaceChildren(...rows.values());
  const hasListSections = contextList?.kind === "regular" && listSections.some(section => section.listId === contextList.id);
  els.list.hidden = active.length === 0 && !groupedToday && !hasListSections;
  els.empty.hidden = active.length > 0 || groupedToday || hasListSections;
  const oneToFour = ![11, 12, 13, 14].includes(active.length % 100) && [1, 2, 3, 4].includes(active.length % 10);
  els.count.textContent = groupSelection ? `Вибрано груп: ${selectedGroupIds.size}` : selectionMode
    ? `Вибрано: ${selectedIds.size}`
    : `${active.length} ${oneToFour ? "завдання" : "завдань"}`;
  if (taskSection) {
    const shift = previousSectionTop - taskSection.getBoundingClientRect().top;
    if (Math.abs(shift) > 1) taskSection.animate([
      { transform: `translateY(${shift}px)` },
      { transform: "translateY(0)" }
    ], { duration: 280, easing: "cubic-bezier(.22,1,.36,1)" });
  }
}

function showTaskEditor() {
  clearTimeout(editorCloseTimer);
  els.shell.hidden = true;
  els.editor.hidden = false;
  els.editor.classList.remove("is-closing");
  document.body.classList.add("task-editor-open");
  els.editor.scrollTop = 0;
}

const taskDescriptionToggle = document.querySelector("#task-description-toggle");
const taskDescriptionEdit = document.querySelector("#task-description-edit");
const taskDescriptionLabel = document.querySelector("#task-description-label");
const taskDescriptionCopyActions = [...document.querySelectorAll('[data-rich-target="task-description"]')];

function syncTaskDescriptionActions() {
  const hasDescription = Boolean(els.description.value.trim());
  taskDescriptionEdit.textContent = hasDescription ? "Редагувати" : "Додати опис";
  for (const action of taskDescriptionCopyActions) action.hidden = !hasDescription;
  return hasDescription;
}

function syncTaskActionsMenu() {
  els.taskActionsMenu.hidden = true;
  els.taskActionsTrigger.setAttribute("aria-expanded", "false");
  const merge = document.querySelector("#task-merge-checklist");
  merge.hidden = !els.editor.dataset.taskId || !/^\s*[-*+] \[[ xX]\](?: |$)/m.test(els.description.value || "");
  syncTaskDescriptionActions();
  els.taskActionsTrigger.hidden = [els.taskAddToday, els.taskAttachProject, els.taskConvertProject, els.taskDetachProject, els.taskDelete, merge,
    ...taskDescriptionCopyActions].every(button => button.hidden);
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
  const hasDescription = syncTaskDescriptionActions();
  if (els.editor.classList.contains("description-edit-mode")) return;
  const expanded = taskDescriptionToggle.getAttribute("aria-expanded") === "true";
  els.description.hidden = !hasDescription;
  els.description.classList.toggle("is-truncated", hasDescription);
  const canExpand = hasDescription && els.description.scrollHeight > els.description.clientHeight + 1;
  els.description.classList.toggle("is-truncated", canExpand && !expanded);
  els.description.inert = canExpand && !expanded;
  if (!expanded) els.description.scrollTop = 0;
  taskDescriptionLabel.hidden = canExpand;
  taskDescriptionToggle.hidden = !canExpand;
  taskDescriptionToggle.textContent = expanded ? "Згорнути опис" : "Розгорнути опис";
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
  els.description.value = "";
  taskDescriptionToggle.setAttribute("aria-expanded", "false");
  els.savedSteps.hidden = true;
  els.savedSteps.open = false;
  els.detailFields.hidden = false;
  els.detailToggle.hidden = true;
  els.taskProjectRow.hidden = true;
  els.taskProjectOptions.hidden = true;
  els.editor.dataset.pendingProjectId = "";
  els.taskAttachProject.hidden = !projects.some(item => item.status === "active");
  els.taskAttachProject.querySelector("span:last-child").textContent = "Додати до проєкту";
  els.taskConvertProject.hidden = true;
  els.taskDetachProject.hidden = true;
  els.taskDelete.hidden = true;
  els.taskAddToday.hidden = true;
  syncTaskActionsMenu();
  delete els.taskProjectLink.dataset.projectId;
  setTaskEditorListUI(listId);
  els.date.value = originListId === TODAY_LIST_ID ? todayTaskDates(localDateValue(), todayTaskCreationMode).dueDate || ""
    : originListId === TOMORROW_LIST_ID ? nextLocalDate() : originListId === "upcoming" ? upcomingDate : "";
  els.editor.dataset.dateChosen = String(originListId === "upcoming");
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
  els.editor.dataset.pendingProjectId = "";
  delete els.editor.dataset.originListId;
  els.form.reset();
  els.detailFields.hidden = false;
  els.detailToggle.hidden = false;
  const project = projects.find(item => item.id === task.projectId);
  els.taskProjectSectionRow.hidden = !project || !project.projectSections?.length;
  els.taskProjectSectionSelect.replaceChildren(new Option("Звичайні кроки", ""), ...(project?.projectSections || []).map(section => new Option(section.title, section.id)));
  els.taskProjectSectionSelect.value = project?.projectSections?.some(section => section.id === task.projectSectionId) ? task.projectSectionId : "";
  els.taskProjectRow.hidden = !project;
  els.taskProjectOptions.hidden = true;
  els.taskProjectTrigger.setAttribute("aria-expanded", "false");
  els.taskProjectTrigger.disabled = task.status !== "active" || !projects.some(item => item.status === "active");
  els.taskAttachProject.hidden = task.status !== "active" || Boolean(task.projectId) || Boolean(task.savedSteps?.length) || !projects.some(item => item.status === "active");
  els.taskConvertProject.hidden = task.status !== "active" || Boolean(task.projectId);
  els.taskDetachProject.hidden = task.status !== "active" || !project;
  els.taskDelete.hidden = false;
  const manuallyToday = task.addedToTodayDate === localDateValue();
  els.taskAddToday.hidden = task.status !== "active";
  els.taskAddToday.querySelector("span:last-child").textContent = taskTodayActionLabel(manuallyToday, task.dueDate === localDateValue());
  els.taskProjectLink.dataset.projectId = project?.id || "";
  els.taskProjectValue.textContent = project?.title || "";
  setTaskEditorListUI(task.listId || INBOX_LIST_ID);
  setTaskEditorSectionUI(task.listId || INBOX_LIST_ID, task.sectionId);
  els.input.value = task.title;
  els.description.value = task.description || "";
  taskDescriptionToggle.setAttribute("aria-expanded", String(Boolean(els.description.querySelector(".rich-checklist"))));
  syncTaskActionsMenu();
  const snapshot = Array.isArray(task.savedSteps) ? task.savedSteps : [];
  els.savedSteps.hidden = snapshot.length === 0;
  els.savedSteps.open = false;
  els.savedStepsTitle.textContent = `Збережені кроки · ${snapshot.length}`;
  els.savedStepsList.replaceChildren();
  for (const step of snapshot) {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    title.textContent = step.title;
    const meta = document.createElement("span");
    meta.textContent = `${step.status === "completed" ? "Виконано" : "Активний"} · ${displayListTitle(lists.find(list => list.id === step.listId)) || "Нові"}`;
    const description = document.createElement("p");
    description.textContent = step.description;
    item.append(title, meta, description);
    els.savedStepsList.append(item);
  }
  els.taskConvertStepsCount.hidden = snapshot.length === 0;
  els.taskConvertStepsCount.textContent = snapshot.length ? `відновити ${snapshot.length} кроків` : "";
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
