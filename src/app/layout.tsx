import type { Metadata } from "next";
import { Fraunces, Barlow } from "next/font/google";
import "./globals.css";

// Fraunces: optical serif with real personality — editorial, authoritative, distinctive
const fraunces = Fraunces({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

// Barlow: clean geometric sans, slightly condensed, more character than DM Sans
const barlow = Barlow({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CivicSpark — Know Your Bills, Reach Your Reps",
  description: "Understand federal legislation that affects you and send personalized letters to your representatives.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${barlow.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
