let projects = [];
let activeProjectId = null;
let selectedProjectIds = new Set();
let projectCompleteDialogResolve = null;
let projectCompleteDialogReturnFocus = null;
let projectDeleteDialogResolve = null;
let projectDeleteDialogReturnFocus = null;

const projectEls = {
  shell: document.querySelector(".app-shell"),
  overview: document.querySelector("#projects-overview"),
  overviewHeader: document.querySelector(".projects-header"),
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
  overviewSelectionToolbar: document.querySelector("#projects-selection-toolbar"),
  overviewSelectionClose: document.querySelector("#projects-selection-close"),
  overviewSelectionCount: document.querySelector("#projects-selection-count"),
  completeSelected: document.querySelector("#projects-complete-selected"),
  deleteSelectedProjects: document.querySelector("#projects-delete-selected"),
  completeDialogBackdrop: document.querySelector("#project-complete-dialog-backdrop"),
  completeDialog: document.querySelector("#project-complete-dialog"),
  completeDialogTitle: document.querySelector("#project-complete-dialog-title"),
  completeTasks: document.querySelector("#project-complete-tasks"),
  completeNo: document.querySelector("#project-complete-no"),
  completeYes: document.querySelector("#project-complete-yes"),
  deleteDialogBackdrop: document.querySelector("#project-delete-dialog-backdrop"),
  deleteDialog: document.querySelector("#project-delete-dialog"),
  deleteDialogTitle: document.querySelector("#project-delete-dialog-title"),
  deleteKeepTasks: document.querySelector("#project-delete-keep-tasks"),
  deleteNo: document.querySelector("#project-delete-no"),
  deleteYes: document.querySelector("#project-delete-yes"),
  overdueDialogBackdrop: document.querySelector("#project-overdue-dialog-backdrop"),
  overdueDialog: document.querySelector("#project-overdue-dialog"),
  overdueMessage: document.querySelector("#project-overdue-dialog-message"),
  overdueCancel: document.querySelector("#project-overdue-cancel"),
  overdueClear: document.querySelector("#project-overdue-clear"),
  overdueDelete: document.querySelector("#project-overdue-delete"),
  convertTask: document.querySelector("#project-convert-task"),
  convertDialogBackdrop: document.querySelector("#project-convert-dialog-backdrop"),
  convertDialog: document.querySelector("#project-convert-dialog"),
  convertCancel: document.querySelector("#project-convert-cancel"),
  convertConfirm: document.querySelector("#project-convert-confirm"),
  cardTemplate: document.querySelector("#project-card-template"),
  screen: document.querySelector("#project-screen"),
  selectionToolbar: document.querySelector("#project-selection-toolbar"),
  selectionClose: document.querySelector("#project-selection-close"),
  selectionCount: document.querySelector("#project-selection-count"),
  selectAll: document.querySelector("#project-select-all-tasks"),
  dateSelected: document.querySelector("#project-date-selected"),
  listSelected: document.querySelector("#project-list-selected"),
  listOptions: document.querySelector("#project-list-options"),
  createFromSteps: document.querySelector("#project-create-from-steps"),
  addToExisting: document.querySelector("#project-add-to-existing"),
  detachSelected: document.querySelector("#project-detach-selected"),
  selectionMore: document.querySelector(".project-selection-more"),
  selectionMoreTrigger: document.querySelector("#project-selection-more-trigger"),
  selectionMoreMenu: document.querySelector("#project-selection-more-menu"),
  createFromStepsBackdrop: document.querySelector("#project-create-from-steps-backdrop"),
  createFromStepsDialog: document.querySelector("#project-create-from-steps-dialog"),
  createFromStepsName: document.querySelector("#project-create-from-steps-name"),
  createExistingFields: document.querySelector("#project-create-existing-fields"),
  createExistingSelect: document.querySelector("#project-create-existing-select"),
  createNewFields: document.querySelector("#project-create-new-fields"),
  createFromStepsCancel: document.querySelector("#project-create-from-steps-cancel"),
  createFromStepsConfirm: document.querySelector("#project-create-from-steps-confirm"),
  deleteSelected: document.querySelector("#project-delete-selected"),
  back: document.querySelector("#project-back"),
  editOpen: document.querySelector("#project-edit-open"),
  rootVisibility: document.querySelector("#project-root-visibility"),
  hideRoot: document.querySelector("#project-hide-root"),
  editClose: document.querySelector("#project-edit-close"),
  editor: document.querySelector("#project-editor"),
  heading: document.querySelector("#project-screen-title"),
  title: document.querySelector("#project-title"),
  description: document.querySelector("#project-description"),
  dueDate: document.querySelector("#project-due-date"),
  dueTime: document.querySelector("#project-due-time"),
  datePickerOpen: document.querySelector("#project-date-picker-open"),
  dateLabel: document.querySelector("#project-date-label"),
  showCountdown: document.querySelector("#project-show-countdown"),
  defaultList: document.querySelector("#project-default-list"),
  countdown: document.querySelector("#project-countdown"),
  saveStatus: document.querySelector("#project-save-status"),
  progress: document.querySelector("#project-progress"),
  steps: document.querySelector("#project-steps"),
  tasksExpand: document.querySelector("#project-tasks-expand"),
  tasksEmpty: document.querySelector("#project-tasks-empty"),
  taskList: document.querySelector("#project-task-list"),
  sectionCreate: document.querySelector("#project-section-create"),
  sectionName: document.querySelector("#project-section-name"),
  attachBackdrop: document.querySelector("#project-attach-backdrop"),
  attachDialog: document.querySelector("#project-attach-dialog"),
  attachClose: document.querySelector("#project-attach-close"),
  attachSearch: document.querySelector("#project-attach-search"),
  attachResults: document.querySelector("#project-attach-results"),
  attachEmpty: document.querySelector("#project-attach-empty"),
  attachSave: document.querySelector("#project-attach-save"),
  addNewFirst: document.querySelector("#project-add-new-first"),
  mainComplete: document.querySelector("#project-main-complete"),
  actionsTrigger: document.querySelector("#project-actions-trigger"),
  actionsMenu: document.querySelector("#project-actions-menu"),
  sectionsOpen: document.querySelector("#project-assign-section"),
  sectionsDialog: document.querySelector("#project-sections-dialog"),
  sectionActionDialog: document.querySelector("#project-section-action-dialog"),
  descriptionOpen: document.querySelector("#project-description-open"),
  descriptionDialog: document.querySelector("#project-description-dialog"),
  complete: document.querySelector("#project-complete"),
  delete: document.querySelector("#project-delete")
};
let attachSelectedIds = new Set();
let attachTargetSectionId = null;
let attachReturnFocus = null;

function projectSteps(projectId) {
  return tasks.filter(task => task.projectId === projectId).sort(compareProjectTasks);
}

async function rememberProjectList(projectId, listId) {
  const project = projects.find(item => item.id === projectId);
  if (!project || project.lastListId === listId || !lists.some(list => list.id === listId)) return;
  const updated = createProject({ ...project, lastListId: listId, updatedAt: new Date().toISOString() });
  projects = projects.map(item => item.id === updated.id ? updated : item);
  try {
    await projectDb.put(updated);
  } catch (_error) {
    toast("Не вдалося запам’ятати список проєкту");
  }
}

async function rememberProjectLists(tasksToRemember, listId) {
  const projectIds = new Set(tasksToRemember.map(task => task.projectId).filter(Boolean));
  await Promise.all([...projectIds].map(projectId => rememberProjectList(projectId, listId)));
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
  const countdown = project.dueDate ? projectCountdown(project.dueDate, localDateValue()) : null;
  card.dataset.projectId = project.id;
  const selected = selectedProjectIds.has(project.id);
  card.classList.toggle("selected", selected);
  card.setAttribute("aria-pressed", String(selected));
  card.querySelector(".project-card-title").textContent = project.title;
  card.querySelector(".project-card-progress").textContent = `${completed}/${steps.length}`;
  const deadline = card.querySelector(".project-card-deadline");
  deadline.hidden = !countdown;
  deadline.textContent = countdown?.text || "";
  deadline.dataset.overdue = String(countdown?.overdue === true);
  container.append(card);
}

function renderProjects() {
  const active = projects.filter(project => project.status !== "completed").sort(compareProjects);
  const desktopCount = document.querySelector("#nav-projects .desktop-primary-count");
  desktopCount.textContent = String(active.length);
  desktopCount.setAttribute("aria-label", `Проєктів: ${active.length}`);
  const completed = projects.filter(project => project.status === "completed").sort((a, b) => String(b.completedAt || b.updatedAt).localeCompare(String(a.completedAt || a.updatedAt)));
  projectEls.activeList.replaceChildren();
  projectEls.completedList.replaceChildren();
  active.forEach(project => renderProjectCard(project, projectEls.activeList));
  completed.forEach(project => renderProjectCard(project, projectEls.completedList));
  selectedProjectIds = new Set(active.filter(project => selectedProjectIds.has(project.id)).map(project => project.id));
  const selectionMode = selectedProjectIds.size > 0;
  projectEls.overview.classList.toggle("selection-mode", selectionMode);
  projectEls.overviewSelectionToolbar.hidden = !selectionMode;
  projectEls.overviewHeader.hidden = selectionMode;
  projectEls.overviewSelectionCount.textContent = `Вибрано: ${selectedProjectIds.size}`;
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
  selectedProjectIds = new Set();
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

function renderProjectTask(task, target = projectEls.taskList) {
  const row = els.template.content.firstElementChild.cloneNode(true);
  const project = projects.find(item => item.id === task.projectId);
  const list = lists.find(item => item.id === (task.listId || INBOX_LIST_ID))
    || lists.find(item => item.kind === "inbox");
  row.dataset.id = task.id;
  const selected = selectedTaskIds.has(task.id);
  const completed = isTaskCompleted(task);
  row.classList.toggle("selected", selected);
  row.classList.toggle("completed", completed);
  row.setAttribute("aria-selected", String(selected));
  row.querySelector(".task-text").textContent = task.title;
  if (currentProjectTask(tasks, task.projectId, projects)?.id === task.id) {
    row.classList.add("current-project-step");
    const marker = document.createElement("span");
    marker.className = "sr-only";
    marker.textContent = "Поточний крок";
    row.querySelector(".task-open").prepend(marker);
  }
  const description = row.querySelector(".task-description-preview");
  description.textContent = task.description ? richPreviewText(task.description) : "";
  description.hidden = !task.description;
  const date = row.querySelector(".task-date");
  renderTaskDueDate(date, task);
  const projectBadge = row.querySelector(".task-project");
  projectBadge.hidden = !project || task.projectId === activeProjectId;
  row.querySelector(".task-project-name").textContent = project?.title || "";
  row.querySelector(".task-list-name").textContent = displayListTitle(list);
  const taskListIcon = row.querySelector(".task-list .inbox-icon");
  taskListIcon.className = list?.kind === "regular" ? "list-menu-icon" : "inbox-icon";
  const toggle = row.querySelector(".toggle");
  toggle.classList.toggle("done", completed);
  toggle.setAttribute("aria-label", completed ? "Повернути завдання в активні" : "Позначити виконаною");
  target.append(row);
}

const PROJECT_ROOT_SECTION_ID = "project-root";

function renderProjectSectionHeading(section, count, root = false) {
  const row = document.createElement("li");
  row.className = `list-section project-section-heading${root ? " project-root-heading" : ""}`;
  row.dataset.sectionId = section.id;
  const heading = document.createElement("div");
  heading.className = "list-section-heading";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "list-section-toggle";
  button.dataset.projectSectionToggle = section.id;
  button.setAttribute("aria-expanded", String(!section.collapsed));
  const current = currentProjectTask(tasks, activeProjectId, projects);
  row.classList.toggle("contains-current-step", section.collapsed && (root ? !current?.projectSectionId : current?.projectSectionId === section.id));
  button.setAttribute("aria-label", `${section.collapsed ? "Розгорнути" : "Згорнути"} секцію «${section.title}»`);
  if (row.classList.contains("contains-current-step")) button.setAttribute("aria-label", `${section.title} · ${count} · поточний крок`);
  const label = document.createElement("span");
  label.className = "list-section-label";
  label.textContent = section.title;
  const number = document.createElement("span");
  number.className = "list-section-count";
  number.textContent = String(count);
  button.append(label, number);
  const add = document.createElement("button");
  add.type = "button";
  add.className = "today-group-add list-section-add";
  add.setAttribute("aria-label", `Додати крок до секції «${section.title}»`);
  add.setAttribute("aria-description", "Утримуйте, щоб прикріпити існуючі завдання");
  add.setAttribute("aria-keyshortcuts", "Shift+Enter");
  add.setAttribute("aria-haspopup", "dialog");
  heading.append(button, add);
  const members = document.createElement("ul");
  members.className = "list-section-tasks";
  members.hidden = section.collapsed;
  members.id = `project-section-tasks-${section.id}`;
  button.setAttribute("aria-controls", members.id);
  row.append(heading, members);
  projectEls.taskList.append(row);
  return members;
}

function renderCompletedProjectTaskHeading(count) {
  const heading = document.createElement("li");
  heading.className = "project-completed-heading";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "project-completed-toggle";
  button.setAttribute("aria-expanded", String(projectEls.steps.classList.contains("is-completed-expanded")));
  const label = document.createElement("span");
  label.textContent = `Завершені ${count}`;
  const chevron = document.createElement("span");
  chevron.className = "project-completed-chevron";
  chevron.setAttribute("aria-hidden", "true");
  button.append(label, chevron);
  heading.append(button);
  projectEls.taskList.append(heading);
}

async function reopenProjectTask(task) {
  const updatedAt = new Date().toISOString();
  const updated = { ...task, status: "active", completedAt: null, updatedAt };
  await taskDb.put(updated);
  tasks = tasks.map(item => item.id === updated.id ? updated : item);
  if (projectSteps(activeProjectId).filter(item => !isTaskCompleted(item)).length > 3) {
    projectEls.steps.classList.add("is-expanded");
    projectEls.tasksExpand.setAttribute("aria-expanded", "true");
    projectEls.tasksExpand.setAttribute("aria-label", "Згорнути завдання");
  }
  renderCurrentTasks();
}

function renderOpenProject() {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project || projectEls.screen.hidden) return;
  const steps = projectSteps(project.id);
  const activeSteps = steps.filter(task => !isTaskCompleted(task));
  const completedSteps = steps.filter(isTaskCompleted);
  const completedCount = completedSteps.length;
  const selectedHere = new Set(steps.filter(task => selectedTaskIds.has(task.id)).map(task => task.id));
  if (selectedHere.size && activeSteps.length > 3) {
    projectEls.steps.classList.add("is-expanded");
    projectEls.tasksExpand.setAttribute("aria-expanded", "true");
    projectEls.tasksExpand.setAttribute("aria-label", "Згорнути завдання");
  }
  if (completedSteps.some(task => selectedHere.has(task.id))) projectEls.steps.classList.add("is-completed-expanded");
  projectEls.heading.textContent = project.title;
  if (document.activeElement !== projectEls.title) projectEls.title.value = project.title;
  if (document.activeElement !== projectEls.description) projectEls.description.value = project.description || "";
  if (document.activeElement !== projectEls.dueDate) projectEls.dueDate.value = project.dueDate || "";
  if (document.activeElement !== projectEls.dueTime) projectEls.dueTime.value = project.dueTime || "";
  projectEls.dateLabel.textContent = readableDueDate(project.dueDate, project.dueTime);
  applyDateTone(projectEls.datePickerOpen, project.dueDate, project.dueTime);
  projectEls.showCountdown.checked = project.showCountdown === true;
  if (document.activeElement !== projectEls.defaultList) {
    projectEls.defaultList.replaceChildren(new Option("Останній вибраний", ""),
      ...lists.map(list => new Option(displayListTitle(list), list.id)));
    projectEls.defaultList.value = lists.some(list => list.id === project.defaultListId) ? project.defaultListId : "";
  }
  renderProjectCountdown();
  projectEls.progress.textContent = `${steps.length} завд. · ${completedCount} виконано`;
  projectEls.tasksEmpty.hidden = steps.length > 0 || Boolean(project.projectSections?.length);
  projectEls.tasksExpand.hidden = true;
  projectEls.steps.classList.add("is-expanded");
  projectEls.steps.dataset.previewProjectId = project.id;
  projectEls.selectAll.setAttribute("aria-pressed", String(steps.length > 0 && steps.every(task => selectedHere.has(task.id))));
  projectEls.addNewFirst.checked = project.addNewTasksFirst === true;
  projectEls.hideRoot.checked = project.unsectionedHidden === true;
  projectEls.rootVisibility.setAttribute("aria-pressed", String(project.unsectionedHidden === true));
  projectEls.rootVisibility.setAttribute("aria-label", `${project.unsectionedHidden ? "Показати" : "Приховати"} звичайні кроки`);
  projectEls.complete.textContent = project.status === "completed" ? "Повернути в активні" : "Завершити проєкт";
  projectEls.convertTask.hidden = project.status === "completed";
  projectEls.mainComplete.textContent = projectEls.complete.textContent;
  projectEls.taskList.replaceChildren();
  const projectSections = project.projectSections || [];
  const validSectionIds = new Set(projectSections.map(section => section.id));
  const unsectioned = activeSteps.filter(task => !validSectionIds.has(task.projectSectionId));
  const rootSection = { id: PROJECT_ROOT_SECTION_ID, title: "Звичайні кроки", collapsed: project.unsectionedCollapsed === true };
  if (!project.unsectionedHidden) {
    const rootTarget = renderProjectSectionHeading(rootSection, unsectioned.length, true);
    if (!rootSection.collapsed || unsectioned.some(task => selectedHere.has(task.id))) {
      rootTarget.hidden = false;
      unsectioned.forEach(task => renderProjectTask(task, rootTarget));
    }
  }
  for (const section of projectSections) {
    const members = activeSteps.filter(task => task.projectSectionId === section.id);
    const target = renderProjectSectionHeading(section, members.length);
    if (!section.collapsed || members.some(task => selectedHere.has(task.id))) {
      target.hidden = false;
      members.forEach(task => renderProjectTask(task, target));
    }
  }
  if (completedCount) renderCompletedProjectTaskHeading(completedCount);
  completedSteps.forEach(task => renderProjectTask(task));
  syncProjectTaskPreview();
  projectEls.taskList.classList.toggle("selection-mode", selectedHere.size > 0);
  projectEls.selectionToolbar.hidden = selectedHere.size === 0;
  projectEls.screen.querySelector(".project-screen-header").hidden = selectedHere.size > 0;
  projectEls.selectionCount.textContent = `Вибрано: ${selectedHere.size}`;
  projectEls.selectionMore.hidden = project.status !== "active";
  if (!selectedHere.size) closeProjectSelectionMore();
  projectEls.listOptions.replaceChildren(...createListDropdownSearch(), ...lists.map(createListDropdownOption));
  const currentListId = selectedTasksListId(tasks, selectedHere);
  for (const option of projectEls.listOptions.querySelectorAll("[data-list-id]")) {
    const selected = option.dataset.listId === currentListId;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-selected", String(selected));
  }
  projectEls.sectionsOpen.hidden = project.status !== "active";
  syncProjectSectionSelection();
}

function openProject(projectId, { showOverdue = true } = {}) {
  const project = projects.find(item => item.id === projectId);
  if (!project) return;
  selectedListSectionIds.clear();
  activeProjectId = projectId;
  selectedProjectSectionIds.clear();
  selectedTaskIds = new Set();
  projectEls.steps.classList.remove("is-completed-expanded");
  projectEls.screen.hidden = false;
  document.body.classList.add("project-screen-open");
  renderOpenProject();
  if (showOverdue && project.status === "active") openProjectOverdueDialog();
}

function overdueProjectSteps() {
  if (!activeProjectId) return [];
  const date = localDateValue();
  const time = localTimeValue();
  return tasks.filter(task => task.projectId === activeProjectId && isTaskOverdue(task, date, time));
}

function openProjectOverdueDialog() {
  const count = overdueProjectSteps().length;
  if (!count) return;
  projectEls.overdueMessage.textContent = count === 1
    ? "У проєкті є 1 прострочене завдання. Що з ним зробити?"
    : `У проєкті є ${count} прострочених завдань. Що з ними зробити?`;
  projectEls.overdueDialogBackdrop.hidden = false;
  document.body.classList.add("project-delete-dialog-open");
  requestAnimationFrame(() => projectEls.overdueDialog.focus());
}

function closeProjectOverdueDialog() {
  if (projectEls.overdueDialogBackdrop.hidden) return;
  projectEls.overdueDialogBackdrop.hidden = true;
  document.body.classList.remove("project-delete-dialog-open");
  if (!projectEls.screen.hidden) projectEls.back.focus();
}

async function resolveProjectOverdue(deleteTasks) {
  const affected = overdueProjectSteps();
  closeProjectOverdueDialog();
  if (!affected.length) return;
  try {
    if (deleteTasks) await taskDb.deleteMany(affected.map(task => task.id));
    else {
      const updatedAt = new Date().toISOString();
      await taskDb.putMany(affected.map(task => ({ ...task, dueDate: null, dueTime: null, updatedAt })));
    }
    selectedTaskIds = new Set([...selectedTaskIds].filter(id => !affected.some(task => task.id === id)));
    await refresh();
    toast(deleteTasks
      ? affected.length === 1 ? "Прострочене завдання видалено" : `Видалено прострочених завдань: ${affected.length}`
      : affected.length === 1 ? "Термін простроченого завдання знято" : `Знято терміни завдань: ${affected.length}`, {
      duration: 3000,
      action: async () => {
        try {
          if (deleteTasks) await taskDb.putMany(affected);
          else {
            const current = await taskDb.all();
            const dates = new Map(affected.map(task => [task.id, task]));
            await taskDb.putMany(current.filter(task => dates.has(task.id)).map(task => ({
              ...task, dueDate: dates.get(task.id).dueDate, dueTime: dates.get(task.id).dueTime,
              updatedAt: new Date().toISOString()
            })));
          }
          await refresh();
          toast("Дію скасовано");
        } catch (_error) { toast("Не вдалося скасувати дію"); }
      }
    });
  } catch (_error) {
    await refresh();
    toast("Не вдалося змінити прострочені завдання");
  }
}

function renderAttachResults() {
  const available = tasks.filter(task => task.status === "active" && !task.projectId && !task.savedSteps?.length);
  const query = projectEls.attachSearch.value.trim().toLocaleLowerCase("uk");
  const matches = available.filter(task => task.title.toLocaleLowerCase("uk").includes(query))
    .sort((a, b) => a.title.localeCompare(b.title, "uk"));
  projectEls.attachResults.replaceChildren();
  for (const task of matches) {
    const label = document.createElement("label");
    label.className = "project-attach-row";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = task.id;
    checkbox.checked = attachSelectedIds.has(task.id);
    const title = document.createElement("span");
    title.textContent = task.title;
    label.append(checkbox, title);
    projectEls.attachResults.append(label);
  }
  projectEls.attachEmpty.hidden = matches.length > 0;
  projectEls.attachEmpty.textContent = available.length ? "За таким запитом завдань немає" : "Немає вільних активних завдань";
  projectEls.attachSave.disabled = attachSelectedIds.size === 0;
  projectEls.attachSave.textContent = attachSelectedIds.size ? `Додати (${attachSelectedIds.size})` : "Додати";
}

function closeAttachDialog() {
  projectEls.attachBackdrop.hidden = true;
  if (window.visualViewport) {
    window.visualViewport.removeEventListener("resize", positionAttachDialog);
    window.visualViewport.removeEventListener("scroll", positionAttachDialog);
  }
  projectEls.attachBackdrop.style.top = "";
  projectEls.attachBackdrop.style.height = "";
  projectEls.attachBackdrop.style.bottom = "";
  projectEls.attachBackdrop.style.removeProperty("--project-attach-viewport-height");
  document.body.classList.remove("project-attach-open");
  attachSelectedIds.clear();
  attachReturnFocus?.focus();
  attachReturnFocus = null;
  attachTargetSectionId = null;
}

function openAttachDialog(sectionId, trigger) {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project || project.status !== "active") return;
  if (sectionId && !project.projectSections?.some(section => section.id === sectionId)) return;
  attachTargetSectionId = sectionId;
  attachReturnFocus = trigger;
  const section = project.projectSections?.find(item => item.id === sectionId);
  document.querySelector("#project-attach-destination").textContent = `До секції «${section?.title || "Звичайні кроки"}»`;
  attachSelectedIds.clear();
  projectEls.attachSearch.value = "";
  renderAttachResults();
  projectEls.attachBackdrop.hidden = false;
  document.body.classList.add("project-attach-open");
  positionAttachDialog();
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", positionAttachDialog);
    window.visualViewport.addEventListener("scroll", positionAttachDialog);
  }
  projectEls.attachSearch.focus();
}

function positionAttachDialog() {
  if (projectEls.attachBackdrop.hidden || !window.visualViewport) return;
  const viewport = window.visualViewport;
  projectEls.attachBackdrop.style.top = `${viewport.offsetTop}px`;
  projectEls.attachBackdrop.style.height = `${viewport.height}px`;
  projectEls.attachBackdrop.style.bottom = "auto";
  projectEls.attachBackdrop.style.setProperty("--project-attach-viewport-height", `${viewport.height}px`);
}

async function saveAttachedTasks() {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project || !attachSelectedIds.size || attachTargetSectionId && !project.projectSections?.some(section => section.id === attachTargetSectionId)) return;
  const selected = tasks.filter(task => attachSelectedIds.has(task.id) && task.status === "active" && !task.projectId && !task.savedSteps?.length);
  if (!selected.length) return;
  const now = new Date().toISOString();
  const bumped = tasks.filter(task => task.projectId === project.id && task.status === "active")
    .map(task => ({ ...task, projectPosition: (task.projectPosition ?? 0) + selected.length, updatedAt: now }));
  const changed = selected.map((task, index) => ({ ...task, projectId: project.id, projectSectionId: attachTargetSectionId, projectPosition: index, updatedAt: now }));
  projectEls.attachSave.disabled = true;
  try {
    await taskDb.putMany([...changed, ...bumped]);
    const replacements = new Map([...changed, ...bumped].map(task => [task.id, task]));
    tasks = tasks.map(task => replacements.get(task.id) || task);
    closeAttachDialog();
    renderProjects();
    renderCurrentTasks();
  } catch (_error) {
    projectEls.attachSave.disabled = false;
    toast("Не вдалося додати завдання до проєкту");
  }
}

const selectedProjectSectionIds = new Set();
let sectionDialogScope = null;
let projectSectionBusy = false;
function syncProjectSectionSelection() {
  const project = projects.find(item => item.id === activeProjectId);
  const sections = project?.projectSections || [];
  const valid = new Set(sections.map(section => section.id));
  for (const id of selectedProjectSectionIds) if (!valid.has(id)) selectedProjectSectionIds.delete(id);
  const active = selectedProjectSectionIds.size > 0 && !projectEls.screen.hidden;
  document.querySelector("#project-section-selection-toolbar").hidden = !active;
  document.querySelector("#project-section-selection-count").textContent = `Секцій: ${selectedProjectSectionIds.size}`;
  document.querySelector("#project-section-rename").disabled = selectedProjectSectionIds.size !== 1 || projectSectionBusy;
  for (const id of ["project-section-delete", "project-section-dissolve"]) document.getElementById(id).disabled = projectSectionBusy;
  projectEls.screen.querySelector(".project-screen-header").hidden = active || selectedTaskIds.size > 0;
  if (active) projectEls.selectionToolbar.hidden = true;
  for (const row of projectEls.taskList.querySelectorAll(".project-section-heading")) {
    const selected = selectedProjectSectionIds.has(row.dataset.sectionId);
    const section = row.dataset.sectionId === PROJECT_ROOT_SECTION_ID ? { collapsed: project?.unsectionedCollapsed === true } : sections.find(section => section.id === row.dataset.sectionId);
    const button = row.querySelector("[data-project-section-toggle]");
    row.classList.toggle("section-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    const members = row.querySelector(".list-section-tasks");
    const containsSelectedTask = [...members.querySelectorAll("[data-id]")].some(task => selectedTaskIds.has(task.dataset.id));
    members.hidden = selected || (section?.collapsed && !containsSelectedTask);
    button.setAttribute("aria-expanded", String(!members.hidden));
  }
}
function clearProjectSectionSelection() {
  selectedProjectSectionIds.clear();
  syncProjectSectionSelection();
}
function selectProjectSection(id, only = false) {
  if (projectSectionBusy) return;
  if (only) selectedProjectSectionIds.clear();
  selectedProjectSectionIds.add(id);
  selectedTaskIds.clear();
  projectEls.taskList.querySelectorAll(".swipe-row.selected").forEach(row => row.classList.remove("selected"));
  projectEls.taskList.classList.remove("selection-mode");
  projectEls.listOptions.hidden = true;
  syncProjectSectionSelection();
}
async function changeProjectSections(transform) {
  if (projectSectionBusy) return false;
  projectSectionBusy = true;
  syncProjectSectionSelection();
  try {
    if (!projectEls.editor.hidden && !await saveProjectFields()) throw new Error(projectEls.saveStatus.textContent || "Не вдалося зберегти проєкт");
    const current = projects.find(item => item.id === activeProjectId);
    if (!current) return false;
    const plan = transform(current);
    await projectDb.putWithTasks(plan.project, plan.tasks || [], plan.deletedTaskIds || []);
    const replacements = new Map((plan.tasks || []).map(task => [task.id, task]));
    const deleted = new Set(plan.deletedTaskIds || []);
    tasks = tasks.filter(task => !deleted.has(task.id)).map(task => replacements.get(task.id) || task);
    projects = projects.map(project => project.id === current.id ? plan.project : project);
    renderProjects();
    renderCurrentTasks();
    renderOpenProject();
    syncProjectEditorSummary();
    return true;
  } catch (error) {
    if (projectEls.sectionActionDialog.open) {
      const field = document.querySelector("#project-section-action-error");
      field.textContent = error.message || "Не вдалося змінити секції";
      field.hidden = false;
    } else if (projectEls.sectionsDialog.open) {
      const field = document.querySelector("#project-section-picker-error");
      field.textContent = error.message || "Не вдалося змінити секцію";
      field.hidden = false;
    } else toast("Не вдалося змінити секції");
    return false;
  } finally { projectSectionBusy = false; syncProjectSectionSelection(); }
}
function sectionUiContext() {
  if (projectEls.screen.hidden) return { kind: "list", id: activeListId, record: activeList(), sections: orderedListSections(), selectedIds: selectedListSectionIds,
    taskRecords: tasks.filter(task => task.listId === activeListId), parent: "списку" };
  const project = projects.find(item => item.id === activeProjectId);
  return { kind: "project", id: activeProjectId, record: project, sections: project?.projectSections || [], selectedIds: selectedProjectSectionIds,
    taskRecords: tasks.filter(task => task.projectId === activeProjectId), parent: "проєкті" };
}
function openProjectSectionAction(action) {
  const context = sectionUiContext();
  const selected = context.selectedIds;
  if (projectSectionBusy || !selected.size || (action === "rename" && selected.size !== 1)) return;
  if (!context.record || (context.kind === "list" && context.record.kind !== "regular")) return;
  sectionDialogScope = { kind: context.kind, id: context.id };
  const name = document.querySelector("#project-section-rename-input");
  const renaming = action === "rename";
  projectEls.sectionActionDialog.dataset.action = action;
  document.querySelector("#project-section-action-title").textContent = renaming ? "Перейменувати секцію" : action === "delete" ? "Видалити секції?" : "Розпустити секції?";
  document.querySelector("#project-section-rename-label").hidden = !renaming;
  name.required = renaming;
  name.value = renaming ? context.sections.find(section => selected.has(section.id))?.title || "" : "";
  const count = context.taskRecords.filter(task => selected.has(context.kind === "list" ? task.sectionId : task.projectSectionId)).length;
  document.querySelector("#project-section-action-description").textContent = renaming ? "" : action === "delete"
    ? `Буде видалено секцій: ${selected.size}, завдань у них: ${count}. Включно із завершеними.`
    : `Буде прибрано секцій: ${selected.size}. Усі їхні завдання залишаться в цьому ${context.parent} без секції.`;
  const confirm = document.querySelector("#project-section-action-confirm");
  confirm.textContent = renaming ? "Зберегти" : action === "delete" ? "Видалити" : "Розпустити";
  confirm.classList.toggle("danger-action", action === "delete");
  document.querySelector("#project-section-action-error").hidden = true;
  syncProjectDialogViewport();
  projectEls.sectionActionDialog.showModal();
  (renaming ? name : document.querySelector("#project-section-action-cancel")).focus();
  if (renaming) name.select();
  scheduleMobileNavigationRecord();
}
function restoreProjectSectionAction(state) {
  const selected = state.scope?.kind === "list" ? selectedListSectionIds : selectedProjectSectionIds;
  selected.clear();
  for (const id of state.ids) selected.add(id);
  if (state.scope?.kind === "list") syncListSectionSelection(); else syncProjectSectionSelection();
  openProjectSectionAction(state.action);
}
function closeProjectSectionAction() {
  if (projectSectionBusy) return;
  projectEls.sectionActionDialog.close();
  if (sectionDialogScope?.kind === "list") (els.list.querySelector(".list-section-toggle[aria-pressed='true']") || els.listEditorOpen).focus();
  else (projectEls.taskList.querySelector("[data-project-section-toggle][aria-pressed='true']") || projectEls.editOpen).focus();
  scheduleMobileNavigationRecord();
}
function syncProjectEditorSummary() {
  projectEls.descriptionOpen.textContent = richPreviewText(projectEls.description.value).trim() || "Додати опис…";
}
function closeProjectActions({ focus = false } = {}) {
  projectEls.actionsMenu.hidden = true;
  projectEls.actionsTrigger.setAttribute("aria-expanded", "false");
  if (focus) projectEls.actionsTrigger.focus();
}
function syncProjectDialogViewport() {
  const viewport = window.visualViewport;
  for (const dialog of [projectEls.sectionsDialog, projectEls.descriptionDialog, projectEls.sectionActionDialog]) {
    dialog.style.setProperty("--project-dialog-top", `${viewport?.offsetTop || 0}px`);
    dialog.style.setProperty("--project-dialog-height", `${viewport?.height || window.innerHeight}px`);
    dialog.style.setProperty("--project-dialog-bottom", `${Math.max(0, window.innerHeight - (viewport?.height || window.innerHeight) - (viewport?.offsetTop || 0))}px`);
  }
}
window.visualViewport?.addEventListener("resize", syncProjectDialogViewport);
window.visualViewport?.addEventListener("scroll", syncProjectDialogViewport);
window.addEventListener("resize", syncProjectDialogViewport);
let projectDescriptionDraft = "";
function openProjectDescription() {
  projectDescriptionDraft = projectEls.description.value;
  syncProjectDialogViewport();
  projectEls.descriptionDialog.showModal();
  projectEls.description.focus();
  scheduleMobileNavigationRecord();
}
function closeProjectDescription(save = false) {
  if (!save) projectEls.description.value = projectDescriptionDraft;
  else markProjectDirty();
  projectEls.descriptionDialog.close();
  syncProjectEditorSummary();
  projectEls.descriptionOpen.focus();
  scheduleMobileNavigationRecord();
}
function openProjectSections() {
  const context = sectionUiContext();
  const selected = context.taskRecords.filter(task => selectedTaskIds.has(task.id));
  if (!context.record || !selected.length || projectSectionBusy || (context.kind === "list" ? context.record.kind !== "regular" : context.record.status !== "active")) return;
  sectionDialogScope = { kind: context.kind, id: context.id };
  projectEls.sectionCreate.reset();
  document.querySelector("#project-section-picker-error").hidden = true;
  const options = context.sections.map(section => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.assignProjectSection = section.id;
    button.textContent = section.title;
    return button;
  });
  if (context.kind === "project") {
    const root = document.createElement("button");
    root.type = "button";
    root.dataset.assignProjectSection = PROJECT_ROOT_SECTION_ID;
    root.textContent = "Звичайні кроки";
    options.unshift(root);
  }
  document.querySelector("#project-section-options").replaceChildren(...options);
  syncProjectDialogViewport();
  projectEls.sectionsDialog.showModal();
  (document.querySelector("#project-section-options button") || projectEls.sectionName).focus();
  scheduleMobileNavigationRecord();
}
function closeProjectSections() {
  if (projectSectionBusy) return;
  projectEls.sectionsDialog.close();
  if (sectionDialogScope?.kind === "list") (els.selectionToolbar.hidden ? els.listEditorOpen : document.querySelector("#list-assign-section")).focus();
  else if (!projectEls.selectionToolbar.hidden) projectEls.sectionsOpen.focus();
  else projectEls.editOpen.focus();
  scheduleMobileNavigationRecord();
}
async function assignSelectedProjectTasks(sectionId = null) {
  const selected = new Set(selectedTaskIds);
  const name = projectEls.sectionName.value;
  const saved = sectionDialogScope?.kind === "list"
    ? await changeListSections(list => assignListTasksToSection(list, sections, tasks, selected, sectionId, name), sectionDialogScope.id)
    : await changeProjectSections(project => sectionId === PROJECT_ROOT_SECTION_ID
      ? { project: { ...project, unsectionedCollapsed: false, updatedAt: new Date().toISOString() },
        tasks: tasks.filter(task => task.projectId === project.id && selected.has(task.id) && task.projectSectionId)
          .map(task => ({ ...task, projectSectionId: null, updatedAt: new Date().toISOString() })) }
      : assignProjectTasksToSection(project, tasks, selected, sectionId, name));
  if (!saved) return;
  selectedTaskIds.clear();
  closeProjectSections();
  renderCurrentTasks();
}
function openProjectEditor() {
  selectedProjectSectionIds.clear();
  renderOpenProject();
  projectEls.editor.hidden = false;
  document.body.classList.add("project-editor-open");
  syncProjectEditorSummary();
  projectEls.saveStatus.textContent = "";
  projectEls.editClose.focus();
}

function closeProjectEditor() {
  selectedProjectSectionIds.clear();
  syncProjectSectionSelection();
  if (projectEls.sectionActionDialog.open) closeProjectSectionAction();
  closeProjectActions();
  document.querySelector(".project-copy-menu").open = false;
  if (projectEls.sectionsDialog.open) closeProjectSections();
  if (projectEls.descriptionDialog.open) closeProjectDescription();
  projectEls.editor.hidden = true;
  document.body.classList.remove("project-editor-open");
  renderOpenProject();
  projectEls.editOpen.focus();
}

function syncProjectTaskPreview() {
  projectEls.taskList.querySelectorAll(".swipe-row:not(.completed)").forEach(row => { row.inert = false; });
  projectEls.taskList.querySelectorAll(".swipe-row.completed").forEach(row => { row.inert = !projectEls.steps.classList.contains("is-completed-expanded"); });
}

function toggleProjectTasks() {
  const expanded = !projectEls.steps.classList.contains("is-expanded");
  projectEls.steps.classList.toggle("is-expanded", expanded);
  syncProjectTaskPreview();
  projectEls.tasksExpand.setAttribute("aria-expanded", String(expanded));
  projectEls.tasksExpand.setAttribute("aria-label", expanded ? "Згорнути завдання" : "Розгорнути всі завдання");
  if (expanded) projectEls.tasksExpand.focus();
}

function toggleCompletedProjectTasks() {
  const expanded = projectEls.steps.classList.toggle("is-completed-expanded");
  const button = projectEls.taskList.querySelector(".project-completed-toggle");
  if (button) button.setAttribute("aria-expanded", String(expanded));
  syncProjectTaskPreview();
}

async function closeProject({ animated = false } = {}) {
  clearProjectSectionSelection();
  if (projectEls.sectionsDialog.open) closeProjectSections();
  if (projectEls.sectionActionDialog.open) closeProjectSectionAction();
  closeProjectOverdueDialog();
  if (!projectEls.attachBackdrop.hidden) closeAttachDialog();
  if (!projectEls.editor.hidden) closeProjectEditor();
  if (projectEls.steps.classList.contains("is-expanded")) toggleProjectTasks();
  projectEls.steps.classList.remove("is-completed-expanded");
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
    projectEls.title.focus();
    return false;
  }
  const updated = createProject({ ...project, title, description: projectEls.description.value.trim(), dueDate: projectEls.dueDate.value || null, dueTime: projectEls.dueDate.value && projectEls.dueTime.value ? projectEls.dueTime.value : null, showCountdown: projectEls.showCountdown.checked, defaultListId: projectEls.defaultList.value || null, updatedAt: new Date().toISOString() });
  projectEls.saveStatus.textContent = "Збереження…";
  try {
    await projectDb.put(updated);
    projects = projects.map(item => item.id === updated.id ? updated : item);
    projectEls.heading.textContent = updated.title;
    projectEls.saveStatus.textContent = "Збережено";
    renderProjects();
    renderCurrentTasks();
    syncProjectEditorSummary();
    if (closeAfter) closeProjectEditor();
    return true;
  } catch (_error) {
    projectEls.saveStatus.textContent = "Не вдалося зберегти";
    return false;
  }
}

function markProjectDirty() {
  projectEls.saveStatus.textContent = "Є незбережені зміни";
}

async function addProject(title) {
  const value = title.trim();
  if (!value) return;
  const project = createProject({ title: value, position: nextProjectPosition(projects) });
  await projectDb.put(project);
  projects.push(project);
  projectEls.createForm.hidden = true;
  projectEls.createTitle.value = "";
  renderProjects();
  openProject(project.id);
}

async function addProjectStep(title, { sectionId = null, description = "" } = {}) {
  const project = projects.find(item => item.id === activeProjectId);
  const value = title.trim();
  if (!project || !value) return;
  const preferredListId = project.defaultListId || project.lastListId;
  const listId = lists.some(list => list.id === preferredListId) ? preferredListId : INBOX_LIST_ID;
  const listTasks = tasks.filter(task => (task.listId || INBOX_LIST_ID) === listId && !task.sectionId);
  const steps = tasks.filter(task => task.projectId === project.id);
  const addFirst = project.addNewTasksFirst === true;
  const task = createTask({
    title: value,
    description,
    listId,
    position: addFirst ? 0 : (listTasks.length ? Math.max(...listTasks.map(item => item.position || 0)) + 1 : 0),
    projectId: project.id,
    projectSectionId: sectionId,
    projectPosition: addFirst ? 0 : (steps.length ? Math.max(...steps.map(item => item.projectPosition ?? -1)) + 1 : 0)
  });
  const replacements = new Map();
  if (addFirst) {
    for (const existing of tasks) {
      const inProject = existing.projectId === project.id;
      const inListRoot = (existing.listId || INBOX_LIST_ID) === listId && !existing.sectionId;
      if (!inProject && !inListRoot) continue;
      replacements.set(existing.id, {
        ...existing,
        position: inListRoot ? (Number.isFinite(existing.position) ? existing.position : 0) + 1 : existing.position,
        projectPosition: inProject ? (Number.isFinite(existing.projectPosition) ? existing.projectPosition : 0) + 1 : existing.projectPosition,
        updatedAt: task.updatedAt
      });
    }
  }
  await taskDb.putMany([task, ...replacements.values()]);
  tasks = tasks.map(existing => replacements.get(existing.id) || existing);
  tasks.push(task);
  await rememberProjectList(project.id, listId);
  renderOpenProject();
  renderProjects();
}

async function toggleProjectStatus() {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project) return;
  const completing = project.status !== "completed";
  if (completing) {
    await completeProjects([project]);
    return;
  }
  const now = new Date().toISOString();
  const updated = { ...project, status: "active", completedAt: null, updatedAt: now };
  await projectDb.put(updated);
  projects = projects.map(item => item.id === updated.id ? updated : item);
  renderOpenProject();
  renderProjects();
}

async function deleteProject() {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project) return;
  const detachTasks = await requestProjectDeletion(1);
  if (detachTasks === null) return;
  const now = new Date().toISOString();
  await projectDb.deleteManyWithTasks([project.id], now, detachTasks);
  tasks = detachTasks
    ? tasks.map(task => task.projectId === project.id ? { ...task, projectId: null, projectSectionId: null, projectPosition: null, updatedAt: now } : task)
    : tasks.filter(task => task.projectId !== project.id);
  projects = projects.filter(item => item.id !== project.id);
  closeProject();
  renderCurrentTasks();
  toast(detachTasks ? "Проєкт видалено, завдання збережено" : "Проєкт і його завдання видалено");
}

function closeProjectConvertDialog() {
  projectEls.convertDialogBackdrop.hidden = true;
  document.body.classList.remove("project-delete-dialog-open");
  projectEls.actionsTrigger.focus();
}

function openProjectConvertDialog() {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project || project.status !== "active") return;
  projectEls.convertDialog.querySelector('input[value="save"]').checked = true;
  projectEls.convertDialogBackdrop.hidden = false;
  document.body.classList.add("project-delete-dialog-open");
  requestAnimationFrame(() => projectEls.convertDialog.focus());
}

async function convertOpenProjectToTask() {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project || project.status !== "active") { closeProjectConvertDialog(); return; }
  const title = projectEls.title.value.trim();
  if (!title) {
    closeProjectConvertDialog();
    projectEls.saveStatus.textContent = "Назва не може бути порожньою";
    projectEls.title.focus();
    return;
  }
  const editedProject = { ...project, title, description: projectEls.description.value.trim(),
    dueDate: projectEls.dueDate.value || null,
    dueTime: projectEls.dueDate.value && projectEls.dueTime.value ? projectEls.dueTime.value : null };
  const choice = projectEls.convertDialog.querySelector('input[name="project-convert-choice"]:checked').value;
  let plan;
  try { plan = projectToTaskChanges(editedProject, tasks, choice, new Date().toISOString()); }
  catch (error) { toast(error.message); return; }
  mobileNavApplying = true;
  clearTimeout(mobileNavTimer);
  closeProjectConvertDialog();
  projectEls.convertTask.disabled = true;
  let converted = false;
  try {
    await projectDb.convertToTask(project.id, plan.task, plan.updates, plan.deletedIds);
    const replacements = new Map(plan.updates.map(task => [task.id, task]));
    const deleted = new Set(plan.deletedIds);
    tasks = [...tasks.filter(task => !deleted.has(task.id)).map(task => replacements.get(task.id) || task), plan.task].sort(compareTasks);
    projects = projects.filter(item => item.id !== project.id);
    await closeProject();
    openList(INBOX_LIST_ID);
    openTaskDetails(plan.task);
    converted = true;
    toast(choice === "save" ? "Проєкт став завданням, кроки збережено" : choice === "keep" ? "Проєкт став завданням, кроки залишилися окремими" : "Проєкт став завданням, кроки видалено");
  } catch (_error) {
    toast("Не вдалося перетворити проєкт. Дані не змінено");
  } finally {
    mobileNavApplying = false;
    if (converted) recordMobileNavigation(true);
    else replaceMobileNavigation();
    projectEls.convertTask.disabled = false;
  }
}

function selectedActiveProjectStepIds() {
  return new Set(projectSteps(activeProjectId).filter(task => selectedTaskIds.has(task.id) && !isTaskCompleted(task)).map(task => task.id));
}

function closeCreateFromStepsDialog() {
  projectEls.createFromStepsBackdrop.hidden = true;
  projectEls.selectionMoreTrigger.focus();
}

function closeProjectSelectionMore({ focus = false } = {}) {
  projectEls.selectionMoreMenu.hidden = true;
  projectEls.selectionMoreTrigger.setAttribute("aria-expanded", "false");
  if (focus) projectEls.selectionMoreTrigger.focus();
}

async function detachSelectedProjectSteps() {
  const projectId = activeProjectId;
  const selected = projectSteps(projectId).filter(task => selectedTaskIds.has(task.id));
  if (!selected.length) return;
  closeProjectSelectionMore();
  const updatedAt = new Date().toISOString();
  const changed = selected.map(task => ({ ...task, projectId: null, projectSectionId: null, projectPosition: null, updatedAt }));
  try {
    await taskDb.putMany(changed);
    const replacements = new Map(changed.map(task => [task.id, task]));
    tasks = tasks.map(task => replacements.get(task.id) || task);
    selectedTaskIds.clear();
    renderProjects();
    renderCurrentTasks();
    renderOpenProject();
    toast(`Відкріплено завдань: ${changed.length}`);
  } catch (_error) {
    toast("Не вдалося відкріпити завдання");
  }
}

function openCreateFromStepsDialog(mode = "existing") {
  if (!selectedTaskIds.size || !projects.some(project => project.id === activeProjectId && project.status === "active")) return;
  closeProjectSelectionMore();
  projectEls.createFromStepsDialog.dataset.mode = mode === "new" ? "new" : "existing";
  projectEls.createFromStepsName.value = "";
  projectEls.createExistingSelect.replaceChildren(...projects.filter(project => project.status === "active" && project.id !== activeProjectId).sort(compareProjects).map(project => new Option(project.title, project.id)));
  syncCreateFromStepsMode();
  projectEls.createFromStepsBackdrop.hidden = false;
  (projectEls.createFromStepsDialog.dataset.mode === "existing" ? projectEls.createExistingSelect : projectEls.createFromStepsName).focus();
}

function syncCreateFromStepsMode() {
  const existing = projectEls.createFromStepsDialog.dataset.mode === "existing";
  projectEls.createExistingFields.hidden = !existing;
  projectEls.createNewFields.hidden = existing;
  document.querySelector("#project-create-from-steps-title").textContent = existing ? "Додати до проєкту" : "Створити новий проєкт";
  projectEls.createFromStepsConfirm.textContent = existing ? "Додати" : "Створити";
  projectEls.createFromStepsConfirm.disabled = existing && !projectEls.createExistingSelect.value;
}

async function createProjectFromSelectedSteps() {
  const existing = projectEls.createFromStepsDialog.dataset.mode === "existing";
  const title = projectEls.createFromStepsName.value.trim();
  if (!existing && !title) { projectEls.createFromStepsName.focus(); return; }
  const selectedIds = new Set(projectSteps(activeProjectId).filter(task => selectedTaskIds.has(task.id)).map(task => task.id));
  if (!selectedIds.size) { closeCreateFromStepsDialog(); return; }
  projectEls.createFromStepsConfirm.disabled = true;
  try {
    if (existing) {
      const destination = projects.find(project => project.id === projectEls.createExistingSelect.value && project.status === "active" && project.id !== activeProjectId);
      if (!destination) { toast("Виберіть проєкт"); return; }
      const selected = projectSteps(activeProjectId).filter(task => selectedIds.has(task.id));
      const current = projectSteps(destination.id).filter(task => !isTaskCompleted(task));
      const ordered = destination.addNewTasksFirst === true ? [...selected, ...current] : [...current, ...selected];
      const now = new Date().toISOString();
      const changed = ordered.map((task, index) => ({ ...task, projectId: destination.id, projectSectionId: selectedIds.has(task.id) ? null : task.projectSectionId, projectPosition: index, updatedAt: now }));
      await taskDb.putMany(changed);
      const replacements = new Map(changed.map(task => [task.id, task]));
      tasks = tasks.map(task => replacements.get(task.id) || task);
      selectedTaskIds = new Set();
      closeCreateFromStepsDialog();
      renderOpenProject();
      renderProjects();
      renderCurrentTasks();
      toast("Завдання додано до проєкту");
      return;
    }
    const plan = projectFromSelectedSteps(title, activeProjectId, selectedIds, tasks, projects);
    await projectDb.createFromSteps(activeProjectId, plan.project, plan.steps);
    const moved = new Map(plan.steps.map(task => [task.id, task]));
    tasks = tasks.map(task => moved.get(task.id) || task);
    projects = [...projects, plan.project].sort(compareProjects);
    selectedTaskIds = new Set();
    closeCreateFromStepsDialog();
    renderOpenProject();
    renderProjects();
    toast("Новий проєкт створено");
  } catch (_error) {
    toast("Не вдалося зберегти проєкт. Кроки не змінено");
  } finally {
    syncCreateFromStepsMode();
  }
}

async function reorderSelectedProjectSteps({ beforeId, sectionId = null, movedIds = null }) {
  if (sectionId === PROJECT_ROOT_SECTION_ID) sectionId = null;
  const projectSelectedIds = selectedActiveProjectStepIds();
  const ordered = reorderProjectStepBlock(tasks, activeProjectId, projectSelectedIds, beforeId);
  const moveSet = new Set(movedIds || []);
  const now = new Date().toISOString();
  const reordered = movedIds ? ordered.map(task => moveSet.has(task.id) && task.projectSectionId !== sectionId
    ? { ...task, projectSectionId: sectionId, updatedAt: now } : task) : ordered;
  const changed = reordered.filter((task, index) => task !== tasks[index]);
  if (!changed.length) return;
  tasks = reordered;
  renderOpenProject();
  renderProjects();
  try { await taskDb.putMany(changed); }
  catch (_error) { await refresh(); toast("Не вдалося зберегти порядок кроків"); }
}

async function reorderProjectCards({ selectedIds, beforeId }) {
  const reordered = reorderProjectBlock(projects, selectedIds, beforeId);
  const changed = reordered.filter((project, index) => project !== projects[index]);
  if (!changed.length) return;
  projects = reordered;
  renderProjects();
  try { await projectDb.putMany(changed); }
  catch (_error) { await loadProjects(); toast("Не вдалося зберегти порядок проєктів"); }
}

function selectProject(projectId) {
  if (!projects.some(project => project.id === projectId && project.status !== "completed")) return;
  selectedProjectIds.add(projectId);
  renderProjects();
}

function selectOnlyProject(projectId) {
  selectedProjectIds = new Set([projectId]);
  renderProjects();
}

function toggleProjectSelection(projectId) {
  if (selectedProjectIds.has(projectId)) selectedProjectIds.delete(projectId);
  else selectedProjectIds.add(projectId);
  renderProjects();
}

function clearProjectSelection() {
  selectedProjectIds = new Set();
  renderProjects();
}

async function completeSelectedProjects() {
  const selected = projects.filter(project => selectedProjectIds.has(project.id) && project.status !== "completed");
  if (!selected.length) return;
  await completeProjects(selected);
}

async function completeProjects(selected) {
  const completeTasks = await requestProjectCompletion(selected.length);
  if (completeTasks === null) return;
  const now = new Date().toISOString();
  const updates = selected.map(project => ({ ...project, status: "completed", completedAt: now, updatedAt: now }));
  const ids = new Set(updates.map(project => project.id));
  const replacements = new Map(updates.map(project => [project.id, project]));
  await projectDb.completeManyWithTasks(updates, now, completeTasks);
  projects = projects.map(project => replacements.get(project.id) || project);
  tasks = tasks.map(task => {
    if (!ids.has(task.projectId) || task.status !== "active") return task;
    return completeTasks
      ? { ...task, status: "completed", completedAt: now, updatedAt: now }
      : { ...task, projectId: null, projectSectionId: null, projectPosition: null, updatedAt: now };
  });
  selectedProjectIds = new Set();
  renderProjects();
  renderCurrentTasks();
}

function requestProjectCompletion(count) {
  if (projectCompleteDialogResolve) projectCompleteDialogResolve(null);
  projectCompleteDialogReturnFocus = document.activeElement;
  projectEls.completeDialogTitle.textContent = count === 1 ? "Завершити проєкт?" : `Завершити проєкти (${count})?`;
  projectEls.completeTasks.checked = true;
  projectEls.completeDialogBackdrop.hidden = false;
  document.body.classList.add("project-complete-dialog-open");
  requestAnimationFrame(() => projectEls.completeDialog.focus());
  return new Promise(resolve => { projectCompleteDialogResolve = resolve; });
}

function closeProjectCompleteDialog(result = null) {
  if (!projectCompleteDialogResolve) return;
  const resolve = projectCompleteDialogResolve;
  projectCompleteDialogResolve = null;
  projectEls.completeDialogBackdrop.hidden = true;
  document.body.classList.remove("project-complete-dialog-open");
  projectCompleteDialogReturnFocus?.focus();
  projectCompleteDialogReturnFocus = null;
  resolve(result);
}

async function deleteSelectedProjects() {
  const ids = new Set(selectedProjectIds);
  if (!ids.size) return;
  const detachTasks = await requestProjectDeletion(ids.size);
  if (detachTasks === null) return;
  const now = new Date().toISOString();
  await projectDb.deleteManyWithTasks(ids, now, detachTasks);
  tasks = detachTasks
    ? tasks.map(task => ids.has(task.projectId) ? { ...task, projectId: null, projectSectionId: null, projectPosition: null, updatedAt: now } : task)
    : tasks.filter(task => !ids.has(task.projectId));
  projects = projects.filter(project => !ids.has(project.id));
  selectedProjectIds = new Set();
  renderProjects();
  renderCurrentTasks();
  toast(detachTasks ? "Проєкти видалено, завдання збережено" : "Проєкти та їхні завдання видалено");
}

function requestProjectDeletion(count) {
  if (projectDeleteDialogResolve) projectDeleteDialogResolve(null);
  projectDeleteDialogReturnFocus = document.activeElement;
  projectEls.deleteDialogTitle.textContent = count === 1 ? "Видалити проєкт?" : `Видалити проєкти (${count})?`;
  projectEls.deleteKeepTasks.checked = true;
  projectEls.deleteDialogBackdrop.hidden = false;
  document.body.classList.add("project-delete-dialog-open");
  requestAnimationFrame(() => projectEls.deleteDialog.focus());
  return new Promise(resolve => { projectDeleteDialogResolve = resolve; });
}

function closeProjectDeleteDialog(result = null) {
  if (!projectDeleteDialogResolve) return;
  const resolve = projectDeleteDialogResolve;
  projectDeleteDialogResolve = null;
  projectEls.deleteDialogBackdrop.hidden = true;
  document.body.classList.remove("project-delete-dialog-open");
  projectDeleteDialogReturnFocus?.focus();
  projectDeleteDialogReturnFocus = null;
  resolve(result);
}

projectEls.add.addEventListener("click", () => { projectEls.createForm.hidden = false; projectEls.createTitle.focus(); });
projectEls.createCancel.addEventListener("click", () => { projectEls.createForm.hidden = true; projectEls.createTitle.value = ""; });
projectEls.createForm.addEventListener("submit", event => { event.preventDefault(); addProject(projectEls.createTitle.value); });
[projectEls.activeList, projectEls.completedList].forEach(container => container.addEventListener("click", event => {
  const card = event.target.closest("[data-project-id]");
  if (!card) return;
  if (card.dataset.dragged) { delete card.dataset.dragged; return; }
  if (card.dataset.longPressed) { delete card.dataset.longPressed; return; }
  if (selectedProjectIds.size && container === projectEls.activeList) { toggleProjectSelection(card.dataset.projectId); return; }
  openProject(card.dataset.projectId);
}));
projectEls.overviewSelectionClose.addEventListener("click", clearProjectSelection);
projectEls.completeSelected.addEventListener("click", completeSelectedProjects);
projectEls.deleteSelectedProjects.addEventListener("click", deleteSelectedProjects);
projectEls.completeNo.addEventListener("click", () => closeProjectCompleteDialog(null));
projectEls.completeYes.addEventListener("click", () => closeProjectCompleteDialog(projectEls.completeTasks.checked));
projectEls.completeDialogBackdrop.addEventListener("click", event => { if (event.target === projectEls.completeDialogBackdrop) closeProjectCompleteDialog(null); });
projectEls.deleteNo.addEventListener("click", () => closeProjectDeleteDialog(null));
projectEls.deleteYes.addEventListener("click", () => closeProjectDeleteDialog(projectEls.deleteKeepTasks.checked));
projectEls.deleteDialogBackdrop.addEventListener("click", event => { if (event.target === projectEls.deleteDialogBackdrop) closeProjectDeleteDialog(null); });
projectEls.overdueCancel.addEventListener("click", closeProjectOverdueDialog);
projectEls.overdueClear.addEventListener("click", () => resolveProjectOverdue(false));
projectEls.overdueDelete.addEventListener("click", () => resolveProjectOverdue(true));
projectEls.overdueDialogBackdrop.addEventListener("click", event => { if (event.target === projectEls.overdueDialogBackdrop) closeProjectOverdueDialog(); });
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (!projectEls.completeDialogBackdrop.hidden) closeProjectCompleteDialog(null);
  else if (!projectEls.deleteDialogBackdrop.hidden) closeProjectDeleteDialog(null);
  else if (!projectEls.overdueDialogBackdrop.hidden) closeProjectOverdueDialog();
});
projectEls.back.addEventListener("click", closeProject);
projectEls.editOpen.addEventListener("click", openProjectEditor);
async function setProjectRootHidden(hidden) {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project || project.unsectionedHidden === hidden) return;
  const updated = createProject({ ...project, unsectionedHidden: hidden, updatedAt: new Date().toISOString() });
  try {
    await projectDb.put(updated);
    projects = projects.map(item => item.id === updated.id ? updated : item);
    renderOpenProject();
  } catch (_error) {
    projectEls.hideRoot.checked = project.unsectionedHidden === true;
    toast("Не вдалося змінити видимість секції");
  }
}
projectEls.rootVisibility.addEventListener("click", () => {
  const project = projects.find(item => item.id === activeProjectId);
  if (project) setProjectRootHidden(!project.unsectionedHidden);
});
projectEls.hideRoot.addEventListener("change", () => setProjectRootHidden(projectEls.hideRoot.checked));
projectEls.editClose.addEventListener("click", () => saveProjectFields({ closeAfter: true }));
projectEls.tasksExpand.addEventListener("click", toggleProjectTasks);
projectEls.mainComplete.addEventListener("click", toggleProjectStatus);
[projectEls.title, projectEls.description, projectEls.dueDate, projectEls.dueTime, projectEls.defaultList].forEach(field => field.addEventListener("input", markProjectDirty));
projectEls.datePickerOpen.addEventListener("click", () => {
  editingSelectedTaskDates = false;
  editingProjectDate = true;
  openDatePicker(projectEls.dueDate.value, projectEls.dueTime.value);
});
projectEls.showCountdown.addEventListener("change", () => { markProjectDirty(); renderProjectCountdown(); });

projectEls.sectionCreate.addEventListener("submit", event => { event.preventDefault(); assignSelectedProjectTasks(); });
document.querySelector("#project-section-options").addEventListener("click", event => {
  const button = event.target.closest("[data-assign-project-section]");
  if (button) assignSelectedProjectTasks(button.dataset.assignProjectSection);
});
projectEls.taskList.addEventListener("click", async event => {
  const add = event.target.closest(".list-section-add");
  if (add) {
    if (add.dataset.longPressed) { delete add.dataset.longPressed; return; }
    const sectionId = add.closest("[data-section-id]")?.dataset.sectionId;
    if (sectionId) openQuickTask({ kind: "project-section", projectId: activeProjectId, sectionId: sectionId === PROJECT_ROOT_SECTION_ID ? null : sectionId });
    return;
  }
  const header = event.target.closest("[data-project-section-toggle]");
  const id = header?.dataset.projectSectionToggle;
  const row = header?.closest(".project-section-heading");
  if (row?.dataset.longPressed || row?.dataset.dragged) { delete row.dataset.longPressed; delete row.dataset.dragged; return; }
  if (id && id !== PROJECT_ROOT_SECTION_ID && selectedProjectSectionIds.size) {
    if (selectedProjectSectionIds.has(id)) selectedProjectSectionIds.delete(id);
    else selectedProjectSectionIds.add(id);
    syncProjectSectionSelection();
    return;
  }
  const project = projects.find(item => item.id === activeProjectId);
  if (!id || !project) return;
  const updated = createProject({ ...project,
    ...(id === PROJECT_ROOT_SECTION_ID ? { unsectionedCollapsed: !project.unsectionedCollapsed } : { projectSections: project.projectSections.map(section => section.id === id ? { ...section, collapsed: !section.collapsed } : section) }),
    updatedAt: new Date().toISOString() });
  try { await projectDb.put(updated); projects = projects.map(item => item.id === updated.id ? updated : item); renderOpenProject(); }
  catch (_error) { toast("Не вдалося змінити секцію"); }
});
let sectionAddPress = null;
projectEls.taskList.addEventListener("pointerdown", event => {
  const button = event.target.closest(".project-section-heading .list-section-add");
  if (!button || event.button > 0) return;
  const sectionId = button.closest("[data-section-id]")?.dataset.sectionId;
  if (!sectionId) return;
  sectionAddPress = { button, pointerId: event.pointerId, x: event.clientX, y: event.clientY,
    timer: setTimeout(() => {
      if (!sectionAddPress || sectionAddPress.button !== button) return;
      button.dataset.longPressed = "true";
      setTimeout(() => { delete button.dataset.longPressed; }, 700);
      openAttachDialog(sectionId === PROJECT_ROOT_SECTION_ID ? null : sectionId, button);
      sectionAddPress = null;
    }, 450) };
});
projectEls.taskList.addEventListener("pointermove", event => {
  if (!sectionAddPress || event.pointerId !== sectionAddPress.pointerId) return;
  if (Math.hypot(event.clientX - sectionAddPress.x, event.clientY - sectionAddPress.y) > 12) {
    clearTimeout(sectionAddPress.timer);
    sectionAddPress = null;
  }
});
for (const type of ["pointerup", "pointercancel", "pointerleave"]) projectEls.taskList.addEventListener(type, event => {
  if (!sectionAddPress || event.pointerId !== sectionAddPress.pointerId) return;
  clearTimeout(sectionAddPress.timer);
  sectionAddPress = null;
});
projectEls.taskList.addEventListener("contextmenu", event => {
  if (event.target.closest(".project-section-heading .list-section-add")) event.preventDefault();
});
projectEls.taskList.addEventListener("keydown", event => {
  const button = event.target.closest(".project-section-heading .list-section-add");
  if (!button || event.key !== "Enter" || !event.shiftKey) return;
  event.preventDefault();
  const sectionId = button.closest("[data-section-id]")?.dataset.sectionId;
  openAttachDialog(sectionId === PROJECT_ROOT_SECTION_ID ? null : sectionId, button);
});
projectEls.attachClose.addEventListener("click", closeAttachDialog);
projectEls.attachBackdrop.addEventListener("click", event => { if (event.target === projectEls.attachBackdrop) closeAttachDialog(); });
projectEls.attachDialog.addEventListener("keydown", event => { if (event.key === "Escape") closeAttachDialog(); });
projectEls.attachSearch.addEventListener("input", renderAttachResults);
projectEls.attachResults.addEventListener("change", event => {
  if (event.target.type !== "checkbox") return;
  if (event.target.checked) attachSelectedIds.add(event.target.value);
  else attachSelectedIds.delete(event.target.value);
  projectEls.attachSave.disabled = attachSelectedIds.size === 0;
  projectEls.attachSave.textContent = attachSelectedIds.size ? `Додати (${attachSelectedIds.size})` : "Додати";
});
projectEls.attachSave.addEventListener("click", saveAttachedTasks);
projectEls.addNewFirst.addEventListener("change", async () => {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project) return;
  const updated = createProject({ ...project, addNewTasksFirst: projectEls.addNewFirst.checked, updatedAt: new Date().toISOString() });
  projects = projects.map(item => item.id === updated.id ? updated : item);
  try { await projectDb.put(updated); }
  catch (_error) {
    projects = projects.map(item => item.id === project.id ? project : item);
    projectEls.addNewFirst.checked = project.addNewTasksFirst === true;
    toast("Не вдалося зберегти порядок нових завдань");
  }
});
projectEls.actionsTrigger.addEventListener("click", () => {
  const open = projectEls.actionsMenu.hidden;
  projectEls.actionsMenu.hidden = !open;
  projectEls.actionsTrigger.setAttribute("aria-expanded", String(open));
  if (open) projectEls.actionsMenu.querySelector("button:not([hidden])").focus();
});
document.addEventListener("click", event => {
  if (!event.target.closest("#project-actions-menu, #project-actions-trigger")) closeProjectActions();
  if (!event.target.closest(".project-copy-menu")) document.querySelector(".project-copy-menu").open = false;
});
projectEls.actionsMenu.addEventListener("keydown", event => {
  const buttons = [...projectEls.actionsMenu.querySelectorAll("button:not([hidden])")];
  const index = buttons.indexOf(document.activeElement);
  if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeProjectActions({ focus: true }); }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    buttons[(index + (event.key === "ArrowDown" ? 1 : buttons.length - 1)) % buttons.length].focus();
  }
  if (event.key === "Tab") closeProjectActions({ focus: true });
});
projectEls.sectionsOpen.addEventListener("click", openProjectSections);
document.querySelector("#project-sections-close").addEventListener("click", closeProjectSections);
projectEls.descriptionOpen.addEventListener("click", openProjectDescription);
document.querySelector("#project-description-cancel").addEventListener("click", () => closeProjectDescription());
document.querySelector("#project-description-done").addEventListener("click", () => closeProjectDescription(true));
for (const [dialog, close] of [[projectEls.sectionsDialog, closeProjectSections], [projectEls.descriptionDialog, closeProjectDescription]]) {
  dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
  dialog.addEventListener("click", event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) close();
  });
}
document.querySelector(".project-copy-menu").addEventListener("click", event => {
  if (event.target.closest("button")) event.currentTarget.open = false;
});
async function runProjectMenuAction(action) {
  if (!await saveProjectFields()) { closeProjectActions(); return; }
  closeProjectActions({ focus: true });
  await action();
}
projectEls.complete.addEventListener("click", () => runProjectMenuAction(toggleProjectStatus));
projectEls.delete.addEventListener("click", () => runProjectMenuAction(deleteProject));
projectEls.convertTask.addEventListener("click", () => runProjectMenuAction(openProjectConvertDialog));
projectEls.convertCancel.addEventListener("click", closeProjectConvertDialog);
projectEls.convertConfirm.addEventListener("click", convertOpenProjectToTask);
projectEls.convertDialogBackdrop.addEventListener("click", event => {
  if (event.target === projectEls.convertDialogBackdrop) closeProjectConvertDialog();
});
projectEls.convertDialog.addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); closeProjectConvertDialog(); }
});
projectEls.taskList.addEventListener("click", async event => {
  if (event.target.closest(".project-completed-toggle")) { toggleCompletedProjectTasks(); return; }
  const row = event.target.closest(".swipe-row");
  if (!row || row.dataset.swiped) { if (row) delete row.dataset.swiped; return; }
  if (row.dataset.longPressed) { delete row.dataset.longPressed; return; }
  if (selectedTaskIds.size) { toggleTaskSelection(row.dataset.id); return; }
  const task = tasks.find(item => item.id === row.dataset.id);
  if (event.target.closest(".toggle")) {
    if (isTaskCompleted(task)) await reopenProjectTask(task);
    else await completeTask(task, {}, event.target.closest(".toggle"));
    renderOpenProject();
    return;
  }
  if (event.target.closest(".task-card")) openTaskDetails(task);
});

projectEls.selectionClose.addEventListener("click", clearTaskSelection);
projectEls.selectAll.addEventListener("click", () => {
  const ids = projectSteps(activeProjectId).map(task => task.id);
  const allSelected = ids.length > 0 && ids.every(id => selectedTaskIds.has(id));
  selectedTaskIds = allSelected ? new Set() : new Set(ids);
  renderCurrentTasks();
});
projectEls.dateSelected.addEventListener("click", openSelectedTaskDatePicker);
projectEls.listSelected.addEventListener("click", () => {
  if (!projectEls.listOptions.hidden) resetListDropdownKeyboard(projectEls.listOptions);
  projectEls.listOptions.hidden = !projectEls.listOptions.hidden;
  projectEls.listOptions.scrollLeft = 0;
  projectEls.listSelected.setAttribute("aria-expanded", String(!projectEls.listOptions.hidden));
  if (!projectEls.listOptions.hidden && matchMedia("(max-width: 759px)").matches) {
    positionListDropdownForKeyboard(projectEls.listOptions);
    requestAnimationFrame(() => projectEls.listOptions.querySelector(".list-dropdown-search")?.focus({ preventScroll: true }));
  }
});
projectEls.listOptions.addEventListener("click", event => {
  const option = event.target.closest("[data-list-id]");
  if (!option) return;
  resetListDropdownKeyboard(projectEls.listOptions);
  projectEls.listOptions.hidden = true;
  projectEls.listSelected.setAttribute("aria-expanded", "false");
  moveSelectedTasksToList(option.dataset.listId);
});
projectEls.deleteSelected.addEventListener("click", deleteSelectedTasks);
projectEls.selectionMoreTrigger.addEventListener("click", () => {
  const open = projectEls.selectionMoreMenu.hidden;
  projectEls.addToExisting.disabled = !projects.some(project => project.status === "active" && project.id !== activeProjectId);
  projectEls.selectionMoreMenu.hidden = !open;
  projectEls.selectionMoreTrigger.setAttribute("aria-expanded", String(open));
  if (open) projectEls.selectionMoreMenu.querySelector("button:not(:disabled)")?.focus();
});
projectEls.addToExisting.addEventListener("click", () => openCreateFromStepsDialog("existing"));
projectEls.createFromSteps.addEventListener("click", () => openCreateFromStepsDialog("new"));
projectEls.detachSelected.addEventListener("click", detachSelectedProjectSteps);
document.addEventListener("click", event => { if (!event.target.closest(".project-selection-more")) closeProjectSelectionMore(); });
projectEls.selectionMore.addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); closeProjectSelectionMore({ focus: true }); }
});
projectEls.createFromStepsCancel.addEventListener("click", closeCreateFromStepsDialog);
projectEls.createFromStepsConfirm.addEventListener("click", createProjectFromSelectedSteps);
projectEls.createFromStepsName.addEventListener("keydown", event => {
  if (event.key === "Enter") { event.preventDefault(); createProjectFromSelectedSteps(); }
});
projectEls.createFromStepsDialog.addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); closeCreateFromStepsDialog(); }
});
projectEls.createFromStepsBackdrop.addEventListener("click", event => {
  if (event.target === projectEls.createFromStepsBackdrop) closeCreateFromStepsDialog();
});

enableTaskGestures({
  container: projectEls.taskList,
  onDelete: deleteTask,
  isSelectionMode: () => selectedTaskIds.size > 0,
  isSelected: id => selectedTaskIds.has(id),
  onLongPress: selectTask,
  onSelectOnly: selectTask,
  getSelectedIds: selectedActiveProjectStepIds,
  onReorder: reorderSelectedProjectSteps,
  canDragRow: row => !row.classList.contains("completed"),
  sectionDragEnabled: () => Boolean(projects.find(item => item.id === activeProjectId)?.projectSections?.length),
  requireSelectionForDrag: true
});

enableProjectCardReorder({
  container: projectEls.activeList,
  isSelectionMode: () => selectedProjectIds.size > 0,
  isSelected: id => selectedProjectIds.has(id),
  onLongPress: selectProject,
  onSelectOnly: selectOnlyProject,
  getSelectedIds: () => new Set(selectedProjectIds),
  onReorder: reorderProjectCards
});

projectEls.taskList.addEventListener("contextmenu", event => {
  if (event.target.closest("[data-project-section-toggle]")) event.preventDefault();
});
document.querySelector("#project-section-selection-close").addEventListener("click", clearProjectSectionSelection);
projectEls.taskList.addEventListener("keydown", event => {
  const header = event.target.closest("[data-project-section-toggle]");
  if (!header) return;
  if (event.key === "Escape") { clearProjectSectionSelection(); event.preventDefault(); }
  if (event.key === " " && event.shiftKey && header.dataset.projectSectionToggle !== PROJECT_ROOT_SECTION_ID) { selectProjectSection(header.dataset.projectSectionToggle); event.preventDefault(); }
  if (event.altKey && ["ArrowUp", "ArrowDown"].includes(event.key)) {
    event.preventDefault();
    const sections = projects.find(project => project.id === activeProjectId)?.projectSections || [];
    const index = sections.findIndex(section => section.id === header.dataset.projectSectionToggle);
    const target = event.key === "ArrowUp" ? index - 1 : index + 2;
    if ((event.key === "ArrowUp" && index <= 0) || (event.key === "ArrowDown" && index >= sections.length - 1)) return;
    changeProjectSections(project => ({ project: reorderProjectSections(project, new Set([header.dataset.projectSectionToggle]), sections[target]?.id || null) }));
  }
});
for (const action of ["rename", "dissolve", "delete"]) document.getElementById(`project-section-${action}`).addEventListener("click", () => openProjectSectionAction(action));
document.querySelector("#project-section-action-cancel").addEventListener("click", closeProjectSectionAction);
projectEls.sectionActionDialog.addEventListener("cancel", event => { event.preventDefault(); closeProjectSectionAction(); });
document.querySelector("#project-section-action-form").addEventListener("submit", async event => {
  event.preventDefault();
  const action = projectEls.sectionActionDialog.dataset.action;
  const listMode = sectionDialogScope?.kind === "list";
  const selected = new Set(listMode ? selectedListSectionIds : selectedProjectSectionIds);
  const confirm = document.querySelector("#project-section-action-confirm");
  confirm.disabled = true;
  const saved = listMode
    ? await changeListSections(list => action === "rename"
      ? renameListSection(sections, list.id, [...selected][0], document.querySelector("#project-section-rename-input").value)
      : removeListSections(sections, tasks, list.id, selected, action === "delete"), sectionDialogScope.id)
    : await changeProjectSections(project => action === "rename"
      ? { project: renameProjectSection(project, [...selected][0], document.querySelector("#project-section-rename-input").value) }
      : removeProjectSections(project, tasks, selected, action === "delete"));
  confirm.disabled = false;
  if (saved) {
    if (action !== "rename") (listMode ? selectedListSectionIds : selectedProjectSectionIds).clear();
    closeProjectSectionAction();
    if (listMode) syncListSectionSelection(); else syncProjectSectionSelection();
  }
});
enableProjectCardReorder({
  container: projectEls.taskList, cardSelector: ".project-section-heading:not(.project-root-heading)", handleSelector: "[data-project-section-toggle]", insertionSelector: ".list-section-heading", idKey: "sectionId", scrollElement: projectEls.screen, requireSelectionForDrag: true,
  isSelectionMode: () => !projectSectionBusy && selectedProjectSectionIds.size > 0,
  isSelected: id => !projectSectionBusy && selectedProjectSectionIds.has(id),
  onLongPress: id => selectProjectSection(id), onSelectOnly: id => selectProjectSection(id, true),
  getSelectedIds: () => new Set(selectedProjectSectionIds),
  onReorder: ({ selectedIds, beforeId }) => changeProjectSections(project => ({ project: reorderProjectSections(project, selectedIds, beforeId) }))
});
