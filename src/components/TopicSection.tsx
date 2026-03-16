"use client";

import Link from "next/link";

const topics = [
    { id: "marvel", name: "Marvel", color: "#ef4444", href: "/tim-kiem?q=Marvel" },
    { id: "4k", name: "4K Ultra HD", color: "#a855f7", href: "/danh-sach/tat-ca-the-loai?quality=4K" },
    { id: "sitcom", name: "Sitcom", color: "#F4C84A", href: "/the-loai/hai-huoc" },
    { id: "long-tieng", name: "Lồng Tiếng", color: "#6366f1", href: "/danh-sach/phim-long-tieng" },
    { id: "xuyen-khong", name: "Xuyên Không", color: "#f97316", href: "/the-loai/xuyen-khong" },
    { id: "co-trang", name: "Cổ Trang", color: "#dc2626", href: "/the-loai/co-trang" },
    { id: "kinh-di", name: "Kinh Dị", color: "#10b981", href: "/the-loai/kinh-di" },
    { id: "tinh-cam", name: "Tình Cảm", color: "#ec4899", href: "/the-loai/tinh-cam" },
    { id: "hanh-dong", name: "Hành Động", color: "#f59e0b", href: "/the-loai/hanh-dong" },
    { id: "tam-ly", name: "Tâm Lý", color: "#06b6d4", href: "/the-loai/tam-ly" },
    { id: "hoc-duong", name: "Học Đường", color: "#84cc16", href: "/the-loai/hoc-duong" },
    { id: "vien-tuong", name: "Viễn Tưởng", color: "#818cf8", href: "/the-loai/vien-tuong" },
];

export default function TopicSection() {
    return (
        <section className="w-full max-w-[1920px] mx-auto px-4 md:px-12 pt-5 pb-3 md:pt-3">
            <div className="flex items-center gap-2 mb-3 px-1">
                <span className="w-1 h-5 bg-[#F4C84A] rounded-sm inline-block" />
                <h2 className="text-[17px] font-bold text-white">Khám phá nhanh</h2>
            </div>

            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 scroll-smooth">
                {topics.map((topic) => (
                    <Link
                        key={topic.id}
                        href={topic.href}
                        className="group flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] hover:border-white/[0.16] bg-[#0B0B10] hover:bg-[#111117] transition-all duration-200 active:scale-[0.97]"
                    >
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
