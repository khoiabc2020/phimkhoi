import type { Metadata } from "next";
import { Geist, Geist_Mono, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://khoiphim.io.vn"),
  title: {
    default: "CINEFLIX - Xem Phim Online Chất Lượng Cao",
    template: "%s | CINEFLIX"
  },
  description: "Xem phim online chất lượng cao vietsub, lồng tiếng, thuyết minh. Phim mới cập nhật hàng ngày, hoàn toàn miễn phí.",
  keywords: ["xem phim", "phim online", "phim vietsub", "phim hay", "phim mới", "CINEFLIX"],
  authors: [{ name: "CINEFLIX" }],
  creator: "CINEFLIX",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "CINEFLIX - Xem Phim Online Chất Lượng Cao",
    description: "Xem phim online chất lượng cao vietsub, lồng tiếng, thuyết minh. Phim mới cập nhật hàng ngày, hoàn toàn miễn phí.",
    type: "website",
    url: "https://khoiphim.io.vn",
    locale: "vi_VN",
    siteName: "CINEFLIX",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "CINEFLIX",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CINEFLIX - Xem Phim Online Chất Lượng Cao",
    description: "Xem phim online chất lượng cao vietsub, lồng tiếng, thuyết minh. Phim mới cập nhật hàng ngày, hoàn toàn miễn phí.",
    images: ["/logo.png"],
  },
  manifest: "/manifest.json",
};

import { Providers } from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getMenuData } from "@/services/api";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { categories, countries } = await getMenuData();

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* PWA + Mobile */}
        <meta name="theme-color" content="#020617" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/logo.png" />
        {/* Preconnect to image CDN domains để giảm latency ảnh tối đa */}
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://img.ophim.live" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://img.ophim.live" />
        <link rel="preconnect" href="https://phimimg.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://phimimg.com" />
        <link rel="dns-prefetch" href="https://phimapi.com" />
        <link rel="dns-prefetch" href="https://ophim1.com" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${beVietnamPro.variable} antialiased pb-20 lg:pb-0`}
      >
        <Providers>
          <Header categories={categories} countries={countries} />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
