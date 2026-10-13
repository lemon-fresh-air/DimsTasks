const els = {
  shell: document.querySelector(".app-shell"),
  normalHeader: document.querySelector("#normal-header"),
  selectionToolbar: document.querySelector("#selection-toolbar"),
  selectionClose: document.querySelector("#selection-close"),
  selectionCount: document.querySelector("#selection-count"),
  dateSelected: document.querySelector("#date-selected"),
  deleteSelected: document.querySelector("#delete-selected"),
  form: document.querySelector("#task-form"),
  input: document.querySelector("#task-title"),
  description: document.querySelector("#task-description"),
  date: document.querySelector("#task-date"),
  dateLabel: document.querySelector("#date-label"),
  datePickerOpen: document.querySelector("#date-picker-open"),
  datePickerBackdrop: document.querySelector("#date-picker-backdrop"),
  datePicker: document.querySelector("#date-picker"),
  datePickerClose: document.querySelector("#date-picker-close"),
  datePickerValue: document.querySelector("#date-picker-value span:last-child"),
  datePickerSave: document.querySelector("#date-picker-save"),
  calendarPrevious: document.querySelector("#calendar-previous"),
  calendarNext: document.querySelector("#calendar-next"),
  calendarMonth: document.querySelector("#calendar-month"),
  calendarGrid: document.querySelector("#calendar-grid"),
  todayWeekday: document.querySelector("#today-weekday"),
  tomorrowWeekday: document.querySelector("#tomorrow-weekday"),
  editor: document.querySelector("#task-editor"),
  detailFields: document.querySelector(".detail-fields"),
  attributePlaceholders: document.querySelector(".attribute-placeholders"),
  desktopSaveTask: document.querySelector("#desktop-save-task"),
  detailToggle: document.querySelector("#detail-toggle"),
  editorBack: document.querySelector("#task-editor-back"),
  mainMenu: document.querySelector("#main-menu"),
  mainMenuOpen: document.querySelector("#main-menu-open"),
  mainMenuClose: document.querySelector("#main-menu-close"),
  mainMenuLists: document.querySelector("#main-menu-lists"),
  mainMenuSwipeZone: document.querySelector("#main-menu-swipe-zone"),
  newListOpen: document.querySelector("#new-list-open"),
  newListForm: document.querySelector("#new-list-form"),
  newListTitle: document.querySelector("#new-list-title"),
  newListCancel: document.querySelector("#new-list-cancel"),
  settingsOpen: document.querySelector("#settings-open"),
  settingsScreen: document.querySelector("#settings-screen"),
  settingsClose: document.querySelector("#settings-close"),
  themeToggle: document.querySelector("#theme-toggle"),
  themeLabel: document.querySelector("#theme-label"),
  listSwipeZone: document.querySelector("#list-swipe-zone"),
  currentListHeading: document.querySelector("#current-list-heading"),
  inboxTitle: document.querySelector("#inbox-title"),
  bottomListLabel: document.querySelector("#bottom-list-label"),
  editorListLabel: document.querySelector("#editor-list-label"),
  composerListLabel: document.querySelector("#composer-list-label"),
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
const monthFormatter = new Intl.DateTimeFormat("uk-UA", { month: "long", year: "numeric" });
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
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (value === localDateValue(tomorrow)) return "Завтра";
  return dateFormatter.format(new Date(`${value}T12:00:00`));
}

function dateTone(value) {
  if (!value) return "none";
  if (value === localDateValue()) return "today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (value === localDateValue(tomorrow)) return "tomorrow";
  return "future";
}

function applyDateTone(element, value) {
  element.dataset.dateTone = dateTone(value);
}

function editorState() {
  return JSON.stringify({ title: els.input.value, description: els.description.value, dueDate: els.date.value });
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

let pendingDateValue = null;
let visibleCalendarMonth = null;
let datePickerReturnFocus = null;
let editorCloseTimer;
let menuCloseTimer;
let menuOpenFrame;
let settingsCloseTimer;
let settingsOpenFrame;

function applyTheme(theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalizedTheme;
  els.themeToggle.checked = normalizedTheme === "dark";
  els.themeLabel.textContent = normalizedTheme === "dark" ? "Нічна" : "Денна";
  els.themeToggle.setAttribute("aria-label", normalizedTheme === "dark" ? "Увімкнено нічну тему" : "Увімкнути нічну тему");
}

function renderMainMenuLists(lists, activeListId, selectedIds = new Set()) {
  els.mainMenuLists.classList.toggle("selection-mode", selectedIds.size > 0);
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
    icon.className = list.kind === "inbox" ? "inbox-icon" : "list-menu-icon";
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = displayListTitle(list);
    button.append(icon, label);
    return button;
  }));
}

function setActiveListUI(list) {
  const title = displayListTitle(list);
  els.currentListHeading.textContent = title;
  els.inboxTitle.textContent = title;
  els.bottomListLabel.textContent = title;
  els.editorListLabel.textContent = title;
  els.composerListLabel.textContent = title;
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
  document.body.classList.add("main-menu-open");
  menuOpenFrame = requestAnimationFrame(() => {
    menuOpenFrame = requestAnimationFrame(() => {
      els.mainMenu.classList.add("is-open");
      els.mainMenuClose.focus({ preventScroll: true });
    });
  });
  history.pushState({ mainMenu: true }, "");
}

function closeMainMenu({ fromHistory = false } = {}) {
  if (els.mainMenu.hidden) return;
  cancelAnimationFrame(menuOpenFrame);
  els.mainMenu.classList.remove("is-open");
  els.mainMenuOpen.setAttribute("aria-expanded", "false");
  document.body.classList.remove("main-menu-open");
  menuCloseTimer = setTimeout(() => {
    els.mainMenu.hidden = true;
    hideNewListForm({ returnFocus: false });
    els.mainMenuOpen.focus();
  }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 240);
  if (!fromHistory && history.state?.mainMenu) history.back();
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
  history.pushState({ settings: true }, "");
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
  if (!fromHistory && history.state?.settings) history.back();
}

function enableHorizontalSwipe(element, { direction, onSwipe }) {
  let gesture = null;

  element.addEventListener("pointerdown", event => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    gesture = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
    element.setPointerCapture?.(event.pointerId);
  });

  element.addEventListener("pointerup", event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    const requiredDistance = Math.min(120, Math.max(80, innerWidth * .22));
    const movesInDirection = direction === "right" ? dx >= requiredDistance : dx <= -requiredDistance;
    const isClearlyHorizontal = Math.abs(dx) >= Math.abs(dy) * 1.5;
    gesture = null;
    if (movesInDirection && isClearlyHorizontal) onSwipe();
  });

  const cancel = event => {
    if (gesture?.pointerId === event.pointerId) gesture = null;
  };
  element.addEventListener("pointercancel", cancel);
  element.addEventListener("lostpointercapture", cancel);
}

function enableListReordering({ onReorder, isSelectionMode, isSelected, onLongPress, onSelectOnly, getSelectedIds }) {
  let gesture = null;
  const container = els.mainMenuLists;

  function capturePositions() {
    return new Map([...container.querySelectorAll("[data-list-id]")].map(item => [item.dataset.listId, item.getBoundingClientRect().top]));
  }

  function animatePositions(previous) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const item of container.querySelectorAll("[data-list-id]")) {
      const top = previous.get(item.dataset.listId);
      if (top === undefined) continue;
      const delta = top - item.getBoundingClientRect().top;
      if (Math.abs(delta) > 1) item.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
  }

  function positionPreview(clientX, clientY) {
    gesture.lastX = clientX;
    gesture.lastY = clientY;
    gesture.targetX = clientX - gesture.offsetX;
    gesture.targetY = clientY - gesture.offsetY;
  }

  function renderPreview() {
    if (!gesture?.dragging) return;
    const follow = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : .42;
    gesture.currentX += (gesture.targetX - gesture.currentX) * follow;
    gesture.currentY += (gesture.targetY - gesture.currentY) * follow;
    gesture.preview.style.transform = `translate3d(${gesture.currentX}px,${gesture.currentY}px,0)`;
    gesture.followFrame = requestAnimationFrame(renderPreview);
  }

  function updateInsertion(clientY) {
    const candidates = [...container.querySelectorAll('[data-list-kind="regular"]')]
      .filter(item => !gesture.selectedIds.has(item.dataset.listId));
    const before = candidates.find(item => clientY < item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2) || null;
    const beforeId = before?.dataset.listId || null;
    if (beforeId === gesture.lastBeforeId) return;
    const previous = capturePositions();
    if (before) before.before(gesture.placeholder); else container.append(gesture.placeholder);
    gesture.lastBeforeId = beforeId;
    gesture.moved = true;
    animatePositions(previous);
  }

  function startDrag(event) {
    clearTimeout(gesture.longPressTimer);
    if (!isSelected(gesture.id)) onSelectOnly(gesture.id);
    gesture.item = container.querySelector(`[data-list-id="${CSS.escape(gesture.id)}"]`);
    if (!gesture.item) return;
    const selectedIds = getSelectedIds();
    const selectedItems = [...container.querySelectorAll('[data-list-kind="regular"]')]
      .filter(item => selectedIds.has(item.dataset.listId));
    const rect = gesture.item.getBoundingClientRect();
    const placeholder = document.createElement("div");
    placeholder.className = "list-drag-placeholder";
    placeholder.style.height = `${selectedItems.reduce((height, item) => height + item.getBoundingClientRect().height, 0) + Math.max(0, selectedItems.length - 1) * 4}px`;
    gesture.item.before(placeholder);
    selectedItems.forEach(item => item.classList.add("drag-source"));
    const preview = document.createElement("div");
    preview.className = "list-drag-preview";
    preview.style.width = `${rect.width}px`;
    const previewItem = gesture.item.cloneNode(true);
    if (selectedIds.size > 1) {
      const count = document.createElement("span");
      count.className = "drag-count";
      count.textContent = selectedIds.size;
      previewItem.append(count);
    }
    preview.append(previewItem);
    document.body.append(preview);
    gesture = {
      ...gesture, item: gesture.item, selectedIds, selectedItems, dragging: true, placeholder, preview, moved: false, lastBeforeId: gesture.id,
      offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top,
      currentX: rect.left, currentY: rect.top, targetX: rect.left, targetY: rect.top
    };
    container.classList.add("dragging");
    positionPreview(event.clientX, event.clientY);
    gesture.followFrame = requestAnimationFrame(renderPreview);
  }

  container.addEventListener("pointerdown", event => {
    const item = event.target.closest('[data-list-kind="regular"]');
    if (!item || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    gesture = { item, id: item.dataset.listId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, ready: event.pointerType === "mouse", dragging: false };
    item.setPointerCapture?.(event.pointerId);
    gesture.longPressTimer = setTimeout(() => {
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      gesture.ready = true;
      container.dataset.suppressListClick = gesture.id;
      if (!isSelected(gesture.id)) onLongPress(gesture.id);
      gesture.item = container.querySelector(`[data-list-id="${CSS.escape(gesture.id)}"]`);
      gesture.item?.classList.add("lifted");
    }, 450);
  });

  container.addEventListener("pointermove", event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
    if (gesture.dragging) {
      event.preventDefault();
      positionPreview(event.clientX, event.clientY);
      updateInsertion(event.clientY);
      return;
    }
    if (gesture.ready && distance > 6) {
      event.preventDefault();
      container.dataset.suppressListClick = gesture.id;
      startDrag(event);
      return;
    }
    if (isSelectionMode() && isSelected(gesture.id) && distance > 8) {
      event.preventDefault();
      container.dataset.suppressListClick = gesture.id;
      startDrag(event);
      return;
    }
    if (!gesture.ready && distance > 8) clearTimeout(gesture.longPressTimer);
  });

  function finish(event, cancelled = false) {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const finished = gesture;
    gesture = null;
    clearTimeout(finished.longPressTimer);
    finished.item?.classList.remove("lifted");
    if (!finished.dragging) return;
    cancelAnimationFrame(finished.followFrame);
    finished.preview.remove();
    finished.placeholder.remove();
    finished.selectedItems.forEach(item => item.classList.remove("drag-source"));
    container.classList.remove("dragging");
    if (!cancelled && finished.moved) onReorder({ selectedIds: finished.selectedIds, beforeId: finished.lastBeforeId });
  }

  container.addEventListener("pointerup", event => finish(event));
  container.addEventListener("pointercancel", event => finish(event, true));
}

function dateFromValue(value) {
  return value ? new Date(`${value}T12:00:00`) : null;
}

function setPendingDate(value) {
  pendingDateValue = value || "";
  els.datePickerValue.textContent = value ? fullDateFormatter.format(dateFromValue(value)) : "Без дати";
  document.querySelectorAll("[data-date-shortcut]").forEach(button => {
    const shortcutValue = button.dataset.dateShortcut === "today" ? localDateValue()
      : button.dataset.dateShortcut === "tomorrow" ? localDateValue(new Date(Date.now() + 86400000)) : "";
    button.classList.toggle("selected", shortcutValue === pendingDateValue);
    button.setAttribute("aria-pressed", String(shortcutValue === pendingDateValue));
  });
  renderCalendar();
}

function renderCalendar() {
  if (!visibleCalendarMonth) return;
  const todayValue = localDateValue();
  const today = dateFromValue(todayValue);
  const year = visibleCalendarMonth.getFullYear();
  const month = visibleCalendarMonth.getMonth();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  els.calendarPrevious.disabled = isCurrentMonth;
  els.calendarMonth.textContent = monthFormatter.format(visibleCalendarMonth);
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstWeekday }, () => {
    const spacer = document.createElement("span");
    spacer.className = "calendar-spacer";
    return spacer;
  });
  for (let day = 1; day <= daysInMonth; day += 1) {
    const value = localDateValue(new Date(year, month, day, 12));
    if (isCurrentMonth && value < todayValue) {
      const hidden = document.createElement("span");
      hidden.className = "calendar-spacer past-day";
      cells.push(hidden);
      continue;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.date = value;
    button.textContent = day;
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", fullDateFormatter.format(dateFromValue(value)));
    if (value === todayValue) { button.classList.add("today"); button.setAttribute("aria-current", "date"); }
    if (value === pendingDateValue) { button.classList.add("selected"); button.setAttribute("aria-selected", "true"); }
    cells.push(button);
  }
  els.calendarGrid.replaceChildren(...cells);
}

function openDatePicker(initialValue = els.date.value) {
  datePickerReturnFocus = document.activeElement;
  const initial = initialValue || localDateValue();
  const initialDate = dateFromValue(initial);
  const today = new Date();
  visibleCalendarMonth = new Date(Math.max(initialDate.getTime(), today.getTime()));
  visibleCalendarMonth.setDate(1);
  els.todayWeekday.textContent = weekdayFormatter.format(today);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  els.tomorrowWeekday.textContent = weekdayFormatter.format(tomorrow);
  els.datePickerBackdrop.hidden = false;
  document.body.classList.add("date-picker-open");
  setPendingDate(initialValue);
  requestAnimationFrame(() => els.datePicker.focus());
}

function closeDatePicker() {
  els.datePickerBackdrop.hidden = true;
  document.body.classList.remove("date-picker-open");
  datePickerReturnFocus?.focus();
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

function renderTasks(tasks, selectedIds = new Set()) {
  const active = tasks.filter(task => !isTaskCompleted(task));
  const selectionMode = selectedIds.size > 0;
  els.shell.classList.toggle("selection-active", selectionMode);
  els.normalHeader.hidden = selectionMode;
  els.selectionToolbar.hidden = !selectionMode;
  els.selectionCount.textContent = `Вибрано: ${selectedIds.size}`;
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
    const displayedDate = task.dueDate || task.createdAt?.slice(0, 10);
    const taskDate = row.querySelector(".task-date");
    taskDate.textContent = readableDate(displayedDate);
    applyDateTone(taskDate, displayedDate);
    row.querySelector(".task-project-name").textContent = els.currentListHeading.textContent;
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

function openNewTaskEditor() {
  els.editor.classList.remove("detail-mode");
  els.editor.dataset.taskId = "";
  els.form.reset();
  els.detailFields.hidden = false;
  els.attributePlaceholders.hidden = false;
  els.detailToggle.hidden = true;
  els.date.value = localDateValue();
  els.dateLabel.textContent = "Сьогодні";
  applyDateTone(els.datePickerOpen, els.date.value);
  rememberEditorState();
  showTaskEditor();
  requestAnimationFrame(() => { resizeDescription(); els.input.focus(); });
}

function openTaskDetails(task) {
  els.editor.classList.add("detail-mode");
  els.editor.dataset.taskId = task.id;
  els.form.reset();
  els.detailFields.hidden = false;
  els.attributePlaceholders.hidden = false;
  els.detailToggle.hidden = false;
  els.input.value = task.title;
  els.description.value = task.description || "";
  els.date.value = task.dueDate || "";
  els.dateLabel.textContent = readableDate(task.dueDate);
  applyDateTone(els.datePickerOpen, els.date.value);
  rememberEditorState();
  showTaskEditor();
  requestAnimationFrame(() => {
    els.input.style.height = "auto";
    els.input.style.height = `${Math.min(els.input.scrollHeight, 150)}px`;
    resizeDescription();
  });
}

function enableTaskGestures({ onDelete, isSelectionMode, isSelected, onLongPress, onSelectOnly, getSelectedIds, onReorder }) {
  let gesture = null;
  const maxReveal = 112;
  const deleteThreshold = 72;
  const settleDuration = 260;
  const deleteDuration = 300;

  els.list.addEventListener("pointerdown", event => {
    const card = event.target.closest(".task-card");
    if (!card || event.button > 0) return;
    const row = card.closest(".swipe-row");
    gesture = { row, card, id: row.dataset.id, pointerId: event.pointerId, pointerType: event.pointerType, startX: event.clientX, startY: event.clientY, lastY: event.clientY, dx: 0, horizontal: false, scrolling: false, longPress: false, dragging: false };
    card.setPointerCapture(event.pointerId);
    row.classList.remove("settling");
    if (event.pointerType === "mouse") {
      gesture.longPress = true;
    }
    gesture.longPressTimer = setTimeout(() => {
      if (!gesture || gesture.pointerId !== event.pointerId || gesture.horizontal) return;
      gesture.longPress = true;
      row.dataset.longPressed = "true";
      onLongPress(row.dataset.id);
      gesture.row = els.list.querySelector(`[data-id="${CSS.escape(gesture.id)}"]`);
      gesture.card = gesture.row?.querySelector(".task-card");
      gesture.row?.classList.add("lifted");
    }, 450);
  });

  function captureRows() {
    return new Map([...els.list.children].filter(row => row.dataset.id).map(row => [row.dataset.id, row.getBoundingClientRect().top]));
  }

  function animateRows(previous) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const row of els.list.children) {
      const top = previous.get(row.dataset.id);
      if (top === undefined) continue;
      const delta = top - row.getBoundingClientRect().top;
      if (Math.abs(delta) > 1) row.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
  }

  function startDrag(event) {
    clearTimeout(gesture.longPressTimer);
    if (!isSelected(gesture.id)) {
      onSelectOnly(gesture.id);
      gesture.row = els.list.querySelector(`[data-id="${CSS.escape(gesture.id)}"]`);
      gesture.card = gesture.row?.querySelector(".task-card");
    }
    const selectedIds = getSelectedIds();
    const rows = [...els.list.children].filter(row => selectedIds.has(row.dataset.id));
    if (!rows.length) return;
    const sourceRect = gesture.row.getBoundingClientRect();
    const totalHeight = rows.reduce((sum, row) => sum + row.getBoundingClientRect().height, 0);
    const placeholder = document.createElement("li");
    placeholder.className = "drag-placeholder";
    placeholder.style.height = `${totalHeight}px`;
    rows[0].before(placeholder);
    rows.forEach(row => row.classList.add("drag-source"));
    const preview = document.createElement("div");
    preview.className = "drag-preview";
    preview.style.width = `${sourceRect.width}px`;
    preview.append(gesture.card.cloneNode(true));
    if (rows.length > 1) {
      const badge = document.createElement("span");
      badge.className = "drag-count";
      badge.textContent = rows.length;
      preview.append(badge);
    }
    document.body.append(preview);
    gesture = {
      ...gesture, dragging: true, selectedIds, rows, placeholder, preview, moved: false, lastBeforeId: null,
      offsetX: event.clientX - sourceRect.left, offsetY: event.clientY - sourceRect.top,
      currentX: sourceRect.left, currentY: sourceRect.top, targetX: sourceRect.left, targetY: sourceRect.top
    };
    els.list.classList.add("dragging");
    positionPreview(event.clientX, event.clientY);
    gesture.followFrame = requestAnimationFrame(renderPreview);
    gesture.scrollFrame = requestAnimationFrame(autoScroll);
  }

  function positionPreview(clientX, clientY) {
    gesture.lastX = clientX;
    gesture.lastY = clientY;
    gesture.targetX = clientX - gesture.offsetX;
    gesture.targetY = clientY - gesture.offsetY;
  }

  function renderPreview() {
    if (!gesture?.dragging) return;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const follow = reducedMotion ? 1 : .42;
    gesture.currentX += (gesture.targetX - gesture.currentX) * follow;
    gesture.currentY += (gesture.targetY - gesture.currentY) * follow;
    gesture.preview.style.transform = `translate3d(${gesture.currentX}px,${gesture.currentY}px,0)`;
    gesture.followFrame = requestAnimationFrame(renderPreview);
  }

  function updateInsertion(clientY) {
    const candidates = [...els.list.children].filter(row => row.dataset.id && !gesture.selectedIds.has(row.dataset.id));
    const before = candidates.find(row => clientY < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2) || null;
    const beforeId = before?.dataset.id || null;
    if (beforeId === gesture.lastBeforeId) return;
    const previous = captureRows();
    if (before) before.before(gesture.placeholder); else els.list.append(gesture.placeholder);
    gesture.lastBeforeId = beforeId;
    gesture.moved = true;
    animateRows(previous);
  }

  function autoScroll() {
    if (!gesture?.dragging) return;
    const clientY = gesture.lastY;
    const edge = 72;
    const speed = clientY < edge ? -Math.min(14, (edge - clientY) / 4) : clientY > innerHeight - edge ? Math.min(14, (clientY - innerHeight + edge) / 4) : 0;
    if (speed) {
      window.scrollBy(0, speed);
      updateInsertion(clientY);
    }
    gesture.scrollFrame = requestAnimationFrame(autoScroll);
  }

  els.list.addEventListener("pointermove", event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (gesture.dragging) {
      event.preventDefault();
      positionPreview(event.clientX, event.clientY);
      updateInsertion(event.clientY);
      return;
    }
    if (gesture.longPress && Math.hypot(dx, dy) > 6) {
      event.preventDefault();
      startDrag(event);
      return;
    }
    if (isSelectionMode() && Math.hypot(dx, dy) > 8) {
      event.preventDefault();
      clearTimeout(gesture.longPressTimer);
      startDrag(event);
      return;
    }
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearTimeout(gesture.longPressTimer);
    if (!gesture.horizontal && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      event.preventDefault();
      gesture.scrolling = true;
      gesture.row.dataset.swiped = "true";
      window.scrollBy(0, gesture.lastY - event.clientY);
      gesture.lastY = event.clientY;
      return;
    }
    if (dx >= 0 && !gesture.horizontal) return;
    if (Math.abs(dx) > 8) {
      gesture.horizontal = true;
    }
    if (!gesture.horizontal) return;
    event.preventDefault();
    gesture.dx = Math.max(-maxReveal, Math.min(0, dx));
    gesture.row.classList.add("swiping");
    gesture.card.style.transform = `translateX(${gesture.dx}px)`;
  });

  const finishGesture = event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (gesture.dragging) {
      const finished = gesture;
      gesture = null;
      cancelAnimationFrame(finished.scrollFrame);
      cancelAnimationFrame(finished.followFrame);
      finished.preview.remove();
      finished.placeholder.remove();
      finished.rows.forEach(row => row.classList.remove("drag-source", "lifted"));
      els.list.classList.remove("dragging");
      if (finished.moved) onReorder({ beforeId: finished.lastBeforeId });
      return;
    }
    const { row, card, dx, horizontal, scrolling, longPress, longPressTimer } = gesture;
    gesture = null;
    clearTimeout(longPressTimer);
    row?.classList.remove("lifted");
    if (longPress || scrolling) return;
    if (horizontal && Math.abs(dx) >= deleteThreshold) {
      row.classList.remove("swiping");
      row.classList.add("deleting");
      row.dataset.swiped = "true";
      setTimeout(() => onDelete(row.dataset.id), deleteDuration);
      return;
    }
    row.classList.remove("swiping");
    row.classList.add("settling");
    card.style.transform = "translateX(0)";
    setTimeout(() => row.classList.remove("settling"), settleDuration);
  };

  const cancelGesture = event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const { row, card, longPressTimer, dragging, preview, placeholder, rows = [], scrollFrame, followFrame } = gesture;
    gesture = null;
    clearTimeout(longPressTimer);
    if (dragging) {
      cancelAnimationFrame(scrollFrame);
      cancelAnimationFrame(followFrame);
      preview.remove();
      placeholder.remove();
      rows.forEach(item => item.classList.remove("drag-source", "lifted"));
      els.list.classList.remove("dragging");
      return;
    }
    row.classList.remove("swiping");
    row.classList.add("settling");
    card.style.transform = "translateX(0)";
    setTimeout(() => row.classList.remove("settling"), settleDuration);
  };

  els.list.addEventListener("pointerup", finishGesture);
  els.list.addEventListener("pointercancel", cancelGesture);
}
