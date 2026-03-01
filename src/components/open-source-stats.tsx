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
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d262e" />
          <stop offset="100%" stopColor="#ede6f3" />
        </linearGradient>
      </defs>
      {lines.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="url(#lineGrad)"
          strokeWidth={1}
          opacity={0.08 + i * 0.03}
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
      <defs>
        <linearGradient id="gridGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d262e" />
          <stop offset="60%" stopColor="#8b7fa8" />
          <stop offset="100%" stopColor="#ede6f3" />
        </linearGradient>
      </defs>
      {cells.map(({ row, col, opacity }, i) => (
        <rect
          key={i}
          x={12 + col * 16}
          y={6 + row * 11}
          width={8}
          height={8}
          rx={2}
          fill="url(#gridGrad)"
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
      <defs>
        <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ede6f3" />
          <stop offset="100%" stopColor="#0d262e" />
        </linearGradient>
      </defs>
      {bars.map(({ x, height }, i) => (
        <rect
          key={i}
          x={x}
          y={160 - height}
          width={4}
          height={height}
          fill="url(#barGrad)"
          opacity={0.08 + (height / 160) * 0.18}
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
      {/* Subtle radial glow behind section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,#ede6f3_0%,transparent_70%)] opacity-[0.15] pointer-events-none" />

      <div className="relative px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-[family-name:var(--font-manrope)] text-xl sm:text-2xl md:text-3xl font-normal tracking-[-0.02em] leading-[1.3] mb-6 bg-gradient-to-r from-foreground via-foreground to-[#64748b] bg-clip-text text-transparent"
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
            <span className="font-bold bg-gradient-to-r from-foreground to-[#4a6670] bg-clip-text text-transparent">3x</span> faster input
            than typing, support for{" "}
            <span className="font-bold bg-gradient-to-r from-foreground to-[#4a6670] bg-clip-text text-transparent">100+</span> languages,
            and seamless dictation across every app—Orbit is trusted by over{" "}
            <span className="font-bold bg-gradient-to-r from-foreground to-[#4a6670] bg-clip-text text-transparent">50K</span> users to
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
                <span className="font-bold text-sm bg-gradient-to-r from-foreground to-[#4a6670] bg-clip-text text-transparent">
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
