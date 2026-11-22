"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLanguage } from "./LanguageContext";

gsap.registerPlugin(ScrollTrigger);

function MotionVideoTile({ clip, label }: { clip: string; label: string }) {
  const isEn = useLanguage() === "en";
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    let intersecting = false;

    const sync = () => {
      if (!intersecting || paused || mql.matches || document.hidden) {
        vid.pause();
      } else {
        vid.play().catch(() => {});
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        sync();
      },
      { threshold: 0.15 }
    );
    io.observe(vid);

    mql.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      io.disconnect();
      mql.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      vid.pause();
    };
  }, [paused]);

  return (
    <button
      type="button"
      data-intro-reveal="true"
      className={`brand-media-tile brand-motion-tile brand-motion-${clip}`}
      onClick={() => setPaused((p) => !p)}
      aria-label={
        isEn
          ? `${paused ? "Play" : "Pause"} ${label} video`
          : `${paused ? "تشغيل" : "إيقاف"} فيديو ${label}`
      }
      aria-pressed={paused}
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback"
        preload="none"
        poster={`/brand/intro-v2/${clip}.webp`}
        aria-hidden="true"
      >
        <source src={`/brand/intro-v2/${clip}.mp4`} type="video/mp4" />
      </video>
    </button>
  );
}

const CAPABILITIES_AR = [
  {
    title: "تبرمج وتبني بالـ AI.",
    text: "تحوّل أي فكرة لموقع أو تطبيق شغّال من الصفر للإطلاق باستخدام Claude Code وCodex وأحدث أدوات البرمجة الذكية.",
  },
  {
    title: "تمَنتج وتصنع فيديو أسرع.",
    text: "توظّف الذكاء الاصطناعي في المونتاج، الموشن جرافيك، توليد المشاهد، والمؤثرات الصوتية بجودة سينمائية.",
  },
  {
    title: "تصمّم جرافيك وهوية بصرية.",
    text: "تبني تصميمات سوشيال ميديا، صور إعلانية، وهويات بصرية كاملة مع ثبات الشخصيات والمنتجات.",
  },
  {
    title: "تطلق حملات Media Buying.",
    text: "تكتب زوايا إعلانية بيّاعة، تحلّل السوق والمنافسين، وتدير حملات تسويقية بالـ AI تضاعف المبيعات.",
  },
];

const CAPABILITIES_EN = [
  {
    title: "Code & ship with AI.",
    text: "Build full websites, apps and production systems from scratch using Claude Code, Codex and modern AI agents.",
  },
  {
    title: "Edit & produce AI video.",
    text: "Accelerate video editing, motion graphics, scene generation and sound design with studio-grade AI workflows.",
  },
  {
    title: "Design graphics & brand visuals.",
    text: "Create consistent characters, product visuals, thumbnails and brand identities using paid and free AI models.",
  },
  {
    title: "Scale AI Media Buying.",
    text: "Generate high-converting ad angles, analyze competitors and automate marketing funnels that drive real ROI.",
  },
];

function SharedIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="brand-shared-icon" data-shared-icon="true">
      <span className="brand-question-mover">
        <span className="brand-icon-original">{children}</span>
      </span>
    </span>
  );
}

function IntroWords({ children }: { children: string }) {
  return (
    <>
      {children.split(" ").map((word, idx) => (
        <span key={idx} data-intro-copy="true">
          <span className="brand-intro-word" data-intro-reveal="true">
            {word}
          </span>{" "}
        </span>
      ))}
    </>
  );
}

function SculptedTile({ name, src }: { name: string; src: string }) {
  return (
    <span
      className="brand-media-tile brand-sculpted-tile"
      title={name}
      data-intro-reveal="true"
    >
      <Image
        src={src}
        width={1024}
        height={1024}
        alt={name}
        sizes="(max-width:767px) 150px, 260px"
        quality={90}
      />
    </span>
  );
}

export function BrandStory() {
  const isEn = useLanguage() === "en";
  const capabilities = isEn ? CAPABILITIES_EN : CAPABILITIES_AR;
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        sectionEl.dataset.motionReady = "true";

        const revealItems = sectionEl.querySelectorAll("[data-intro-reveal]");
        const introRevealTween = gsap.from(revealItems, {
          opacity: 0,
          y: (_idx, el) => (el.classList.contains("brand-media-tile") ? 28 : 18),
          scale: (_idx, el) => (el.classList.contains("brand-media-tile") ? 0.72 : 1),
          rotation: (_idx, el) => (el.classList.contains("brand-media-tile") ? -10 : 0),
          duration: 0.55,
          stagger: 0.04,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionEl.querySelector(".brand-intro-statement"),
            start: "top 90%",
            toggleActions: "play none none none",
            once: true,
          },
        });

        const sharedIcons = Array.from(
          sectionEl.querySelectorAll("[data-shared-icon]")
        ) as HTMLElement[];
        const iconSlots = Array.from(
          sectionEl.querySelectorAll("[data-icon-slot]")
        ) as HTMLElement[];
        const questionSlots = Array.from(
          sectionEl.querySelectorAll("[data-question-slot]")
        ) as HTMLElement[];
        const questionBases = sectionEl.querySelectorAll(".brand-question-base");

        let iconDeltas: { x: number; y: number; scale: number }[] = [];
        const computeIconDeltas = () => {
          iconDeltas = sharedIcons.map((iconEl, idx) => {
            const srcRect = iconEl.getBoundingClientRect();
            const dstRect = iconSlots[idx].getBoundingClientRect();
            return {
              x:
                dstRect.left +
                dstRect.width / 2 -
                (srcRect.left + srcRect.width / 2 - Number(gsap.getProperty(iconEl, "x"))),
              y:
                dstRect.top +
                dstRect.height / 2 -
                (srcRect.top + srcRect.height / 2 - Number(gsap.getProperty(iconEl, "y"))),
              scale: dstRect.width / iconEl.offsetWidth,
            };
          });
        };
        computeIconDeltas();

        // Beat 1 -> Beat 2: Fast, clean FLIP from statement into the 4 Core Track Cards
        const toCardsTl = gsap.timeline();
        toCardsTl.to(
          sectionEl.querySelectorAll("[data-intro-copy]"),
          { opacity: 0, duration: 0.25, ease: "power1.out" },
          0
        );
        sharedIcons.forEach((iconEl, idx) =>
          toCardsTl.to(
            iconEl,
            {
              x: () => iconDeltas[idx].x,
              y: () => iconDeltas[idx].y,
              scale: () => iconDeltas[idx].scale,
              duration: 0.72,
              ease: "power2.inOut",
            },
            0.04 + 0.025 * idx
          )
        );
        gsap.set(sectionEl.querySelectorAll(".brand-capability-copy"), {
          opacity: 0,
          y: 20,
        });
        toCardsTl.to(
          sectionEl.querySelectorAll(".brand-capability-copy"),
          {
            opacity: 1,
            y: 0,
            duration: 0.32,
            stagger: 0.04,
            ease: "power2.out",
          },
          0.62
        );

        // Beat 2 -> Beat 3: Direct, snappy transition from the 4 Track Cards into "هتتعلّم إيه؟ وإزاي"
        const toQuestionsTl = gsap.timeline();
        toQuestionsTl.to(
          sectionEl.querySelectorAll(".brand-capability-copy"),
          { opacity: 0, y: -14, duration: 0.22, ease: "power2.in", immediateRender: false },
          0
        );
        toQuestionsTl.to(
          [sharedIcons[1], sharedIcons[3]],
          { opacity: 0, scale: 0.75, duration: 0.25, ease: "power2.out", immediateRender: false },
          0
        );

        [0, 2].forEach((slotIdx, qIdx) => {
          const moverEl = sharedIcons[slotIdx].querySelector(
            ".brand-question-mover"
          ) as HTMLElement;
          const getQDelta = (axis: "x" | "y") => {
            const srcRect = iconSlots[slotIdx].getBoundingClientRect();
            const dstRect = questionSlots[qIdx].getBoundingClientRect();
            const scaleFactor = srcRect.width / sharedIcons[slotIdx].offsetWidth;
            return axis === "x"
              ? (dstRect.left + dstRect.width / 2 - srcRect.left - srcRect.width / 2) /
                  scaleFactor
              : (dstRect.top + dstRect.height / 2 - srcRect.top - srcRect.height / 2) /
                  scaleFactor;
          };

          toQuestionsTl.fromTo(
            moverEl,
            { x: 0, y: 0, scale: 1 },
            {
              x: () => getQDelta("x"),
              y: () => getQDelta("y"),
              scale: () =>
                questionSlots[qIdx].getBoundingClientRect().width /
                iconSlots[slotIdx].getBoundingClientRect().width,
              duration: 0.62,
              ease: "power2.inOut",
              immediateRender: false,
            },
            0.08 + 0.05 * qIdx
          );
        });

        toQuestionsTl.set(questionBases, { opacity: 1 }, 0.45);
        toQuestionsTl.fromTo(
          questionBases,
          { clipPath: isEn ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.45,
            stagger: 0.14,
            ease: "power2.out",
            immediateRender: false,
          },
          0.45
        );
        toQuestionsTl.fromTo(
          sectionEl.querySelectorAll(".brand-question-prefix"),
          { width: 0, opacity: 0 },
          {
            width: (_idx, el) =>
              (el.firstElementChild as HTMLElement).getBoundingClientRect().width,
            opacity: 1,
            duration: 0.45,
            stagger: 0.12,
            ease: "power2.out",
            immediateRender: false,
          },
          0.72
        );

        const stageEl = sectionEl.querySelector(".brand-story-stage") as HTMLElement;
        const master = gsap.timeline({
          scrollTrigger: {
            trigger: sectionEl,
            start: "top top",
            end: () => `+=${Math.round(2.3 * stageEl.clientHeight)}`,
            scrub: 0.22,
            invalidateOnRefresh: true,
            onRefreshInit: computeIconDeltas,
          },
        });

        master.add(toCardsTl.timeScale(toCardsTl.duration() / 0.8), 0.12);
        master.add(toQuestionsTl.timeScale(toQuestionsTl.duration() / 0.85), 1.15);
        master.to({}, { duration: 0.2 }, 2.05);

        master.eventCallback("onUpdate", () => {
          if (master.time() > 0.1 && introRevealTween.progress() < 1) {
            introRevealTween.progress(1);
          }
        });

        document.fonts.ready.then(() => {
          if (sectionEl.isConnected) ScrollTrigger.refresh();
        });

        return () => {
          master.kill();
          delete sectionEl.dataset.motionReady;
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        sectionEl.dataset.reduced = "true";
        const sharedIcons = Array.from(sectionEl.querySelectorAll("[data-shared-icon]"));
        const anchors = sharedIcons.map((el) => ({
          parent: el.parentNode!,
          next: el.nextSibling,
        }));
        const slots = sectionEl.querySelectorAll("[data-icon-slot]");
        sharedIcons.forEach((el, idx) => slots[idx]?.appendChild(el));

        return () => {
          sharedIcons.forEach((el, idx) =>
            anchors[idx].parent.insertBefore(el, anchors[idx].next)
          );
          delete sectionEl.dataset.reduced;
        };
      });
    }, sectionRef);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, [isEn]);

  return (
    <section
      ref={sectionRef}
      id="identity"
      className="brand-story-sequence ta-fast-story"
      aria-labelledby="brand-intro-title"
      dir={isEn ? "ltr" : "rtl"}
    >
      <span id="approach" className="brand-capabilities-anchor" aria-hidden="true" />
      <div className="brand-story-stage wahba-brand-intro">
        <h2 id="brand-intro-title" className="brand-intro-statement">
          <span className="brand-intro-line">
            <IntroWords>{isEn ? "At" : "في"}</IntroWords>
            <span data-intro-copy="true">
              <b
                className="brand-intro-word"
                data-intro-reveal="true"
                lang="en"
                dir="ltr"
              >
                Tornado Academy
              </b>
            </span>{" "}
            <SharedIcon>
              <SculptedTile name="Claude Code & Codex" src="/brand/tiles/code.webp" />
            </SharedIcon>{" "}
            <IntroWords>{isEn ? "you master AI" : "بنعلّمك توظّف الـ AI"}</IntroWords>
          </span>{" "}
          <span className="brand-intro-line">
            <IntroWords>{isEn ? "across coding," : "كمبرمج، ومونتير"}</IntroWords>
            <SharedIcon>
              <SculptedTile name="AI Video & Motion" src="/brand/tiles/video.webp" />
            </SharedIcon>{" "}
            <IntroWords>{isEn ? "video, design" : "وجرافيك ديزاينر"}</IntroWords>
            <SharedIcon>
              <MotionVideoTile
                clip="blue-caustics"
                label={isEn ? "creative visuals" : "التصميم البصري"}
              />
            </SharedIcon>{" "}
            <IntroWords>{isEn ? "that stands out," : "محترف،"}</IntroWords>
          </span>{" "}
          <span className="brand-intro-line">
            <IntroWords>{isEn ? "and marketing" : "وميديا باير"}</IntroWords>
            <SharedIcon>
              <MotionVideoTile
                clip="liquid-chrome"
                label={isEn ? "growth systems" : "منظومات التسويق"}
              />
            </SharedIcon>{" "}
            <IntroWords>
              {isEn
                ? "that wins clients and grows with you."
                : "يبني، يصمّم، ويبيع بأحدث تقنيات اليوم."}
            </IntroWords>
          </span>
        </h2>

        <section
          className="brand-capabilities-row"
          aria-label={
            isEn
              ? "Tornado Academy Core Learning Tracks"
              : "مسارات التعلّم الأساسية في Tornado Academy"
          }
        >
          {capabilities.map((cap) => (
            <article key={cap.title} className="brand-capability">
              <div className="brand-capability-slot" data-icon-slot="true" />
              <div className="brand-capability-copy">
                <h3>{cap.title}</h3>
                <p>{cap.text}</p>
              </div>
            </article>
          ))}
        </section>

        <section
          className="brand-questions-panel"
          aria-label={isEn ? "What will you learn, and how?" : "هتتعلّم إيه؟ وإزاي؟"}
        >
          <div className="brand-question-row">
            <div className="brand-question-slot" data-question-slot="true" />
            <div className="brand-question-copy">
              <h3
                className="brand-question-word brand-question-what"
                dir={isEn ? "ltr" : "rtl"}
                aria-label={isEn ? "What will you learn?" : "هتتعلّم إيه؟"}
              >
                <span className="brand-question-prefix brand-question-prefix-what">
                  <span>{isEn ? "You’ll master " : "هتتعلّم\u00A0"}</span>
                </span>
                <span className="brand-question-base">
                  {isEn ? "What?" : "إيــــــــــــه؟"}
                </span>
              </h3>
            </div>
          </div>

          <div className="brand-question-row">
            <div className="brand-question-slot" data-question-slot="true" />
            <div className="brand-question-copy">
              <h3 className="brand-question-word" dir={isEn ? "ltr" : "rtl"}>
                <span className="brand-question-prefix">
                  <span>{isEn ? "and " : "و"}</span>
                </span>
                <span className="brand-question-base">
                  {isEn ? "How" : "إزاي"}
                </span>
              </h3>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
