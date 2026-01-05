import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import NotificationBanner from "@/components/NotificationBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EnstaRobots World Cup",
  description: "The ultimate robotics competition platform.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="relative min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
          <Navbar />
          <main className="flex-1 pb-20 md:pb-0">
            {children}
          </main>
          <BottomNav />
          <NotificationBanner />
        </div>
      </body>
    </html>
  );
}
