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
  dialog: document.querySelector("#task-dialog"),
  detailHeader: document.querySelector(".detail-header"),
  detailFields: document.querySelector(".detail-fields"),
  attributePlaceholders: document.querySelector(".attribute-placeholders"),
  detailToggle: document.querySelector("#detail-toggle"),
  collapseTask: document.querySelector("#collapse-task"),
  saveTaskButton: document.querySelector("#save-task-button"),
  formHint: document.querySelector(".form-hint"),
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

function showTaskDialog() {
  els.dialog.hidden = false;
  document.body.classList.add("task-dialog-open");
  syncTaskDialogViewport();
}

function hideTaskDialog() {
  if (els.dialog.hidden) return;
  els.dialog.hidden = true;
  document.body.classList.remove("task-dialog-open");
  els.dialog.dispatchEvent(new Event("taskdialogclose"));
}

function syncTaskDialogViewport() {
  if (!window.visualViewport) return;
  const viewport = window.visualViewport;
  const keyboardHeight = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
  els.dialog.style.setProperty("--keyboard-offset", `${keyboardHeight}px`);
}

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", syncTaskDialogViewport);
  window.visualViewport.addEventListener("scroll", syncTaskDialogViewport);
}

function openComposer() {
  els.dialog.classList.remove("detail-mode");
  els.dialog.dataset.taskId = "";
  els.form.reset();
  els.detailHeader.hidden = true;
  els.detailFields.hidden = false;
  els.attributePlaceholders.hidden = true;
  els.detailToggle.hidden = true;
  els.saveTaskButton.textContent = "Створити задачу";
  els.formHint.hidden = false;
  els.date.value = localDateValue();
  els.dateLabel.textContent = "Сьогодні";
  showTaskDialog();
  requestAnimationFrame(() => els.input.focus());
}

function openTaskDetails(task) {
  els.dialog.classList.add("detail-mode");
  els.dialog.dataset.taskId = task.id;
  els.form.reset();
  els.detailHeader.hidden = false;
  els.detailFields.hidden = false;
  els.attributePlaceholders.hidden = false;
  els.detailToggle.hidden = false;
  els.saveTaskButton.textContent = "Зберегти зміни";
  els.formHint.hidden = true;
  els.input.value = task.title;
  els.description.value = task.description || "";
  els.date.value = task.dueDate || "";
  els.dateLabel.textContent = readableDate(task.dueDate);
  showTaskDialog();
  requestAnimationFrame(() => {
    els.input.style.height = "auto";
    els.input.style.height = `${Math.min(els.input.scrollHeight, 150)}px`;
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
      if (!card.hasPointerCapture(event.pointerId)) card.setPointerCapture(event.pointerId);
    }
    if (!gesture.horizontal) return;
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

  els.list.addEventListener("pointerup", finishGesture);
  els.list.addEventListener("pointercancel", finishGesture);
}
