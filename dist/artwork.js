"use strict";

{
  const art = document.querySelector(".signal-art");
  const hint = document.getElementById("art-hint");
  const artworkMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const pieces = [...art.querySelectorAll(".art-piece")].map((element, index) => ({
    element,
    x: 0,
    y: 0,
    vx: (index % 2 ? -1 : 1) * (32 + index * 4),
    vy: (index % 3 ? 1 : -1) * (25 + index * 3)
  }));
  let visible = false;
  let frame = 0;
  let lastTime;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  function position(piece) {
    piece.element.style.setProperty("--art-x", piece.x + "px");
    piece.element.style.setProperty("--art-y", piece.y + "px");
  }
  function measure() {
    const bounds = art.getBoundingClientRect();
    const padding = 6;
    for (const piece of pieces) {
      const rect = piece.element.getBoundingClientRect();
      piece.minX = piece.x + bounds.left - rect.left + padding;
      piece.maxX = Math.max(piece.minX, piece.x + bounds.right - rect.right - padding);
      piece.minY = piece.y + bounds.top - rect.top + padding;
      piece.maxY = Math.max(piece.minY, piece.y + bounds.bottom - rect.bottom - padding);
      move(piece, 0, 0);
    }
  }
  function move(piece, dx, dy) {
    piece.x = clamp(piece.x + dx, piece.minX, piece.maxX);
    piece.y = clamp(piece.y + dy, piece.minY, piece.maxY);
    position(piece);
  }
  function bounce(value, velocity, min, max, elapsed) {
    const next = value + velocity * elapsed;
    if (next < min) return [Math.min(max, 2 * min - next), Math.abs(velocity)];
    if (next > max) return [Math.max(min, 2 * max - next), -Math.abs(velocity)];
    return [next, velocity];
  }
  function animate(time) {
    const elapsed = lastTime == null ? 0 : Math.min((time - lastTime) / 1000, .04);
    lastTime = time;
    for (const piece of pieces) {
      if (piece.drag || piece.hovered || piece.element.matches(":focus-visible")) continue;
      [piece.x, piece.vx] = bounce(piece.x, piece.vx, piece.minX, piece.maxX, elapsed);
      [piece.y, piece.vy] = bounce(piece.y, piece.vy, piece.minY, piece.maxY, elapsed);
      position(piece);
    }
    frame = requestAnimationFrame(animate);
  }
  function syncAnimation() {
    if (visible && !artworkMotion.matches) {
      if (!frame) frame = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = undefined;
    }
  }
  function showHint(event) {
    if (event.pointerType !== "mouse") return;
    hint.hidden = false;
    hint.style.left = Math.max(0, Math.min(event.clientX + 13, innerWidth - hint.offsetWidth - 4)) + "px";
    hint.style.top = Math.max(0, Math.min(event.clientY + 17, innerHeight - hint.offsetHeight - 4)) + "px";
  }
  for (const piece of pieces) {
    const { element } = piece;
    element.setAttribute("aria-describedby", "art-keys");
    element.addEventListener("pointerenter", event => {
      piece.hovered = event.pointerType === "mouse";
      showHint(event);
    });
    element.addEventListener("pointerleave", () => {
      piece.hovered = false;
      hint.hidden = true;
    });
    element.addEventListener("pointerdown", event => {
      if (event.button !== 0 || piece.drag) return;
      piece.drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      element.setPointerCapture(event.pointerId);
      element.classList.add("is-dragging");
      hint.hidden = true;
    });
    element.addEventListener("pointermove", event => {
      const drag = piece.drag;
      if (!drag) {
        showHint(event);
        return;
      }
      if (drag.id !== event.pointerId) return;
      move(piece, event.clientX - drag.x, event.clientY - drag.y);
      drag.x = event.clientX;
      drag.y = event.clientY;
    });
    element.addEventListener("lostpointercapture", () => {
      piece.drag = undefined;
      piece.hovered = element.matches(":hover");
      element.classList.remove("is-dragging");
    });
    element.addEventListener("keydown", event => {
      const direction = arrows[event.key];
      if (!direction) return;
      event.preventDefault();
      move(piece, direction[0] * 12, direction[1] * 12);
    });
  }
  measure();
  new ResizeObserver(measure).observe(art);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncAnimation();
  }).observe(art);
  artworkMotion.addEventListener("change", syncAnimation);
}
