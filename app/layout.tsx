import type {Metadata} from "next";
import {Geist, Geist_Mono, Doto} from "next/font/google";
import "./globals.css";
import DiaryFrame from "./diary/DiaryFrame";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const doto = Doto({
  variable: "--font-doto",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Walking Coding - Creative Coding Diary",
  description: "Daily creative coding experiments and diary with p5.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${doto.variable} antialiased`}
      >
        <DiaryFrame>{children}</DiaryFrame>
      </body>
    </html>
  );
}
