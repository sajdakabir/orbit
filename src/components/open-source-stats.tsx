"use client";

import { motion } from "framer-motion";

function StarsChart() {
  const lines = Array.from({ length: 12 }, (_, i) => {
    const startY = 140 - i * 4;
    const endY = 20 + i * 6;
    const cp1x = 80 + i * 2;
    const cp1y = startY - 10 - i * 2;
    const cp2x = 200 - i * 3;
    const cp2y = endY + 30 + i * 3;
    return `M 10 ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, 290 ${endY}`;
  });

  return (
    <svg
      viewBox="0 0 300 160"
      fill="none"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {lines.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.06 + i * 0.025}
        />
      ))}
    </svg>
  );
}

function ContributorsGrid() {
  const rows = 14;
  const cols = 18;
  const cells: { row: number; col: number; opacity: number }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = (r * 17 + c * 31 + r * c * 7) % 100;
      let opacity = 0.05;
      if (seed < 15) opacity = 0.3;
      else if (seed < 30) opacity = 0.18;
      else if (seed < 50) opacity = 0.1;
      cells.push({ row: r, col: c, opacity });
    }
  }

  return (
    <svg
      viewBox="0 0 300 160"
      fill="none"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {cells.map(({ row, col, opacity }, i) => (
        <rect
          key={i}
          x={12 + col * 16}
          y={6 + row * 11}
          width={8}
          height={8}
          rx={2}
          fill="currentColor"
          opacity={opacity}
        />
      ))}
    </svg>
  );
}

function MonthlyDevsChart() {
  const barCount = 28;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const seed = (i * 37 + 13) % 100;
    const baseHeight = 30 + (i / barCount) * 60;
    const variation = (seed / 100) * 50 - 15;
    const height = Math.max(15, Math.min(140, baseHeight + variation));
    return { x: 8 + i * 10.5, height };
  });

  return (
    <svg
      viewBox="0 0 300 160"
      fill="none"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {bars.map(({ x, height }, i) => (
        <rect
          key={i}
          x={x}
          y={160 - height}
          width={4}
          height={height}
          fill="currentColor"
          opacity={0.06 + (height / 160) * 0.14}
        />
      ))}
    </svg>
  );
}

export default function OpenSourceStats() {
  const stats = [
    {
      figure: "Fig 1.",
      value: "3x",
      label: "Faster Than Typing",
      chart: <StarsChart />,
    },
    {
      figure: "Fig 2.",
      value: "100+",
      label: "Languages Supported",
      chart: <ContributorsGrid />,
    },
    {
      figure: "Fig 3.",
      value: "50M+",
      label: "Words Dictated",
      chart: <MonthlyDevsChart />,
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-[family-name:var(--font-manrope)] text-xl sm:text-2xl md:text-3xl font-normal tracking-[-0.02em] leading-[1.3] mb-6 text-foreground"
          >
            Your voice, everywhere you type
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-sm sm:text-base text-muted max-w-[680px] mx-auto leading-relaxed"
          >
            <span className="text-foreground font-medium">[*]</span> With{" "}
            <span className="text-foreground font-bold">3x</span> faster input
            than typing, support for{" "}
            <span className="text-foreground font-bold">100+</span> languages,
            and seamless dictation across every app—Orbit is trusted by over{" "}
            <span className="text-foreground font-bold">50K</span> users to
            turn their voice into perfectly formatted text.
          </motion.p>
        </div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8"
        >
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col">
              {/* Chart */}
              <div className="h-[200px] text-foreground mb-6">{stat.chart}</div>

              {/* Caption */}
              <p className="text-xs text-muted font-mono tracking-wide">
                {stat.figure}{" "}
                <span className="text-foreground font-bold text-sm">
                  {stat.value}
                </span>{" "}
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
