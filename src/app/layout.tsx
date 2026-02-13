import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Orbit — Your voice is the new keyboard",
  description:
    "Orbit is an AI-powered voice companion that turns your speech into perfect text, anywhere on your computer. Stop typing. Start speaking.",
  metadataBase: new URL("https://orbitvoice.app"),
  openGraph: {
    title: "Orbit — Your voice is the new keyboard",
    description:
      "AI-powered voice dictation that turns speech into perfect text, anywhere on your computer.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbit — Your voice is the new keyboard",
    description:
      "AI-powered voice dictation that turns speech into perfect text, anywhere on your computer.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/orbit.png" type="image/png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
