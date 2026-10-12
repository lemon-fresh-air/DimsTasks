let tasks = [];
let selectedTaskIds = new Set();
let completionAudioContext;

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
      { opacity: 1, transform: "translateX(0)" },
      { opacity: 1, transform: "translateX(0)", offset: .7 },
      { opacity: 0, transform: "translateX(10px)" }
    ], { duration: 380, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
  }
  playCompletionSound();
}

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

async function completeTask(task, changes = {}, toggle) {
  if (!task) return;
  if (toggle) toggle.disabled = true;
  startCompletionFeedback(toggle);
  await new Promise(resolve => setTimeout(resolve, 380));
  const completedAt = new Date().toISOString();
  const completedTask = { ...task, ...changes, status: "completed", completedAt, updatedAt: completedAt };
  await taskDb.put(completedTask);
  await refresh();
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
  await completeTask(task, {}, toggle);
});

els.detailToggle.addEventListener("click", async () => {
  const task = tasks.find(item => item.id === els.editor.dataset.taskId);
  if (!task) return;
  const changes = { title: els.input.value.trim() || task.title, description: els.description.value.trim(), dueDate: els.date.value || null };
  await completeTask(task, changes, els.detailToggle);
  els.editor.dataset.taskId = "";
  hideTaskEditor();
});

enableTaskSwipe({
  onDelete: deleteTask,
  isSelectionMode: () => selectedTaskIds.size > 0,
  onLongPress: selectTask
});
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
refresh().catch(() => toast("Не вдалося відкрити локальне сховище"));
