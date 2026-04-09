import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Orbit — Your second brain, powered by voice",
  description:
    "Orbit is an AI-powered voice companion that turns your speech into perfect text, anywhere on your computer. Stop typing. Start speaking.",
  metadataBase: new URL("https://orbit.sajdakabir.com"),
  openGraph: {
    title: "Orbit — Your second brain, powered by voice",
    description:
      "AI-powered voice dictation that turns speech into perfect text, anywhere on your computer.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Orbit — Your second brain, powered by voice",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbit — Your second brain, powered by voice",
    description:
      "AI-powered voice dictation that turns speech into perfect text, anywhere on your computer.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/orbit.png" type="image/png" />
      </head>
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
