import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Superstar — Your digital stage, one link",
    template: "%s · Superstar",
  },
  description:
    "Claim your handle on getsuperstar.info. A polished public page for anyone — bio, photos, work, and socials in about 60 seconds.",
  metadataBase: new URL("https://getsuperstar.info"),
  applicationName: "Superstar",
  openGraph: {
    type: "website",
    siteName: "Superstar",
    title: "Superstar — Your digital stage, one link",
    description:
      "One link for your bio, photos, work, and socials. For students, professionals, and anyone who wants to be found.",
    url: "https://getsuperstar.info",
  },
  twitter: {
    card: "summary",
    title: "Superstar — Your AI-built creator stage",
    description:
      "One link for your portfolio, showreel, and socials. Built by AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-neutral-900 font-sans">
        {children}
      </body>
    </html>
  );
}
