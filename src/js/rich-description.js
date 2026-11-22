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
  editor.addEventListener("keydown", event => {
    const handle = event.target.closest(".checklist-drag-handle");
    if (!handle || !matchMedia("(min-width: 760px)").matches || !["ArrowUp", "ArrowDown"].includes(event.key)
      || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const item = handle.closest("li");
    const list = item?.parentElement;
    if (!list?.classList.contains("rich-checklist")) return;
    const neighbor = event.key === "ArrowUp" ? item.previousElementSibling : item.nextElementSibling;
    if (!neighbor) return;
    event.preventDefault();
    const previous = new Map([...list.children].map(row => [row, row.getBoundingClientRect().top]));
    if (event.key === "ArrowUp") neighbor.before(item); else neighbor.after(item);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) for (const row of list.children) {
      const delta = previous.get(row) - row.getBoundingClientRect().top;
      if (Math.abs(delta) > 1) row.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], { duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    handle.focus({ preventScroll: true });
    editor.dispatchEvent(new Event("input", { bubbles: true }));
  });
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
const richLinkDialog = document.querySelector("#rich-link-dialog");
const richLinkForm = document.querySelector("#rich-link-form");
const richLinkText = document.querySelector("#rich-link-text");
const richLinkUrl = document.querySelector("#rich-link-url");
const richLinkError = document.querySelector("#rich-link-error");
let pendingRichLink = null;
function openRichLinkDialog(editor, range, trigger) {
  const validRange = range && editor.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
  const start = validRange?.startContainer;
  const existing = (start?.nodeType === Node.ELEMENT_NODE ? start : start?.parentElement)?.closest("a");
  pendingRichLink = { editor, range: validRange, trigger, existing: existing && editor.contains(existing) ? existing : null };
  richLinkText.value = validRange?.toString() || pendingRichLink.existing?.textContent || "";
  richLinkUrl.value = pendingRichLink.existing?.href || "";
  richLinkError.hidden = true;
  richLinkDialog.showModal();
  (richLinkText.value ? richLinkUrl : richLinkText).focus();
}
richLinkForm.addEventListener("submit", event => {
  event.preventDefault();
  const pending = pendingRichLink;
  if (!pending) return;
  const url = richSafeUrl(richLinkUrl.value.trim());
  if (!url) { richLinkError.hidden = false; richLinkUrl.focus(); return; }
  const label = richLinkText.value.trim() || new URL(url).hostname;
  const link = richLink(url, label, label === new URL(url).hostname);
  richLinkDialog.close();
  pending.editor.focus();
  const range = pending.range;
  if (pending.existing?.isConnected && (range?.collapsed || range?.toString() === pending.existing.textContent)) pending.existing.replaceWith(link);
  else if (range && pending.editor.contains(range.commonAncestorContainer)) {
    range.deleteContents();
    range.insertNode(link);
  } else pending.editor.append(link);
  const caret = document.createRange();
  caret.setStartAfter(link); caret.collapse(true);
  const selection = window.getSelection();
  selection.removeAllRanges(); selection.addRange(caret);
  pending.editor.dispatchEvent(new Event("input", { bubbles: true }));
});
richLinkDialog.addEventListener("close", () => { pendingRichLink = null; });
document.querySelector("#rich-link-cancel").addEventListener("click", () => richLinkDialog.close());
const richLinkPreview = document.querySelector("#rich-link-preview");
const richLinkPreviewOpen = document.querySelector("#rich-link-preview-open");
const richLinkPreviewFavicon = document.querySelector("#rich-link-preview-favicon");
const richLinkPreviewIcon = richLinkPreview.querySelector(".rich-external-icon");
richLinkPreviewFavicon.addEventListener("load", () => { richLinkPreviewFavicon.hidden = false; richLinkPreviewIcon.hidden = true; });
richLinkPreviewFavicon.addEventListener("error", () => { richLinkPreviewFavicon.hidden = true; richLinkPreviewIcon.hidden = false; });
function closeRichLinkPreview() {
  if (richLinkPreview.matches(":popover-open")) richLinkPreview.hidePopover();
}
function showRichLinkPreview(link) {
  const url = richSafeUrl(link.href);
  if (!url) return;
  const parsed = new URL(url);
  richLinkPreviewOpen.href = url;
  document.querySelector("#rich-link-preview-label").textContent = link.textContent.trim() || parsed.hostname;
  document.querySelector("#rich-link-preview-host").textContent = parsed.hostname;
  richLinkPreviewFavicon.hidden = true;
  richLinkPreviewIcon.hidden = false;
  richLinkPreviewFavicon.src = `${parsed.origin}/favicon.ico`;
  if (!richLinkPreview.matches(":popover-open")) richLinkPreview.showPopover();
  const rect = link.getBoundingClientRect();
  const width = richLinkPreview.offsetWidth;
  const height = richLinkPreview.offsetHeight;
  richLinkPreview.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
  richLinkPreview.style.top = `${rect.top >= height + 12 ? rect.top - height - 8 : Math.min(rect.bottom + 8, window.innerHeight - height - 12)}px`;
}
document.addEventListener("click", event => {
  if (!richLinkPreview.matches(":popover-open") || richLinkPreview.contains(event.target)
    || event.target.closest?.(".rich-description a")) return;
  event.preventDefault();
  event.stopPropagation();
  closeRichLinkPreview();
}, true);
document.addEventListener("click", event => {
  const link = event.target.closest?.(".rich-description a");
  if (link) { event.preventDefault(); showRichLinkPreview(link); return; }
  if (!richLinkPreview.contains(event.target)) closeRichLinkPreview();
});
document.addEventListener("keydown", event => { if (event.key === "Escape") closeRichLinkPreview(); });
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
    if (!editor.isContentEditable || !["Enter", "Backspace"].includes(event.key) || event.key === "Enter" && event.shiftKey) return;
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
  let savedRichRange = null;
  function updateFormatButtons() {
    const selection = window.getSelection();
    const inEditor = selection?.rangeCount && editor.contains(selection.anchorNode);
    if (inEditor) savedRichRange = selection.getRangeAt(0).cloneRange();
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
      if (button.dataset.richCommand === "link") {
        const selection = window.getSelection();
        const current = selection?.rangeCount && editor.contains(selection.anchorNode) ? selection.getRangeAt(0) : savedRichRange;
        openRichLinkDialog(editor, current, button);
        return;
      }
      editor.focus();
      if (button.dataset.richCommand === "checklist") {
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
  document.querySelectorAll(`[data-rich-target="${editor.id}"]`).forEach(button => button.addEventListener("click", () => copyDescription(button.dataset.richCopy === "title-description")));
}
installRichDescription(els.description, els.input);
installRichDescription(document.querySelector("#project-description"), document.querySelector("#project-title"));
