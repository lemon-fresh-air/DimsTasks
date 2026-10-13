let tasks = [];
let selectedTaskIds = new Set();
let completionAudioContext;
let editingSelectedTaskDates = false;

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
  renderTasks(tasks, selectedTaskIds);
  if (previousPositions) animateTaskReflow(previousPositions);
}

async function loadAndNormalizeTaskOrder() {
  const loaded = await taskDb.all();
  const normalized = normalizeTaskOrder(loaded);
  const changed = normalized.filter((task, index) => task !== loaded[index]);
  if (changed.length) await taskDb.putMany(changed);
  tasks = normalized.sort(compareTasks);
  renderTasks(tasks, selectedTaskIds);
}

function selectTask(id) {
  selectedTaskIds = new Set([id]);
  renderTasks(tasks, selectedTaskIds);
}

function toggleTaskSelection(id) {
  const next = new Set(selectedTaskIds);
  if (next.has(id)) next.delete(id); else next.add(id);
  selectedTaskIds = next;
  renderTasks(tasks, selectedTaskIds);
}

function clearTaskSelection() {
  selectedTaskIds = new Set();
  renderTasks(tasks, selectedTaskIds);
}

async function deleteSelectedTasks() {
  const deletedTasks = tasks.filter(task => selectedTaskIds.has(task.id));
  if (!deletedTasks.length) return;
  const deletedIds = deletedTasks.map(task => task.id);
  tasks = tasks.filter(task => !selectedTaskIds.has(task.id));
  selectedTaskIds = new Set();
  renderTasks(tasks, selectedTaskIds);
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
  editingSelectedTaskDates = true;
  openDatePicker(sharedDate);
}

async function updateSelectedTaskDates(dueDate) {
  const selectedIds = new Set(selectedTaskIds);
  const previousPositions = captureTaskPositions();
  const updatedAt = new Date().toISOString();
  const updatedTasks = tasks.map(task => selectedIds.has(task.id) ? { ...task, dueDate: dueDate || null, updatedAt } : task);
  const changed = updatedTasks.filter(task => selectedIds.has(task.id));
  if (!changed.length) return;
  try {
    await taskDb.putMany(changed);
    tasks = updatedTasks.sort(compareTasks);
    renderTasks(tasks, selectedTaskIds);
    await animateBulkDateChange(selectedIds, previousPositions);
    clearTaskSelection();
    toast(changed.length === 1 ? "Дату завдання змінено" : `Змінено дату завдань: ${changed.length}`);
  } catch (_error) {
    await refresh();
    toast("Не вдалося змінити дату");
  }
}

async function addTask() {
  const title = els.input.value.trim();
  if (!title) { els.input.focus(); return false; }
  const task = createTask({ title, description: els.description.value.trim(), dueDate: els.date.value || null, position: 0 });
  const scope = taskOrderScope(task);
  const shifted = tasks.filter(item => taskOrderScope(item) === scope).map(item => ({ ...item, position: item.position + 1 }));
  await taskDb.putMany([task, ...shifted]);
  await refresh();
  return true;
}

async function reorderSelectedTasks({ beforeId }) {
  const selected = tasks.filter(task => selectedTaskIds.has(task.id)).sort(compareTasks);
  if (!selected.length) return false;
  const previous = tasks;
  const scope = taskOrderScope(selected[0]);
  const reordered = reorderTaskBlock(tasks, selectedTaskIds, beforeId, scope);
  const changed = reordered.filter((task, index) => task !== tasks[index]);
  if (!changed.length) return false;
  tasks = reordered.sort(compareTasks);
  renderTasks(tasks, selectedTaskIds);
  try {
    await taskDb.putMany(changed);
    return true;
  } catch (_error) {
    tasks = previous;
    renderTasks(tasks, selectedTaskIds);
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
  await taskDb.put({ ...task, title, description: els.description.value.trim(), dueDate: els.date.value || null, updatedAt: new Date().toISOString() });
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
  renderTasks(tasks, selectedTaskIds);
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
    renderTasks(tasks, selectedTaskIds);
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

els.add.addEventListener("click", openNewTaskEditor);
els.editorBack.addEventListener("click", () => saveAndLeaveTaskEditor({ allowEmptyNew: true }));
els.desktopSaveTask.addEventListener("click", () => saveAndLeaveTaskEditor({ allowEmptyNew: true }));
els.selectionClose.addEventListener("click", clearTaskSelection);
els.dateSelected.addEventListener("click", openSelectedTaskDatePicker);
els.deleteSelected.addEventListener("click", deleteSelectedTasks);
document.addEventListener("keydown", event => {
  if (event.key !== "Escape" || !selectedTaskIds.size || !matchMedia("(min-width: 760px)").matches) return;
  if (!els.editor.hidden || !els.datePickerBackdrop.hidden) return;
  event.preventDefault();
  clearTaskSelection();
});
els.datePickerOpen.addEventListener("click", () => { editingSelectedTaskDates = false; openDatePicker(); });
els.datePickerClose.addEventListener("click", () => { editingSelectedTaskDates = false; closeDatePicker(); });
els.datePickerBackdrop.addEventListener("click", event => { if (event.target === els.datePickerBackdrop) { editingSelectedTaskDates = false; closeDatePicker(); } });
els.datePicker.addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); editingSelectedTaskDates = false; closeDatePicker(); }
});
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
els.datePickerSave.addEventListener("click", async () => {
  if (editingSelectedTaskDates) {
    editingSelectedTaskDates = false;
    closeDatePicker();
    await updateSelectedTaskDates(pendingDateValue);
    return;
  }
  els.date.value = pendingDateValue;
  els.dateLabel.textContent = readableDate(pendingDateValue);
  applyDateTone(els.datePickerOpen, pendingDateValue);
  updateDesktopSaveState();
  closeDatePicker();
});
els.input.addEventListener("input", () => { els.input.style.height = "auto"; els.input.style.height = `${Math.min(els.input.scrollHeight, 150)}px`; updateDesktopSaveState(); });
els.description.addEventListener("input", () => { resizeDescription(); updateDesktopSaveState(); });
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
  const changes = { title: els.input.value.trim() || task.title, description: els.description.value.trim(), dueDate: els.date.value || null };
  await completeTask(task, changes, els.detailToggle);
  els.editor.dataset.taskId = "";
  hideTaskEditor();
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
loadAndNormalizeTaskOrder().catch(() => toast("Не вдалося відкрити локальне сховище"));
