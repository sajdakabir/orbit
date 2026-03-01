"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DEMO_TEXT = "What are the latest trends in AI for 2025?";
const PHASE_TIMINGS = {
  idle: 1500,
  keyPress: 1200,
  listening: 3000,
  done: 2000,
};

// macOS dock app icons using real images
const dockApps = [
  { name: "Finder", image: "/icon/finder.png", isOpen: false },
  { name: "Safari", image: "/icon/safari2.png", isOpen: false },
  { name: "Terminal", image: "/icon/Terminali.png", isOpen: true },
  { name: "Orbit", image: "/orbit.png", isOpen: true },
  { name: "Superhuman", image: "/icon/superhuman.avif", isOpen: true },
  { name: "Dia", image: "/icon/dia.png", isOpen: true },
];

// Apps after dock divider
const dockAppsRight = [
  { name: "VS Code", image: "/icon/vscode.png", isOpen: true },
  { name: "Bin", image: "/icon/bin.png", isOpen: false },
];

function DockIcon({ app }: { app: { name: string; image: string; isOpen: boolean } }) {
  const isBin = app.name === "Bin";
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative flex flex-col items-center group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground border border-foreground/10 rounded-md shadow-lg z-50 whitespace-nowrap pointer-events-none"
          >
            <span className="text-[11px] text-white font-medium">{app.name}</span>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`w-11 h-11 sm:w-12 sm:h-12 ${isBin ? "" : "rounded-xl"} overflow-hidden ${isBin ? "" : "shadow-md"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={app.image}
          alt={app.name}
          className={`w-full h-full ${isBin ? "object-contain" : "object-cover"}`}
        />
      </div>
      {/* Open indicator dot */}
      {app.isOpen && (
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/50 rounded-full" />
      )}
    </div>
  );
}

export default function HeroDemo() {
  const [phase, setPhase] = useState<
    "idle" | "keyPress" | "listening" | "done"
  >("idle");
  const [typedText, setTypedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);

  const resetDemo = useCallback(() => {
    setPhase("idle");
    setTypedText("");
    setCharIndex(0);
  }, []);

  // Phase transitions
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (phase === "idle") {
      timeout = setTimeout(() => setPhase("keyPress"), PHASE_TIMINGS.idle);
    } else if (phase === "keyPress") {
      timeout = setTimeout(() => setPhase("listening"), PHASE_TIMINGS.keyPress);
    } else if (phase === "done") {
      timeout = setTimeout(resetDemo, PHASE_TIMINGS.done);
    }

    return () => clearTimeout(timeout);
  }, [phase, resetDemo]);

  // Typing effect during listening phase
  useEffect(() => {
    if (phase !== "listening") return;

    if (charIndex < DEMO_TEXT.length) {
      const speed = 40 + Math.random() * 30;
      const timeout = setTimeout(() => {
        setTypedText(DEMO_TEXT.slice(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => setPhase("done"), 600);
      return () => clearTimeout(timeout);
    }
  }, [phase, charIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="relative max-w-[900px] mx-auto rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_8px_60px_rgba(0,0,0,0.3)]"
    >
      <div className="w-full aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-[#0a2028] via-[#112a33] to-[#132f38]">

        {/* macOS Menu bar */}
        <div className="absolute top-0 inset-x-0 h-7 bg-white/10 backdrop-blur-xl flex items-center px-4 z-10 border-b border-white/10">
          <svg className="w-3.5 h-3.5 text-white/80" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <div className="flex items-center gap-4 ml-4">
            <span className="text-[11px] text-white/70 font-medium">Dia</span>
            <span className="text-[11px] text-white/40">File</span>
            <span className="text-[11px] text-white/40">Edit</span>
            <span className="text-[11px] text-white/40">View</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[11px] text-white/50">
              {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Dia window - floating on desktop */}
        <div className="absolute top-10 left-[8%] right-[8%] bottom-24 bg-white/15 backdrop-blur-2xl rounded-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden">
          {/* Dia toolbar */}
          <div className="h-10 bg-white/10 backdrop-blur-sm flex items-center px-3.5 gap-3 border-b border-white/15">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex items-center gap-2 ml-1">
              <svg className="w-3 h-3 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              <svg className="w-3 h-3 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </div>
            <span className="text-[11px] text-white/60 ml-auto mr-auto">Dia</span>
            <span className="text-[10px] text-white/30">Personalization</span>
          </div>

          {/* Dia content - centered layout */}
          <div className="flex flex-col items-center justify-center h-[calc(100%-40px)] px-8">
            {/* Dia logo */}
            <div className="w-10 h-10 rounded-xl overflow-hidden mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon/dia.png" alt="Dia" className="w-full h-full object-cover" />
            </div>

            {/* Search input */}
            <div className="w-full max-w-[420px] bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2.5 min-h-[28px]">
                {phase === "idle" && (
                  <>
                    <svg className="w-4 h-4 text-white/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    <span className="text-[13px] text-white/30">
                      Search the web...
                      <span className="animate-pulse">|</span>
                    </span>
                  </>
                )}
                {phase === "keyPress" && (
                  <>
                    <svg className="w-4 h-4 text-white/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    <span className="text-[13px] text-white/30">
                      Search the web...
                      <span className="animate-pulse">|</span>
                    </span>
                  </>
                )}
                {(phase === "listening" || phase === "done") && typedText && (
                  <>
                    <svg className="w-4 h-4 text-white/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    <span className="text-[13px] text-white/90">
                      {typedText}
                      {phase === "listening" && (
                        <span className="animate-pulse">|</span>
                      )}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/25 flex items-center gap-1">
                    <span className="text-[13px]">+</span> Add tabs or files
                  </span>
                  <span className="text-white/25 text-[11px]">···</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" /></svg>
                  <svg className="w-3.5 h-3.5 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                </div>
              </div>
            </div>

            {/* Action pills */}
            <div className="flex items-center gap-3 mt-5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-[11px] text-white/40">
                <span className="text-[12px]">✦</span> Skills
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-[11px] text-white/40">
                <span className="text-[12px]">🎓</span> Learn Skills
              </span>
            </div>
          </div>
        </div>

        {/* macOS Dock */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-end gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.2)]">
            {dockApps.map((app) => (
              <DockIcon key={app.name} app={app} />
            ))}
            {/* Dock divider */}
            <div className="w-px h-10 bg-white/15 mx-1" />
            {dockAppsRight.map((app) => (
              <DockIcon key={app.name} app={app} />
            ))}
          </div>
        </div>

        {/* Hotkey indicator - fn key */}
        <AnimatePresence>
          {phase === "keyPress" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-22 left-1/2 -translate-x-1/2 z-30"
            >
              <span className="px-4 py-2 bg-foreground text-white rounded-xl text-sm font-bold font-mono shadow-lg shadow-black/10">
                fn
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orbit floating pill */}
        <AnimatePresence>
          {phase === "listening" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute bottom-22 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2.5 px-4 py-2 bg-white/15 backdrop-blur-xl border border-white/20 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
            >
              <span className="relative w-2.5 h-2.5 bg-red-500 rounded-full">
                <span className="absolute -inset-1 border-2 border-red-500 rounded-full animate-ping" />
              </span>
              <span className="text-[13px] text-white/90 font-medium">
                Listening...
              </span>
              {/* Mini waveform */}
              <div className="flex items-center gap-[2px] h-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[2px] rounded-full bg-white/40"
                    style={{
                      animation: `miniWave 0.8s ease-in-out ${i * 0.1}s infinite`,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Done checkmark */}
        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-22 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-xl border border-white/20 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
            >
              <svg
                className="w-4 h-4 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              <span className="text-[13px] text-white/90 font-medium">
                Done
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        @keyframes miniWave {
          0%,
          100% {
            height: 4px;
          }
          50% {
            height: 14px;
          }
        }
      `}</style>
    </motion.div>
  );
}
