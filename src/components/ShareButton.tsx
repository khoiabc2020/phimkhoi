"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

export default function ShareButton({ title, text, className, iconOnlyOnMobile = false }: { title?: string; text?: string; className?: string; iconOnlyOnMobile?: boolean }) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;

        // Use Web Share API if supported (mainly mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title || "Chia sẻ phim",
                    text: text || "Kiểm tra phim này nhé!",
                    url: url
                });
                return;
            } catch (error) {
                // User cancelled or error, fallback to clipboard
                console.log("Share API failed", error);
            }
        }

        // Fallback: Copy to clipboard
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            alert("Đã copy đường dẫn phim vào khay nhớ tạm!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy", err);
            alert("Không thể copy đường dẫn. Vui lòng thử lại!");
        }
    };

    return (
        <button
            onClick={handleShare}
            className={`flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-medium text-sm transition-all border border-white/5 group ${className || ""}`}
            title="Chia sẻ phim này"
        >
            <Share2 className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors shrink-0" />
            <span className={iconOnlyOnMobile ? "hidden sm:inline" : ""}>{copied ? "Đã chép Link!" : "Chia sẻ"}</span>
        </button>
    );
}
