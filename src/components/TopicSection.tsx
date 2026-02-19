"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const topics = [
    { id: 'marvel', name: 'Marvel', color: '#ef4444', slug: 'marvel' },
    { id: '4k', name: '4K', color: '#a855f7', slug: '4k' },
    { id: 'sitcom', name: 'Sitcom', color: '#22c55e', slug: 'sitcom' },
    { id: 'long-tieng', name: 'Lồng Tiếng', color: '#6366f1', slug: 'long-tieng' },
    { id: 'xuyen-khong', name: 'Xuyên Không', color: '#f97316', slug: 'xuyen-khong' },
    { id: 'co-trang', name: 'Cổ Trang', color: '#dc2626', slug: 'co-trang' },
];

export default function TopicSection() {
    return (
        <section className="container mx-auto px-4 md:px-12 py-6">
            <div className="flex items-center gap-2 mb-4 px-2">
                <Sparkles className="w-4 h-4 text-[#fbbf24]" />
                <h2 className="text-[18px] font-semibold text-white tracking-tight">
                    Khám phá nhanh
                </h2>
            </div>

            {/* Horizontal Scroll - Pill Style (iOS 26) */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mask-gradient-responsive">
                {topics.map((topic) => (
                    <Link
                        key={topic.id}
                        href={`/tim-kiem?keyword=${topic.name}`}
                        className="group flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm transition-all active:scale-95"
                    >
                        {/* Dot Indicator */}
                        <div
                            className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                            style={{ backgroundColor: topic.color, color: topic.color }}
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
