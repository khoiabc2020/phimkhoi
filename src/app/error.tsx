"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCcw, Home } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error
        console.error("Global Error Boundary:", error);

        // Build ID mismatch or hydration error detection
        const errorMsg = error.message?.toLowerCase() || "";
        const isSuspenseError = errorMsg.includes("suspense") || errorMsg.includes("loading");
        const isFetchError = errorMsg.includes("fetch") || errorMsg.includes("network");
        const isHydrationError = errorMsg.includes("hydration") || errorMsg.includes("did not match");

        // If it's a version mismatch or fetch error, try one auto-refresh
        if (isFetchError || isHydrationError || isSuspenseError) {
            const lastReload = sessionStorage.getItem("last-error-reload");
            const now = Date.now();
            
            // Only auto-reload once every 10 seconds to avoid infinite loops
            if (!lastReload || now - parseInt(lastReload) > 10000) {
                sessionStorage.setItem("last-error-reload", now.toString());
                console.warn("Detecting build mismatch or fetch error. Attempting auto-reload...");
                window.location.reload();
            }
        }
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-center px-4">
            <h1 className="text-6xl font-black text-white/5 mb-4">OPS!</h1>
            <div className="relative">
                <h2 className="text-2xl font-bold text-white mb-2">Đã xảy ra lỗi hệ thống</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    Chúng tôi rất tiếc vì sự bất tiện này. Một lỗi không mong muốn đã xảy ra trong quá trình xử lý.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <button
                        onClick={() => reset()}
                        className="inline-flex items-center gap-2 bg-primary text-black font-bold px-8 py-3 rounded-full hover:bg-yellow-400 transition-all active:scale-95"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Thử lại
                    </button>
                    
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-white/5 text-white font-bold px-8 py-3 rounded-full hover:bg-white/10 transition-all border border-white/10"
                    >
                        <Home className="w-4 h-4" />
                        Về Trang Chủ
                    </Link>
                </div>
                
                {error.digest && (
                    <p className="mt-8 text-[10px] text-white/20 font-mono tracking-widest uppercase">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
        </div>
    );
}
