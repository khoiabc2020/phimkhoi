import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MovieBox - Xem phim là mê",
  description: "Website xem phim online chất lượng cao, cập nhật liên tục.",
};

import { Providers } from "@/components/Providers";
import Header from "@/components/Header";
import { getMenuData } from "@/services/api";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { categories, countries } = await getMenuData();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-20 lg:pb-0`}
      >
        <Providers>
          <Header categories={categories} countries={countries} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
