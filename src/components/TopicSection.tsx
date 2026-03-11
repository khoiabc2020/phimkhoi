"use client";

import Link from "next/link";

const topics = [
    { id: "marvel", name: "Marvel", emoji: "⚡", color: "#ef4444", glow: "#ef444440", href: "/tim-kiem?q=Marvel" },
    { id: "4k", name: "4K Ultra HD", emoji: "🎬", color: "#a855f7", glow: "#a855f740", href: "/danh-sach/tat-ca-the-loai?quality=4K" },
    { id: "sitcom", name: "Sitcom", emoji: "😂", color: "#F4C84A", glow: "#F4C84A40", href: "/the-loai/hai-huoc" },
    { id: "long-tieng", name: "Lồng Tiếng", emoji: "🎙️", color: "#6366f1", glow: "#6366f140", href: "/danh-sach/phim-long-tieng" },
    { id: "xuyen-khong", name: "Xuyên Không", emoji: "🌀", color: "#f97316", glow: "#f9731640", href: "/the-loai/xuyen-khong" },
    { id: "co-trang", name: "Cổ Trang", emoji: "⚔️", color: "#dc2626", glow: "#dc262640", href: "/the-loai/co-trang" },
    { id: "kinh-di", name: "Kinh Dị", emoji: "👻", color: "#10b981", glow: "#10b98140", href: "/the-loai/kinh-di" },
    { id: "tinh-cam", name: "Tình Cảm", emoji: "💕", color: "#ec4899", glow: "#ec489940", href: "/the-loai/tinh-cam" },
    { id: "hanh-dong", name: "Hành Động", emoji: "💥", color: "#f59e0b", glow: "#f59e0b40", href: "/the-loai/hanh-dong" },
    { id: "tam-ly", name: "Tâm Lý", emoji: "🧠", color: "#06b6d4", glow: "#06b6d440", href: "/the-loai/tam-ly" },
    { id: "hoc-duong", name: "Học Đường", emoji: "🎓", color: "#84cc16", glow: "#84cc1640", href: "/the-loai/hoc-duong" },
    { id: "vien-tuong", name: "Viễn Tưởng", emoji: "🚀", color: "#818cf8", glow: "#818cf840", href: "/the-loai/vien-tuong" },
];

export default function TopicSection() {
    return (
        <section className="container mx-auto px-4 md:px-12 pt-5 pb-3 md:pt-3">
            <div className="flex items-center gap-2 mb-3 px-1">
                <span className="w-1 h-5 bg-gradient-to-t from-[#F4C84A] to-yellow-200 rounded-sm inline-block" />
                <h2 className="text-[17px] font-bold text-white">Khám phá nhanh</h2>
            </div>

            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 scroll-smooth">
                {topics.map((topic) => (
                    <Link
                        key={topic.id}
                        href={topic.href}
                        className="group flex-shrink-0 flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full border transition-all duration-200 active:scale-[0.97]"
                        style={{
                            borderColor: `${topic.color}30`,
                            background: `linear-gradient(135deg, ${topic.glow}, transparent)`,
                        }}
                    >
                        <span className="text-base leading-none">{topic.emoji}</span>
                        <span
                            className="text-[13px] font-semibold whitespace-nowrap"
                            style={{ color: topic.color }}
                        >
                            {topic.name}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
