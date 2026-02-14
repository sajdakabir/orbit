"use client";

import { motion } from "framer-motion";
import { Home, Calendar, StickyNote, Book, Mic } from "lucide-react";

const features = [
  {
    icon: <Home className="w-[22px] h-[22px] text-accent" />,
    title: "Activity Dashboard",
    desc: "Track your productivity with weekly streaks, speaking speed, and word count. See all your voice interactions with playback.",
  },
  {
    icon: <Calendar className="w-[22px] h-[22px] text-accent" />,
    title: "Daily Journal",
    desc: "Voice-powered journaling with calendar navigation. Rich text editor with auto-save. Track your thoughts across time.",
  },
  {
    icon: <StickyNote className="w-[22px] h-[22px] text-accent" />,
    title: "Voice Notes",
    desc: "Quick voice notes that save instantly. Search, organize in grid or list view. Never lose a thought again.",
  },
  {
    icon: <Book className="w-[22px] h-[22px] text-accent" />,
    title: "Personal Library",
    desc: "Organize your knowledge in one place. Voice-powered content creation. Everything synced and searchable.",
  },
];

const cardV = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

export default function Features() {
  return (
    <section id="features" className="py-28">
      <div className="max-w-[1120px] mx-auto px-6">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="block text-[13px] font-semibold text-accent uppercase tracking-widest mb-4"
        >
          Features
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4"
        >
          Everything you need in one place
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[17px] text-muted max-w-[560px] leading-relaxed mb-16"
        >
          Replace 2-3 apps with one voice-powered workspace. Journal, take notes,
          and dictate anywhere—all with your voice.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={cardV}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className="p-12 bg-bg-card border border-border rounded-2xl hover:bg-bg-card-hover hover:border-accent/20 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-accent-soft rounded-xl flex items-center justify-center mb-6">
                {f.icon}
              </div>
              <h3 className="text-[22px] font-bold tracking-tight mb-3">
                {f.title}
              </h3>
              <p className="text-[15px] text-muted leading-relaxed max-w-[440px]">
                {f.desc}
              </p>
            </motion.div>
          ))}

          {/* Full-width dictation card */}
          <motion.div
            variants={cardV}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={4}
            className="md:col-span-2 p-12 bg-bg-card border border-border rounded-2xl hover:bg-bg-card-hover hover:border-accent/20 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div>
                <div className="w-12 h-12 bg-accent-soft rounded-xl flex items-center justify-center mb-6">
                  <Mic className="w-[22px] h-[22px] text-accent" />
                </div>
                <h3 className="text-[22px] font-bold tracking-tight mb-3">
                  Global Voice Dictation
                </h3>
                <p className="text-[15px] text-muted leading-relaxed max-w-[440px]">
                  Press a hotkey and speak—your words appear instantly in any app.
                  Works everywhere: emails, docs, messages, code editors, and more.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                {["Slack", "Gmail", "VS Code", "Notion", "+Any App"].map((name) => (
                  <span
                    key={name}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 bg-bg-card border border-border rounded-full text-sm font-medium transition-all hover:bg-bg-card-hover hover:border-dim ${
                      name.startsWith("+") ? "text-accent" : "text-muted"
                    }`}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
