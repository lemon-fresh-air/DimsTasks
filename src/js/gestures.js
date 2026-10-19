function enableHorizontalSwipe(element, { direction, onSwipe, canStart = () => true, canComplete = () => true }) {
  let gesture = null;

  element.addEventListener("pointerdown", event => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0) || !canStart(event)) return;
    gesture = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
  });

  window.addEventListener("pointerup", event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    const requiredDistance = Math.min(96, Math.max(64, innerWidth * .18));
    const movesInDirection = direction === "right" ? dx >= requiredDistance : dx <= -requiredDistance;
    const isClearlyHorizontal = Math.abs(dx) >= Math.abs(dy) * 1.15;
    gesture = null;
    if (movesInDirection && isClearlyHorizontal && canComplete()) onSwipe();
  });

  const cancel = event => {
    if (gesture?.pointerId === event.pointerId) gesture = null;
  };
  window.addEventListener("pointercancel", cancel);
}

function enableListReordering({ onReorder, isSelectionMode, isSelected, onLongPress, onSelectOnly, getSelectedIds }) {
  let gesture = null;
  const container = els.mainMenuLists;

  function capturePositions() {
    return new Map([...container.querySelectorAll("[data-list-id]")].map(item => [item.dataset.listId, item.getBoundingClientRect().top]));
  }

  function animatePositions(previous) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const item of container.querySelectorAll("[data-list-id]")) {
      const top = previous.get(item.dataset.listId);
      if (top === undefined) continue;
      const delta = top - item.getBoundingClientRect().top;
      if (Math.abs(delta) > 1) item.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
  }

  function positionPreview(clientX, clientY) {
    gesture.lastX = clientX;
    gesture.lastY = clientY;
    gesture.targetX = clientX - gesture.offsetX;
    gesture.targetY = clientY - gesture.offsetY;
  }

  function renderPreview() {
    if (!gesture?.dragging) return;
    const follow = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : .42;
    gesture.currentX += (gesture.targetX - gesture.currentX) * follow;
    gesture.currentY += (gesture.targetY - gesture.currentY) * follow;
    gesture.preview.style.transform = `translate3d(${gesture.currentX}px,${gesture.currentY}px,0)`;
    gesture.followFrame = requestAnimationFrame(renderPreview);
  }

  function updateInsertion(clientY) {
    const candidates = [...container.querySelectorAll('[data-list-kind="regular"]')]
      .filter(item => !gesture.selectedIds.has(item.dataset.listId));
    const before = candidates.find(item => clientY < item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2) || null;
    const beforeId = before?.dataset.listId || null;
    if (beforeId === gesture.lastBeforeId) return;
    const previous = capturePositions();
    if (before) before.before(gesture.placeholder); else container.append(gesture.placeholder);
    gesture.lastBeforeId = beforeId;
    gesture.moved = true;
    animatePositions(previous);
  }

  function startDrag(event) {
    clearTimeout(gesture.longPressTimer);
    if (!isSelected(gesture.id)) onSelectOnly(gesture.id);
    gesture.item = container.querySelector(`[data-list-id="${CSS.escape(gesture.id)}"]`);
    if (!gesture.item) return;
    const selectedIds = getSelectedIds();
    const selectedItems = [...container.querySelectorAll('[data-list-kind="regular"]')]
      .filter(item => selectedIds.has(item.dataset.listId));
    const rect = gesture.item.getBoundingClientRect();
    const placeholder = document.createElement("div");
    placeholder.className = "list-drag-placeholder";
    placeholder.style.height = `${selectedItems.reduce((height, item) => height + item.getBoundingClientRect().height, 0) + Math.max(0, selectedItems.length - 1) * 4}px`;
    gesture.item.before(placeholder);
    selectedItems.forEach(item => item.classList.add("drag-source"));
    const preview = document.createElement("div");
    preview.className = "list-drag-preview";
    preview.style.width = `${rect.width}px`;
    const previewItem = gesture.item.cloneNode(true);
    if (selectedIds.size > 1) {
      const count = document.createElement("span");
      count.className = "drag-count";
      count.textContent = selectedIds.size;
      previewItem.append(count);
    }
    preview.append(previewItem);
    document.body.append(preview);
    gesture = {
      ...gesture, item: gesture.item, selectedIds, selectedItems, dragging: true, placeholder, preview, moved: false, lastBeforeId: gesture.id,
      offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top,
      currentX: rect.left, currentY: rect.top, targetX: rect.left, targetY: rect.top
    };
    container.classList.add("dragging");
    positionPreview(event.clientX, event.clientY);
    gesture.followFrame = requestAnimationFrame(renderPreview);
  }

  container.addEventListener("pointerdown", event => {
    const item = event.target.closest('[data-list-kind="regular"]');
    if (!item || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    gesture = { item, id: item.dataset.listId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, lastY: event.clientY, ready: event.pointerType === "mouse", scrolling: false, dragging: false };
    item.setPointerCapture?.(event.pointerId);
    gesture.longPressTimer = setTimeout(() => {
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      gesture.ready = true;
      container.dataset.suppressListClick = gesture.id;
      if (!isSelected(gesture.id)) onLongPress(gesture.id);
      gesture.item = container.querySelector(`[data-list-id="${CSS.escape(gesture.id)}"]`);
      gesture.item?.classList.add("lifted");
    }, 450);
  });

  container.addEventListener("pointermove", event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
    if (gesture.dragging) {
      event.preventDefault();
      positionPreview(event.clientX, event.clientY);
      updateInsertion(event.clientY);
      return;
    }
    if (gesture.ready && distance > 6) {
      event.preventDefault();
      container.dataset.suppressListClick = gesture.id;
      startDrag(event);
      return;
    }
    if (isSelectionMode() && isSelected(gesture.id) && distance > 8) {
      event.preventDefault();
      container.dataset.suppressListClick = gesture.id;
      startDrag(event);
      return;
    }
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (gesture.scrolling || (!isSelected(gesture.id) && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8)) {
      event.preventDefault();
      clearTimeout(gesture.longPressTimer);
      gesture.scrolling = true;
      container.dataset.suppressListClick = gesture.id;
      container.scrollBy(0, gesture.lastY - event.clientY);
      gesture.lastY = event.clientY;
      return;
    }
    if (!gesture.ready && distance > 8) clearTimeout(gesture.longPressTimer);
  });

  function finish(event, cancelled = false) {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const finished = gesture;
    gesture = null;
    clearTimeout(finished.longPressTimer);
    finished.item?.classList.remove("lifted");
    if (!finished.dragging) return;
    cancelAnimationFrame(finished.followFrame);
    finished.preview.remove();
    finished.placeholder.remove();
    finished.selectedItems.forEach(item => item.classList.remove("drag-source"));
    container.classList.remove("dragging");
    if (!cancelled && finished.moved) onReorder({ selectedIds: finished.selectedIds, beforeId: finished.lastBeforeId });
  }

  container.addEventListener("pointerup", event => finish(event));
  container.addEventListener("pointercancel", event => finish(event, true));
}

function enableTaskGestures({ container = els.list, onDelete, isSelectionMode, isSelected, onLongPress, onSelectOnly, getSelectedIds, onReorder, requireSelectionForDrag = false }) {
  let gesture = null;
  const maxReveal = 112;
  const deleteThreshold = 72;
  const settleDuration = 260;
  const deleteDuration = 300;
  let momentumFrame = null;

  container.addEventListener("pointerdown", event => {
    if (event.target.closest(".toggle")) return;
    const card = event.target.closest(".task-card");
    if (!card || event.button > 0) return;
    cancelAnimationFrame(momentumFrame);
    const row = card.closest(".swipe-row");
    gesture = { row, card, id: row.dataset.id, pointerId: event.pointerId, pointerType: event.pointerType, canDrag: isSelectionMode(), startX: event.clientX, startY: event.clientY, lastY: event.clientY, dx: 0, horizontal: false, scrolling: false, longPress: false, dragging: false };
    card.setPointerCapture(event.pointerId);
    row.classList.remove("settling");
    if (event.pointerType === "mouse" && gesture.canDrag) {
      gesture.longPress = true;
    }
    gesture.longPressTimer = setTimeout(() => {
      if (!gesture || gesture.pointerId !== event.pointerId || gesture.horizontal || gesture.scrolling) return;
      row.dataset.longPressed = "true";
      if (gesture.canDrag) {
        gesture.longPress = true;
        gesture.row?.classList.add("lifted");
        return;
      }
      gesture.selectionPress = true;
      onLongPress(row.dataset.id);
      gesture.row = container.querySelector(`[data-id="${CSS.escape(gesture.id)}"]`);
      gesture.card = gesture.row?.querySelector(".task-card");
    }, 450);
  });

  function captureRows() {
    return new Map([...container.children].filter(row => row.dataset.id).map(row => [row.dataset.id, row.getBoundingClientRect().top]));
  }

  function animateRows(previous) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const row of container.children) {
      const top = previous.get(row.dataset.id);
      if (top === undefined) continue;
      const delta = top - row.getBoundingClientRect().top;
      if (Math.abs(delta) > 1) row.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
  }

  function startDrag(event) {
    clearTimeout(gesture.longPressTimer);
    if (!isSelected(gesture.id)) {
      onSelectOnly(gesture.id);
      gesture.row = container.querySelector(`[data-id="${CSS.escape(gesture.id)}"]`);
      gesture.card = gesture.row?.querySelector(".task-card");
      gesture.card?.setPointerCapture(event.pointerId);
    }
    const selectedIds = getSelectedIds();
    const rows = [...container.children].filter(row => selectedIds.has(row.dataset.id));
    if (!rows.length) return;
    const sourceRect = gesture.row.getBoundingClientRect();
    const totalHeight = rows.reduce((sum, row) => sum + row.getBoundingClientRect().height, 0);
    const placeholder = document.createElement("li");
    placeholder.className = "drag-placeholder";
    placeholder.style.height = `${totalHeight}px`;
    rows[0].before(placeholder);
    rows.forEach(row => row.classList.add("drag-source"));
    const preview = document.createElement("div");
    preview.className = "drag-preview";
    preview.style.width = `${sourceRect.width}px`;
    preview.append(gesture.card.cloneNode(true));
    if (rows.length > 1) {
      const badge = document.createElement("span");
      badge.className = "drag-count";
      badge.textContent = rows.length;
      preview.append(badge);
    }
    document.body.append(preview);
    gesture = {
      ...gesture, dragging: true, selectedIds, rows, placeholder, preview, moved: false, lastBeforeId: null,
      offsetX: event.clientX - sourceRect.left, offsetY: event.clientY - sourceRect.top,
      currentX: sourceRect.left, currentY: sourceRect.top, targetX: sourceRect.left, targetY: sourceRect.top
    };
    container.classList.add("dragging");
    positionPreview(event.clientX, event.clientY);
    gesture.followFrame = requestAnimationFrame(renderPreview);
    gesture.scrollFrame = requestAnimationFrame(autoScroll);
  }

  function positionPreview(clientX, clientY) {
    gesture.lastX = clientX;
    gesture.lastY = clientY;
    gesture.targetX = clientX - gesture.offsetX;
    gesture.targetY = clientY - gesture.offsetY;
  }

  function renderPreview() {
    if (!gesture?.dragging) return;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const follow = reducedMotion ? 1 : .42;
    gesture.currentX += (gesture.targetX - gesture.currentX) * follow;
    gesture.currentY += (gesture.targetY - gesture.currentY) * follow;
    gesture.preview.style.transform = `translate3d(${gesture.currentX}px,${gesture.currentY}px,0)`;
    gesture.followFrame = requestAnimationFrame(renderPreview);
  }

  function updateInsertion(clientY) {
    const candidates = [...container.children].filter(row => row.dataset.id && !gesture.selectedIds.has(row.dataset.id));
    const before = candidates.find(row => clientY < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2) || null;
    const beforeId = before?.dataset.id || null;
    if (beforeId === gesture.lastBeforeId) return;
    const previous = captureRows();
    if (before) before.before(gesture.placeholder); else container.append(gesture.placeholder);
    gesture.lastBeforeId = beforeId;
    gesture.moved = true;
    animateRows(previous);
  }

  function autoScroll() {
    if (!gesture?.dragging) return;
    const clientY = gesture.lastY;
    const edge = 72;
    const scrollContainer = container.closest(".project-screen");
    const bounds = scrollContainer?.getBoundingClientRect() || { top: 0, bottom: innerHeight };
    const speed = clientY < bounds.top + edge ? -Math.min(14, (bounds.top + edge - clientY) / 4) : clientY > bounds.bottom - edge ? Math.min(14, (clientY - bounds.bottom + edge) / 4) : 0;
    if (speed) {
      if (scrollContainer) scrollContainer.scrollBy(0, speed);
      else window.scrollBy(0, speed);
      updateInsertion(clientY);
    }
    gesture.scrollFrame = requestAnimationFrame(autoScroll);
  }

  container.addEventListener("pointermove", event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (gesture.dragging) {
      event.preventDefault();
      positionPreview(event.clientX, event.clientY);
      updateInsertion(event.clientY);
      return;
    }
    if (gesture.selectionPress) return;
    if (gesture.longPress && Math.hypot(dx, dy) > 6) {
      event.preventDefault();
      startDrag(event);
      return;
    }
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearTimeout(gesture.longPressTimer);
    if (gesture.scrolling || (!gesture.horizontal && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8)) {
      event.preventDefault();
      gesture.scrolling = true;
      gesture.row.dataset.swiped = "true";
      const scrollContainer = container.closest(".project-steps.is-expanded") || container.closest(".project-screen");
      const delta = gesture.lastY - event.clientY;
      if (scrollContainer) scrollContainer.scrollBy(0, delta);
      else window.scrollBy(0, delta);
      const now = performance.now();
      const elapsed = now - (gesture.lastMoveTime || now);
      if (elapsed > 0) gesture.scrollVelocity = Math.max(-2.5, Math.min(2.5, delta / elapsed));
      gesture.lastMoveTime = now;
      gesture.lastY = event.clientY;
      return;
    }
    if (gesture.canDrag || dx >= 0 && !gesture.horizontal) return;
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
    if (gesture.dragging) {
      const finished = gesture;
      gesture = null;
      cancelAnimationFrame(finished.scrollFrame);
      cancelAnimationFrame(finished.followFrame);
      finished.preview.remove();
      finished.placeholder.remove();
      finished.rows.forEach(row => row.classList.remove("drag-source", "lifted"));
      container.classList.remove("dragging");
      if (finished.moved) onReorder({ beforeId: finished.lastBeforeId });
      return;
    }
    const { row, card, dx, horizontal, scrolling, longPress, longPressTimer, scrollVelocity } = gesture;
    gesture = null;
    clearTimeout(longPressTimer);
    row?.classList.remove("lifted");
    if (scrolling && Math.abs(scrollVelocity || 0) > .08) {
      const scrollContainer = container.closest(".project-steps.is-expanded") || container.closest(".project-screen");
      let velocity = scrollVelocity;
      let lastTime = performance.now();
      const coast = now => {
        const elapsed = Math.min(now - lastTime, 32);
        lastTime = now;
        if (scrollContainer) scrollContainer.scrollBy(0, velocity * elapsed);
        else window.scrollBy(0, velocity * elapsed);
        velocity *= Math.pow(.94, elapsed / 16);
        if (Math.abs(velocity) > .08) momentumFrame = requestAnimationFrame(coast);
      };
      momentumFrame = requestAnimationFrame(coast);
    }
    if (longPress || scrolling) return;
    if (!isSelectionMode() && horizontal && Math.abs(dx) >= deleteThreshold) {
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
    const { row, card, longPressTimer, dragging, preview, placeholder, rows = [], scrollFrame, followFrame } = gesture;
    gesture = null;
    clearTimeout(longPressTimer);
    if (dragging) {
      cancelAnimationFrame(scrollFrame);
      cancelAnimationFrame(followFrame);
      preview.remove();
      placeholder.remove();
      rows.forEach(item => item.classList.remove("drag-source", "lifted"));
      container.classList.remove("dragging");
      return;
    }
    row.classList.remove("swiping");
    row.classList.add("settling");
    card.style.transform = "translateX(0)";
    setTimeout(() => row.classList.remove("settling"), settleDuration);
  };

  container.addEventListener("pointerup", finishGesture);
  container.addEventListener("pointercancel", cancelGesture);
}

function enableProjectCardReorder({ container, isSelectionMode, isSelected, onLongPress, onSelectOnly, getSelectedIds, onReorder }) {
  let gesture = null;

  function cleanup(finished) {
    clearTimeout(finished.longPressTimer);
    cancelAnimationFrame(finished.followFrame);
    cancelAnimationFrame(finished.scrollFrame);
    finished.preview?.remove();
    finished.placeholder?.remove();
    (finished.cards || [finished.card]).forEach(card => card?.classList.remove("drag-source", "lifted"));
    container.classList.remove("dragging");
  }

  function updateInsertion(clientY) {
    const candidates = [...container.children].filter(card => card.dataset.projectId && !gesture.selectedIds.has(card.dataset.projectId));
    const before = candidates.find(card => clientY < card.getBoundingClientRect().top + card.getBoundingClientRect().height / 2) || null;
    const beforeId = before?.dataset.projectId || null;
    if (beforeId === gesture.lastBeforeId) return;
    if (before) before.before(gesture.placeholder); else container.append(gesture.placeholder);
    gesture.lastBeforeId = beforeId;
    gesture.moved = true;
  }

  function renderPreview() {
    if (!gesture?.dragging) return;
    const follow = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : .42;
    gesture.currentX += (gesture.targetX - gesture.currentX) * follow;
    gesture.currentY += (gesture.targetY - gesture.currentY) * follow;
    gesture.preview.style.transform = `translate3d(${gesture.currentX}px,${gesture.currentY}px,0)`;
    gesture.followFrame = requestAnimationFrame(renderPreview);
  }

  function autoScroll() {
    if (!gesture?.dragging) return;
    const edge = 72;
    const speed = gesture.lastY < edge ? -Math.min(14, (edge - gesture.lastY) / 4)
      : gesture.lastY > innerHeight - edge ? Math.min(14, (gesture.lastY - innerHeight + edge) / 4) : 0;
    if (speed) {
      window.scrollBy(0, speed);
      updateInsertion(gesture.lastY);
    }
    gesture.scrollFrame = requestAnimationFrame(autoScroll);
  }

  function startDrag(event) {
    clearTimeout(gesture.longPressTimer);
    if (!isSelected(gesture.id)) {
      onSelectOnly(gesture.id);
      gesture.card = container.querySelector(`[data-project-id="${CSS.escape(gesture.id)}"]`);
    }
    const selectedIds = getSelectedIds();
    const cards = [...container.children].filter(card => selectedIds.has(card.dataset.projectId));
    if (!cards.length) return;
    const rect = gesture.card.getBoundingClientRect();
    const gap = Number.parseFloat(getComputedStyle(container).rowGap) || 0;
    const totalHeight = cards.reduce((sum, card) => sum + card.getBoundingClientRect().height, 0) + gap * (cards.length - 1);
    const placeholder = document.createElement("div");
    placeholder.className = "project-drag-placeholder";
    placeholder.style.height = `${totalHeight}px`;
    cards[0].before(placeholder);
    const preview = document.createElement("div");
    preview.className = "project-drag-preview";
    preview.style.width = `${rect.width}px`;
    preview.append(gesture.card.cloneNode(true));
    if (cards.length > 1) {
      const badge = document.createElement("span");
      badge.className = "drag-count";
      badge.textContent = cards.length;
      preview.append(badge);
    }
    document.body.append(preview);
    cards.forEach(card => card.classList.add("drag-source"));
    gesture = {
      ...gesture, dragging: true, selectedIds, cards, placeholder, preview, moved: false, lastBeforeId: gesture.id,
      offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top,
      currentX: rect.left, currentY: rect.top, targetX: rect.left, targetY: rect.top,
      lastY: event.clientY
    };
    container.classList.add("dragging");
    gesture.followFrame = requestAnimationFrame(renderPreview);
    gesture.scrollFrame = requestAnimationFrame(autoScroll);
  }

  container.addEventListener("pointerdown", event => {
    const card = event.target.closest(".project-card");
    if (!card || event.button > 0) return;
    gesture = { card, id: card.dataset.projectId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, lastY: event.clientY, ready: event.pointerType === "mouse", scrolling: false, dragging: false };
    card.setPointerCapture?.(event.pointerId);
    gesture.longPressTimer = setTimeout(() => {
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      gesture.ready = true;
      onLongPress(gesture.id);
      gesture.card = container.querySelector(`[data-project-id="${CSS.escape(gesture.id)}"]`);
      if (gesture.card) {
        gesture.card.dataset.longPressed = "true";
        gesture.card.classList.add("lifted");
      }
    }, 450);
  });

  container.addEventListener("pointermove", event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
    if (gesture.dragging) {
      event.preventDefault();
      gesture.targetX = event.clientX - gesture.offsetX;
      gesture.targetY = event.clientY - gesture.offsetY;
      gesture.lastY = event.clientY;
      updateInsertion(event.clientY);
      return;
    }
    if ((gesture.ready || isSelectionMode()) && distance > 6) {
      event.preventDefault();
      startDrag(event);
      updateInsertion(event.clientY);
      return;
    }
    if (distance > 8) {
      clearTimeout(gesture.longPressTimer);
      if (event.pointerType !== "mouse" && Math.abs(event.clientY - gesture.startY) > Math.abs(event.clientX - gesture.startX)) {
        event.preventDefault();
        gesture.scrolling = true;
        gesture.card.dataset.dragged = "true";
        window.scrollBy(0, gesture.lastY - event.clientY);
        gesture.lastY = event.clientY;
      }
    }
  });

  container.addEventListener("pointerup", event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const finished = gesture;
    gesture = null;
    if (!finished.dragging) {
      clearTimeout(finished.longPressTimer);
      finished.card.classList.remove("lifted");
      return;
    }
    const { selectedIds, lastBeforeId: beforeId, moved } = finished;
    finished.card.dataset.dragged = "true";
    cleanup(finished);
    if (moved) onReorder({ selectedIds, beforeId });
  });

  container.addEventListener("pointercancel", event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const finished = gesture;
    gesture = null;
    cleanup(finished);
  });
}
