import { Twitter, Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Textured background */}
      <div className="max-w-[1280px] mx-auto">
        <div className="relative bg-[#EEF1F0] mx-0 overflow-hidden">
          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.12] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundSize: "200px 200px",
            }}
          />

          {/* Main footer content */}
          <div className="relative px-8 md:px-12 pt-16 pb-8">
            {/* Logo + Tagline */}
            <div className="mb-20">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-foreground rounded-full" />
                <span className="text-lg font-semibold text-foreground tracking-tight">
                  Orbit
                </span>
              </div>
              <p className="text-sm text-muted leading-relaxed max-w-[320px]">
                Your second brain, powered by voice.
                <br />
                Dictate anywhere, format everything.
              </p>
            </div>

            {/* Bottom bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-[#E9EFF2]">
              {/* Copyright */}
              <p className="text-xs text-muted">
                Orbit &middot; {new Date().getFullYear()} All Rights Reserved
              </p>

              {/* Social icons */}
              <div className="flex items-center gap-5">
                <a
                  href="https://x.com/sajdakabir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://github.com/sajdakabir/orbit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
              </div>

              {/* Legal links */}
              <div className="flex items-center gap-1 text-xs text-muted">
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
                <span>&middot;</span>
                <a href="#" className="hover:text-foreground transition-colors">
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
