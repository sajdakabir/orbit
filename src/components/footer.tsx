import { Twitter, Github, Linkedin } from "lucide-react";
import OrbitIcon from "./orbit-icon";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto">
        <div className="relative bg-[#112a33] mx-0 overflow-hidden">
          {/* Subtle orbital rings background */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              viewBox="0 0 800 300"
              fill="none"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid slice"
            >
              {Array.from({ length: 8 }, (_, i) => {
                const rx = 120 + i * 40;
                const ry = 60 + i * 25;
                const rotation = -15 + i * 4;
                const opacity = 0.02 + i * 0.008;
                return (
                  <ellipse
                    key={i}
                    cx={400}
                    cy={200}
                    rx={rx}
                    ry={ry}
                    transform={`rotate(${rotation} 400 200)`}
                    stroke="white"
                    strokeWidth={0.6}
                    opacity={opacity}
                  />
                );
              })}
            </svg>
          </div>

          {/* Main footer content */}
          <div className="relative px-8 md:px-12 pt-16 pb-8">
            {/* Logo + Tagline */}
            <div className="mb-20">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="text-white/50">
                  <OrbitIcon width={18} height={16} />
                </div>
                <span className="text-lg font-semibold text-white/70 tracking-tight">
                  Orbit
                </span>
              </div>
              <p className="text-sm text-white/25 leading-relaxed max-w-[320px]">
                Your second brain, powered by voice.
                <br />
                Dictate anywhere, format everything.
              </p>
            </div>

            {/* Bottom bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-white/[0.06]">
              {/* Copyright */}
              <p className="text-xs text-white/20">
                Orbit &middot; {new Date().getFullYear()} All Rights Reserved
              </p>

              {/* Social icons */}
              <div className="flex items-center gap-5">
                <a
                  href="https://x.com/sajdakabir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/20 hover:text-white/50 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/20 hover:text-white/50 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://github.com/sajdakabir/orbit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/20 hover:text-white/50 transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
              </div>

              {/* Legal links */}
              <div className="flex items-center gap-1 text-xs text-white/20">
                <a href="#" className="hover:text-white/50 transition-colors">
                  Terms of Service
                </a>
                <span>&middot;</span>
                <a href="#" className="hover:text-white/50 transition-colors">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
