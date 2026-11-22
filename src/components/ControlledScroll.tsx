"use client";

import { useEffect } from "react";

export function ControlledScroll() {
  useEffect(() => {
    // Use native GPU-accelerated scrolling on touch/mobile, reduced-motion, or low-end devices
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const isLowEnd =
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency <= 4;
    if (isReduced || isCoarsePointer || isLowEnd) {
      return;
    }

    let targetY = window.scrollY;
    let currentY = targetY;
    let rafId = 0;
    let lastTime = 0;
    let direction = 0;
    let locked = false;
    let lockedY = 0;

    const html = document.documentElement;
    const prevScrollBehavior = html.style.scrollBehavior;
    const prevOverscrollY = html.style.overscrollBehaviorY;
    const prevScrollbarGutter = html.style.scrollbarGutter;
    let prevOverflowY = html.style.overflowY;

    html.style.scrollBehavior = "auto";
    html.style.overscrollBehaviorY = "none";
    html.style.scrollbarGutter = "stable";

    const handleScrollLock = (ev: Event) => {
      const customEv = ev as CustomEvent<boolean>;
      const nextLocked = !!customEv.detail;
      if (nextLocked !== locked) {
        cancelAnimationFrame(rafId);
        rafId = 0;
        targetY = currentY = window.scrollY;
        direction = 0;
        locked = nextLocked;
        if (locked) {
          lockedY = window.scrollY;
          prevOverflowY = html.style.overflowY;
          html.style.overflowY = "hidden";
        } else {
          html.style.overflowY = prevOverflowY;
        }
      }
    };

    const handleNativeScroll = () => {
      if (locked && Math.abs(window.scrollY - lockedY) > 1) {
        window.scrollTo({ top: lockedY, behavior: "instant" });
      }
    };

    const maxScroll = () => Math.max(0, html.scrollHeight - window.innerHeight);
    const clampY = (y: number) => Math.max(0, Math.min(maxScroll(), y));

    const isInteractiveOrScrollable = (target: EventTarget | null) => {
      let el = target instanceof Element ? target : null;
      if (
        document.querySelector("dialog[open]") ||
        el?.closest("input,textarea,select,[contenteditable=true],[role=slider]")
      ) {
        return true;
      }
      while (el && el !== document.body && el !== html) {
        const style = getComputedStyle(el);
        if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 2) {
          return true;
        }
        el = el.parentElement;
      }
      return false;
    };

    const step = (now: number) => {
      if (locked) {
        rafId = 0;
        return;
      }
      const dt = Math.min((now - lastTime) / 1000 || 1 / 60, 0.04);
      lastTime = now;
      const winY = window.scrollY;
      if (Math.abs(winY - currentY) > 3) {
        targetY = winY;
      }
      targetY = clampY(targetY);
      const diff = targetY - winY;
      const delta = Math.abs(diff) * (1 - Math.exp(-dt / 0.16));
      currentY = clampY(winY + Math.sign(diff) * Math.min(delta, 1500 * dt));
      window.scrollTo({ top: currentY, behavior: "instant" });
      currentY = window.scrollY;
      if (Math.abs(targetY - currentY) > 1) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = 0;
        direction = 0;
        targetY = currentY;
      }
    };

    const startLoop = () => {
      if (!rafId) {
        currentY = window.scrollY;
        lastTime = performance.now();
        rafId = requestAnimationFrame(step);
      }
    };

    const addDelta = (deltaY: number) => {
      if (locked) return;
      const sign = Math.sign(deltaY);
      if (!rafId || sign !== direction) {
        targetY = window.scrollY;
      }
      direction = sign;
      targetY = clampY(
        window.scrollY + Math.max(-280, Math.min(280, targetY - window.scrollY + 0.65 * deltaY))
      );
      startLoop();
    };

    const onWheel = (ev: WheelEvent) => {
      if (
        ev.ctrlKey ||
        Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ||
        isInteractiveOrScrollable(ev.target)
      ) {
        return;
      }
      ev.preventDefault();
      const multiplier = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? window.innerHeight : 1;
      addDelta(ev.deltaY * multiplier);
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (
        ev.defaultPrevented ||
        ev.ctrlKey ||
        ev.metaKey ||
        ev.altKey ||
        isInteractiveOrScrollable(ev.target) ||
        (ev.key === " " &&
          ev.target instanceof Element &&
          ev.target.closest("button,a,[role=button]"))
      ) {
        return;
      }
      if (
        locked &&
        ["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(ev.key)
      ) {
        ev.preventDefault();
        return;
      }
      if (ev.key === "Home" || ev.key === "End") {
        ev.preventDefault();
        targetY = ev.key === "Home" ? 0 : maxScroll();
        direction = Math.sign(targetY - window.scrollY);
        startLoop();
        return;
      }
      const keyMap: Record<string, number> = {
        ArrowDown: 90,
        ArrowUp: -90,
        PageDown: 0.75 * window.innerHeight,
        PageUp: -0.75 * window.innerHeight,
        " ": window.innerHeight * (ev.shiftKey ? -0.75 : 0.75),
      };
      if (ev.key in keyMap) {
        ev.preventDefault();
        addDelta(keyMap[ev.key]);
      }
    };

    const onClick = (ev: MouseEvent) => {
      if (
        ev.defaultPrevented ||
        ev.button !== 0 ||
        ev.ctrlKey ||
        ev.metaKey ||
        ev.shiftKey ||
        ev.altKey
      ) {
        return;
      }
      const anchor =
        ev.target instanceof Element
          ? (ev.target.closest('a[href^="#"]') as HTMLAnchorElement | null)
          : null;
      if (!anchor || anchor.hasAttribute("download") || anchor.target === "_blank") {
        return;
      }
      const targetId = decodeURIComponent(anchor.hash.slice(1));
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        ev.preventDefault();
        if (!locked) {
          const margin = parseFloat(getComputedStyle(targetEl).scrollMarginTop) || 0;
          targetY = clampY(window.scrollY + targetEl.getBoundingClientRect().top - margin);
          history.pushState(null, "", anchor.hash);
          direction = Math.sign(targetY - window.scrollY);
          startLoop();
        }
      }
    };

    const onTouchStart = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;
      targetY = currentY = window.scrollY;
      direction = 0;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    window.addEventListener("wahba:scroll-lock", handleScrollLock);
    window.addEventListener("tornado:scroll-lock", handleScrollLock);
    window.addEventListener("scroll", handleNativeScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      html.style.scrollBehavior = prevScrollBehavior;
      html.style.overscrollBehaviorY = prevOverscrollY;
      html.style.scrollbarGutter = prevScrollbarGutter;
      if (locked) {
        html.style.overflowY = prevOverflowY;
      }
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
      window.removeEventListener("wahba:scroll-lock", handleScrollLock);
      window.removeEventListener("tornado:scroll-lock", handleScrollLock);
      window.removeEventListener("scroll", handleNativeScroll);
    };
  }, []);

  return null;
}
