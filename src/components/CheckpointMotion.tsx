"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function CheckpointMotion({ children }: { children: React.ReactNode }) {
  const scopeRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          all: "all",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const stage = scopeRef.current?.querySelector(".forge-stage") as HTMLElement | null;
          const artScroll = scopeRef.current?.querySelector(
            ".forge-art-scroll"
          ) as HTMLElement | null;
          const titleScrolls = stage?.querySelectorAll(".forge-title-scroll");
          if (!stage || !artScroll || !titleScrolls?.length) return;

          const isReduced = !!context.conditions?.reduced;
          const exitTl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage,
              start: "top top",
              end: () => `+=${Math.min(420, 0.45 * stage.clientHeight)}`,
              scrub: isReduced ? true : 0.18,
              invalidateOnRefresh: true,
            },
          });

          if (!isReduced) {
            exitTl.to(
              artScroll,
              {
                y: 0,
                scale: () => (window.innerWidth < 768 ? 1.02 : 1.035),
                duration: 1,
              },
              0
            );
          }

          exitTl.to(
            titleScrolls,
            {
              y: () => (isReduced ? 0 : Math.min(60, 0.07 * stage.clientHeight)),
              opacity: 0,
              duration: 0.7,
            },
            0
          );
        }
      );

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const stage = scopeRef.current?.querySelector(".forge-stage") as HTMLElement | null;
        const introTl = gsap.timeline();

        introTl.from(
          ".hero-studio-light",
          { opacity: 0, duration: 1.15, ease: "power2.out" },
          0
        );
        introTl.from(
          ".hero-pebble-texture,.forge-horizon",
          { opacity: 0, duration: 0.9, stagger: 0.07, ease: "power2.out" },
          0.06
        );
        introTl.from(
          ".forge-title-word",
          {
            y: 42,
            opacity: 0,
            duration: 0.82,
            stagger: 0.085,
            ease: "power4.out",
            clearProps: "transform,opacity",
          },
          0.08
        );
        introTl.from(
          ".forge-art",
          {
            y: 56,
            opacity: 0,
            scale: 0.96,
            duration: 1.0,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
          0.1
        );
        introTl.from(
          ".ta-cinema-plate",
          {
            opacity: 0,
            scale: 0.9,
            duration: 0.85,
            stagger: 0.09,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
          0.34
        );
        introTl.from(
          ".hero-bottom-cta",
          {
            opacity: 0,
            y: 18,
            scale: 0.96,
            duration: 0.56,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
          0.42
        );
        introTl.from(
          ".ta-hero-rail",
          {
            opacity: 0,
            y: 14,
            duration: 0.6,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
          0.5
        );
        introTl.from(
          ".hero-folder-row > div",
          {
            opacity: 0,
            y: 36,
            duration: 0.62,
            stagger: 0.08,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
          0.42
        );
        introTl.from(
          ".site-header .header-inner",
          {
            opacity: 0,
            y: -14,
            duration: 0.52,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
          0.16
        );
        introTl.from(
          ".site-header .notch-app-tile",
          {
            opacity: 0,
            scale: 0.75,
            duration: 0.4,
            stagger: 0.045,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
          0.3
        );

        const artInner = scopeRef.current?.querySelector(
          ".forge-art-inner"
        ) as HTMLElement | null;
        const cinemaStage = scopeRef.current?.querySelector(
          ".ta-cinema-stage"
        ) as HTMLElement | null;
        if (
          !stage ||
          !artInner ||
          !window.matchMedia("(hover: hover) and (pointer: fine)").matches
        ) {
          return;
        }

        const springs = [
          { value: 0, velocity: 0, target: 0 },
          { value: 0, velocity: 0, target: 0 },
          { value: 0, velocity: 0, target: 0 },
          { value: 0, velocity: 0, target: 0 },
          { value: 0, velocity: 0, target: 0 },
        ];
        const setCss =
          artInner.closest(".forge-native-model") || cinemaStage
            ? null
            : gsap.quickSetter(artInner, "css");
        let rafId = 0;
        let lastTime = 0;

        const tick = (now: number) => {
          const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60;
          lastTime = now;
          let active = false;

          for (const [idx, s] of springs.entries()) {
            const omega = (2 * Math.PI) / (idx >= 3 ? 0.65 : 0.45);
            const diff = s.value - s.target;
            const vTerm = s.velocity + omega * diff;
            const decay = Math.exp(-omega * dt);
            s.value = s.target + (diff + vTerm * dt) * decay;
            s.velocity = (s.velocity - omega * vTerm * dt) * decay;
            active =
              active ||
              Math.abs(s.value - s.target) > 0.001 ||
              Math.abs(s.velocity) > 0.001;
          }

          if (cinemaStage) {
            const nx = springs[0].value / 14;
            const ny = springs[1].value / 10;
            cinemaStage.style.setProperty("--cinema-px", nx.toFixed(4));
            cinemaStage.style.setProperty("--cinema-py", ny.toFixed(4));
            cinemaStage.style.setProperty(
              "--cinema-light-x",
              `${(50 + nx * 38).toFixed(2)}%`
            );
            cinemaStage.style.setProperty(
              "--cinema-light-y",
              `${(24 + ny * 34).toFixed(2)}%`
            );
            stage.style.setProperty(
              "--stage-light-x",
              `${(24 + nx * 18).toFixed(2)}%`
            );
            stage.style.setProperty(
              "--stage-light-y",
              `${(22 + ny * 16).toFixed(2)}%`
            );
          } else {
            const isPortrait = artInner.closest(".forge-portrait-art");
            setCss?.({
              x: springs[0].value,
              y: springs[1].value,
              rotation: springs[2].value,
              ...(isPortrait
                ? {
                    rotationY: 0.38 * springs[0].value,
                    rotationX: -(0.32 * springs[1].value),
                    transformPerspective: 1300,
                  }
                : {}),
            });

            if (isPortrait) {
              artInner.style.setProperty(
                "--portrait-light-x",
                `${40 + 2.3 * springs[0].value}%`
              );
              artInner.style.setProperty(
                "--portrait-light-y",
                `${24 + 2 * springs[1].value}%`
              );
              artInner.style.setProperty(
                "--portrait-shadow-x",
                `${-(1.8 * springs[0].value)}px`
              );
              artInner.style.setProperty(
                "--portrait-shadow-y",
                `${18 - springs[1].value}px`
              );
            }
          }

          stage.style.setProperty(
            "--title-parallax-x",
            `${(springs[3].value * 0.25).toFixed(2)}px`
          );
          stage.style.setProperty(
            "--title-parallax-y",
            `${(springs[4].value * 0.2).toFixed(2)}px`
          );

          rafId = active ? requestAnimationFrame(tick) : 0;
          if (!active) lastTime = 0;
        };

        const setTargets = (tx: number, ty: number, rot: number) => {
          springs[0].target = tx;
          springs[1].target = ty;
          springs[2].target = rot;
          springs[3].target = -(1.8 * tx);
          springs[4].target = -(1.4 * ty);
          if (!rafId) rafId = requestAnimationFrame(tick);
        };

        const onPointerMove = (ev: PointerEvent) => {
          if (ev.pointerType !== "mouse") return;
          const rect = stage.getBoundingClientRect();
          const nx = (ev.clientX - rect.left) / rect.width - 0.5;
          const ny = (ev.clientY - rect.top) / rect.height - 0.5;
          setTargets(14 * nx, 10 * ny, 1.1 * nx);
        };

        const onPointerLeave = () => setTargets(0, 0, 0);

        stage.addEventListener("pointermove", onPointerMove);
        stage.addEventListener("pointerleave", onPointerLeave);

        return () => {
          cancelAnimationFrame(rafId);
          stage.removeEventListener("pointermove", onPointerMove);
          stage.removeEventListener("pointerleave", onPointerLeave);
          stage.style.removeProperty("--title-parallax-x");
          stage.style.removeProperty("--title-parallax-y");
          stage.style.removeProperty("--stage-light-x");
          stage.style.removeProperty("--stage-light-y");
          [
            "--cinema-px",
            "--cinema-py",
            "--cinema-light-x",
            "--cinema-light-y",
          ].forEach((prop) => cinemaStage?.style.removeProperty(prop));
          [
            "--portrait-light-x",
            "--portrait-light-y",
            "--portrait-shadow-x",
            "--portrait-shadow-y",
          ].forEach((prop) => artInner.style.removeProperty(prop));
        };
      });

      return () => mm.revert();
    },
    { scope: scopeRef }
  );

  return <div ref={scopeRef}>{children}</div>;
}
