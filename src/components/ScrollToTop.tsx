"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Về đầu trang"
      className={`fixed bottom-[84px] right-4 md:bottom-8 md:right-6 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.07] hover:bg-white/[0.14] backdrop-blur-md border border-white/[0.12] hover:border-white/25 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <ChevronUp className="w-4.5 h-4.5 text-white/80" />
    </button>
  );
}
