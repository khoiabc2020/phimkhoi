import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Lexend } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Script from "next/script";

// Font chính cho heading — preload, chỉ 2 weight cần thiết
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["700", "900"],
  display: "swap",
  preload: true,
});

// Font body — preload, giới hạn weight
const outfitFont = Lexend({
  variable: "--font-outfit",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#020617",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://khoiphim.org"),
  title: {
    default: "KHOIPHIM - Xem Phim Online Chất Lượng Cao",
    template: "%s | KHOIPHIM"
  },
  description: "Xem phim online chất lượng cao vietsub, lồng tiếng, thuyết minh. Phim mới cập nhật hàng ngày, hoàn toàn miễn phí.",
  keywords: ["xem phim", "phim online", "phim vietsub", "phim hay", "phim mới", "KHOIPHIM"],
  authors: [{ name: "KHOIPHIM" }],
  creator: "KHOIPHIM",
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
    title: "KHOIPHIM - Xem Phim Online Chất Lượng Cao",
    description: "Xem phim online chất lượng cao vietsub, lồng tiếng, thuyết minh. Phim mới cập nhật hàng ngày, hoàn toàn miễn phí.",
    type: "website",
    url: "https://khoiphim.org",
    locale: "vi_VN",
    siteName: "KHOIPHIM",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "KHOIPHIM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KHOIPHIM - Xem Phim Online Chất Lượng Cao",
    description: "Xem phim online chất lượng cao vietsub, lồng tiếng, thuyết minh. Phim mới cập nhật hàng ngày, hoàn toàn miễn phí.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

import { Providers } from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import LoadingBar from "@/components/LoadingBar";
import RouteWarmup from "@/components/RouteWarmup";
import ScrollToTop from "@/components/ScrollToTop";
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Advanced App Icons */}
        <link rel="apple-touch-icon" sizes="57x57" href="/icons/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icons/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/icons/ms-icon-144x144.png" />
        <meta name="theme-color" content="#ffffff" />
        {/* Preconnect to image CDN domains để giảm latency ảnh tối đa */}
        <link rel="preconnect" href="https://wsrv.nl" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://wsrv.nl" />
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
        {/* WebSite + Organization schema — giúp Google hiểu site, kích hoạt Search sitelink */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://khoiphim.org/#website",
              "url": "https://khoiphim.org",
              "name": "KHOIPHIM",
              "description": "Xem phim online chất lượng cao vietsub, lồng tiếng, thuyết minh. Miễn phí.",
              "inLanguage": "vi",
              "potentialAction": {
                "@type": "SearchAction",
                "target": { "@type": "EntryPoint", "urlTemplate": "https://khoiphim.org/tim-kiem?keyword={search_term_string}" },
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@type": "Organization",
              "@id": "https://khoiphim.org/#organization",
              "name": "KHOIPHIM",
              "url": "https://khoiphim.org",
              "logo": { "@type": "ImageObject", "url": "https://khoiphim.org/logo.png", "width": 512, "height": 512 },
              "sameAs": ["https://khoiphim.org"]
            }
          ]
        }) }} />
      </head>
      <body
        className={`${beVietnamPro.variable} ${outfitFont.variable} antialiased pb-20 lg:pb-0 font-sans`}
      >
        <Providers>
          <Suspense fallback={null}>
            <LoadingBar />
          </Suspense>
          <RouteWarmup />
          <div className="flex flex-col min-h-screen">
            <Suspense fallback={<div className="h-16 bg-black/50" />}>
              <Header categories={categories} countries={countries} />
            </Suspense>
            <div className="flex flex-1 w-full overflow-x-hidden min-h-screen">
              <Sidebar />
              <main className="flex-1 min-w-0">
                {children}
              </main>
            </div>
            <Footer />
          </div>
          <BottomNav />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
