"use client";

import Link from "next/link";

const NAV_ITEMS = [
    {
        label: "Hàn Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/han-quoc",
        from: "rgba(104, 118, 178, 0.34)",
        to: "rgba(146, 158, 210, 0.18)",
    },
    {
        label: "Trung Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/trung-quoc",
        from: "rgba(78, 132, 132, 0.3)",
        to: "rgba(138, 154, 144, 0.18)",
    },
    {
        label: "Phim Ngắn",
        sub: "Xem chủ đề",
        href: "/the-loai/phim-ngan",
        from: "rgba(118, 92, 86, 0.3)",
        to: "rgba(164, 126, 118, 0.16)",
    },
    {
        label: "Thuyết Minh",
        sub: "Xem chủ đề",
        href: "/danh-sach/thuyet-minh",
        from: "rgba(92, 86, 132, 0.3)",
        to: "rgba(142, 126, 174, 0.16)",
    },
    {
        label: "Phim Mỹ",
        sub: "Xem chủ đề",
        href: "/quoc-gia/my",
        from: "rgba(112, 82, 80, 0.3)",
        to: "rgba(168, 118, 112, 0.16)",
    },
    {
        label: "Thái Lan",
        sub: "Xem chủ đề",
        href: "/quoc-gia/thai-lan",
        from: "rgba(96, 102, 132, 0.28)",
        to: "rgba(150, 132, 146, 0.16)",
    },
];

export default function QuickNav() {
    return (
        <div className="w-full pb-6 pt-4 md:pt-8">
            <div className="mx-auto mb-3 w-full max-w-[1920px] px-2 sm:px-4 md:px-8">
                <h2 className="mb-4 flex items-center gap-2 text-[20px] font-extrabold tracking-tight text-white md:text-[24px]">
                    <span className="inline-block h-5 w-1 rounded-sm bg-[#8FA7C5]" />
                    Bạn đang quan tâm gì?
                </h2>

                <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto py-1 lg:grid lg:grid-cols-6 md:gap-4">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={`Xem ${item.label}`}
                            className="group relative aspect-[1.8/1] w-[160px] flex-shrink-0 snap-start overflow-hidden rounded-[12px] border border-white/[0.06] bg-[#0c0d12] shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition-all duration-300 hover:scale-[1.02] hover:border-[#8FA7C5]/18 hover:shadow-[0_14px_30px_rgba(0,0,0,0.22)] sm:w-[220px] lg:w-auto"
                            style={{
                                backgroundImage: `linear-gradient(135deg, ${item.from}, ${item.to})`,
                            }}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_42%)]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-black/10 to-transparent" />

                            <div className="absolute inset-x-0 bottom-0 flex h-full flex-col justify-end p-3 sm:p-4">
                                <h3 className="mb-1 text-[16px] font-bold leading-tight text-white sm:text-[20px]">
                                    {item.label}
                                </h3>
                                <p className="flex items-center gap-1 text-[11px] font-medium text-white/78 transition-all group-hover:gap-1.5 sm:text-[12px]">
                                    {item.sub}
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="shrink-0"
                                    >
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
