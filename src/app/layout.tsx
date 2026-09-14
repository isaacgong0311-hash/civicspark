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
    default: "CivicSpark Missions — Learn the Bill. Shape the Conversation.",
    template: "%s · CivicSpark",
  },
  description:
    "Source-backed classroom missions that help students understand real legislation, weigh evidence, and write a teacher-reviewed letter to Congress.",
  applicationName: "CivicSpark",
  keywords: [
    "civic education", "classroom", "Congress", "legislation", "student voice",
    "constituent letter", "nonpartisan", "Congressional App Challenge", "Congress.gov",
  ],
  authors: [{ name: "CivicSpark" }],
  category: "government",
  openGraph: {
    type: "website",
    siteName: "CivicSpark",
    title: "CivicSpark Missions — Learn the Bill. Shape the Conversation.",
    description:
      "Students investigate a real bill, weigh official evidence, and turn their perspective into a teacher-reviewed letter to Congress.",
    url: "https://civicspark.vercel.app",
    locale: "en_US",
    images: [{ url: "/cover.jpg", width: 2400, height: 1260, alt: "CivicSpark classroom missions" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicSpark Missions",
    description:
      "Source-backed civic missions that move students from understanding to action.",
    images: ["/cover.jpg"],
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
