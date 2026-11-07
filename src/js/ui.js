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
  taskAttachProjectSelect: document.querySelector("#task-attach-project-select"),
  taskAttachCancel: document.querySelector("#task-attach-cancel"),
  taskAttachConfirm: document.querySelector("#task-attach-confirm"),
  taskConvertProject: document.querySelector("#task-convert-project"),
  taskConvertStepsCount: document.querySelector("#task-convert-steps-count"),
  taskDetachProject: document.querySelector("#task-detach-project"),
  taskActionsTrigger: document.querySelector("#task-actions-trigger"),
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

const richVideoTitles = new Map();
function richSafeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch (_error) { return null; }
}
function richLink(url, label, autoTitle = false) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.textContent = label;
  anchor.title = url;
  if (autoTitle) queueMicrotask(() => richEnrichVideo(anchor));
  return anchor;
}
function richEnrichVideo(anchor) {
  if (!anchor.isConnected || anchor.dataset.videoRequested) return;
  const url = richSafeUrl(anchor.href);
  if (!url || !/(^|\.)youtube\.com$|(^|\.)youtu\.be$/i.test(new URL(url).hostname)) return;
  const label = anchor.textContent;
  if (label !== new URL(url).hostname) return;
  const cached = richVideoTitles.get(url);
  if (cached) { anchor.textContent = cached; return; }
  anchor.dataset.videoRequested = "true";
  fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`)
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (!data?.title || typeof data.title !== "string" || !anchor.isConnected) return;
      richVideoTitles.set(url, data.title);
      if (anchor.textContent === label) {
        anchor.textContent = data.title;
        anchor.closest(".rich-description")?.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }).catch(() => {});
}
function richInline(parent, source) {
  let rest = source;
  while (rest) {
    const match = rest.match(/^(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*(.+?)\*\*|__(.+?)__|<u>([\s\S]+?)<\/u>|\*([^*\n]+)\*|_([^_\n]+)_|(https?:\/\/[^\s<>]+))/i);
    if (match) {
      let node;
      if (match[2]) {
        const url = richSafeUrl(match[3]);
        node = url ? richLink(url, match[2], match[2] === new URL(url).hostname) : document.createTextNode(match[0]);
      } else if (match[4] || match[5]) {
        node = document.createElement("strong"); richInline(node, match[4] || match[5]);
      } else if (match[6]) {
        node = document.createElement("u"); richInline(node, match[6]);
      } else if (match[7] || match[8]) {
        node = document.createElement("em"); richInline(node, match[7] || match[8]);
      } else {
        const clean = match[9].replace(/[.,!?;:]+$/, "");
        const url = richSafeUrl(clean);
        node = url ? richLink(url, new URL(url).hostname, true) : document.createTextNode(match[0]);
        if (clean.length !== match[0].length) rest = match[0].slice(clean.length) + rest.slice(match[0].length);
      }
      parent.append(node);
      if (cleanUndefined(match, node)) rest = rest.slice(match[0].length);
      continue;
    }
    const next = rest.slice(1).search(/\[|\*|_|<u>|https?:\/\//i);
    const length = next < 0 ? rest.length : next + 1;
    parent.append(document.createTextNode(rest.slice(0, length)));
    rest = rest.slice(length);
  }
}
function cleanUndefined(match, node) { return !(match[9] && node.nodeType === 1 && match[9].replace(/[.,!?;:]+$/, "").length !== match[0].length); }
function richMarkdownFragment(value) {
  const root = document.createDocumentFragment();
  if (!value) return root;
  const lines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
  let list = null;
  let emptyChecklistContent = null;
  for (const line of lines) {
    const bullet = line.match(/^\s*([-*+] |\d+[.)] )(.*)$/);
    if (bullet) {
      emptyChecklistContent = null;
      const ordered = /^\d/.test(bullet[1]);
      if (!list || list.tagName !== (ordered ? "OL" : "UL")) {
        list = document.createElement(ordered ? "ol" : "ul"); root.append(list);
        if (ordered) list.start = Number.parseInt(bullet[1], 10);
      }
      const item = document.createElement("li");
      const check = !ordered && bullet[2].match(/^\[([ xX])\](?: |$)(.*)$/);
      if (check) {
        if (!list.classList.contains("rich-checklist") && list.children.length) {
          list = document.createElement("ul"); root.append(list);
        }
        list.classList.add("rich-checklist");
        const box = document.createElement("input");
        box.type = "checkbox"; box.checked = check[1].toLowerCase() === "x";
        box.setAttribute("aria-label", "Виконано");
        box.contentEditable = "false";
        item.append(box);
        const content = document.createElement("span");
        content.className = "checklist-item-text";
        richInline(content, check[2]);
        if (!content.childNodes.length) content.append(document.createElement("br"));
        item.append(content);
        if (!check[2].trim()) emptyChecklistContent = content;
      } else {
        if (list.classList.contains("rich-checklist")) {
          list = document.createElement("ul"); root.append(list);
        }
        richInline(item, bullet[2]);
      }
      list.append(item);
    } else if (!line.trim()) {
      emptyChecklistContent = null;
      list = null;
      const blank = document.createElement("div"); blank.className = "rich-blank-line"; root.append(blank);
    } else {
      if (emptyChecklistContent) {
        emptyChecklistContent.replaceChildren();
        richInline(emptyChecklistContent, line);
        emptyChecklistContent = null;
        continue;
      }
      list = null;
      const paragraph = document.createElement("p"); root.append(paragraph);
      richInline(paragraph, line);
    }
  }
  return root;
}
function richPreviewText(value) {
  const holder = document.createElement("div");
  holder.append(richMarkdownFragment(value));
  return holder.innerText || holder.textContent || "";
}
function richSerializeInline(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const tag = node.tagName.toLowerCase();
  const content = [...node.childNodes].map(richSerializeInline).join("");
  if (tag === "br") return "\n";
  if (node.classList.contains("checklist-item-text")) return content.replaceAll("\n", "");
  if (tag === "strong" || tag === "b") return `**${content}**`;
  if (tag === "em" || tag === "i") return `*${content}*`;
  if (tag === "u") return `<u>${content}</u>`;
  if (tag === "a") { const url = richSafeUrl(node.getAttribute("href")); return url ? `[${content}](${url})` : content; }
  return content;
}
function richSerialize(node) {
  const parts = [];
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) { parts.push(child.textContent); continue; }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const tag = child.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      parts.push([...child.children].filter(item => item.tagName === "LI")
        .map((item, index) => `${tag === "ol" ? `${(Number.parseInt(child.getAttribute("start"), 10) || 1) + index}.` : "-"} ${item.querySelector(':scope > input[type="checkbox"]') ? `[${item.querySelector(':scope > input[type="checkbox"]').checked ? "x" : " "}] ` : ""}${[...item.childNodes].filter(node => node.tagName !== "INPUT" && (node.tagName !== "BR" || !item.querySelector(':scope > input[type="checkbox"]'))).map(richSerializeInline).join("")}`).join("\n"));
    } else if (child.classList.contains("rich-blank-line")) parts.push("");
    else if (tag === "p" || tag === "div") parts.push([...child.childNodes].map(richSerializeInline).join(""));
    else parts.push(richSerializeInline(child));
  }
  return parts.join("\n").trim();
}
function richFromHtml(html) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const allowed = document.createElement("div");
  function sanitize(source, target) {
    for (const child of source.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) { target.append(document.createTextNode(child.textContent)); continue; }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = child.tagName.toLowerCase();
      if (["script", "style", "iframe", "img", "svg"].includes(tag)) continue;
      const mapped = { b: "strong", i: "em" }[tag] || tag;
      const element = ["strong", "em", "u", "a", "p", "div", "br", "ul", "ol", "li"].includes(mapped)
        ? document.createElement(mapped) : document.createElement("span");
      if (mapped === "a") {
        const url = richSafeUrl(child.getAttribute("href"));
        if (url) element.setAttribute("href", url);
      }
      sanitize(child, element);
      target.append(element);
    }
  }
  sanitize(parsed.body, allowed);
  return richSerialize(allowed);
}
function installChecklistDrag(editor) {
  let gesture = null;
  const scrollContainer = () => {
    if (editor.closest(".description-edit-mode")) {
      if (editor.scrollHeight > editor.clientHeight) return editor;
      const fields = editor.closest(".detail-fields");
      if (fields.scrollHeight > fields.clientHeight) return fields;
    }
    return document.querySelector("#task-editor");
  };
  function decorate() {
    for (const item of editor.querySelectorAll(".rich-checklist > li")) {
      const content = item.querySelector(".checklist-item-text");
      if (content?.textContent.trim()) content.querySelectorAll("br").forEach(br => br.remove());
      if (item.querySelector(":scope > .checklist-drag-handle")) continue;
      const handle = document.createElement("span");
      handle.className = "checklist-drag-handle";
      handle.contentEditable = "false";
      handle.setAttribute("role", "button");
      handle.setAttribute("tabindex", "0");
      handle.setAttribute("aria-label", "Перетягнути пункт чекліста");
      item.append(handle);
    }
  }
  function animateSiblings(list, before) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const item of list.children) {
      if (item === gesture.item) continue;
      const old = before.get(item);
      if (!old) continue;
      const delta = old.top - item.getBoundingClientRect().top;
      if (Math.abs(delta) > 1) {
        item.getAnimations().forEach(animation => animation.cancel());
        item.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], { duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" });
      }
    }
  }
  function updateOrder(y) {
    const { list, item } = gesture;
    const siblings = [...list.children].filter(candidate => candidate !== item);
    const beforeItem = siblings.find(candidate => {
      const rect = candidate.getBoundingClientRect();
      return y < rect.top + rect.height / 2;
    }) || null;
    if (beforeItem === item.nextElementSibling || (!beforeItem && item === list.lastElementChild)) return;
    const before = new Map(siblings.map(candidate => [candidate, candidate.getBoundingClientRect()]));
    list.insertBefore(item, beforeItem);
    gesture.moved = true;
    animateSiblings(list, before);
  }
  function follow() {
    if (!gesture?.dragging) return;
    const rate = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : .42;
    gesture.x += (gesture.targetX - gesture.x) * rate;
    gesture.y += (gesture.targetY - gesture.y) * rate;
    gesture.preview.style.transform = `translate3d(${gesture.x}px,${gesture.y}px,0)`;
    const scroller = scrollContainer();
    const bounds = scroller.getBoundingClientRect();
    const edge = 60;
    const speed = gesture.lastY < bounds.top + edge ? -Math.min(12, (bounds.top + edge - gesture.lastY) / 4)
      : gesture.lastY > bounds.bottom - edge ? Math.min(12, (gesture.lastY - bounds.bottom + edge) / 4) : 0;
    if (speed) { scroller.scrollBy(0, speed); updateOrder(gesture.lastY); }
    gesture.frame = requestAnimationFrame(follow);
  }
  function startDrag() {
    if (!gesture) return;
    const rect = gesture.item.getBoundingClientRect();
    const preview = gesture.item.cloneNode(true);
    preview.classList.add("checklist-drag-preview");
    preview.style.width = `${rect.width}px`;
    preview.style.left = `${rect.left}px`;
    preview.style.top = `${rect.top}px`;
    preview.setAttribute("aria-hidden", "true");
    document.body.append(preview);
    gesture.item.classList.add("checklist-drag-source");
    gesture = { ...gesture, dragging: true, preview, x: 0, y: 0,
      targetX: gesture.lastX - gesture.startX, targetY: gesture.lastY - gesture.startY };
    gesture.frame = requestAnimationFrame(follow);
  }
  function finish(cancel = false) {
    if (!gesture) return;
    const finished = gesture;
    gesture = null;
    if (finished.handle) {
      window.getSelection()?.removeAllRanges();
      if (document.activeElement?.classList.contains("checklist-drag-handle")) document.activeElement.blur();
      setTimeout(() => { delete editor.dataset.checklistHandleActive; }, 0);
    }
    clearTimeout(finished.timer);
    cancelAnimationFrame(finished.frame);
    if (finished.swiping) {
      const item = finished.item;
      if (!cancel && finished.swipeX <= -72) {
        const list = finished.list;
        const siblings = [...list.children].filter(sibling => sibling !== item);
        const positions = new Map(siblings.map(sibling => [sibling, sibling.getBoundingClientRect().top]));
        const nextContent = (item.nextElementSibling || item.previousElementSibling)?.querySelector(".checklist-item-text");
        item.remove();
        if (!list.children.length) list.remove();
        if (editor === document.activeElement && nextContent) {
          const range = document.createRange();
          range.selectNodeContents(nextContent); range.collapse(false);
          const selection = window.getSelection();
          selection.removeAllRanges(); selection.addRange(range);
        }
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches) for (const sibling of siblings) {
          const delta = positions.get(sibling) - sibling.getBoundingClientRect().top;
          if (Math.abs(delta) > 1) sibling.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], { duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" });
        }
        editor.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        item.classList.add("checklist-settling");
        item.style.setProperty("--checklist-swipe-x", "0px");
        setTimeout(() => {
          item.classList.remove("checklist-swiping", "checklist-settling");
          item.style.removeProperty("--checklist-swipe-x");
        }, 260);
      }
      return;
    }
    if (!finished.dragging) {
      if (!cancel && !finished.scrolling && !finished.handle
        && Math.hypot(finished.lastX - finished.startX, finished.lastY - finished.startY) <= 8) {
        editor.focus();
        if (finished.caret) {
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(finished.caret);
        }
      }
      return;
    }
    if (cancel && finished.moved) finished.list.insertBefore(finished.item, finished.originalNext);
    const restore = () => {
      finished.preview.remove();
      finished.item.classList.remove("checklist-drag-source");
    };
    if (cancel || matchMedia("(prefers-reduced-motion: reduce)").matches) restore();
    else {
      const rect = finished.item.getBoundingClientRect();
      finished.preview.style.transition = "left 160ms ease, top 160ms ease, transform 160ms ease, opacity 160ms ease";
      finished.preview.style.left = `${rect.left}px`;
      finished.preview.style.top = `${rect.top}px`;
      finished.preview.style.transform = "translate3d(0,0,0)";
      finished.preview.style.opacity = ".65";
      setTimeout(restore, 170);
    }
    if (finished.moved && !cancel) editor.dispatchEvent(new Event("input", { bubbles: true }));
  }
  editor.addEventListener("input", decorate);
  editor.addEventListener("pointerdown", event => {
    if (event.button > 0 || event.target.closest('input[type="checkbox"]')) return;
    const handle = event.target.closest(".checklist-drag-handle");
    const item = event.target.closest(".rich-checklist > li");
    if (!item || !editor.contains(item)) return;
    if (gesture) finish(true);
    if (handle) {
      event.preventDefault();
      editor.dataset.checklistHandleActive = "true";
      window.getSelection()?.removeAllRanges();
      handle.focus({ preventScroll: true });
    }
    const content = item.querySelector(".checklist-item-text");
    let caret = null;
    if (!handle) {
      caret = document.caretRangeFromPoint?.(event.clientX, event.clientY) || null;
      if (content && (!caret || !content.contains(caret.startContainer))) {
        caret = document.createRange();
        caret.selectNodeContents(content);
        caret.collapse(false);
      }
      event.preventDefault();
      item.setPointerCapture?.(event.pointerId);
    }
    gesture = { item, list: item.parentElement, originalNext: item.nextSibling, pointerId: event.pointerId,
      startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY,
      previousY: event.clientY, dragging: false, moved: false, handle: Boolean(handle), caret };
  });
  editor.addEventListener("selectstart", event => {
    if (gesture?.handle) event.preventDefault();
  });
  editor.addEventListener("click", event => {
    if (event.target.closest(".checklist-drag-handle")) event.preventDefault();
  });
  window.addEventListener("pointermove", event => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gesture.lastX = event.clientX; gesture.lastY = event.clientY;
    if (gesture.handle && !gesture.dragging) {
      event.preventDefault();
      if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > 4) {
        startDrag();
      }
    }
    if (!gesture.dragging && !gesture.handle) {
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      if (!gesture.scrolling && (gesture.swiping || dx < -8 && Math.abs(dx) > Math.abs(dy))) {
        event.preventDefault();
        gesture.swiping = true;
        gesture.swipeX = Math.max(-112, Math.min(0, dx));
        gesture.item.classList.add("checklist-swiping");
        gesture.item.style.setProperty("--checklist-swipe-x", `${gesture.swipeX}px`);
      } else if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        gesture.scrolling = true;
        if (event.pointerType === "touch") {
          event.preventDefault();
          scrollContainer().scrollBy(0, gesture.previousY - event.clientY);
        }
      }
      gesture.previousY = event.clientY;
      return;
    }
    if (!gesture.dragging) return;
    event.preventDefault();
    gesture.targetX = event.clientX - gesture.startX;
    gesture.targetY = event.clientY - gesture.startY;
    updateOrder(event.clientY);
  });
  window.addEventListener("pointerup", event => { if (gesture?.pointerId === event.pointerId) finish(); });
  window.addEventListener("pointercancel", event => { if (gesture?.pointerId === event.pointerId) finish(true); });
  editor.addEventListener("keydown", event => {
    const handle = event.target.closest(".checklist-drag-handle");
    if (!handle || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const item = handle.parentElement;
    const sibling = event.key === "ArrowUp" ? item.previousElementSibling : item.nextElementSibling;
    if (!sibling) return;
    if (event.key === "ArrowUp") sibling.before(item); else sibling.after(item);
    handle.focus();
    editor.dispatchEvent(new Event("input", { bubbles: true }));
  });
  return decorate;
}
function installRichDescription(editor, titleInput) {
  const decorateChecklist = editor.id === "task-description" ? installChecklistDrag(editor) : () => {};
  Object.defineProperty(editor, "value", {
    get: () => richSerialize(editor),
    set: value => { editor.replaceChildren(richMarkdownFragment(value)); decorateChecklist(); }
  });
  editor.addEventListener("paste", event => {
    event.preventDefault();
    const plain = event.clipboardData.getData("text/plain");
    const html = event.clipboardData.getData("text/html");
    const markdown = html && !/[\*_\[\]<]/.test(plain) ? richFromHtml(html) : plain;
    const holder = document.createElement("div");
    holder.append(richMarkdownFragment(markdown));
    document.execCommand("insertHTML", false, holder.innerHTML);
    editor.querySelectorAll("a").forEach(richEnrichVideo);
  });
  editor.addEventListener("change", event => {
    if (event.target.matches('.rich-checklist input[type="checkbox"]')) editor.dispatchEvent(new Event("input", { bubbles: true }));
  });
  editor.addEventListener("keydown", event => {
    if (!["Enter", "Backspace"].includes(event.key) || event.key === "Enter" && event.shiftKey) return;
    const selection = window.getSelection();
    const anchor = selection?.anchorNode;
    const anchorElement = anchor?.nodeType === Node.ELEMENT_NODE ? anchor : anchor?.parentElement;
    const item = anchorElement?.closest("li");
    if (!item || !editor.contains(item) || !item.parentElement.classList.contains("rich-checklist")) return;
    const content = item.querySelector(".checklist-item-text");
    if (event.key === "Backspace") {
      if (!selection.isCollapsed || !content) return;
      if (content.textContent.trim()) {
        if (!content.contains(anchor)) {
          event.preventDefault();
          const range = document.createRange();
          range.selectNodeContents(content); range.collapse(false);
          selection.removeAllRanges(); selection.addRange(range);
        } else {
          const before = document.createRange();
          before.selectNodeContents(content);
          before.setEnd(anchor, selection.anchorOffset);
          if (!before.toString()) event.preventDefault();
        }
        return;
      }
      event.preventDefault();
      const list = item.parentElement;
      const previous = item.previousElementSibling?.querySelector(".checklist-item-text");
      const next = item.nextElementSibling?.querySelector(".checklist-item-text");
      let target = previous || next;
      if (!target) {
        target = document.createElement("p");
        target.append(document.createElement("br"));
        list.after(target);
      }
      item.remove();
      if (!list.children.length) list.remove();
      const range = document.createRange();
      range.selectNodeContents(target);
      range.collapse(!previous);
      selection.removeAllRanges(); selection.addRange(range);
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    event.preventDefault();
    if (!item.textContent.trim()) {
      const paragraph = document.createElement("p"); paragraph.append(document.createElement("br"));
      const list = item.parentElement;
      list.after(paragraph); item.remove();
      if (!list.children.length) list.remove();
      selection.removeAllRanges(); const range = document.createRange();
      range.selectNodeContents(paragraph); range.collapse(true); selection.addRange(range);
    } else {
      const next = document.createElement("li");
      const box = document.createElement("input"); box.type = "checkbox"; box.contentEditable = "false"; box.setAttribute("aria-label", "Виконано");
      const content = document.createElement("span"); content.className = "checklist-item-text"; content.append(document.createElement("br"));
      next.append(box, content); item.after(next);
      decorateChecklist();
      selection.removeAllRanges(); const range = document.createRange();
      range.selectNodeContents(content); range.collapse(true); selection.addRange(range);
    }
    editor.dispatchEvent(new Event("input", { bubbles: true }));
  });
  editor.addEventListener("input", event => {
    const selection = window.getSelection();
    if (!selection?.isCollapsed || !editor.contains(selection.anchorNode)) return;
    const anchor = selection.anchorNode;
    const block = (anchor.nodeType === Node.ELEMENT_NODE ? anchor : anchor.parentElement)?.closest("p,div");
    if (!block || !editor.contains(block) || block.closest("li")) return;
    if (!/\s$/.test(block.textContent)) return;
    const marker = block.textContent.trim();
    if (!/^[-*+]$|^\d+[.)]$/.test(marker)) return;
    if (block === editor && editor.textContent.trim() !== marker) return;
    const ordered = /^\d/.test(marker);
    const list = document.createElement(ordered ? "ol" : "ul");
    if (ordered) list.start = Number.parseInt(marker, 10);
    const item = document.createElement("li");
    item.append(document.createElement("br"));
    list.append(item);
    if (block === editor) editor.replaceChildren(list);
    else block.replaceWith(list);
    const range = document.createRange();
    range.selectNodeContents(item);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    editor.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const shell = editor.closest(".rich-description-shell");
  const formatButtons = [...shell.querySelectorAll("[data-rich-command]")];
  function updateFormatButtons() {
    const selection = window.getSelection();
    const inEditor = selection?.rangeCount && editor.contains(selection.anchorNode);
    for (const button of formatButtons) {
      const command = button.dataset.richCommand;
      const active = command === "checklist" ? false : inEditor && (command === "link"
        ? Boolean(selection.anchorNode?.parentElement?.closest("a"))
        : document.queryCommandState(command));
      button.setAttribute("aria-pressed", String(Boolean(active)));
    }
  }
  document.addEventListener("selectionchange", updateFormatButtons);
  editor.addEventListener("input", updateFormatButtons);
  editor.addEventListener("keyup", updateFormatButtons);
  shell.querySelectorAll("[data-rich-command]").forEach(button => {
    button.addEventListener("pointerdown", event => event.preventDefault());
    button.addEventListener("click", () => {
      editor.focus();
      if (button.dataset.richCommand === "link") {
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
        const raw = prompt("Вставте адресу посилання (https://…)");
        const url = richSafeUrl(raw);
        if (!url) return;
        editor.focus();
        if (range) { selection.removeAllRanges(); selection.addRange(range); }
        if (selection?.isCollapsed) document.execCommand("insertHTML", false, richLink(url, new URL(url).hostname).outerHTML);
        else document.execCommand("createLink", false, url);
        for (const link of editor.querySelectorAll("a")) if (link.href === url) {
          link.target = "_blank"; link.rel = "noopener noreferrer";
          richEnrichVideo(link);
        }
      } else if (button.dataset.richCommand === "checklist") {
        const list = document.createElement("ul"); list.className = "rich-checklist";
        const item = document.createElement("li");
        const box = document.createElement("input"); box.type = "checkbox"; box.contentEditable = "false"; box.setAttribute("aria-label", "Виконано");
        const content = document.createElement("span"); content.className = "checklist-item-text"; content.append(document.createElement("br"));
        item.append(box, content); list.append(item);
        const selection = window.getSelection();
        const current = selection?.anchorNode?.parentElement?.closest("p,li");
        if (current && editor.contains(current)) current.after(list);
        else editor.append(list);
        decorateChecklist();
        const range = document.createRange(); range.selectNodeContents(content); range.collapse(true);
        selection.removeAllRanges(); selection.addRange(range);
      } else document.execCommand(button.dataset.richCommand);
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      updateFormatButtons();
    });
  });
  async function copyDescription(withTitle) {
    const description = editor.value;
    const value = withTitle ? `${titleInput.value.trim()}\n\n${description}`.trim() : description;
    try {
      if (navigator.clipboard?.write && window.ClipboardItem) {
        const safe = document.createElement("div"); safe.append(richMarkdownFragment(description));
        const html = safe.innerHTML;
        const safeTitle = titleInput.value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        await navigator.clipboard.write([new ClipboardItem({
          "text/plain": new Blob([value], { type: "text/plain" }),
          "text/html": new Blob([withTitle ? `<h2>${safeTitle}</h2>${html}` : html], { type: "text/html" })
        })]);
      } else await navigator.clipboard.writeText(value);
      toast(withTitle ? "Назву й опис скопійовано" : "Опис скопійовано");
    } catch (_error) { toast("Не вдалося скопіювати опис"); }
  }
  shell.querySelectorAll("[data-rich-copy]").forEach(button => button.addEventListener("click", () => copyDescription(button.dataset.richCopy === "title-description")));
  if (editor.id === "task-description") document.querySelector("#task-copy-description").addEventListener("click", () => copyDescription(false));
  else document.querySelectorAll('[data-rich-target="project-description"]').forEach(button => button.addEventListener("click", () => copyDescription(button.dataset.richCopy === "title-description")));
}
installRichDescription(els.description, els.input);
installRichDescription(document.querySelector("#project-description"), document.querySelector("#project-title"));

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
    if (isTaskDueToday(task, today)) todayCount += 1;
  }
  counts.set(TODAY_LIST_ID, todayCount);
  counts.set(TOMORROW_LIST_ID, visibleProjectTasks(tasks, projects).filter(task => isTaskDueToday(task, nextLocalDate())).length);
  return counts;
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
  for (const item of els.mainMenuLists.querySelectorAll("[data-list-id]")) {
    const count = item.querySelector(".main-menu-count");
    if (!count) continue;
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
  els.taskListOptions.replaceChildren(...lists.map(createListDropdownOption), createListDropdownCreator("task"));
  for (const option of els.taskListOptions.querySelectorAll("[data-list-id]")) {
    if (sections.some(section => section.listId === option.dataset.listId))
      option.querySelector("span:nth-child(2)").textContent += "…";
  }
  if (lists.some(list => list.id === selectedListId)) els.taskListSelect.value = selectedListId;
  setTaskEditorListUI(els.taskListSelect.value || lists[0]?.id);
  setTaskEditorSectionUI(els.taskListSelect.value, selectedSectionId);
}

function renderSelectedListOptions(lists, currentListId) {
  els.selectedListOptions.replaceChildren(...lists.map(createListDropdownOption), createListDropdownCreator("selection"));
  for (const option of els.selectedListOptions.children) {
    const selected = option.dataset.listId === currentListId;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-selected", String(selected));
  }
}

function closeSelectedListDropdown({ returnFocus = false } = {}) {
  els.selectedListOptions.hidden = true;
  els.listSelected.setAttribute("aria-expanded", "false");
  if (returnFocus) els.listSelected.focus({ preventScroll: true });
}

function openSelectedListDropdown() {
  els.selectedListOptions.hidden = false;
  els.listSelected.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => els.selectedListOptions.querySelector(".is-selected")?.focus({ preventScroll: true }));
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
  for (const item of els.taskListOptions.children) {
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
  els.taskListOptions.hidden = true;
  els.taskListTrigger.setAttribute("aria-expanded", "false");
  if (returnFocus) els.taskListTrigger.focus({ preventScroll: true });
}

function openTaskListDropdown() {
  closeTaskSectionDropdown();
  els.taskListOptions.hidden = false;
  els.taskListTrigger.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => els.taskListOptions.querySelector(".is-selected")?.focus({ preventScroll: true }));
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
  document.body.classList.remove("settings-open");
  settingsCloseTimer = setTimeout(() => {
    els.settingsScreen.hidden = true;
    els.settingsOpen.focus({ preventScroll: true });
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
    row.querySelector(".task-meta-primary").hidden = !task.dueDate && !showTaskList;
    row.querySelector(".task-meta").hidden = !task.dueDate && !taskProject && !showTaskList;
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

function syncTaskActionsMenu() {
  els.taskActionsMenu.hidden = true;
  els.taskActionsTrigger.setAttribute("aria-expanded", "false");
  const merge = document.querySelector("#task-merge-checklist");
  merge.hidden = !els.editor.dataset.taskId || !/^\s*[-*+] \[[ xX]\](?: |$)/m.test(els.description.value || "");
  els.taskActionsTrigger.hidden = [els.taskAttachProject, els.taskConvertProject, els.taskDetachProject, els.taskDelete, merge].every(button => button.hidden);
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
  els.description.style.height = "";
  els.description.classList.remove("is-truncated");
  const preview = !els.editor.classList.contains("description-edit-mode");
  if (preview) els.description.scrollTop = 0;
  els.description.classList.toggle("is-truncated", preview && els.description.scrollHeight > els.description.clientHeight + 1);
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
  syncTaskActionsMenu();
  delete els.taskProjectLink.dataset.projectId;
  setTaskEditorListUI(listId);
  els.date.value = originListId === TODAY_LIST_ID ? localDateValue() : originListId === TOMORROW_LIST_ID ? nextLocalDate() : "";
  els.editor.dataset.dateChosen = "false";
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
  els.taskProjectLink.dataset.projectId = project?.id || "";
  els.taskProjectValue.textContent = project?.title || "";
  setTaskEditorListUI(task.listId || INBOX_LIST_ID);
  setTaskEditorSectionUI(task.listId || INBOX_LIST_ID, task.sectionId);
  els.input.value = task.title;
  els.description.value = task.description || "";
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
