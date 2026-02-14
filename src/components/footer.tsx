import { Twitter, Github, Youtube } from "lucide-react";

export default function Footer() {
  const navigationLinks = [
    { label: "Blog", href: "#" },
    { label: "Documentation", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
  ];

  const socialLinks = [
    { icon: Twitter, href: "https://x.com/orbitvoiceapp", label: "Twitter" },
    { icon: Github, href: "https://github.com", label: "GitHub" },
    { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
  ];

  return (
    <footer className="relative overflow-hidden py-40">
      {/* Large background text - centered behind content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <h2
          className="text-[220px] md:text-[320px] lg:text-[420px] tracking-tighter leading-none whitespace-nowrap"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 700,
            fontStyle: "italic",
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(255,255,255,0.04)",
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0.01))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          Orbit
        </h2>
      </div>

      {/* Content - positioned in bottom half */}
      <div className="relative max-w-[1120px] mx-auto px-6 flex flex-col items-center gap-10 mt-32">
        {/* Navigation links */}
        <nav>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {navigationLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Social icons */}
        <div className="flex items-center gap-6">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-foreground transition-colors"
              aria-label={social.label}
            >
              <social.icon className="w-5 h-5" />
            </a>
          ))}
        </div>

        {/* Copyright */}
        <p className="text-sm text-dim text-center">
          &copy; {new Date().getFullYear()} Orbit. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
