import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Harmutt Böttger - Ingenieurbüro für Arbeitssicherheit",
  description: "Arbeitssicherheit für medizinische Einrichtungen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Navigation oben rechts */}
        <div className="absolute top-4 right-4 text-sm space-x-4">
          <Link href="/" className="underline">Home</Link>
          <Link href="/admin" className="underline">Admin</Link>
        </div>

        {/* Seiteninhalt */}
        {children}
      </body>
    </html>
  );
}
