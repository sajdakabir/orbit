"use client";

import { motion } from "framer-motion";

const apps = [
  { name: "Notion", icon: "/icon/notion.svg" },
  { name: "ChatGPT", icon: "/icon/chatgpt.svg" },
  { name: "Slack", icon: "/icon/slack.svg" },
  { name: "Gmail", icon: "/icon/gmail.svg" },
  { name: "Spotify", icon: "/icon/spotify.svg" },
  { name: "Google Docs", icon: "/icon/gdocs.svg" },
  { name: "SuperHuman", icon: "/icon/superhuman.avif" },
  { name: "Figma", icon: "/icon/figma.svg" },
  { name: "Discord", icon: "/icon/discord.svg" },
];

function DotMatrixText({ text }: { text: string }) {
  return (
    <span className="text-dim font-mono font-medium tracking-wide">
      {text}
    </span>
  );
}

export default function Integrations() {
  return (
    <section id="integrations" className="relative">
      <div className="px-6 md:px-12">
        {/* Main content area */}
        <div className="py-24 md:py-32">
          <div className="md:ml-[35%]">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 mb-8"
            >
              <span className="w-1.5 h-1.5 bg-foreground rounded-full" />
              <span className="text-sm text-muted font-medium">
                Built for everyone who types
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="font-[family-name:var(--font-manrope)] text-[22px] sm:text-[28px] md:text-[34px] font-normal tracking-[-0.02em] leading-[1.3] mb-12 text-foreground max-w-[580px]"
            >
              Dictate anywhere —{" "}
              where{" "}
              <DotMatrixText text="your voice and AI" />{" "}
              work together, with full context to format and adapt automatically
            </motion.h2>

            {/* Two columns */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-[640px]"
            >
              <div>
                <h3 className="text-base font-semibold text-foreground mb-3">
                  For your work
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  A seamless dictation experience across every app. Compose
                  emails, write docs, and send messages — all without touching
                  your keyboard.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-3">
                  For your life
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Journal your thoughts, capture ideas on the go, and dictate
                  anywhere — your words are formatted and adapted to every
                  context.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom integration bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="border-t border-border py-6 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <p className="text-sm text-foreground font-medium max-w-[400px] md:text-left text-center">
            All your favorite apps, unified with{" "}
            <span className="font-mono text-muted">voice dictation</span>,
            powering effortless input
          </p>
          <div className="flex items-center gap-5">
            {apps.map((app) => (
              <span
                key={app.name}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:scale-110 transition-transform"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={app.icon}
                  alt={app.name}
                  className="w-6 h-6 object-contain"
                />
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
