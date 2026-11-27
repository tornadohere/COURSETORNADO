"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";

export interface VideoPlayerHandle {
  playWithSound: () => void;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  isEn: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  isHls?: boolean;
  watermarkText?: string;
  protectedMode?: boolean;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 2] as const;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer(
    {
      src,
      poster,
      isEn,
      autoPlay = true,
      loop = true,
      isHls = false,
      watermarkText,
      protectedMode = false,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const hideTimerRef = useRef<number | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [bufferedPct, setBufferedPct] = useState(0);
    const [speedIdx, setSpeedIdx] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isSeeking, setIsSeeking] = useState(false);
    const [wmPos, setWmPos] = useState({ top: 14, left: 14 });

    const useHlsEngine =
      isHls || src.includes(".m3u8") || src.includes("/manifest");

    // Periodically reposition watermark overlay to deter screen recording
    useEffect(() => {
      if (!watermarkText) return;
      const move = () => {
        const top = 10 + Math.floor(Math.random() * 68);
        const left = 8 + Math.floor(Math.random() * 58);
        setWmPos({ top, left });
      };
      move();
      const id = window.setInterval(move, 9000);
      return () => window.clearInterval(id);
    }, [watermarkText]);

    // Attach HLS.js or native source whenever src changes
    useEffect(() => {
      const vid = videoRef.current;
      if (!vid || !src) return;

      let hlsInstance: { destroy: () => void } | null = null;
      let cancelled = false;

      if (useHlsEngine) {
        if (vid.canPlayType("application/vnd.apple.mpegurl")) {
          vid.src = src;
        } else {
          import("hls.js").then(({ default: Hls }) => {
            if (cancelled || !videoRef.current) return;
            if (Hls.isSupported()) {
              const hls = new Hls({
                enableWorker: true,
                xhrSetup: (xhr, url) => {
                  // Send session cookies only to our own origin (manifest + AES key API)
                  if (
                    url.startsWith("/") ||
                    url.startsWith(window.location.origin)
                  ) {
                    xhr.withCredentials = true;
                  }
                },
              });
              hls.loadSource(src);
              hls.attachMedia(videoRef.current);
              hlsInstance = hls;
            }
          });
        }
      } else {
        vid.src = src;
      }

      return () => {
        cancelled = true;
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      };
    }, [src, useHlsEngine]);

    const clearHideTimer = useCallback(() => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    }, []);

    const scheduleHide = useCallback(() => {
      clearHideTimer();
      hideTimerRef.current = window.setTimeout(() => {
        if (videoRef.current && !videoRef.current.paused) {
          setControlsVisible(false);
        }
      }, 2400);
    }, [clearHideTimer]);

    const revealControls = useCallback(() => {
      setControlsVisible(true);
      scheduleHide();
    }, [scheduleHide]);

    useEffect(() => {
      const vid = videoRef.current;
      if (!vid) return;

      if (vid.readyState >= 1 && Number.isFinite(vid.duration)) {
        setDuration(vid.duration);
      }

      if (!autoPlay) return;

      // Try unmuted autoplay first; if browser policy blocks it, fall back to muted autoplay
      vid.muted = false;
      vid
        .play()
        .then(() => {
          setIsMuted(false);
          setIsPlaying(true);
          scheduleHide();
        })
        .catch(() => {
          vid.muted = true;
          setIsMuted(true);
          vid
            .play()
            .then(() => {
              setIsPlaying(true);
              scheduleHide();
            })
            .catch(() => {
              setIsPlaying(false);
            });
        });

      return () => {
        clearHideTimer();
      };
    }, [autoPlay, clearHideTimer, scheduleHide]);

    useEffect(() => {
      const onFullscreenChange = () => {
        setIsFullscreen(document.fullscreenElement === containerRef.current);
      };
      document.addEventListener("fullscreenchange", onFullscreenChange);
      return () => {
        document.removeEventListener("fullscreenchange", onFullscreenChange);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      playWithSound: () => {
        const vid = videoRef.current;
        if (!vid) return;
        vid.muted = false;
        if (vid.volume === 0) {
          vid.volume = 1;
          setVolume(1);
        }
        setIsMuted(false);
        if (vid.currentTime < 2) {
          vid.currentTime = 0;
        }
        vid.play().catch(() => {});
        revealControls();
        containerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      },
    }));

    const togglePlay = useCallback(() => {
      const vid = videoRef.current;
      if (!vid) return;
      if (vid.paused) {
        vid.play().catch(() => {});
        revealControls();
      } else {
        vid.pause();
        clearHideTimer();
        setControlsVisible(true);
      }
    }, [clearHideTimer, revealControls]);

    const toggleMute = useCallback(() => {
      const vid = videoRef.current;
      if (!vid) return;
      const nextMuted = !vid.muted;
      vid.muted = nextMuted;
      if (!nextMuted && vid.volume === 0) {
        vid.volume = 0.85;
        setVolume(0.85);
      }
      setIsMuted(nextMuted);
      if (!nextMuted && vid.paused) {
        vid.play().catch(() => {});
      }
      revealControls();
    }, [revealControls]);

    const handleVolumeChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const vid = videoRef.current;
        if (!vid) return;
        const val = parseFloat(e.target.value);
        vid.volume = val;
        vid.muted = val === 0;
        setVolume(val);
        setIsMuted(val === 0);
        revealControls();
      },
      [revealControls]
    );

    const cycleSpeed = useCallback(() => {
      const vid = videoRef.current;
      if (!vid) return;
      const nextIdx = (speedIdx + 1) % SPEED_OPTIONS.length;
      vid.playbackRate = SPEED_OPTIONS[nextIdx];
      setSpeedIdx(nextIdx);
      revealControls();
    }, [revealControls, speedIdx]);

    const toggleFullscreen = useCallback(() => {
      const container = containerRef.current;
      const vid = videoRef.current as
        | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
        | null;
      if (!container) return;

      if (document.fullscreenElement === container) {
        document.exitFullscreen().catch(() => {});
      } else if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          vid?.webkitEnterFullscreen?.();
        });
      } else {
        vid?.webkitEnterFullscreen?.();
      }
      revealControls();
    }, [revealControls]);

    const seekToClientX = useCallback((clientX: number) => {
      const track = trackRef.current;
      const vid = videoRef.current;
      if (!track || !vid || !Number.isFinite(vid.duration) || vid.duration <= 0) {
        return;
      }
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const nextTime = ratio * vid.duration;
      vid.currentTime = nextTime;
      setCurrentTime(nextTime);
    }, []);

    const handleTrackPointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsSeeking(true);
        seekToClientX(e.clientX);
        revealControls();
      },
      [revealControls, seekToClientX]
    );

    const handleTrackPointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isSeeking) return;
        seekToClientX(e.clientX);
      },
      [isSeeking, seekToClientX]
    );

    const handleTrackPointerUp = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isSeeking) return;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        setIsSeeking(false);
      },
      [isSeeking]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        const vid = videoRef.current;
        if (!vid) return;

        switch (e.key) {
          case " ":
          case "k":
          case "K":
            e.preventDefault();
            togglePlay();
            break;
          case "m":
          case "M":
            e.preventDefault();
            toggleMute();
            break;
          case "f":
          case "F":
            e.preventDefault();
            toggleFullscreen();
            break;
          case "ArrowRight":
            e.preventDefault();
            vid.currentTime = Math.min(
              vid.duration || 0,
              vid.currentTime + 5
            );
            revealControls();
            break;
          case "ArrowLeft":
            e.preventDefault();
            vid.currentTime = Math.max(0, vid.currentTime - 5);
            revealControls();
            break;
        }
      },
      [revealControls, toggleFullscreen, toggleMute, togglePlay]
    );

    const updateBuffered = useCallback(() => {
      const vid = videoRef.current;
      if (!vid || !vid.duration || vid.buffered.length === 0) return;
      const end = vid.buffered.end(vid.buffered.length - 1);
      setBufferedPct(Math.min(100, (end / vid.duration) * 100));
    }, []);

    const progressPct =
      duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    const VolumeIcon =
      isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

    const showBar = controlsVisible || !isPlaying || isSeeking;

    return (
      <div
        ref={containerRef}
        className={`ta-vp-root${isFullscreen ? " is-fullscreen" : ""}`}
        tabIndex={0}
        role="region"
        aria-label={isEn ? "Academy intro video player" : "مشغل فيديو المقدمة"}
        onMouseMove={revealControls}
        onMouseLeave={() => {
          if (isPlaying && !isSeeking) {
            clearHideTimer();
            setControlsVisible(false);
          }
        }}
        onKeyDown={handleKeyDown}
        onContextMenu={
          protectedMode || watermarkText
            ? (e) => e.preventDefault()
            : undefined
        }
      >
        <video
          ref={videoRef}
          className="ta-vp-video"
          src={useHlsEngine ? undefined : src}
          poster={poster}
          loop={loop}
          playsInline
          preload="metadata"
          controlsList={
            protectedMode || watermarkText
              ? "nodownload noplaybackrate"
              : undefined
          }
          disablePictureInPicture={Boolean(protectedMode || watermarkText)}
          onContextMenu={
            protectedMode || watermarkText
              ? (e) => e.preventDefault()
              : undefined
          }
          onClick={togglePlay}
          onPlay={() => {
            setIsPlaying(true);
            scheduleHide();
          }}
          onPause={() => {
            setIsPlaying(false);
            clearHideTimer();
            setControlsVisible(true);
          }}
          onLoadedMetadata={(e) => {
            const vid = e.currentTarget;
            if (Number.isFinite(vid.duration)) {
              setDuration(vid.duration);
            }
            updateBuffered();
          }}
          onDurationChange={(e) => {
            if (Number.isFinite(e.currentTarget.duration)) {
              setDuration(e.currentTarget.duration);
            }
          }}
          onTimeUpdate={(e) => {
            if (!isSeeking) {
              setCurrentTime(e.currentTarget.currentTime);
            }
          }}
          onProgress={updateBuffered}
          onVolumeChange={(e) => {
            setIsMuted(e.currentTarget.muted || e.currentTarget.volume === 0);
            setVolume(e.currentTarget.volume);
          }}
        />

        {/* Moving anti-piracy watermark overlay */}
        {watermarkText && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: `${wmPos.top}%`,
              left: `${wmPos.left}%`,
              pointerEvents: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              padding: "4px 10px",
              borderRadius: "8px",
              background: "rgba(5, 6, 8, 0.36)",
              color: "rgba(255, 255, 255, 0.34)",
              fontSize: "11.5px",
              fontWeight: 600,
              letterSpacing: "0.02em",
              zIndex: 6,
              transition: "top 1.6s ease, left 1.6s ease",
              whiteSpace: "nowrap",
            }}
          >
            {watermarkText}
          </div>
        )}

        {/* Top-end unmute prompt pill when playing muted */}
        {isMuted && (
          <button
            type="button"
            className="ta-vp-unmute-pill"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            aria-label={isEn ? "Unmute video" : "تشغيل الصوت"}
          >
            <VolumeX size={14} strokeWidth={2.2} aria-hidden="true" />
            <span>{isEn ? "Tap for sound" : "تشغيل الصوت"}</span>
          </button>
        )}

        {/* Center Play overlay when paused */}
        {!isPlaying && (
          <button
            type="button"
            className="ta-vp-center-play"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            aria-label={isEn ? "Play video" : "تشغيل الفيديو"}
          >
            <Play size={26} strokeWidth={2.2} fill="currentColor" aria-hidden="true" />
          </button>
        )}

        {/* Bottom Glassmorphic Control Bar */}
        <div
          className={`ta-vp-controls${showBar ? " is-visible" : ""}`}
          dir="ltr"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Seekable Progress Bar */}
          <div
            ref={trackRef}
            className="ta-vp-progress-wrap"
            role="slider"
            tabIndex={0}
            aria-label={isEn ? "Seek video" : "تقديم أو ترجيع الفيديو"}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            onPointerDown={handleTrackPointerDown}
            onPointerMove={handleTrackPointerMove}
            onPointerUp={handleTrackPointerUp}
            onPointerCancel={handleTrackPointerUp}
          >
            <div className="ta-vp-progress-track">
              <div
                className="ta-vp-progress-buffered"
                style={{ width: `${bufferedPct}%` }}
              />
              <div
                className="ta-vp-progress-filled"
                style={{ width: `${progressPct}%` }}
              >
                <span className="ta-vp-progress-thumb" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="ta-vp-bar-row">
            <div className="ta-vp-bar-left">
              <button
                type="button"
                className="ta-vp-btn"
                onClick={togglePlay}
                aria-label={
                  isPlaying
                    ? isEn
                      ? "Pause"
                      : "إيقاف مؤقت"
                    : isEn
                    ? "Play"
                    : "تشغيل"
                }
              >
                {isPlaying ? (
                  <Pause size={16} strokeWidth={2.3} fill="currentColor" />
                ) : (
                  <Play size={16} strokeWidth={2.3} fill="currentColor" />
                )}
              </button>

              <div className="ta-vp-volume-group">
                <button
                  type="button"
                  className="ta-vp-btn"
                  onClick={toggleMute}
                  aria-label={
                    isMuted
                      ? isEn
                        ? "Unmute"
                        : "تشغيل الصوت"
                      : isEn
                      ? "Mute"
                      : "كتم الصوت"
                  }
                >
                  <VolumeIcon size={16} strokeWidth={2.2} />
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="ta-vp-volume-slider"
                  aria-label={isEn ? "Volume" : "مستوى الصوت"}
                />
              </div>

              <span className="ta-vp-time">
                {formatTime(currentTime)}
                <span className="ta-vp-time-sep">/</span>
                {formatTime(duration)}
              </span>
            </div>

            <div className="ta-vp-bar-right">
              <button
                type="button"
                className="ta-vp-speed-btn"
                onClick={cycleSpeed}
                aria-label={isEn ? "Playback speed" : "سرعة التشغيل"}
              >
                {SPEED_OPTIONS[speedIdx]}x
              </button>

              <button
                type="button"
                className="ta-vp-btn"
                onClick={toggleFullscreen}
                aria-label={
                  isFullscreen
                    ? isEn
                      ? "Exit fullscreen"
                      : "إنهاء ملء الشاشة"
                    : isEn
                    ? "Fullscreen"
                    : "ملء الشاشة"
                }
              >
                {isFullscreen ? (
                  <Minimize size={16} strokeWidth={2.2} />
                ) : (
                  <Maximize size={16} strokeWidth={2.2} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
