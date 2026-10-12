const els = {
  form: document.querySelector("#task-form"),
  input: document.querySelector("#task-title"),
  date: document.querySelector("#task-date"),
  dateLabel: document.querySelector("#date-label"),
  dialog: document.querySelector("#task-dialog"),
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

function renderTasks(tasks) {
  const active = tasks.filter(task => !isTaskCompleted(task));
  els.list.replaceChildren(...active.map(task => {
    const row = els.template.content.firstElementChild.cloneNode(true);
    row.dataset.id = task.id;
    row.querySelector(".task-text").textContent = task.title;
    row.querySelector(".task-date").textContent = readableDate(task.dueDate || task.createdAt?.slice(0, 10));
    return row;
  }));
  els.list.hidden = active.length === 0;
  els.empty.hidden = active.length > 0;
  els.count.textContent = `${active.length} ${active.length === 1 ? "задача" : active.length > 1 && active.length < 5 ? "задачі" : "задач"}`;
}

function openComposer() {
  els.form.reset();
  els.date.value = localDateValue();
  els.dateLabel.textContent = "Сьогодні";
  els.dialog.showModal();
  requestAnimationFrame(() => els.input.focus());
}

function enableTaskSwipe(onDelete) {
  let gesture = null;
  const maxReveal = 112;
  const deleteThreshold = 72;

  els.list.addEventListener("pointerdown", event => {
    const card = event.target.closest(".task-card");
    if (!card || event.button > 0) return;
    const row = card.closest(".swipe-row");
    gesture = { row, card, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, horizontal: false };
    card.setPointerCapture(event.pointerId);
    row.classList.remove("settling");
  });

  els.list.addEventListener("pointermove", event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (!gesture.horizontal && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      gesture = null;
      return;
    }
    if (dx >= 0 && !gesture.horizontal) return;
    if (Math.abs(dx) > 8) gesture.horizontal = true;
    if (!gesture.horizontal) return;
    gesture.dx = Math.max(-maxReveal, Math.min(0, dx));
    gesture.row.classList.add("swiping");
    gesture.card.style.transform = `translateX(${gesture.dx}px)`;
  });

  const finishGesture = event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const { row, card, dx, horizontal } = gesture;
    gesture = null;
    if (horizontal && Math.abs(dx) >= deleteThreshold) {
      row.classList.remove("swiping");
      row.classList.add("deleting");
      row.dataset.swiped = "true";
      setTimeout(() => onDelete(row.dataset.id), 180);
      return;
    }
    row.classList.remove("swiping");
    row.classList.add("settling");
    card.style.transform = "translateX(0)";
    setTimeout(() => row.classList.remove("settling"), 180);
  };

  els.list.addEventListener("pointerup", finishGesture);
  els.list.addEventListener("pointercancel", finishGesture);
}

