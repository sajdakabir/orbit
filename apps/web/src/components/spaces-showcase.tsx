"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

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
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  /* First row — fade out with slight scale */
  const firstOpacity = useTransform(scrollYProgress, [0, 0.25, 0.48], [1, 1, 0]);
  const firstScale = useTransform(scrollYProgress, [0, 0.25, 0.48], [1, 1, 0.97]);
  const firstDescOpacity = useTransform(scrollYProgress, [0, 0.25, 0.48], [1, 1, 0]);

  /* Second row — slide in first, then fade in once in position */
  const secondOpacity = useTransform(scrollYProgress, [0.55, 0.68], [0, 1]);
  const leftX = useTransform(scrollYProgress, [0.45, 0.68], [-60, 0]);
  const rightX = useTransform(scrollYProgress, [0.45, 0.68], [60, 0]);
  const secondDescOpacity = useTransform(scrollYProgress, [0.58, 0.7], [0, 1]);

  return (
    <section
      ref={sectionRef}
      id="spaces"
      className="relative"
      style={{ minHeight: "180vh" }}
    >
      <div className="sticky top-0 pt-24 pb-16 overflow-x-clip">
        <div className="max-w-[1280px] mx-auto px-6">
          {/* ── Cards Container ─────────────────────────── */}
          <div className="relative">
            {/* First Row — Code Editor + Voice Agent (drives height) */}
            <motion.div style={{ opacity: firstOpacity, scale: firstScale }}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Left Card — Code Editor */}
                <div className="lg:col-span-3 relative bg-[#111111] rounded-2xl overflow-hidden min-h-[380px]">
                  <EditorCode />
                  {/* Floating overlay */}
                  <div className="absolute top-5 right-5 w-[230px] bg-white rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.25)] overflow-hidden">
                    <div className="p-3.5 pb-2.5">
                      <p className="text-[12px] text-[#0d262e] leading-[1.5]">
                        Can you modify the ToDoListController to use Zustand
                        instead of React
                      </p>
                    </div>
                    <div className="flex items-center justify-between px-3.5 py-2 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#0d262e] to-[#1a4a5a] flex items-center justify-center">
                          <span className="text-[7px] font-bold text-white">
                            O
                          </span>
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

                {/* Right Card — Voice Agent */}
                <div className="lg:col-span-2 relative bg-[#111111] rounded-2xl overflow-hidden min-h-[380px] flex flex-col justify-center px-6">
                  <div className="border border-white/10 rounded-lg p-4 mb-3">
                    <p className="text-white/80 font-mono text-[13px] leading-relaxed">
                      <span className="text-white/40 mr-1">✦</span> Welcome to{" "}
                      <span className="text-white font-medium">Orbit</span>{" "}
                      <span className="text-white/40">voice assistant</span>
                    </p>
                  </div>
                  <div className="border border-white/10 rounded-lg px-4 py-3">
                    <p className="text-white/25 font-mono text-[13px]">
                      {">"} Start speaking...
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Second Row — Agent Chat + UI Preview (overlay) */}
            <motion.div
              className="absolute inset-0"
              style={{ opacity: secondOpacity }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                {/* Left Card — Agent Chat (slides from left) */}
                <motion.div
                  style={{ x: leftX }}
                  className="relative bg-[#111111] rounded-2xl overflow-hidden flex flex-col"
                >
                  <div className="p-5 flex-1 text-[13px] leading-[1.7] text-white/60 space-y-3 overflow-hidden relative">
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#111111] to-transparent z-10 pointer-events-none" />

                    <p>
                      Let me design a beautiful, modern fitness application
                      inspired by clean, health-focused design principles.
                      I&apos;ll create an intuitive, user-centered interface
                      that motivates users and makes tracking workouts and
                      progress effortless.
                    </p>

                    <p className="text-white/40">Design inspiration:</p>
                    <ul className="space-y-1 text-white/45 pl-1">
                      <li>• Bold, energetic typography to inspire action</li>
                      <li>• Dynamic animations for workout transitions</li>
                      <li>• Card-based layouts for workouts</li>
                      <li>• Vibrant gradients and glass-morphism effects</li>
                      <li>• Bold, energetic typography to inspire action</li>
                    </ul>

                    <p className="text-white/40">
                      Features for the first version:
                    </p>
                    <p className="text-white/45">
                      Dashboard with daily activity summary and quick actions
                    </p>

                    <div className="bg-white/5 rounded-lg p-3 text-white/50 text-[12px] leading-[1.6]">
                      I want the hero section to have a big headline in bold,
                      then a subheadline that&apos;s a little lighter, and maybe
                      a button that says &apos;Get Started.&apos;
                    </div>
                  </div>

                  <div className="mx-4 mb-4 border border-white/12 rounded-xl overflow-hidden">
                    <div className="px-4 pt-3 pb-6">
                      <p className="text-white/25 text-sm">Ask our agent...</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 pb-3 text-white/40 text-xs">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                      Attach
                    </div>
                  </div>
                </motion.div>

                {/* Right Card — UI Preview (slides from right) */}
                <motion.div
                  style={{ x: rightX }}
                  className="relative bg-[#111111] rounded-2xl overflow-hidden p-5 flex flex-col gap-4"
                >
                  <div className="flex gap-3">
                    <div className="flex-1 h-[100px] bg-white/[0.04] rounded-xl border border-white/[0.06]" />
                    <div className="flex-1 h-[100px] bg-white/[0.04] rounded-xl border border-white/[0.06]" />
                    <div className="flex-1 h-[100px] bg-white/[0.04] rounded-xl border border-white/[0.06]" />
                  </div>
                  <div className="flex gap-2.5">
                    <div className="h-8 w-28 bg-white/[0.06] rounded-lg border border-white/[0.06]" />
                    <div className="h-8 w-28 bg-white/[0.06] rounded-lg border border-white/[0.06]" />
                    <div className="h-8 w-28 bg-white/[0.06] rounded-lg border border-white/[0.06]" />
                  </div>
                  <div className="flex-1 min-h-[140px] bg-white/[0.04] rounded-xl border border-white/[0.06]" />
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* ── Descriptions Container ──────────────────── */}
          <div className="relative mt-10" style={{ minHeight: "180px" }}>
            {/* First descriptions */}
            <motion.div
              className="absolute inset-x-0 top-0"
              style={{ opacity: firstDescOpacity }}
            >
              <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
                <div className="max-w-[600px]">
                  <h3 className="font-[family-name:var(--font-manrope)] text-[22px] font-medium text-foreground mb-3 tracking-[-0.01em]">
                    Dictating with technical accuracy
                  </h3>
                  <p className="text-[15px] text-muted leading-relaxed mb-6">
                    We benchmarked models on how accurately they capture
                    developer language. Orbit consistently nails terms like
                    useState, kubectl, and PyTorch.
                  </p>
                  <div className="flex items-center gap-2.5 text-sm text-muted">
                    Hold
                    <kbd className="inline-flex items-center justify-center px-3.5 py-1.5 bg-foreground text-bg text-xs font-medium rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                      fn
                    </kbd>
                    and try yourself
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 lg:pt-1">
                  <span className="text-sm text-dim whitespace-nowrap">Designed for</span>
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon/slack.svg" alt="Slack" className="w-8 h-8 rounded-lg" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon/notion.svg" alt="Notion" className="w-8 h-8 rounded-lg" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon/figma.svg" alt="Figma" className="w-8 h-8 rounded-lg" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Second descriptions */}
            <motion.div
              className="absolute inset-x-0 top-0"
              style={{ opacity: secondDescOpacity }}
            >
              <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
                <div className="max-w-[600px]">
                  <h3 className="font-[family-name:var(--font-manrope)] text-[22px] font-medium text-foreground mb-3 tracking-[-0.01em]">
                    Prompt at the speed of thought
                  </h3>
                  <p className="text-[15px] text-muted leading-relaxed mb-6">
                    Orbit turns natural, rambling speech into precise prompts —
                    letting you build faster without stopping to edit your
                    thoughts.
                  </p>
                  <div className="flex items-center gap-2.5 text-sm text-muted">
                    Hold
                    <kbd className="inline-flex items-center justify-center px-3.5 py-1.5 bg-foreground text-bg text-xs font-medium rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                      fn
                    </kbd>
                    and try yourself
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 lg:pt-1">
                  <span className="text-sm text-dim whitespace-nowrap">Designed for</span>
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon/chatgpt.svg" alt="ChatGPT" className="w-8 h-8 rounded-lg" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon/superhuman.avif" alt="Superhuman" className="w-8 h-8 rounded-lg" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon/discord.svg" alt="Discord" className="w-8 h-8 rounded-lg" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
