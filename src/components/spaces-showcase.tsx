"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function SpacesShowcase() {
  const [activeTab, setActiveTab] = useState(0);

  const templates = [
    { name: "Today", image: "/screenshots/today.png" },
    { name: "Inbox", image: "/screenshots/inbox.png" },
    { name: "Notes", image: "/screenshots/notes.png" },
    { name: "Dictionary", image: "/screenshots/dictionary.png" },
    { name: "Home", image: "/screenshots/home.png" },
    { name: "Make your recipe", image: "/screenshots/library.png" },
  ];

  return (
    <section id="spaces" className="relative py-24 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4"
          >
            Everything you need in one place
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted max-w-[680px] mx-auto"
          >
            Replace 2-3 apps with one voice-powered workspace. Journal, take notes and dictate anywhere—all with your voice.
          </motion.p>
        </div>

        {/* Template Chips */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-12"
        >
          {templates.map((template, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-6 py-2.5 border rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === index
                  ? "bg-foreground text-bg border-foreground"
                  : "bg-bg-card text-foreground border-border hover:bg-muted/5"
              }`}
            >
              {template.name}
            </button>
          ))}
        </motion.div>

        {/* Product Interface Mockup */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={templates[activeTab].image}
            alt={templates[activeTab].name}
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
}
