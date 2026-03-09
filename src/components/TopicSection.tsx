"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const topics = [
    // Marvel: dùng search theo từ khóa để đúng nội dung
    { id: "marvel", name: "Marvel", color: "#ef4444", href: "/tim-kiem?q=Marvel" },
    // 4K: lọc chất lượng 4K trên toàn bộ danh sách mới cập nhật
    { id: "4k", name: "4K Ultra HD", color: "#a855f7", href: "/danh-sach/tat-ca-the-loai?quality=4K" },
    // Sitcom: map về thể loại Hài Hước
    { id: "sitcom", name: "Sitcom", color: "#F4C84A", href: "/the-loai/hai-huoc" },
    // Lồng tiếng: dùng đúng slug danh sách phim lồng tiếng
    { id: "long-tieng", name: "Lồng Tiếng", color: "#6366f1", href: "/danh-sach/phim-long-tieng" },
    // Xuyên không: map về thể loại xuyen-khong (nếu có trong KKPhim)
    { id: "xuyen-khong", name: "Xuyên Không", color: "#f97316", href: "/the-loai/xuyen-khong" },
    { id: "co-trang", name: "Cổ Trang", color: "#dc2626", href: "/the-loai/co-trang" },
];

export default function TopicSection() {
    return (
        <section className="container mx-auto px-4 md:px-12 pt-5 pb-3 md:pt-3">
            <div className="flex items-center gap-2 mb-3 px-2">
                <span className="w-1 h-5 bg-gradient-to-t from-[#F4C84A] to-yellow-200 rounded-sm inline-block" />
                <h2 className="text-[17px] font-bold text-white">
                    Khám phá nhanh
                </h2>
            </div>

            {/* Horizontal Scroll - Pill Style (iOS 26) */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 mask-gradient-responsive">
                {topics.map((topic) => (
                    <Link
                        key={topic.id}
                        href={topic.href}
                        className="group flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors duration-200 active:scale-95"
                    >
                        {/* Dot Indicator */}
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: topic.color }}
                        />

                        <span className="text-sm font-medium text-white/90 group-hover:text-white whitespace-nowrap">
                            {topic.name}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
