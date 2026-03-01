"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import OrbitIcon from "./orbit-icon";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4">
      <div
        className={`flex items-center justify-between w-full max-w-[720px] px-6 h-12 rounded-full border transition-all duration-500 ${
          scrolled
            ? "bg-white/40 backdrop-blur-2xl border-white/50 shadow-[0_1px_12px_rgba(0,0,0,0.04)]"
            : "bg-transparent border-border-subtle"
        }`}
      >
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2 font-bold text-[15px] tracking-tight text-foreground"
        >
          <OrbitIcon width={20} height={18} />
          Orbit
        </a>

        {/* Links */}
        <ul className="hidden md:flex items-center gap-6">
          {[
            { label: "Spaces", href: "#spaces" },
            { label: "Inbox", href: "/inbox" },
            { label: "Integrations", href: "#integrations" },
          ].map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href=""
          download
          className="hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 bg-accent-soft border border-accent/10 text-foreground text-sm font-bold rounded-full hover:bg-accent-glow transition-all"
        >
          Download
          <Download className="w-3.5 h-3.5" strokeWidth={2.5} />
        </a>
      </div>
    </nav>
  );
}
