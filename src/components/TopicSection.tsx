"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const topics = [
    { id: 'marvel', name: 'Marvel', color: 'from-blue-600 to-blue-900', slug: 'marvel' },
    { id: '4k', name: '4K', color: 'from-purple-600 to-purple-900', slug: '4k' },
    { id: 'sitcom', name: 'Sitcom', color: 'from-green-600 to-green-900', slug: 'sitcom' },
    { id: 'long-tieng', name: 'Lồng Tiếng Cực Mạnh', color: 'from-indigo-500 to-indigo-800', slug: 'long-tieng' }, // Custom slug or tag
    { id: 'xuyen-khong', name: 'Xuyên Không', color: 'from-orange-500 to-orange-800', slug: 'xuyen-khong' },
    { id: 'co-trang', name: 'Cổ Trang', color: 'from-red-600 to-red-900', slug: 'co-trang' },
];

export default function TopicSection() {
    return (
        <section className="container mx-auto px-4 md:px-12 py-8">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                Bạn đang quan tâm gì?
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {topics.map((topic) => (
                    <Link
                        key={topic.id}
                        href={`/tim-kiem?keyword=${topic.name}`} // Or specific slug if available
                        className={`group relative h-32 rounded-xl overflow-hidden cursor-pointer shadow-lg transition-transform hover:scale-105`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${topic.color} opacity-80 group-hover:opacity-100 transition-opacity`} />

                        <div className="absolute inset-0 p-4 flex flex-col justify-between">
                            <h3 className="text-xl font-bold text-white drop-shadow-md break-words leading-tight">
                                {topic.name}
                            </h3>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-white/80 uppercase tracking-wider">
                                Xem chủ đề <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        {/* Decorative Circle */}
                        <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-colors" />
                    </Link>
                ))}
            </div>
        </section>
    );
}
