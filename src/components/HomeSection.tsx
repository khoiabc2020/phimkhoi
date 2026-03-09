"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useId } from "react";

interface HomeSectionProps {
    title: string;
    viewAllHref?: string;
    viewAllLabel?: string;
    children: React.ReactNode;
    compact?: boolean;
}

/** Đề mục trang chủ kiểu rophim: vạch vàng + tiêu đề + tùy chọn "Xem tất cả" */
export default function HomeSection({
    title,
    viewAllHref,
    viewAllLabel = "Xem tất cả",
    children,
    compact = false,
}: HomeSectionProps) {
    const headingId = useId();
    return (
        <section
            aria-labelledby={headingId}
            className={compact ? "space-y-2" : "space-y-4"}
            style={{ contain: "layout style paint", scrollMarginTop: "6rem" }}
        >
            <div className="flex items-center justify-between gap-4 px-1">
                <h2 id={headingId} className="text-base md:text-[17px] font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-1 h-5 md:h-6 bg-[#F4C84A] rounded-sm shrink-0" aria-hidden />
                    <span>{title}</span>
                </h2>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="text-xs md:text-sm font-medium text-[#F4C84A] hover:text-white flex items-center gap-0.5 shrink-0 transition-colors group/link"
                    >
                        {viewAllLabel}
                        <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5" />
                    </Link>
                )}
            </div>
            {children}
        </section>
    );
}
