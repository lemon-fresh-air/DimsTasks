let tasks = [];
let selectedTaskIds = new Set();

async function refresh() {
  tasks = (await taskDb.all()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  selectedTaskIds = new Set([...selectedTaskIds].filter(id => tasks.some(task => task.id === id)));
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

async function addTask() {
  const title = els.input.value.trim();
  if (!title) { els.input.focus(); return false; }
  await taskDb.put(createTask({ title, description: els.description.value.trim(), dueDate: els.date.value || null }));
  await refresh();
  return true;
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

els.add.addEventListener("click", openNewTaskEditor);
els.editorBack.addEventListener("click", () => saveAndLeaveTaskEditor({ allowEmptyNew: true }));
els.selectionClose.addEventListener("click", clearTaskSelection);
els.deleteSelected.addEventListener("click", deleteSelectedTasks);
els.date.addEventListener("change", () => { els.dateLabel.textContent = readableDate(els.date.value); });
els.input.addEventListener("input", () => { els.input.style.height = "auto"; els.input.style.height = `${Math.min(els.input.scrollHeight, 150)}px`; });
els.description.addEventListener("input", resizeDescription);
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
  const opener = event.target.closest(".task-open");
  if (opener && row) {
    const task = tasks.find(item => item.id === row.dataset.id);
    if (task) openTaskDetails(task);
    return;
  }
  if (!toggle) return;
  const task = tasks.find(item => item.id === row.dataset.id);
  const completedAt = new Date().toISOString();
  await taskDb.put({ ...task, status: "completed", completedAt, updatedAt: completedAt });
  await refresh();
  toast("Виконано");
});

els.detailToggle.addEventListener("click", async () => {
  const task = tasks.find(item => item.id === els.editor.dataset.taskId);
  if (!task) return;
  const completedAt = new Date().toISOString();
  await taskDb.put({ ...task, title: els.input.value.trim() || task.title, description: els.description.value.trim(), dueDate: els.date.value || null, status: "completed", completedAt, updatedAt: completedAt });
  els.editor.dataset.taskId = "";
  hideTaskEditor();
  await refresh();
  toast("Виконано");
});

enableTaskSwipe({
  onDelete: deleteTask,
  isSelectionMode: () => selectedTaskIds.size > 0,
  onLongPress: selectTask
});
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
refresh().catch(() => toast("Не вдалося відкрити локальне сховище"));
