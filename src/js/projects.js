let projects = [];
let activeProjectId = null;

const projectEls = {
  shell: document.querySelector(".app-shell"),
  overview: document.querySelector("#projects-overview"),
  count: document.querySelector("#projects-count"),
  add: document.querySelector("#project-add"),
  createForm: document.querySelector("#project-create-form"),
  createTitle: document.querySelector("#project-create-title"),
  createCancel: document.querySelector("#project-create-cancel"),
  empty: document.querySelector("#projects-empty"),
  activeList: document.querySelector("#active-projects"),
  completed: document.querySelector("#completed-projects"),
  completedCount: document.querySelector("#completed-projects-count"),
  completedList: document.querySelector("#completed-project-list"),
  cardTemplate: document.querySelector("#project-card-template"),
  screen: document.querySelector("#project-screen"),
  selectionToolbar: document.querySelector("#project-selection-toolbar"),
  selectionClose: document.querySelector("#project-selection-close"),
  selectionCount: document.querySelector("#project-selection-count"),
  dateSelected: document.querySelector("#project-date-selected"),
  listSelected: document.querySelector("#project-list-selected"),
  listOptions: document.querySelector("#project-list-options"),
  deleteSelected: document.querySelector("#project-delete-selected"),
  back: document.querySelector("#project-back"),
  editOpen: document.querySelector("#project-edit-open"),
  editClose: document.querySelector("#project-edit-close"),
  editor: document.querySelector("#project-editor"),
  heading: document.querySelector("#project-screen-title"),
  goalSummary: document.querySelector("#project-goal-summary"),
  descriptionSummary: document.querySelector("#project-description-summary"),
  descriptionToggle: document.querySelector("#project-description-toggle"),
  deadlineSummary: document.querySelector("#project-deadline-summary"),
  title: document.querySelector("#project-title"),
  goal: document.querySelector("#project-goal"),
  description: document.querySelector("#project-description"),
  dueDate: document.querySelector("#project-due-date"),
  dueTime: document.querySelector("#project-due-time"),
  datePickerOpen: document.querySelector("#project-date-picker-open"),
  dateLabel: document.querySelector("#project-date-label"),
  showCountdown: document.querySelector("#project-show-countdown"),
  countdown: document.querySelector("#project-countdown"),
  saveStatus: document.querySelector("#project-save-status"),
  progress: document.querySelector("#project-progress"),
  steps: document.querySelector("#project-steps"),
  tasksExpand: document.querySelector("#project-tasks-expand"),
  tasksEmpty: document.querySelector("#project-tasks-empty"),
  taskList: document.querySelector("#project-task-list"),
  stepForm: document.querySelector("#project-step-form"),
  stepTitle: document.querySelector("#project-step-title"),
  mainSave: document.querySelector("#project-main-save"),
  mainComplete: document.querySelector("#project-main-complete"),
  save: document.querySelector("#project-save"),
  complete: document.querySelector("#project-complete"),
  delete: document.querySelector("#project-delete")
};

function projectSteps(projectId) {
  return tasks.filter(task => task.projectId === projectId).sort(compareProjectTasks);
}

function renderProjectCountdown() {
  const value = projectEls.showCountdown.checked ? projectCountdown(projectEls.dueDate.value, localDateValue()) : null;
  projectEls.countdown.hidden = !value;
  projectEls.countdown.textContent = value?.text || "";
  projectEls.countdown.dataset.overdue = String(value?.overdue === true);
}

function renderProjectCard(project, container) {
  const card = projectEls.cardTemplate.content.firstElementChild.cloneNode(true);
  const steps = projectSteps(project.id);
  const completed = steps.filter(isTaskCompleted).length;
  const current = currentProjectTask(tasks, project.id);
  card.dataset.projectId = project.id;
  card.querySelector(".project-card-title").textContent = project.title;
  card.querySelector(".project-card-goal").textContent = project.goal || "";
  card.querySelector(".project-card-progress").textContent = `${completed}/${steps.length} виконано`;
  card.querySelector(".project-card-current").textContent = current ? `Поточний крок: ${current.title}` : "Немає поточного кроку";
  container.append(card);
}

function renderProjects() {
  const active = projects.filter(project => project.status !== "completed").sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const completed = projects.filter(project => project.status === "completed").sort((a, b) => String(b.completedAt || b.updatedAt).localeCompare(String(a.completedAt || a.updatedAt)));
  projectEls.activeList.replaceChildren();
  projectEls.completedList.replaceChildren();
  active.forEach(project => renderProjectCard(project, projectEls.activeList));
  completed.forEach(project => renderProjectCard(project, projectEls.completedList));
  projectEls.count.textContent = `${active.length} активних`;
  projectEls.empty.hidden = projects.length > 0;
  projectEls.completed.hidden = completed.length === 0;
  projectEls.completedCount.textContent = completed.length;
  if (activeProjectId) renderOpenProject();
}

async function loadProjects() {
  projects = await projectDb.all();
  renderProjects();
}

function openProjects() {
  activeProjectId = null;
  projectEls.shell.classList.add("projects-mode");
  projectEls.overview.hidden = false;
  setActivePrimaryNav("projects");
  selectedTaskIds = new Set();
  renderProjects();
}

function closeProjects() {
  projectEls.shell.classList.remove("projects-mode");
  projectEls.overview.hidden = true;
}

function renderProjectTask(task) {
  const row = els.template.content.firstElementChild.cloneNode(true);
  const list = lists.find(item => item.id === task.listId);
  row.dataset.id = task.id;
  const selected = selectedTaskIds.has(task.id);
  row.classList.toggle("selected", selected);
  row.setAttribute("aria-selected", String(selected));
  row.querySelector(".task-text").textContent = task.title;
  const description = row.querySelector(".task-description-preview");
  description.textContent = task.description || "";
  description.hidden = !task.description;
  const date = row.querySelector(".task-date");
  date.textContent = readableDueDate(task.dueDate, task.dueTime);
  applyDateTone(date, task.dueDate, task.dueTime);
  row.querySelector(".task-project-name").textContent = displayListTitle(list);
  row.querySelector(".toggle").classList.toggle("done", isTaskCompleted(task));
  projectEls.taskList.append(row);
}

function renderOpenProject() {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project || projectEls.screen.hidden) return;
  const steps = projectSteps(project.id);
  const completedCount = steps.filter(isTaskCompleted).length;
  const selectedHere = new Set(steps.filter(task => selectedTaskIds.has(task.id)).map(task => task.id));
  projectEls.heading.textContent = project.title;
  projectEls.goalSummary.textContent = project.goal ? `Мета: ${project.goal}` : "";
  projectEls.descriptionSummary.textContent = project.description || "";
  projectEls.descriptionToggle.hidden = !project.description;
  projectEls.descriptionToggle.setAttribute("aria-expanded", "false");
  const countdown = project.showCountdown ? projectCountdown(project.dueDate, localDateValue()) : null;
  projectEls.deadlineSummary.hidden = !project.dueDate;
  projectEls.deadlineSummary.textContent = project.dueDate ? `Термін: ${readableDueDate(project.dueDate, project.dueTime)}${countdown ? ` · ${countdown.text}` : ""}` : "";
  projectEls.deadlineSummary.dataset.overdue = String(countdown?.overdue === true);
  if (document.activeElement !== projectEls.title) projectEls.title.value = project.title;
  if (document.activeElement !== projectEls.goal) projectEls.goal.value = project.goal || "";
  if (document.activeElement !== projectEls.description) projectEls.description.value = project.description || "";
  if (document.activeElement !== projectEls.dueDate) projectEls.dueDate.value = project.dueDate || "";
  if (document.activeElement !== projectEls.dueTime) projectEls.dueTime.value = project.dueTime || "";
  projectEls.dateLabel.textContent = readableDueDate(project.dueDate, project.dueTime);
  applyDateTone(projectEls.datePickerOpen, project.dueDate, project.dueTime);
  projectEls.showCountdown.checked = project.showCountdown === true;
  renderProjectCountdown();
  projectEls.progress.textContent = `${completedCount}/${steps.length}`;
  projectEls.tasksEmpty.hidden = steps.length > 0;
  projectEls.tasksExpand.hidden = steps.length < 5;
  projectEls.complete.textContent = project.status === "completed" ? "Повернути в активні" : "Завершити проєкт";
  projectEls.mainComplete.textContent = projectEls.complete.textContent;
  projectEls.taskList.replaceChildren();
  steps.forEach(renderProjectTask);
  projectEls.taskList.classList.toggle("selection-mode", selectedHere.size > 0);
  projectEls.selectionToolbar.hidden = selectedHere.size === 0;
  projectEls.screen.querySelector(".project-screen-header").hidden = selectedHere.size > 0;
  projectEls.selectionCount.textContent = `Вибрано: ${selectedHere.size}`;
  projectEls.listOptions.replaceChildren(...lists.map(createListDropdownOption));
}

function openProject(projectId) {
  const project = projects.find(item => item.id === projectId);
  if (!project) return;
  activeProjectId = projectId;
  selectedTaskIds = new Set();
  projectEls.screen.hidden = false;
  document.body.classList.add("project-screen-open");
  renderOpenProject();
}

function openProjectEditor() {
  renderOpenProject();
  projectEls.editor.hidden = false;
  document.body.classList.add("project-editor-open");
  projectEls.title.focus();
}

function closeProjectEditor() {
  projectEls.editor.hidden = true;
  document.body.classList.remove("project-editor-open");
  renderOpenProject();
  projectEls.editOpen.focus();
}

function toggleProjectTasks() {
  const expanded = !projectEls.steps.classList.contains("is-expanded");
  projectEls.steps.classList.toggle("is-expanded", expanded);
  projectEls.tasksExpand.setAttribute("aria-expanded", String(expanded));
  projectEls.tasksExpand.setAttribute("aria-label", expanded ? "Згорнути завдання" : "Розгорнути всі завдання");
  document.body.classList.toggle("project-tasks-open", expanded);
  if (expanded) projectEls.tasksExpand.focus();
}

async function closeProject({ animated = false } = {}) {
  if (!projectEls.editor.hidden) closeProjectEditor();
  if (projectEls.steps.classList.contains("is-expanded")) toggleProjectTasks();
  if (animated) {
    projectEls.screen.classList.add("is-closing");
    await new Promise(resolve => setTimeout(resolve, 230));
  }
  selectedTaskIds = new Set();
  activeProjectId = null;
  projectEls.screen.hidden = true;
  projectEls.screen.classList.remove("is-closing");
  document.body.classList.remove("project-screen-open");
  renderProjects();
}

async function saveProjectFields({ closeAfter = false } = {}) {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project) return;
  const title = projectEls.title.value.trim();
  if (!title) {
    projectEls.saveStatus.textContent = "Назва не може бути порожньою";
    return;
  }
  const updated = createProject({ ...project, title, goal: projectEls.goal.value.trim(), description: projectEls.description.value.trim(), dueDate: projectEls.dueDate.value || null, dueTime: projectEls.dueDate.value && projectEls.dueTime.value ? projectEls.dueTime.value : null, showCountdown: projectEls.showCountdown.checked, updatedAt: new Date().toISOString() });
  projectEls.saveStatus.textContent = "Збереження…";
  try {
    await projectDb.put(updated);
    projects = projects.map(item => item.id === updated.id ? updated : item);
    projectEls.heading.textContent = updated.title;
    projectEls.saveStatus.textContent = "Збережено";
    renderProjects();
    if (closeAfter) closeProjectEditor();
  } catch (_error) {
    projectEls.saveStatus.textContent = "Не вдалося зберегти";
  }
}

function markProjectDirty() {
  projectEls.saveStatus.textContent = "Є незбережені зміни";
}

async function addProject(title) {
  const value = title.trim();
  if (!value) return;
  const project = createProject({ title: value, position: projects.filter(item => item.status !== "completed").length });
  await projectDb.put(project);
  projects.push(project);
  projectEls.createForm.hidden = true;
  projectEls.createTitle.value = "";
  renderProjects();
  openProject(project.id);
}

async function addProjectStep(title) {
  const project = projects.find(item => item.id === activeProjectId);
  const value = title.trim();
  if (!project || !value) return;
  const inboxTasks = tasks.filter(task => (task.listId || INBOX_LIST_ID) === INBOX_LIST_ID && !task.sectionId);
  const task = createTask({ title: value, listId: INBOX_LIST_ID, position: inboxTasks.length ? Math.max(...inboxTasks.map(item => item.position || 0)) + 1 : 0, projectId: project.id, projectPosition: projectSteps(project.id).length });
  await taskDb.put(task);
  tasks.push(task);
  if (projectEls.stepTitle.value.trim() === value) projectEls.stepTitle.value = "";
  renderOpenProject();
  renderProjects();
}

async function toggleProjectStatus() {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project) return;
  const completing = project.status !== "completed";
  if (completing && !confirm("Завершити цей проєкт?")) return;
  const now = new Date().toISOString();
  const updated = { ...project, status: completing ? "completed" : "active", completedAt: completing ? now : null, updatedAt: now };
  await projectDb.put(updated);
  projects = projects.map(item => item.id === updated.id ? updated : item);
  renderOpenProject();
  renderProjects();
}

async function deleteProject() {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project || !confirm("Видалити проєкт? Його завдання залишаться у своїх списках.")) return;
  const now = new Date().toISOString();
  await projectDb.deleteAndDetachTasks(project.id, now);
  tasks = tasks.map(task => task.projectId === project.id ? { ...task, projectId: null, projectPosition: null, updatedAt: now } : task);
  projects = projects.filter(item => item.id !== project.id);
  closeProject();
  renderCurrentTasks();
  toast("Проєкт видалено, завдання збережено");
}

async function reorderSelectedProjectSteps({ beforeId }) {
  const projectSelectedIds = new Set(projectSteps(activeProjectId).filter(task => selectedTaskIds.has(task.id)).map(task => task.id));
  const reordered = reorderProjectStepBlock(tasks, activeProjectId, projectSelectedIds, beforeId);
  const changed = reordered.filter((task, index) => task !== tasks[index]);
  if (!changed.length) return;
  tasks = reordered;
  renderOpenProject();
  renderProjects();
  try { await taskDb.putMany(changed); }
  catch (_error) { await refresh(); toast("Не вдалося зберегти порядок кроків"); }
}

projectEls.add.addEventListener("click", () => { projectEls.createForm.hidden = false; projectEls.createTitle.focus(); });
projectEls.createCancel.addEventListener("click", () => { projectEls.createForm.hidden = true; projectEls.createTitle.value = ""; });
projectEls.createForm.addEventListener("submit", event => { event.preventDefault(); addProject(projectEls.createTitle.value); });
[projectEls.activeList, projectEls.completedList].forEach(container => container.addEventListener("click", event => {
  const card = event.target.closest("[data-project-id]");
  if (card) openProject(card.dataset.projectId);
}));
projectEls.back.addEventListener("click", closeProject);
projectEls.editOpen.addEventListener("click", openProjectEditor);
projectEls.editClose.addEventListener("click", closeProjectEditor);
projectEls.descriptionToggle.addEventListener("click", () => {
  const expanded = projectEls.descriptionToggle.getAttribute("aria-expanded") !== "true";
  projectEls.descriptionToggle.setAttribute("aria-expanded", String(expanded));
});
projectEls.tasksExpand.addEventListener("click", toggleProjectTasks);
projectEls.mainSave.addEventListener("click", () => closeProject({ animated: true }));
projectEls.mainComplete.addEventListener("click", toggleProjectStatus);
[projectEls.title, projectEls.goal, projectEls.description, projectEls.dueDate, projectEls.dueTime].forEach(field => field.addEventListener("input", markProjectDirty));
projectEls.datePickerOpen.addEventListener("click", () => {
  editingSelectedTaskDates = false;
  editingProjectDate = true;
  openDatePicker(projectEls.dueDate.value, projectEls.dueTime.value);
});
projectEls.showCountdown.addEventListener("change", () => { markProjectDirty(); renderProjectCountdown(); });
projectEls.save.addEventListener("click", () => saveProjectFields({ closeAfter: true }));
projectEls.stepForm.addEventListener("submit", event => { event.preventDefault(); addProjectStep(projectEls.stepTitle.value); });
projectEls.complete.addEventListener("click", toggleProjectStatus);
projectEls.delete.addEventListener("click", deleteProject);
projectEls.taskList.addEventListener("click", async event => {
  const row = event.target.closest(".swipe-row");
  if (!row || row.dataset.swiped) { if (row) delete row.dataset.swiped; return; }
  if (row.dataset.longPressed) { delete row.dataset.longPressed; return; }
  if (selectedTaskIds.size) { toggleTaskSelection(row.dataset.id); return; }
  const task = tasks.find(item => item.id === row.dataset.id);
  if (event.target.closest(".toggle")) { await completeTask(task, {}, event.target.closest(".toggle")); renderOpenProject(); return; }
  if (event.target.closest(".task-card")) openTaskDetails(task);
});

projectEls.selectionClose.addEventListener("click", clearTaskSelection);
projectEls.dateSelected.addEventListener("click", openSelectedTaskDatePicker);
projectEls.listSelected.addEventListener("click", () => {
  projectEls.listOptions.hidden = !projectEls.listOptions.hidden;
  projectEls.listOptions.scrollLeft = 0;
  projectEls.listSelected.setAttribute("aria-expanded", String(!projectEls.listOptions.hidden));
});
projectEls.listOptions.addEventListener("click", event => {
  const option = event.target.closest("[data-list-id]");
  if (!option) return;
  projectEls.listOptions.hidden = true;
  projectEls.listSelected.setAttribute("aria-expanded", "false");
  moveSelectedTasksToList(option.dataset.listId);
});
projectEls.deleteSelected.addEventListener("click", deleteSelectedTasks);

enableTaskGestures({
  container: projectEls.taskList,
  onDelete: deleteTask,
  isSelectionMode: () => selectedTaskIds.size > 0,
  isSelected: id => selectedTaskIds.has(id),
  onLongPress: selectTask,
  onSelectOnly: selectTask,
  getSelectedIds: () => new Set(selectedTaskIds),
  onReorder: reorderSelectedProjectSteps,
  requireSelectionForDrag: true
});
