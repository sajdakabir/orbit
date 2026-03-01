"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Sarah Chen",
    handle: "@sarahchen_dev",
    platform: "twitter" as const,
    avatar: "SC",
    text: "I've been using @OrbitApp for two weeks and I'm genuinely blown away. Dictating emails and docs at 3x speed isn't marketing fluff — it's real. My wrists thank me.",
  },
  {
    name: "Marcus Rivera",
    handle: "@marcusrivera",
    platform: "linkedin" as const,
    avatar: "MR",
    text: "As someone who writes 5,000+ words a day, Orbit has completely changed my workflow. The accuracy across English and Spanish is incredible.",
  },
  {
    name: "Priya Sharma",
    handle: "@priyabuilds",
    platform: "twitter" as const,
    avatar: "PS",
    text: "Replaced three different apps with @OrbitApp. Voice journaling in the morning, dictating Slack messages during the day, writing docs at night. It just works everywhere.",
  },
  {
    name: "James Whitfield",
    handle: "@jameswhitfield",
    platform: "linkedin" as const,
    avatar: "JW",
    text: "The formatting intelligence is what sets Orbit apart. It doesn't just transcribe — it understands context, adds punctuation, and structures my thoughts beautifully.",
  },
  {
    name: "Aiko Tanaka",
    handle: "@aikotanaka",
    platform: "twitter" as const,
    avatar: "AT",
    text: "Finally a voice tool that handles Japanese and English seamlessly. @OrbitApp switches between languages mid-sentence without breaking a sweat. 本当にすごい！",
  },
  {
    name: "David Okonkwo",
    handle: "@davidokonkwo",
    platform: "linkedin" as const,
    avatar: "DO",
    text: "I was skeptical about voice-first tools, but Orbit converted me in one day. Writing my newsletter now takes 20 minutes instead of two hours.",
  },
  {
    name: "Emily Zhang",
    handle: "@emilyzhang_ux",
    platform: "twitter" as const,
    avatar: "EZ",
    text: "Used @OrbitApp to dictate my entire design spec while walking my dog. Came back to a perfectly formatted doc. The future is wild.",
  },
  {
    name: "Raj Patel",
    handle: "@rajpatel_eng",
    platform: "twitter" as const,
    avatar: "RP",
    text: "The latency is insanely low. I speak and the text appears instantly. No awkward pauses, no lag. @OrbitApp nailed the real-time experience.",
  },
  {
    name: "Lisa Moreau",
    handle: "@lisamoreau",
    platform: "linkedin" as const,
    avatar: "LM",
    text: "Orbit has been a game-changer for accessibility in our team. Two of our writers with RSI can now produce content comfortably. Thank you for building this.",
  },
];

function PlatformIcon({ platform }: { platform: "twitter" | "linkedin" }) {
  if (platform === "twitter") {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#0A66C2]" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// Split testimonials into 3 columns for masonry effect
const col1 = [testimonials[0], testimonials[3], testimonials[6]];
const col2 = [testimonials[1], testimonials[4], testimonials[7]];
const col3 = [testimonials[2], testimonials[5], testimonials[8]];

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[0];
}) {
  return (
    <div className="p-5 border border-border rounded-xl bg-white/60 hover:bg-white/80 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ede6f3] to-[#E9EFF2] flex items-center justify-center text-[11px] font-semibold text-foreground">
            {testimonial.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">
              {testimonial.name}
            </p>
            <p className="text-xs text-muted">{testimonial.handle}</p>
          </div>
        </div>
        <PlatformIcon platform={testimonial.platform} />
      </div>

      {/* Text */}
      <p className="text-[13px] text-dim leading-relaxed">
        {testimonial.text.split(/(@\w+)/g).map((part, i) =>
          part.startsWith("@") ? (
            <span
              key={i}
              className="text-[#4a6670] font-medium"
            >
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="relative px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <span className="w-1.5 h-1.5 bg-foreground rounded-full" />
            <span className="text-sm text-muted font-medium">
              Social Proof
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-[family-name:var(--font-manrope)] text-xl sm:text-2xl md:text-3xl font-normal tracking-[-0.02em] leading-[1.3] bg-gradient-to-r from-foreground via-foreground to-[#64748b] bg-clip-text text-transparent"
          >
            What our users are saying
          </motion.h2>
        </div>

        {/* Masonry Grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-[960px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {/* Column 1 */}
          <div className="flex flex-col gap-5">
            {col1.map((t, i) => (
              <TestimonialCard key={i} testimonial={t} />
            ))}
          </div>

          {/* Column 2 — offset down for masonry stagger */}
          <div className="flex flex-col gap-5 md:mt-10">
            {col2.map((t, i) => (
              <TestimonialCard key={i} testimonial={t} />
            ))}
          </div>

          {/* Column 3 — slight offset */}
          <div className="flex flex-col gap-5 md:mt-5">
            {col3.map((t, i) => (
              <TestimonialCard key={i} testimonial={t} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
