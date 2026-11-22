"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "./LanguageContext";

const BACK_PATH =
  "M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z";
const FRONT_PATH =
  "M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 176A22 22 0 0 1 318 198L22 198A22 22 0 0 1 0 176Z";

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    let e = (t = (t + 0x6d2b79f5) >>> 0);
    e = Math.imul(e ^ (e >>> 15), 1 | e);
    return (((e ^= e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ (e >>> 14)) >>> 0) / 0x100000000;
  };
}

function hashStr(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x1000193);
  }
  return h >>> 0;
}

export interface FolderFileItem {
  name: string;
  meta?: string;
  image?: string;
  href?: string;
}

interface GlassFolderProps {
  label: string;
  meta?: string;
  tone?: "light" | "dark";
  image?: string;
  files: FolderFileItem[];
  href?: string;
  labelPlacement?: "bottom-left" | "top-left" | "top-right";
  defaultOpen?: boolean;
  width?: number;
  appear?: boolean;
  className?: string;
}

const GF_STYLES = `
.gf-root {
  --gf-px: 0;
  --gf-py: 0;
  --gf-ease: cubic-bezier(.2, .8, .2, 1);
  --gf-spring: cubic-bezier(.34, 1.36, .5, 1);
  --gf-hinge: 0deg;
  --gf-lift: 42px;
  --gf-spread: 0px;
  --gf-fan: 0deg;
  --gf-stack: 15px;
  --gf-ink: #141416;
  --gf-ink-soft: rgba(20, 20, 22, .55);
  position: relative;
  display: inline-block;
  flex: none;
  vertical-align: top;
  font-family: ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  isolation: isolate;
}
.gf-root[data-tone="dark"] { --gf-ink: #f5f5f7; --gf-ink-soft: rgba(245, 245, 247, .58); }
.gf-root:hover, .gf-root:focus-within { --gf-hinge: -11deg; --gf-lift: -34px; --gf-spread: 8px; --gf-fan: 1.4deg; --gf-stack: 10px; }
.gf-root[data-open] { --gf-hinge: -24deg; --gf-lift: -96px; --gf-spread: 40px; --gf-fan: 5deg; --gf-stack: 30px; }
.gf-stage { position: absolute; left: 0; top: 0; width: 340px; height: 272px; transform-origin: 0 0; }
.gf-tilt { position: absolute; inset: 0; transform: perspective(1400px) rotateX(calc(var(--gf-py) * -3deg)) rotateY(calc(var(--gf-px) * 4deg)); transition: transform .9s var(--gf-ease); }
.gf-shadow { position: absolute; left: 18px; right: 18px; bottom: -6px; height: 60px; border-radius: 40px; background: rgba(16, 18, 24, .34); filter: blur(22px); transform: translateX(calc(var(--gf-px) * -8px)); transition: transform .9s var(--gf-ease), opacity .9s var(--gf-ease); }
.gf-back { position: absolute; inset: 0; overflow: hidden; background: linear-gradient(180deg, #f3f3f4 0%, #e3e3e6 100%); }
.gf-art { position: absolute; left: -12px; top: -12px; max-width: none; object-fit: cover; transform: translate(calc(var(--gf-px) * -7px), calc(var(--gf-py) * -6px)) scale(1.02); transition: transform 1.1s var(--gf-ease), opacity 1.2s var(--gf-ease), filter 1.2s var(--gf-ease); }
.gf-back-sheen { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255, 255, 255, .22) 0%, rgba(255, 255, 255, 0) 22%), radial-gradient(120% 80% at 80% 0%, rgba(255, 255, 255, .16), rgba(255, 255, 255, 0) 60%); pointer-events: none; }
.gf-rim { position: absolute; left: 0; top: 0; max-width: none; overflow: visible; pointer-events: none; fill: none; }
.gf-back-rim { width: 340px; height: 272px; }
.gf-back-rim path { stroke: rgba(255, 255, 255, .45); stroke-width: 1; }
.gf-files { position: absolute; inset: 0; z-index: 5; pointer-events: none; clip-path: inset(-400px -400px 10px -400px); }
.gf-sheet-slot { display: contents; }
.gf-sheet {
  all: unset;
  box-sizing: border-box;
  position: absolute;
  left: 34px;
  top: 96px;
  width: 272px;
  height: 184px;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  pointer-events: auto;
  touch-action: pan-y pinch-zoom;
  background: linear-gradient(180deg, #ffffff 0%, #f2f2f0 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9), 0 0 0 .5px rgba(0, 0, 0, .1), 0 10px 26px -8px rgba(10, 12, 20, .28);
  transform-origin: 50% 100%;
  transform: translate(calc(var(--gf-jx) + var(--gf-slot) * var(--gf-spread)), calc(var(--gf-lift) + var(--gf-depth) * var(--gf-stack) * -1)) rotate(calc(var(--gf-jr) + var(--gf-slot) * var(--gf-fan)));
  transition: transform .75s var(--gf-spring) calc(var(--gf-depth) * 40ms), box-shadow .4s var(--gf-ease), translate .9s var(--gf-ease), opacity .9s var(--gf-ease);
}
.gf-sheet--art { background: #1a1a1d; }
.gf-root[data-open] .gf-sheet:hover, .gf-root[data-open] .gf-sheet:focus-visible {
  transform: translate(calc(var(--gf-jx) + var(--gf-slot) * var(--gf-spread)), calc(var(--gf-lift) + var(--gf-depth) * var(--gf-stack) * -1 - 18px)) rotate(calc(var(--gf-slot) * var(--gf-fan) * .6));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9), 0 0 0 .5px rgba(0, 0, 0, .1), 0 22px 40px -12px rgba(10, 12, 20, .42);
  transition-delay: 0s;
}
.gf-sheet:focus-visible { outline: 2px solid #4c8dff; outline-offset: 2px; }
.gf-sheet-art { position: absolute; left: 0; top: 0; width: 272px; height: 184px; max-width: none; object-fit: cover; }
.gf-sheet--art::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(180deg, rgba(0, 0, 0, .58) 0%, rgba(0, 0, 0, 0) 44%); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .2); pointer-events: none; }
.gf-sheet-head { position: absolute; left: 14px; right: 14px; top: 11px; z-index: 1; display: flex; align-items: baseline; justify-content: space-between; gap: 10px; white-space: nowrap; }
.gf-sheet-name { overflow: hidden; text-overflow: ellipsis; font-size: 12.5px; font-weight: 560; letter-spacing: -.005em; color: #18181b; }
.gf-sheet-meta { flex: none; font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; letter-spacing: .02em; color: rgba(24, 24, 27, .5); }
.gf-sheet--art .gf-sheet-name { color: #fafafa; }
.gf-sheet--art .gf-sheet-meta { color: rgba(250, 250, 250, .75); }
.gf-lines { position: absolute; left: 14px; right: 14px; top: 40px; display: flex; flex-direction: column; gap: 9px; }
.gf-lines i { display: block; height: 5px; border-radius: 3px; background: rgba(24, 24, 27, .08); }
.gf-lines i:first-child { height: 9px; margin-bottom: 4px; background: rgba(24, 24, 27, .14); }
.gf-front { position: absolute; left: 0; top: 74px; width: 340px; height: 198px; z-index: 10; -webkit-backdrop-filter: blur(22px) saturate(1.5); backdrop-filter: blur(22px) saturate(1.5); transform-origin: 50% 100%; transform: perspective(760px) rotateX(var(--gf-hinge)); transition: transform .8s var(--gf-spring), translate 1s var(--gf-ease), opacity 1s var(--gf-ease); }
.gf-tint { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255, 255, 255, .16) 0%, rgba(255, 255, 255, .5) 42%, rgba(252, 252, 252, .93) 100%); }
.gf-spec { position: absolute; inset: 0; background: radial-gradient(260px 200px at calc(50% + var(--gf-px) * 46%) calc(30% + var(--gf-py) * 40%), rgba(255, 255, 255, .5), rgba(255, 255, 255, 0) 70%); mix-blend-mode: soft-light; opacity: .9; transition: background-position .6s var(--gf-ease); pointer-events: none; }
.gf-front-rim { width: 340px; height: 198px; }
.gf-front-rim path { stroke-width: 2.4; transition: stroke-width .3s var(--gf-ease); }
.gf-hit { all: unset; position: absolute; inset: 0; z-index: 1; cursor: pointer; touch-action: pan-y pinch-zoom; }
.gf-hit:focus-visible ~ .gf-label .gf-title { text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 4px; }
.gf-front:has(.gf-hit:focus-visible) .gf-front-rim path { stroke-width: 5; }
.gf-label { position: absolute; z-index: 2; display: flex; flex-direction: column; gap: 4px; max-width: 200px; pointer-events: none; color: var(--gf-ink); }
.gf-mark { position: absolute; top: calc(18% + 12px); inset-inline-end: 14px; z-index: 3; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; overflow: hidden; background: transparent; box-shadow: 0 3px 8px rgba(12, 14, 18, .22); pointer-events: none; }
.gf-mark img { width: 100%; height: 100%; object-fit: cover; display: block; }
.gf-root[data-tone="dark"] .gf-mark { box-shadow: 0 3px 10px rgba(0, 0, 0, .4); }
.hero-folder-row .gf-mark { inset-inline-end: 12px; }
.gf-root[data-place="bottom-left"] .gf-label { left: 28px; bottom: 32px; }
.gf-title { font-size: 18px; font-weight: 500; line-height: 1.15; letter-spacing: -.012em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gf-meta { font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; letter-spacing: .03em; color: var(--gf-ink-soft); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  .gf-root *, .gf-root *::before, .gf-root *::after { transition-duration: 0s !important; transition-delay: 0s !important; animation: none !important; }
  .gf-tilt { transform: none; }
}
`;

function GlassFolder({
  label,
  meta,
  tone = "light",
  image,
  files,
  href,
  labelPlacement = "bottom-left",
  defaultOpen = false,
  width = 340,
  appear = false,
  className = "",
}: GlassFolderProps) {
  const isEn = useLanguage() === "en";
  const router = useRouter();
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const filesRef = useRef<HTMLDivElement | null>(null);
  const hitRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [entered, setEntered] = useState(!appear);
  const scale = width / 340;

  useEffect(() => {
    if (!appear) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          obs.disconnect();
          setEntered(true);
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [appear]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let rafId = 0;
    let px = 0;
    let py = 0;
    const commit = () => {
      rafId = 0;
      el.style.setProperty("--gf-px", px.toFixed(3));
      el.style.setProperty("--gf-py", py.toFixed(3));
    };
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerType === "touch") return;
      const rect = el.getBoundingClientRect();
      px = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      py = ((ev.clientY - rect.top) / rect.height) * 2 - 1;
      if (!rafId) rafId = requestAnimationFrame(commit);
    };
    const onLeave = () => {
      px = 0;
      py = 0;
      if (!rafId) rafId = requestAnimationFrame(commit);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    filesRef.current?.toggleAttribute("inert", !isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setIsOpen(false);
        hitRef.current?.focus();
      }
    };
    const onDown = (ev: PointerEvent) => {
      const target = ev.target as Node | null;
      if (target && !rootRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [isOpen]);

  const startIdx = Math.max(0, files.length - 4);
  const visibleFiles = files.slice(startIdx);
  const totalCount = files.length;
  const displayMeta = meta ?? `${totalCount} ${totalCount === 1 ? "item" : "items"}`;

  return (
    <div
      ref={rootRef}
      className={`gf-root${className ? ` ${className}` : ""}`}
      data-tone={tone}
      data-open={isOpen || undefined}
      data-entered={entered || undefined}
      data-place={labelPlacement}
      style={{
        width,
        height: 326 * scale,
        ...(href ? { cursor: "pointer" } : {}),
      }}
      onClick={href ? () => router.push(href) : undefined}
    >
      <style>{GF_STYLES}</style>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <clipPath id={`gf-back-clip-${uid}`} clipPathUnits="objectBoundingBox">
            <path d={BACK_PATH} transform={`scale(${1 / 340} ${1 / 272})`} />
          </clipPath>
          <clipPath id={`gf-front-clip-${uid}`} clipPathUnits="objectBoundingBox">
            <path d={FRONT_PATH} transform={`scale(${1 / 340} ${1 / 198})`} />
          </clipPath>
        </defs>
      </svg>

      <div
        className="gf-stage"
        style={{ transform: `translateY(${54 * scale}px) scale(${scale})` }}
      >
        <div className="gf-tilt">
          <div className="gf-shadow" aria-hidden="true" />
          <div
            className="gf-back"
            style={{ clipPath: `url(#gf-back-clip-${uid})` }}
            aria-hidden="true"
          >
            {image && (
              <Image
                className="gf-art"
                src={image}
                alt=""
                width={364}
                height={296}
                draggable={false}
                unoptimized
              />
            )}
            <div className="gf-back-sheen" />
          </div>
          <svg
            className="gf-rim gf-back-rim"
            viewBox="0 0 340 272"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={BACK_PATH} />
          </svg>
          <div
            className="gf-front"
            style={{ clipPath: `url(#gf-front-clip-${uid})` }}
          >
            <div className="gf-tint" aria-hidden="true" />
            <div className="gf-spec" aria-hidden="true" />
            <svg
              className="gf-rim gf-front-rim"
              viewBox="0 0 340 198"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id={`gf-rim-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
                  <stop offset="0.35" stopColor="#fff" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
                </linearGradient>
              </defs>
              <path d={FRONT_PATH} stroke={`url(#gf-rim-${uid})`} />
            </svg>
            {href ? (
              <Link
                href={href}
                className="gf-hit"
                onClick={(e) => e.stopPropagation()}
                aria-label={
                  isEn
                    ? `Open ${label}`
                    : `فتح ${label}`
                }
              />
            ) : (
              <button
                ref={hitRef}
                type="button"
                className="gf-hit"
                aria-expanded={isOpen}
                aria-label={
                  isEn
                    ? `${isOpen ? "Close" : "Open"} ${label}, ${totalCount} files`
                    : `${isOpen ? "إغلاق " : "فتح "}${label}، ${totalCount} ملفات`
                }
                onClick={() => setIsOpen((prev) => !prev)}
              />
            )}
            <span className="gf-mark" aria-hidden="true">
              <Image
                src="/brand/tornado-icon.webp"
                width={30}
                height={30}
                alt=""
                sizes="30px"
                unoptimized
              />
            </span>
            <div className="gf-label">
              <span className="gf-title">{label}</span>
              <span className="gf-meta">{displayMeta}</span>
            </div>
          </div>

          <div
            ref={filesRef}
            className="gf-files"
            role="list"
            aria-label={(isEn ? "Contents of " : "محتويات ") + label}
          >
            {visibleFiles.map((file, idx) => {
              const slot =
                visibleFiles.length <= 1 ? 0 : (idx / (visibleFiles.length - 1)) * 2 - 1;
              const rng = mulberry32(hashStr(file.name) + idx);
              const hasArt = !!file.image;
              const content = (
                <>
                  {hasArt && file.image ? (
                    <Image
                      className="gf-sheet-art"
                      src={file.image}
                      alt=""
                      width={272}
                      height={184}
                      draggable={false}
                      unoptimized
                    />
                  ) : (
                    <span className="gf-lines" aria-hidden="true">
                      <i style={{ width: "86%" }} />
                      <i style={{ width: "92%" }} />
                      <i style={{ width: "64%" }} />
                      <i style={{ width: "88%" }} />
                      <i style={{ width: "42%" }} />
                    </span>
                  )}
                  <span className="gf-sheet-head">
                    <span className="gf-sheet-name">{file.name}</span>
                    {file.meta && <span className="gf-sheet-meta">{file.meta}</span>}
                  </span>
                </>
              );

              const sheetStyle = {
                "--gf-slot": slot,
                "--gf-depth": visibleFiles.length - 1 - idx,
                "--gf-jx": `${((rng() - 0.5) * 10).toFixed(2)}px`,
                "--gf-jr": `${((rng() - 0.5) * 3.2).toFixed(2)}deg`,
                zIndex: idx + 1,
              } as React.CSSProperties;

              const sheetClass = `gf-sheet${hasArt ? " gf-sheet--art" : ""}`;

              return (
                <div key={file.name + idx} role="listitem" className="gf-sheet-slot">
                  {file.href ? (
                    <a className={sheetClass} style={sheetStyle} href={file.href}>
                      {content}
                    </a>
                  ) : (
                    <button type="button" className={sheetClass} style={sheetStyle}>
                      {content}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const subscribeReducedMotion = (cb: () => void) => {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};
const getReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useDynamicFolderPath(
  ref: React.RefObject<HTMLDivElement | null>,
  builder: (w: number, h: number) => string
) {
  const [path, setPath] = useState("");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setPath(builder(el.offsetWidth, el.offsetHeight));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, builder]);
  return path;
}

interface TechStackItem {
  id: string;
  labelAr: string;
  labelEn: string;
  color: string;
  icon: React.ReactNode;
}

const TECH_STACK: TechStackItem[] = [
  {
    id: "claude-code",
    labelAr: "Claude Code",
    labelEn: "Claude Code",
    color: "linear-gradient(145deg, #d97757 0%, #b85435 100%)",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="52%"
        height="52%"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m7 8-4 4 4 4" />
        <path d="m17 8 4 4-4 4" />
        <path d="m14 4-4 16" />
      </svg>
    ),
  },
  {
    id: "codex",
    labelAr: "OpenAI Codex",
    labelEn: "OpenAI Codex",
    color: "linear-gradient(145deg, #10a37f 0%, #0b7258 100%)",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="52%"
        height="52%"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="m8 10 3 3-3 3" />
        <path d="M13 16h3" />
      </svg>
    ),
  },
  {
    id: "ai-video",
    labelAr: "مونتاج وفيديو بالـ AI",
    labelEn: "AI Video & Motion",
    color: "linear-gradient(145deg, #e97721 0%, #c0560e 100%)",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="52%"
        height="52%"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <path d="M2 8h20" />
        <path d="m7 4 2 4" />
        <path d="m14 4 2 4" />
        <polygon points="10 11 15 14 10 17 10 11" fill="#ffffff" />
      </svg>
    ),
  },
  {
    id: "ai-design",
    labelAr: "جرافيك ديزاين بالـ AI",
    labelEn: "AI Graphic Design",
    color: "linear-gradient(145deg, #7c5cff 0%, #5333d1 100%)",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="52%"
        height="52%"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2 19 21l-7-4-7 4 7-19Z" />
        <path d="M12 2v11" />
        <circle cx="12" cy="13" r="1.6" fill="#ffffff" />
      </svg>
    ),
  },
  {
    id: "ai-media-buying",
    labelAr: "Media Buying بالـ AI",
    labelEn: "AI Media Buying",
    color: "linear-gradient(145deg, #2563eb 0%, #1d4ed8 100%)",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="52%"
        height="52%"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3v18h18" />
        <path d="m7 15 4-4 3 3 6-7" />
        <path d="M16 7h4v4" />
      </svg>
    ),
  },
  {
    id: "ai-automation",
    labelAr: "أوتوميشن و Agents",
    labelEn: "AI Agents & Workflows",
    color: "linear-gradient(145deg, #24372b 0%, #141f18 100%)",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="52%"
        height="52%"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="12" cy="18" r="3" />
        <path d="M9 6h6" />
        <path d="m7.5 8.5 3 7" />
        <path d="m16.5 8.5-3 7" />
      </svg>
    ),
  },
];

function TechnologyFolder({ title }: { title: string }) {
  const isEn = useLanguage() === "en";
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const frontRef = useRef<HTMLDivElement | null>(null);
  const backRef = useRef<HTMLDivElement | null>(null);

  const [inView, setInView] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [width, setWidth] = useState(420);
  const isReduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const buildFrontPath = useCallback((w: number, h: number) => {
    const tabX = Math.round(0.42 * w);
    return `M0 24A24 24 0 0 1 24 0L${tabX} 0C${tabX + 25.3} 0 ${tabX + 20.7} 24 ${
      tabX + 46
    } 24L${w - 24} 24A24 24 0 0 1 ${w} 48L${w} ${h - 24}A24 24 0 0 1 ${
      w - 24
    } ${h}L24 ${h}A24 24 0 0 1 0 ${h - 24}Z`;
  }, []);

  const buildBackPath = useCallback((w: number, h: number) => {
    const tabX = w - Math.round(0.4 * w);
    return `M0 48A24 24 0 0 1 24 24L${tabX - 46} 24C${tabX - 20.7} 24 ${
      tabX - 25.3
    } 0 ${tabX} 0L${w - 24} 0A24 24 0 0 1 ${w} 24L${w} ${h - 24}A24 24 0 0 1 ${
      w - 24
    } ${h}L24 ${h}A24 24 0 0 1 0 ${h - 24}Z`;
  }, []);

  const frontPath = useDynamicFolderPath(frontRef, buildFrontPath);
  const backPath = useDynamicFolderPath(backRef, buildBackPath);

  const count = TECH_STACK.length;
  const fanStep = count > 1 ? 25 / (count - 1) : 0;
  const expanded = isOpen || hovered;
  const tileSize = Math.min(101, Math.max(44, 0.26 * width));
  const maxGap = Math.max(0, (width - 1.5 * tileSize - 16) / Math.max(1, count - 1));
  const gap = Math.min(56 * (expanded ? 1.15 : 1), maxGap);
  const ease = "cubic-bezier(.2,.8,.2,1)";

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      aria-label={`${title}: ${TECH_STACK.map((t) => (isEn ? t.labelEn : t.labelAr)).join(", ")}`}
      onClick={() => setIsOpen((p) => !p)}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          setIsOpen((p) => !p);
        }
      }}
      onPointerEnter={(ev) => ev.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        setActiveTile(null);
      }}
      className="relative isolate h-[286px] w-full max-w-[420px] cursor-pointer select-none outline-none [-webkit-tap-highlight-color:transparent] focus-visible:rounded-3xl focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 hero-technology-folder"
      style={{
        color: "#ffffff",
        outlineColor: "rgba(255,255,255,.4)",
        zIndex: expanded ? 2 : undefined,
        opacity: inView || isReduced ? 1 : 0,
        transform:
          inView || isReduced
            ? expanded
              ? "translateY(-6px) scale(1.02)"
              : "none"
            : "translateY(34px) scale(.92)",
        transition: isReduced ? "none" : `transform .9s ${ease}, opacity .6s ease`,
      }}
    >
      <div
        className="pointer-events-none absolute left-[8%] right-[8%] top-10 -z-10 h-[200px] rounded-full opacity-80 blur-[18px]"
        style={{
          background: "radial-gradient(closest-side, rgba(255,255,255,.10), transparent)",
        }}
      />

      <div
        ref={backRef}
        data-icon-folder-back="true"
        className="absolute inset-x-0 bottom-0 top-[14px]"
        style={{
          background:
            "linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.008) 60%)",
          clipPath: backPath ? `path('${backPath}')` : undefined,
        }}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <path d={backPath} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="2" />
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {TECH_STACK.map((item, idx) => {
          const offset = idx - (count - 1) / 2;
          const rot = offset * fanStep * (expanded ? 1.2 : 1);
          const itemLabel = isEn ? item.labelEn : item.labelAr;
          return (
            <div
              key={item.id}
              data-icon-folder-tile="true"
              className="absolute left-1/2 top-[42px] -ml-[50.5px] h-[101px] w-[101px] rounded-[26px] [backface-visibility:hidden]"
              style={{
                width: tileSize,
                height: tileSize,
                marginLeft: -tileSize / 2,
                zIndex: activeTile === idx ? 5 : undefined,
                opacity: inView || isReduced ? 1 : 0,
                transform:
                  inView || isReduced
                    ? `translate3d(${offset * gap}px, ${
                        offset * offset * 3 - (expanded ? 4 : 0)
                      }px, 0) rotate(${rot}deg)`
                    : `translate3d(${offset * gap * 0.6}px, 80px, 0)`,
                transition: isReduced
                  ? "none"
                  : `transform ${expanded ? 0.6 : 0.9}s ${ease}, opacity .5s`,
                transitionDelay: isReduced
                  ? "0s"
                  : expanded
                  ? `${0.04 * idx}s`
                  : `${0.35 + 0.08 * idx}s`,
              }}
            >
              <div
                className="pointer-events-auto relative h-full w-full rounded-[inherit]"
                onPointerEnter={(ev) => ev.pointerType === "mouse" && setActiveTile(idx)}
                onPointerLeave={() => setActiveTile((cur) => (cur === idx ? null : cur))}
                style={{
                  transform:
                    activeTile === idx
                      ? `translateY(-26px) rotate(${-rot}deg) scale(1.1)`
                      : activeTile !== null
                      ? "scale(.96)"
                      : "none",
                  filter:
                    activeTile !== null && activeTile !== idx
                      ? "saturate(.75) brightness(.85)"
                      : "none",
                  transition: isReduced
                    ? "none"
                    : `transform .45s ${ease}, filter .3s ease`,
                }}
              >
                <div
                  className="grid h-full w-full place-items-center overflow-hidden rounded-[inherit]"
                  style={{
                    background: item.color,
                    boxShadow:
                      "0 18px 40px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.14)",
                  }}
                >
                  {item.icon}
                </div>
                <span
                  className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium leading-4 backdrop-blur-[8px]"
                  style={{
                    background: "rgba(0,0,0,.55)",
                    borderColor: "rgba(255,255,255,.08)",
                    color: "#ffffff",
                    opacity: activeTile === idx ? 1 : 0,
                    transform: `translateX(-50%) translateY(${
                      activeTile === idx ? 0 : 6
                    }px)`,
                    transition: isReduced
                      ? "none"
                      : `opacity .25s ease, transform .35s ${ease}`,
                  }}
                >
                  {itemLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        ref={frontRef}
        data-icon-folder-front="true"
        className="absolute inset-x-0 bottom-0 h-[180px] overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg,rgba(255,255,255,.09),rgba(255,255,255,.015) 55%),#0c0c0c",
          clipPath: frontPath ? `path('${frontPath}')` : undefined,
          transform: expanded ? "translateY(6px)" : "none",
          transition: isReduced ? "none" : `transform .6s ${ease}`,
        }}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`edge-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(255,255,255,.38)" />
              <stop offset=".35" stopColor="rgba(255,255,255,.1)" />
              <stop offset="1" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <path d={frontPath} fill="none" stroke={`url(#edge-${uid})`} strokeWidth="2" />
        </svg>
        <h3 className="m-0 px-[18px] pt-[34px] text-xl font-medium leading-[26px]">
          {title}
        </h3>
        <div
          data-icon-folder-tags="true"
          className="mx-[18px] mt-3.5 flex flex-wrap gap-1.5"
        >
          {TECH_STACK.map((item, idx) => (
            <span
              key={item.id}
              data-icon-folder-tag="true"
              dir={isEn ? "ltr" : "rtl"}
              className="inline-flex min-h-6 items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs leading-5"
              style={{
                background: "rgba(36,36,36,.7)",
                borderColor: activeTile === idx ? "rgba(255,255,255,.4)" : "#282828",
                color: activeTile === idx ? "#ffffff" : "#9f9f9f",
                transition: "border-color .25s ease, color .25s ease",
              }}
            >
              {isEn ? item.labelEn : item.labelAr}
            </span>
          ))}
        </div>

        <span
          className="absolute bottom-3.5 right-3.5 flex h-[34px] items-center gap-1.5 rounded-full border px-1.5"
          style={{
            background: "rgba(0,0,0,.55)",
            borderColor: "rgba(255,255,255,.08)",
          }}
          aria-hidden="true"
        >
          {TECH_STACK.map((item) => (
            <span
              key={item.id}
              className="block h-[22px] w-[22px] overflow-hidden rounded-[7px]"
            >
              <span
                className="grid h-full w-full place-items-center"
                style={{ background: item.color }}
              >
                {item.icon}
              </span>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

interface FolderConfig {
  label: string;
  meta: string;
  href?: string;
  files: FolderFileItem[];
}

function FolderSlot({ folder, index }: { folder: FolderConfig; index: number }) {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const [slotWidth, setSlotWidth] = useState(340);

  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSlotWidth(Math.max(180, Math.floor(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="hero-folder-slot" ref={slotRef}>
      <GlassFolder
        label={folder.label}
        meta={folder.meta}
        href={folder.href}
        files={folder.files}
        image={`/brand/folders/glacier-${3 + index}.webp`}
        tone="light"
        width={slotWidth}
        appear={false}
        className="hero-glass-folder"
      />
    </div>
  );
}

const FOLDERS_AR: FolderConfig[] = [
  {
    label: "أحدث الكورسات",
    meta: "افتح الفولدر. استكشف المسارات.",
    files: [
      {
        name: "البرمجة بـ Claude Code & Codex",
        meta: "بناء مواقع وأنظمة · 6+ ساعات",
        image: "/projects/pola-samy/desktop-home.webp",
        href: "#identity",
      },
      {
        name: "المونتاج والموشن بالـ AI",
        meta: "إنتاج فيديو احترافي · 4+ ساعات",
        href: "#identity",
      },
      {
        name: "الجرافيك ديزاين والـ Media Buying",
        meta: "تصميم وإعلانات بيّاعة · 5+ ساعات",
        href: "#identity",
      },
    ],
  },
  {
    label: "مكتبة تتحدث يوميًا",
    meta: "كل يومين موديل جديد؟ بيتشرح فورًا.",
    files: [
      {
        name: "رادار موديلات الـ AI اليومي",
        meta: "تحديث فوري للمكتبة",
        href: "#video",
      },
      {
        name: "الأدوات المدفوعة والبدائل المجانية",
        meta: "تطبّق بدون تكاليف إضافية",
        href: "#free-vs-paid",
      },
      {
        name: "مجتمع Tornado داخل المنصة",
        meta: "دعم، تطبيق عملي، ونقاشات",
        href: "#pricing",
      },
    ],
  },
  {
    label: "خزنة تورنادو المجانية",
    meta: "Prompts و Skills جاهزة مجانًا.",
    href: "/vault",
    files: [
      {
        name: "خزنة البرومتات والمهارات (Skills)",
        meta: "مفتوحة بالكامل مجانًا",
        href: "/vault",
      },
      {
        name: "احجز مقعدك — افتتاح 1 ديسمبر",
        meta: "1500 ج.م شاملة كل شيء",
        href: "/vault",
      },
    ],
  },
];

const FOLDERS_EN: FolderConfig[] = [
  {
    label: "Latest Added Courses",
    meta: "Open the folder. Explore tracks.",
    files: [
      {
        name: "AI Coding with Claude Code & Codex",
        meta: "Full-stack & systems · 6+ hrs",
        image: "/projects/pola-samy/desktop-home.webp",
        href: "#identity",
      },
      {
        name: "AI Video Editing & Motion",
        meta: "Cinematic video workflows · 4+ hrs",
        href: "#identity",
      },
      {
        name: "AI Graphic Design & Media Buying",
        meta: "Visuals & high-ROI ads · 5+ hrs",
        href: "#identity",
      },
    ],
  },
  {
    label: "Daily AI Updates",
    meta: "New model every 48h? Covered fast.",
    files: [
      {
        name: "Live AI Model Radar",
        meta: "Continuous library updates",
        href: "#video",
      },
      {
        name: "Paid Tools & Free Alternatives",
        meta: "Zero extra tool budget needed",
        href: "#free-vs-paid",
      },
      {
        name: "In-Platform Tornado Community",
        meta: "Support, feedback & daily workflows",
        href: "#pricing",
      },
    ],
  },
  {
    label: "Free Tornado Vault",
    meta: "Free Prompts & Agent Skills.",
    href: "/en/vault",
    files: [
      {
        name: "Open Full Prompts & Skills Vault",
        meta: "100% free access",
        href: "/en/vault",
      },
      {
        name: "Join Waitlist — Dec 1 Launch",
        meta: "1,500 EGP All-Access",
        href: "/en/vault",
      },
    ],
  },
];

export function HeroFolders() {
  const isEn = useLanguage() === "en";
  const folders = isEn ? FOLDERS_EN : FOLDERS_AR;

  return (
    <section
      id="tools"
      className="hero-folder-row"
      aria-label={
        isEn
          ? "AI tools, latest courses and free vault"
          : "أدوات الذكاء الاصطناعي، أحدث الكورسات، وخزنة تورنادو"
      }
    >
      <div className="hero-technology-slot">
        <TechnologyFolder
          title={
            isEn ? "The AI stack you'll master." : "الأدوات اللي هتتقنها وتشتغل بيها."
          }
        />
      </div>
      {folders.map((folder, idx) => (
        <FolderSlot key={folder.label} folder={folder} index={idx} />
      ))}
    </section>
  );
}
