"use client";

import { motion } from "framer-motion";

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
            <span
              key={app.name}
              title={app.name}
              className="inline-flex items-center justify-center w-12 h-12 bg-bg-card border border-border rounded-full hover:bg-bg-card-hover hover:border-dim hover:scale-110 transition-all cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={app.icon}
                alt={app.name}
                className="w-6 h-6 object-contain"
              />
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
