const els = {
  shell: document.querySelector(".app-shell"),
  normalHeader: document.querySelector("#normal-header"),
  selectionToolbar: document.querySelector("#selection-toolbar"),
  selectionClose: document.querySelector("#selection-close"),
  selectionCount: document.querySelector("#selection-count"),
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
  detailToggle: document.querySelector("#detail-toggle"),
  editorBack: document.querySelector("#task-editor-back"),
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

let pendingDateValue = null;
let visibleCalendarMonth = null;
let datePickerReturnFocus = null;

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

function openDatePicker() {
  datePickerReturnFocus = document.activeElement;
  const initial = els.date.value || localDateValue();
  const initialDate = dateFromValue(initial);
  const today = new Date();
  visibleCalendarMonth = new Date(Math.max(initialDate.getTime(), today.getTime()));
  visibleCalendarMonth.setDate(1);
  els.todayWeekday.textContent = weekdayFormatter.format(today);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  els.tomorrowWeekday.textContent = weekdayFormatter.format(tomorrow);
  els.datePickerBackdrop.hidden = false;
  document.body.classList.add("date-picker-open");
  setPendingDate(els.date.value);
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
    row.querySelector(".task-date").textContent = readableDate(task.dueDate || task.createdAt?.slice(0, 10));
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
  els.shell.hidden = true;
  els.editor.hidden = false;
  document.body.classList.add("task-editor-open");
}

function hideTaskEditor() {
  els.editor.hidden = true;
  els.shell.hidden = false;
  document.body.classList.remove("task-editor-open");
  window.scrollTo(0, 0);
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
  els.attributePlaceholders.hidden = true;
  els.detailToggle.hidden = true;
  els.date.value = localDateValue();
  els.dateLabel.textContent = "Сьогодні";
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
  showTaskEditor();
  requestAnimationFrame(() => {
    els.input.style.height = "auto";
    els.input.style.height = `${Math.min(els.input.scrollHeight, 150)}px`;
    resizeDescription();
  });
}

function enableTaskSwipe({ onDelete, isSelectionMode, onLongPress }) {
  let gesture = null;
  const maxReveal = 112;
  const deleteThreshold = 72;
  const settleDuration = 260;
  const deleteDuration = 300;

  els.list.addEventListener("pointerdown", event => {
    const card = event.target.closest(".task-card");
    if (!card || event.button > 0 || isSelectionMode()) return;
    const row = card.closest(".swipe-row");
    gesture = { row, card, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, horizontal: false, longPress: false };
    card.setPointerCapture(event.pointerId);
    row.classList.remove("settling");
    gesture.longPressTimer = setTimeout(() => {
      if (!gesture || gesture.pointerId !== event.pointerId || gesture.horizontal) return;
      gesture.longPress = true;
      row.dataset.longPressed = "true";
      onLongPress(row.dataset.id);
    }, 520);
  });

  els.list.addEventListener("pointermove", event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearTimeout(gesture.longPressTimer);
    if (!gesture.horizontal && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      gesture = null;
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
    const { row, card, dx, horizontal, longPress, longPressTimer } = gesture;
    gesture = null;
    clearTimeout(longPressTimer);
    if (longPress) return;
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
    const { row, card, longPressTimer } = gesture;
    gesture = null;
    clearTimeout(longPressTimer);
    row.classList.remove("swiping");
    row.classList.add("settling");
    card.style.transform = "translateX(0)";
    setTimeout(() => row.classList.remove("settling"), settleDuration);
  };

  els.list.addEventListener("pointerup", finishGesture);
  els.list.addEventListener("pointercancel", cancelGesture);
}
