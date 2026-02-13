import OrbitIcon from "./orbit-icon";

export default function Footer() {
  return (
    <footer className="py-12 border-t border-border-subtle">
      <div className="max-w-[1120px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5 text-sm text-dim">
          <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
            <OrbitIcon width={16} height={14} />
          </div>
          &copy; {new Date().getFullYear()} Orbit. All rights reserved.
        </div>
        <ul className="flex flex-wrap justify-center gap-8">
          {[
            { label: "Privacy Policy", href: "#" },
            { label: "Terms of Service", href: "#" },
            { label: "Twitter", href: "https://x.com" },
            { label: "Contact", href: "mailto:hello@orbitvoice.app" },
          ].map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  link.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="text-[13px] text-dim hover:text-muted transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
