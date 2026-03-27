"use client";

import Link from "next/link";

const NAV_ITEMS = [
    {
        label: "Hàn Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/han-quoc",
        from: "rgba(108, 128, 210, 0.78)",
        to: "rgba(202, 176, 212, 0.62)",
    },
    {
        label: "Trung Quốc",
        sub: "Xem chủ đề",
        href: "/quoc-gia/trung-quoc",
        from: "rgba(82, 160, 148, 0.76)",
        to: "rgba(191, 175, 156, 0.58)",
    },
    {
        label: "Phim Ngắn",
        sub: "Xem chủ đề",
        href: "/the-loai/phim-ngan",
        from: "rgba(220, 116, 94, 0.76)",
        to: "rgba(239, 156, 143, 0.62)",
    },
    {
        label: "Thuyết Minh",
        sub: "Xem chủ đề",
        href: "/danh-sach/thuyet-minh",
        from: "rgba(165, 119, 208, 0.76)",
        to: "rgba(214, 156, 186, 0.58)",
    },
    {
        label: "Phim Mỹ",
        sub: "Xem chủ đề",
        href: "/quoc-gia/my",
        from: "rgba(198, 100, 88, 0.78)",
        to: "rgba(214, 129, 118, 0.58)",
    },
    {
        label: "Thái Lan",
        sub: "Xem chủ đề",
        href: "/quoc-gia/thai-lan",
        from: "rgba(158, 166, 201, 0.74)",
        to: "rgba(210, 156, 168, 0.54)",
    },
];

export default function QuickNav() {
    return (
        <div className="w-full pb-6 pt-4 md:pt-8">
            <div className="mx-auto mb-3 w-full max-w-[1920px] px-2 sm:px-4 md:px-8">
                <h2 className="mb-5 flex items-center gap-2 text-[20px] font-extrabold tracking-tight text-white md:text-[24px]">
                    <span className="inline-block h-6 w-1 rounded-sm bg-[#A5B8D6]" />
                    Bạn đang quan tâm gì?
                </h2>

                <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto py-1 lg:grid lg:grid-cols-6 md:gap-4">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={`Xem ${item.label}`}
                            className="group relative aspect-[1.8/1] w-[160px] flex-shrink-0 snap-start overflow-hidden rounded-[14px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/18 hover:shadow-[0_18px_36px_rgba(0,0,0,0.18)] sm:w-[220px] lg:w-auto"
                            style={{
                                backgroundImage: `linear-gradient(135deg, ${item.from}, ${item.to})`,
                            }}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_42%)]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/16 via-black/6 to-transparent" />

                            <div className="absolute inset-x-0 bottom-0 flex h-full flex-col justify-end p-3 sm:p-4">
                                <h3 className="mb-1 text-[16px] font-extrabold leading-tight text-white sm:text-[20px]">
                                    {item.label}
                                </h3>
                                <p className="flex items-center gap-1 text-[11px] font-semibold text-white/92 transition-all group-hover:gap-1.5 sm:text-[12px]">
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
