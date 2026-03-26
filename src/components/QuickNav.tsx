"use client";

import Link from "next/link";

const NAV_ITEMS = [
    {
        label: "Hàn Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/han-quoc",
        from: "rgba(22, 28, 44, 0.96)",
        to: "rgba(11, 14, 24, 0.96)",
    },
    {
        label: "Trung Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/trung-quoc",
        from: "rgba(18, 28, 26, 0.96)",
        to: "rgba(10, 16, 18, 0.96)",
    },
    {
        label: "Phim Ngắn",
        sub: "Xem chủ đề",
        href: "/the-loai/phim-ngan",
        from: "rgba(31, 22, 20, 0.96)",
        to: "rgba(17, 12, 12, 0.96)",
    },
    {
        label: "Thuyết Minh",
        sub: "Xem chủ đề",
        href: "/danh-sach/thuyet-minh",
        from: "rgba(25, 20, 36, 0.96)",
        to: "rgba(14, 12, 22, 0.96)",
    },
    {
        label: "Phim Mỹ",
        sub: "Xem chủ đề",
        href: "/quoc-gia/my",
        from: "rgba(34, 20, 20, 0.96)",
        to: "rgba(18, 11, 11, 0.96)",
    },
    {
        label: "Thái Lan",
        sub: "Xem chủ đề",
        href: "/quoc-gia/thai-lan",
        from: "rgba(22, 24, 34, 0.96)",
        to: "rgba(12, 13, 20, 0.96)",
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

                <div className="no-scrollbar flex snap-x overflow-x-auto py-1 lg:grid lg:grid-cols-6 gap-3 md:gap-4">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={`Xem ${item.label}`}
                            className="group quick-nav-card relative aspect-[1.8/1] w-[160px] flex-shrink-0 snap-start overflow-hidden rounded-[12px] border border-white/[0.05] bg-[#0b0b10] shadow-[0_8px_24px_rgba(0,0,0,0.32)] transition-all duration-300 hover:scale-[1.02] hover:border-[#8FA7C5]/20 hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] sm:w-[220px] lg:w-auto"
                            style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(143,167,197,0.12),transparent_42%)]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

                            <div className="absolute inset-x-0 bottom-0 flex h-full flex-col justify-end p-3 sm:p-4">
                                <h3 className="mb-1 text-[16px] font-bold leading-tight text-white sm:text-[20px]">
                                    {item.label}
                                </h3>
                                <p className="flex items-center gap-1 text-[11px] font-medium text-white/72 transition-all group-hover:gap-1.5 sm:text-[12px]">
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
