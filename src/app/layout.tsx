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
  metadataBase: new URL("https://civicspark.vercel.app"),
  title: {
    default: "CivicSpark — Know Your Bills, Reach Your Reps",
    template: "%s · CivicSpark",
  },
  description:
    "Understand federal legislation in plain English, see balanced perspectives, and send AI-drafted letters to your representatives. Nonpartisan, account-free, powered by live Congress.gov data.",
  applicationName: "CivicSpark",
  keywords: [
    "civic engagement", "Congress", "legislation", "bills", "representatives",
    "constituent letter", "nonpartisan", "Congressional App Challenge", "Congress.gov",
  ],
  authors: [{ name: "CivicSpark" }],
  category: "government",
  openGraph: {
    type: "website",
    siteName: "CivicSpark",
    title: "CivicSpark — Know Your Bills, Reach Your Reps",
    description:
      "From ZIP code to constituent letter in under a minute. Plain-English bill summaries, balanced perspectives, and AI-drafted letters — nonpartisan and free.",
    url: "https://civicspark.vercel.app",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicSpark — Know Your Bills, Reach Your Reps",
    description:
      "Plain-English bill summaries, balanced perspectives, and AI-drafted letters to your representatives. Nonpartisan and free.",
  },
  robots: { index: true, follow: true },
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
