import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import AppLayout from "@/components/AppLayout";
import LenisProvider from "@/components/LenisProvider";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ABRAM Docs",
  description: "ABRAM Developer Documentation and Help Center",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-background-base text-foreground font-sans">
        <LenisProvider>
          <AppLayout>{children}</AppLayout>
        </LenisProvider>
        <Analytics />
      </body>
    </html>
  );
}
