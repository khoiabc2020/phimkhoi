"use client";

import Link from "next/link";

const tags = [
    'Hành động', 'Tình cảm', 'Cổ trang', 'Kinh dị', 'Viễn tưởng',
    'Hàn Quốc', 'Anime', 'Netflix', 'Hài hước', 'Gia đình',
    'Học đường', 'Chiến tranh', 'Tâm lý', 'Võ thuật'
];

export default function TopicCloud() {
    return (
        <div className="rounded-lg bg-[#020617]/80 border border-white/10 p-5 overflow-hidden">
            <h3 className="text-white font-bold text-base mb-4 uppercase flex items-center gap-2">
                <span className="w-1 h-4 bg-[#E50914] rounded-sm shrink-0" />
                Từ khóa hot
            </h3>
            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                {tags.map(tag => (
                    <Link
                        key={tag}
                        href={`/tim-kiem?keyword=${tag}`}
                        className="bg-white/5 hover:bg-[#E50914] hover:text-[#0a0a0a] px-3 py-1.5 rounded-full transition-colors duration-200 cursor-pointer border border-white/10 active:scale-95"
                    >
                        {tag}
                    </Link>
                ))}
            </div>
        </div>
    );
}
