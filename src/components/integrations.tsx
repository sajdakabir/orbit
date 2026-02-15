"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const apps = [
  { name: "Slack", icon: "/icon/slack.svg" },
  // { name: "Gmail", icon: "/icon/gmail.svg" },
  { name: "Notion", icon: "/icon/notion.svg" },
  { name: "Telegram", icon: "/icon/telegram.svg" },
  { name: "VS Code", icon: "/icon/vscode.png" },
  { name: "Google Docs", icon: "/icon/gdocs.svg" },
  { name: "SuperHuman", icon: "/icon/superhuman.avif" },
  { name: "Discord", icon: "/icon/discord.svg" },
  { name: "ChatGPT", icon: "/icon/chatgpt.svg" },
  { name: "Dia", icon: "/icon/dia.png" },
  {name:"Orbit", icon:"/orbit copy.png"},
  {name:"Terminal", icon:"/icon/terminali.png"},
];

function AppIcon({ app }: { app: { name: string; icon: string } }) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      className="relative inline-flex items-center justify-center w-12 h-12 bg-bg-card border border-border rounded-full hover:bg-bg-card-hover hover:border-dim hover:scale-110 transition-all cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#2a2a2c] border border-white/10 rounded-md shadow-lg z-50 whitespace-nowrap pointer-events-none"
          >
            <span className="text-[11px] text-white font-medium">{app.name}</span>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#2a2a2c]" />
          </motion.div>
        )}
      </AnimatePresence>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={app.icon}
        alt={app.name}
        className="w-6 h-6 object-contain"
      />
    </span>
  );
}

export default function Integrations() {
  return (
    <section id="integrations" className="py-28">
      <div className="max-w-[1120px] mx-auto px-6 text-center">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="block text-[13px] font-semibold text-accent uppercase tracking-widest mb-4"
        >
          Integrations
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4 mx-auto"
        >
          Works everywhere you type
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[17px] text-muted max-w-[560px] mx-auto leading-relaxed mb-16"
        >
          Orbit isn&apos;t limited to one app. Anywhere there&apos;s a cursor,
          Orbit delivers your words.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex justify-center flex-wrap gap-4 max-w-[720px] mx-auto"
        >
          {apps.map((app) => (
            <AppIcon key={app.name} app={app} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
