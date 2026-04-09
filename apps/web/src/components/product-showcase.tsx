"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const showcaseItems = [
  {
    title: "Track your productivity",
    description: "See your weekly streak, speaking speed, and total words. All your voice interactions in one place.",
    image: "/screenshots/home.png",
    tag: "Home",
  },
  {
    title: "Daily journaling made simple",
    description: "Navigate through dates with a calendar. Rich text editing with auto-save.",
    image: "/screenshots/today.png",
    tag: "Today",
  },
  {
    title: "Voice notes that stick",
    description: "Quick voice notes with search and organization. Grid or list view.",
    image: "/screenshots/notes.png",
    tag: "Notes",
  },
  {
    title: "Your personal library",
    description: "Organize knowledge, create content with your voice. Everything searchable.",
    image: "/screenshots/library.png",
    tag: "Library",
  },
];

export default function ProductShowcase() {
  return (
    <section className="py-28 bg-bg-raised/50">
      <div className="max-w-[1120px] mx-auto px-6">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="block text-[13px] font-semibold text-muted uppercase tracking-widest mb-4"
        >
          Product
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-20"
        >
          See Orbit in action
        </motion.h2>

        <div className="space-y-32">
          {showcaseItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`flex flex-col ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } gap-12 items-center`}
            >
              {/* Content */}
              <div className="flex-1 space-y-4">
                <span className="inline-block px-3 py-1 bg-bg-card border border-border rounded-full text-[13px] font-medium text-muted">
                  {item.tag}
                </span>
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {item.title}
                </h3>
                <p className="text-[17px] text-muted leading-relaxed max-w-[480px]">
                  {item.description}
                </p>
              </div>

              {/* Screenshot placeholder */}
              <div className="flex-1 w-full">
                <div className="relative aspect-[16/10] w-full bg-bg-card border border-border rounded-2xl overflow-hidden">
                  {/* Placeholder - replace with actual screenshots */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-muted">
                      <div className="text-4xl mb-2">📸</div>
                      <p className="text-sm">Screenshot: {item.tag}</p>
                    </div>
                  </div>
                  {/* Uncomment when screenshots are added:
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  */}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
