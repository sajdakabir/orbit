"use client";

import { motion } from "framer-motion";

/* ── Syntax-color helpers ────────────────────────────────── */
function Kw({ children }: { children: React.ReactNode }) {
  return <span className="text-[#c586c0]">{children}</span>;
}
function Str({ children }: { children: React.ReactNode }) {
  return <span className="text-[#ce9178]">{children}</span>;
}
function Type({ children }: { children: React.ReactNode }) {
  return <span className="text-[#4ec9b0]">{children}</span>;
}
function Def({ children }: { children: React.ReactNode }) {
  return <span className="text-[#569cd6]">{children}</span>;
}
function Fn({ children }: { children: React.ReactNode }) {
  return <span className="text-[#dcdcaa]">{children}</span>;
}
function Attr({ children }: { children: React.ReactNode }) {
  return <span className="text-[#9cdcfe]">{children}</span>;
}
function Tag({ children }: { children: React.ReactNode }) {
  return <span className="text-[#569cd6]">{children}</span>;
}

/* ── Code-editor mockup ──────────────────────────────────── */
function EditorCode() {
  const lines: (React.ReactNode | null)[] = [
    <><Kw>import</Kw>{" { Body, Button, Column, Container, Head, Heading, Hr, Html, Img, Link, Preview, Row,"}</>,
    <><Kw>import</Kw>{" * "}<Kw>as</Kw> <Type>React</Type> <Kw>from</Kw> <Str>&apos;react&apos;</Str>{";"}</>,
    null,
    <><Def>const</Def> <Fn>WelcomeEmail</Fn>{" = ({"}</>,
    <>{"  username = "}<Str>&apos;Steve&apos;</Str>{","}</>,
    <>{"  company = "}<Str>&apos;ACME&apos;</Str>{","}</>,
    <>{"}: "}<Type>WelcomeEmailProps</Type>{") => {"}</>,
    <>{"  "}<Def>const</Def>{" previewText = "}<Str>{"`Welcome to ${company}, ${username}!`"}</Str>{";"}</>,
    null,
    <>{"  "}<Kw>return</Kw>{" ("}</>,
    <>{"    "}<Tag>{"<Html>"}</Tag></>,
    <>{"      "}<Tag>{"<Head />"}</Tag></>,
    <>{"      "}<Tag>{"<Preview>"}</Tag>{"{previewText}"}<Tag>{"</Preview>"}</Tag></>,
    <>{"      "}<Tag>{"<Tailwind>"}</Tag></>,
    <>{"        "}<Tag>{"<Body"}</Tag> <Attr>className</Attr>{"="}<Str>&quot;bg-white my-auto mx-auto font-sans&quot;</Str><Tag>{">"}</Tag></>,
    <>{"          "}<Tag>{"<Container"}</Tag> <Attr>className</Attr>{"="}<Str>&quot;my-10 mx-auto p-5 w-[465px]&quot;</Str><Tag>{">"}</Tag></>,
    <>{"            "}<Tag>{"<Section"}</Tag> <Attr>className</Attr>{"="}<Str>&quot;mt-8&quot;</Str><Tag>{">"}</Tag></>,
    <>{"              "}<Tag>{"<Img"}</Tag></>,
    <>{"                "}<Attr>src</Attr>{"={"}<Str>{"`${baseUrl}/static/example-logo.png`"}</Str>{"}"}</>,
    <>{"                "}<Attr>width</Attr>{"="}<Str>&quot;80&quot;</Str></>,
    <>{"                "}<Attr>height</Attr>{"="}<Str>&quot;80&quot;</Str></>,
    <>{"                "}<Attr>alt</Attr>{"="}<Str>&quot;Logo Example&quot;</Str></>,
    <>{"                "}<Attr>className</Attr>{"="}<Str>&quot;my-0 mx-auto&quot;</Str></>,
    <>{"              "}<Tag>{"/>"}</Tag></>,
    <>{"            "}<Tag>{"</Section>"}</Tag></>,
    null,
    <>{"            "}<Tag>{"<Heading"}</Tag> <Attr>className</Attr>{"="}<Str>&quot;text-2xl font-normal text-center p-0 my-8 mx-0&quot;</Str><Tag>{">"}</Tag></>,
    <>{"              Welcome to "}<Tag>{"<strong>"}</Tag>{"{company}"}<Tag>{"</strong>"}</Tag>{", {username}!"}</>,
    <>{"            "}<Tag>{"</Heading>"}</Tag></>,
    null,
    <>{"            "}<Tag>{"<Text"}</Tag> <Attr>className</Attr>{"="}<Str>&quot;text-sm&quot;</Str><Tag>{">"}</Tag></>,
    <>{"              Hello {username},"}</>,
    <>{"            "}<Tag>{"</Text>"}</Tag></>,
    null,
    <>{"            "}<Tag>{"<Text"}</Tag> <Attr>className</Attr>{"="}<Str>&quot;text-sm&quot;</Str><Tag>{">"}</Tag></>,
    <>{"              We&apos;re excited to have you onboard at "}<Tag>{"<strong>"}</Tag>{"{company}"}<Tag>{"</strong>"}</Tag>{". We hope you en..."}</>,
  ];

  return (
    <div className="p-4 pt-5 font-mono text-[11px] leading-[1.7] overflow-hidden relative">
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#111111] to-transparent z-10 pointer-events-none" />

      {lines.map((line, i) => (
        <div key={i} className="flex whitespace-nowrap">
          <span className="w-8 text-right pr-3 text-white/15 select-none shrink-0 tabular-nums text-[10px]">
            {i + 1}
          </span>
          <span className="text-white/50">{line ?? ""}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Main section ────────────────────────────────────────── */
export default function SpacesShowcase() {
  return (
    <section id="spaces" className="relative py-20 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* ── Preview Cards ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-4"
        >
          {/* Left Card — Code Editor + Voice Overlay */}
          <div className="lg:col-span-3 relative bg-[#111111] rounded-2xl overflow-hidden min-h-[380px]">
            <EditorCode />

            {/* Floating voice-prompt overlay */}
            <div className="absolute top-5 right-5 w-[230px] bg-white rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.25)] overflow-hidden">
              <div className="p-3.5 pb-2.5">
                <p className="text-[12px] text-[#0d262e] leading-[1.5]">
                  Can you modify the ToDoListController to use Zustand instead of
                  React
                </p>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#0d262e] to-[#1a4a5a] flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">O</span>
                  </div>
                  <span className="text-xs font-medium text-[#0d262e]/70">
                    Orbit
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-[#0d262e]">
                  Send{" "}
                  <span className="text-[10px] ml-0.5 opacity-50">↵</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card — Voice Agent Interface */}
          <div className="lg:col-span-2 relative bg-[#111111] rounded-2xl overflow-hidden min-h-[380px] flex flex-col justify-center px-6">
            {/* Welcome box */}
            <div className="border border-white/10 rounded-lg p-4 mb-3">
              <p className="text-white/80 font-mono text-[13px] leading-relaxed">
                <span className="text-white/40 mr-1">✦</span> Welcome to{" "}
                <span className="text-white font-medium">Orbit</span>{" "}
                <span className="text-white/40">voice assistant</span>
              </p>
            </div>

            {/* Prompt box */}
            <div className="border border-white/10 rounded-lg px-4 py-3">
              <p className="text-white/25 font-mono text-[13px]">
                {">"} Start speaking...
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Feature Descriptions ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-10"
        >
          {/* Left — Accuracy */}
          <div>
            <h3 className="font-[family-name:var(--font-manrope)] text-[20px] font-normal text-foreground mb-3 tracking-[-0.01em]">
              Dictating with technical accuracy
            </h3>
            <p className="text-sm text-muted leading-relaxed mb-6">
              We benchmarked models on how accurately they capture developer
              language. Orbit consistently nails terms like useState, kubectl,
              and PyTorch.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-dim">Designed for</span>
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon/slack.svg" alt="Slack" className="w-6 h-6 rounded" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon/notion.svg" alt="Notion" className="w-6 h-6 rounded" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon/figma.svg" alt="Figma" className="w-6 h-6 rounded" />
              </div>
            </div>
          </div>

          {/* Right — Formatting */}
          <div>
            <h3 className="font-[family-name:var(--font-manrope)] text-[20px] font-normal text-foreground mb-3 tracking-[-0.01em]">
              Contextual formatting
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Orbit formats your speech the way developers expect — with proper
              punctuation, markdown awareness, and context-sensitive styling
              across languages and frameworks.
            </p>
          </div>
        </motion.div>

        {/* ── Hold-key CTA ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex items-center justify-center gap-2.5 mt-12 text-sm text-muted"
        >
          Hold
          <kbd className="inline-flex items-center justify-center px-3.5 py-1.5 bg-foreground text-bg text-xs font-medium rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
            Space
          </kbd>
          and try yourself
        </motion.div>
      </div>
    </section>
  );
}
