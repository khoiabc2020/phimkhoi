"use client";

import Link from "next/link";

const tags = [
    'Hành động', 'Tình cảm', 'Cổ trang', 'Kinh dị', 'Viễn tưởng',
    'Hàn Quốc', 'Anime', 'Netflix', 'Hài hước', 'Gia đình',
    'Học đường', 'Chiến tranh', 'Tâm lý', 'Võ thuật'
];

export default function TopicCloud() {
    return (
        <div className="bg-[#111] p-5 rounded-xl border border-white/5">
            <h3 className="text-white font-bold text-base mb-4 uppercase flex items-center gap-2">
                <span className="w-1 h-4 bg-[#fbbf24] rounded-full"></span>
                Từ khóa hot
            </h3>
            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                {tags.map(tag => (
                    <Link
                        key={tag}
                        href={`/tim-kiem?keyword=${tag}`}
                        className="bg-white/5 hover:bg-[#fbbf24] hover:text-black px-3 py-1.5 rounded-full transition-colors duration-200 cursor-pointer border border-white/5 active:scale-95"
                    >
                        {tag}
                    </Link>
                ))}
            </div>
        </div>
    );
}
