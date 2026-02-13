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
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bg/80 backdrop-blur-xl border-b border-border-subtle"
          : ""
      }`}
    >
      <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 font-bold text-lg tracking-tight"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <OrbitIcon width={20} height={18} />
          </div>
          Orbit
        </a>

        {/* Links */}
        <ul className="hidden md:flex items-center gap-8">
          {["Features", "How it works", "Integrations", "FAQ"].map((item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href="#download"
          className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-bg text-sm font-semibold rounded-full hover:opacity-90 hover:-translate-y-px transition-all"
        >
          Download
          <Download className="w-3.5 h-3.5" />
        </a>
      </div>
    </nav>
  );
}
