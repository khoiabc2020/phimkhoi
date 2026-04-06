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
      className={`fixed bottom-24 right-4 md:bottom-8 md:right-6 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-[#8FA7C5]/20 hover:bg-[#8FA7C5]/40 backdrop-blur-sm border border-[#8FA7C5]/30 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ChevronUp className="w-5 h-5 text-white" />
    </button>
  );
}
