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
    <footer className="relative py-24 overflow-hidden">
      {/* Large background text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
        <h2 className="text-[200px] md:text-[280px] font-black text-muted/[0.03] tracking-tighter leading-none whitespace-nowrap">
          Orbit
        </h2>
      </div>

      {/* Content */}
      <div className="relative max-w-[1120px] mx-auto px-6 flex flex-col items-center gap-12">
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
