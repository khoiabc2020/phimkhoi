"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { ChevronDown } from "lucide-react";

export default function FilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === "all") {
                params.delete(name);
            } else {
                params.set(name, value);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleFilterChange = (name: string, value: string) => {
        const nextPath = `${pathname}?${createQueryString(name, value)}`;
        router.prefetch(nextPath);
        startTransition(() => {
            router.replace(nextPath);
        });
    };

    const categories = [
        { name: "Thể loại", value: "all" },
        { name: "Hành Động", value: "hanh-dong" },
        { name: "Tình Cảm", value: "tinh-cam" },
        { name: "Hài Hước", value: "hai-huoc" },
        { name: "Cổ Trang", value: "co-trang" },
        { name: "Tâm Lý", value: "tam-ly" },
        { name: "Hình Sự", value: "hinh-su" },
        { name: "Chiến Tranh", value: "chien-tranh" },
        { name: "Thể Thao", value: "the-thao" },
        { name: "Võ Thuật", value: "vo-thuat" },
        { name: "Viễn Tưởng", value: "vien-tuong" },
        { name: "Kinh Dị", value: "kinh-di" },
        { name: "Tài Liệu", value: "tai-lieu" },
        { name: "Bí Ẩn", value: "bi-an" },
        { name: "Học Đường", value: "hoc-duong" },
        { name: "Kinh Điển", value: "kinh-dien" },
        { name: "Phim 18+", value: "phim-18" },
    ];

    const countries = [
        { name: "Quốc gia", value: "all" },
        { name: "Trung Quốc", value: "trung-quoc" },
        { name: "Hàn Quốc", value: "han-quoc" },
        { name: "Nhật Bản", value: "nhat-ban" },
        { name: "Thái Lan", value: "thai-lan" },
        { name: "Âu Mỹ", value: "au-my" },
        { name: "Đài Loan", value: "dai-loan" },
        { name: "Hồng Kông", value: "hong-kong" },
        { name: "Ấn Độ", value: "an-do" },
        { name: "Anh", value: "anh" },
        { name: "Pháp", value: "phap" },
        { name: "Canada", value: "canada" },
        { name: "Việt Nam", value: "viet-nam" },
    ];

    const currentYear = new Date().getFullYear();
    const years = [
        { name: "Năm", value: "all" },
        ...Array.from({ length: 20 }, (_, i) => ({
            name: `${currentYear - i}`,
            value: `${currentYear - i}`,
        })),
    ];

    return (
        <div>
            <div className="flex flex-wrap gap-2 sm:gap-3 py-3">
                {/* Category Dropdown */}
                <div className="relative group">
                    <select
                        onChange={(e) => handleFilterChange("category", e.target.value)}
                        className="appearance-none min-w-[126px] bg-[#0b0b10] border border-white/[0.08] text-white/90 py-2 px-3 pr-8 rounded-[10px] leading-tight focus:outline-none focus:border-[#33445c] cursor-pointer text-sm"
                        value={searchParams.get("category") || "all"}
                        disabled={isPending}
                    >
                        {categories.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/70">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>

                {/* Country Dropdown */}
                <div className="relative group">
                    <select
                        onChange={(e) => handleFilterChange("country", e.target.value)}
                        className="appearance-none min-w-[126px] bg-[#0b0b10] border border-white/[0.08] text-white/90 py-2 px-3 pr-8 rounded-[10px] leading-tight focus:outline-none focus:border-[#33445c] cursor-pointer text-sm"
                        value={searchParams.get("country") || "all"}
                        disabled={isPending}
                    >
                        {countries.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/70">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>

                {/* Year Dropdown */}
                <div className="relative group">
                    <select
                        onChange={(e) => handleFilterChange("year", e.target.value)}
                        className="appearance-none min-w-[110px] bg-[#0b0b10] border border-white/[0.08] text-white/90 py-2 px-3 pr-8 rounded-[10px] leading-tight focus:outline-none focus:border-[#33445c] cursor-pointer text-sm"
                        value={searchParams.get("year") || "all"}
                        disabled={isPending}
                    >
                        {years.map((y) => (
                            <option key={y.value} value={y.value}>
                                {y.name}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/70">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {isPending && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-2.5 md:gap-3 pt-1 [contain:layout_paint]">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="aspect-[2/3] rounded-lg bg-white/[0.06] border border-white/[0.06] animate-pulse" />
                    ))}
                </div>
            )}
        </div>
    );
}
