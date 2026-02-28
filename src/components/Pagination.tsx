"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl?: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(name, value);
            return params.toString();
        },
        [searchParams]
    );

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        router.push(`${pathname}?${createQueryString("page", page.toString())}`);
    };

    if (totalPages <= 1) return null;

    // Calculate visible pages (max 5)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    return (
        <div className="flex items-center justify-center gap-3 mt-12 py-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* First Page */}
            <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1A1C23] hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 border border-white/5 hover:scale-110 active:scale-95 group"
                title="Trang đầu"
            >
                <ChevronLeft className="w-4 h-4 -mr-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Previous Page */}
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1A1C23] hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 border border-white/5 hover:scale-110 active:scale-95"
                title="Trang trước"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1C23] border border-white/10">
                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 relative overflow-hidden",
                            currentPage === page
                                ? "bg-primary text-black shadow-[0_0_15px_rgba(234,179,8,0.5)] scale-110"
                                : "text-gray-400 hover:text-white hover:bg-white/10"
                        )}
                    >
                        {currentPage === page && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-50" />
                        )}
                        {page}
                    </button>
                ))}
            </div>

            {/* Next Page */}
            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1A1C23] hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 border border-white/5 hover:scale-110 active:scale-95"
                title="Trang sau"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Last Page */}
            <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1A1C23] hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 border border-white/5 hover:scale-110 active:scale-95 group"
                title="Trang cuối"
            >
                <ChevronRight className="w-4 h-4" />
                <ChevronRight className="w-4 h-4 -ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
        </div>
    );
}
