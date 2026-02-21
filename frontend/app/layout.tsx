import type { Metadata, Viewport } from "next";
import "./globals.css";

// 1. ADD THIS BLOCK: This locks the screen and prevents all mobile zooming
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "AniMoChat - Anonymous Chat",
  description:
    "Anonymous. Random. No accounts needed. Chat freely with strangers around the world.",
  keywords: [
    "anonymous chat",
    "random chat",
    "stranger chat",
    "online chat",
    "no signup",
  ],
  authors: [{ name: "AniMoChat" }],
  openGraph: {
    title: "AniMoChat - Anonymous Chat",
    description: "Anonymous. Random. No accounts needed.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ani-bg">{children}</body>
    </html>
  );
}
