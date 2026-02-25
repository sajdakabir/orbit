"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Mail, Github, ArrowRight } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const features = [
  {
    title: "Unified inbox",
    description:
      "All your notifications from Gmail, GitHub, Linear, and more—in one place. No more switching between tabs.",
  },
  {
    title: "Smart filters",
    description:
      "Instantly filter by source. See only what matters right now and batch-process the rest later.",
  },
  {
    title: "Voice-powered triage",
    description:
      "Dictate replies, snooze items, or mark as done—all without touching your keyboard.",
  },
];

const integrations = [
  { name: "Gmail", icon: "/icon/gmail.svg" },
  { name: "Linear", icon: "/icon/linear.svg" },
  { name: "Slack", icon: "/icon/slack.svg" },
  { name: "Notion", icon: "/icon/notion.svg" },
  { name: "Discord", icon: "/icon/discord.svg" },
];

export default function InboxPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-44 pb-20 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] opacity-40 pointer-events-none" />

        <div className="relative max-w-[1120px] mx-auto px-6">
          {/* Back link */}
          <motion.a
            href="/"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </motion.a>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-bg-card border border-border rounded-full text-[13px] font-medium text-muted"
          >
            <Mail className="w-3.5 h-3.5" />
            Inbox
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] leading-[1.05] mb-6 bg-gradient-to-b from-foreground via-foreground to-dim bg-clip-text text-transparent"
          >
            One inbox for
            <br />
            everything
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted max-w-[540px] mx-auto mb-16 leading-relaxed"
          >
            Stop juggling tabs. Orbit pulls notifications from Gmail, GitHub,
            Linear, and more into a single, voice-powered inbox.
          </motion.p>
        </div>
      </section>

      {/* Screenshot */}
      <section className="relative pb-24">
        <div className="max-w-[1120px] mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative bg-bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/screenshots/inbox.png"
              alt="Orbit Inbox — unified notifications from Gmail, GitHub, Linear and more"
              className="w-full h-auto object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 bg-bg-card border border-border rounded-2xl"
              >
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations strip */}
      <section className="py-20">
        <div className="max-w-[1120px] mx-auto px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm text-muted uppercase tracking-widest mb-8"
          >
            Works with your favorite tools
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            {integrations.map((app) => (
              <div
                key={app.name}
                className="flex items-center gap-2.5 px-5 py-3 bg-bg-card border border-border rounded-xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={app.icon}
                  alt={app.name}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm font-medium">{app.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 text-center relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_70%)] opacity-30 pointer-events-none" />

        <div className="relative max-w-[1120px] mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-6"
          >
            Try the unified inbox
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[17px] text-muted max-w-[480px] mx-auto leading-relaxed mb-10"
          >
            Download Orbit and bring all your notifications into one
            voice-powered workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <a
              href=""
              download
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-foreground text-bg text-[15px] font-semibold rounded-full hover:opacity-90 hover:-translate-y-px hover:shadow-[0_8px_30px_rgba(255,255,255,0.08)] transition-all"
            >
              Download for Mac
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 text-muted text-[15px] font-medium border border-border rounded-full hover:text-foreground hover:border-dim transition-all"
            >
              Back to home
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}
