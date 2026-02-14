"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DEMO_TEXT = "Hey, can you send me the deck by tomorrow? Thanks!";
const PHASE_TIMINGS = {
  idle: 1500,
  keyPress: 1200,
  listening: 3000,
  done: 2000,
};

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
      className="relative max-w-[900px] mx-auto rounded-2xl overflow-hidden border border-border bg-bg-raised"
    >
      <div className="w-full aspect-[16/10] bg-gradient-to-br from-bg-card to-bg-raised relative overflow-hidden">
        {/* Title bar */}
        <div className="absolute top-0 inset-x-0 h-11 bg-black/30 backdrop-blur-xl flex items-center px-4 gap-2 z-10">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="text-[11px] text-dim ml-auto mr-auto">
            Slack — #general
          </span>
        </div>

        {/* App content area */}
        <div className="pt-14 px-8 pb-8 h-full flex flex-col">
          {/* Existing messages */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-bg-card-hover shrink-0" />
              <div>
                <span className="text-[13px] font-semibold text-foreground">
                  Sarah
                </span>
                <span className="text-[11px] text-dim ml-2">10:32 AM</span>
                <p className="text-sm text-muted mt-0.5">
                  Can someone review the Q4 report before Friday?
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-bg-card-hover shrink-0" />
              <div>
                <span className="text-[13px] font-semibold text-foreground">
                  Mike
                </span>
                <span className="text-[11px] text-dim ml-2">10:45 AM</span>
                <p className="text-sm text-muted mt-0.5">
                  I&apos;ll take a look this afternoon
                </p>
              </div>
            </div>
          </div>

          {/* Message input area */}
          <div className="mt-auto">
            <div className="bg-bg border border-border rounded-xl px-4 py-3 min-h-[48px] flex items-center">
              {phase === "idle" && (
                <span className="text-sm text-dim">
                  Message #general
                  <span className="animate-pulse">|</span>
                </span>
              )}
              {(phase === "listening" || phase === "done") && typedText && (
                <span className="text-sm text-foreground">
                  {typedText}
                  {phase === "listening" && (
                    <span className="animate-pulse">|</span>
                  )}
                </span>
              )}
              {phase === "keyPress" && (
                <span className="text-sm text-dim">
                  Message #general
                  <span className="animate-pulse">|</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hotkey indicator */}
        <AnimatePresence>
          {phase === "keyPress" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2"
            >
              <span className="px-3 py-1.5 bg-foreground text-bg rounded-lg text-xs font-bold font-mono shadow-lg">
                ⌥
              </span>
              <span className="text-[13px] text-dim">+</span>
              <span className="px-3 py-1.5 bg-foreground text-bg rounded-lg text-xs font-bold font-mono shadow-lg">
                Space
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
              className="absolute bottom-24 left-1/2 -translate-x-1/2 inline-flex items-center gap-2.5 px-4 py-2 bg-bg border border-border rounded-full shadow-2xl"
            >
              <span className="relative w-2.5 h-2.5 bg-red-500 rounded-full">
                <span className="absolute -inset-1 border-2 border-red-500 rounded-full animate-ping" />
              </span>
              <span className="text-[13px] text-foreground font-medium">
                Listening...
              </span>
              {/* Mini waveform */}
              <div className="flex items-center gap-[2px] h-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[2px] rounded-full bg-foreground/60"
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
              className="absolute bottom-24 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 py-2 bg-bg border border-border rounded-full shadow-2xl"
            >
              <svg
                className="w-4 h-4 text-emerald-400"
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
              <span className="text-[13px] text-foreground font-medium">
                Done
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom glow bar */}
      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2/5 h-1 bg-gradient-to-r from-transparent via-foreground/30 to-transparent rounded-full blur-sm" />

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
