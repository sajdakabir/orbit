import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — Orbit",
  description: "Privacy Policy for Orbit, the AI-powered voice companion.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Last updated: March 17, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Introduction
            </h2>
            <p>
              Orbit (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is an
              open-source, AI-powered voice companion that turns speech into
              text. We are committed to protecting your privacy. This policy
              explains what data we collect, how we use it, and your rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. Data We Collect
            </h2>
            <p className="mb-3">
              <strong className="text-foreground">Audio Data:</strong> When you
              use Orbit&apos;s voice features, audio is streamed to our servers
              for real-time transcription. Audio is processed in memory and is
              not stored after the transcription is complete.
            </p>
            <p className="mb-3">
              <strong className="text-foreground">Account Data:</strong> If you
              create an account, we collect your email address and basic profile
              information for authentication purposes.
            </p>
            <p className="mb-3">
              <strong className="text-foreground">Usage Data:</strong> We collect
              anonymous usage analytics (e.g., feature usage, crash reports) to
              improve the product. This data is not linked to your identity.
            </p>
            <p>
              <strong className="text-foreground">Local Data:</strong> Notes,
              journal entries, dictionary words, and app settings are stored
              locally on your device in a SQLite database. This data never leaves
              your machine unless you explicitly use a sync feature.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. How We Use Your Data
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide real-time speech-to-text transcription</li>
              <li>To authenticate your account and manage your session</li>
              <li>To improve the accuracy and performance of our services</li>
              <li>To send important product updates (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. Third-Party Services
            </h2>
            <p>
              Orbit uses third-party services for speech recognition (e.g.,
              Groq, Cerebras) and language processing. Audio sent to these
              providers is subject to their respective privacy policies. We
              select providers that do not retain audio data after processing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Data Storage & Security
            </h2>
            <p>
              We use industry-standard security measures to protect your data in
              transit and at rest. Audio is transmitted over encrypted
              connections (TLS/gRPC). We do not sell, trade, or rent your
              personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Your Rights
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong className="text-foreground">Access:</strong> You can
                request a copy of any personal data we hold about you.
              </li>
              <li>
                <strong className="text-foreground">Deletion:</strong> You can
                request deletion of your account and all associated data.
              </li>
              <li>
                <strong className="text-foreground">Local Data:</strong> You have
                full control over locally stored data. You can delete it at any
                time from the app settings.
              </li>
              <li>
                <strong className="text-foreground">Opt-out:</strong> You can
                disable analytics collection in the app settings.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              7. Open Source
            </h2>
            <p>
              Orbit is open source. You can review our codebase at{" "}
              <a
                href="https://github.com/sajdakabir/orbit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                github.com/sajdakabir/orbit
              </a>{" "}
              to verify how we handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. We will
              notify users of significant changes through the app or via email.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. Contact
            </h2>
            <p>
              If you have any questions about this privacy policy, please reach
              out via{" "}
              <a
                href="https://github.com/sajdakabir/orbit/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                GitHub Issues
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
