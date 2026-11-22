"use client";

import React, { useEffect, useRef, useState } from "react";

interface AmbientVideoProps {
  src: string;
  poster: string;
  className?: string;
}

/**
 * Performance-optimized ambient looping video:
 * - Only decodes & plays while visible in viewport (IntersectionObserver).
 * - Pauses immediately when off-screen or tab is hidden.
 * - Falls back to lightweight static WebP poster on prefers-reduced-motion,
 *   Save-Data mode, or very low-core mobile devices to preserve 60fps.
 */
export function AmbientVideo({ src, poster, className = "" }: AmbientVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [disableVideo, setDisableVideo] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const saveData = !!conn?.saveData;
    const lowCores =
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency <= 2;

    if (reduced || saveData || lowCores) {
      setDisableVideo(true);
      return;
    }

    const vid = videoRef.current;
    if (!vid) return;

    let inView = false;
    const sync = () => {
      if (inView && !document.hidden) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { rootMargin: "120px 0px", threshold: 0.05 }
    );
    io.observe(vid);

    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      vid.pause();
    };
  }, []);

  if (disableVideo) {
    return (
      <img
        src={poster}
        alt=""
        aria-hidden="true"
        className={className}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className={className}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden="true"
    />
  );
}
