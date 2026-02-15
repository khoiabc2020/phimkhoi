"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

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
        router.push(`${pathname}?${createQueryString(name, value)}`);
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
        <div className="flex flex-wrap gap-4 py-6">
            {/* Category Dropdown */}
            <div className="relative group">
                <select
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                    className="appearance-none bg-black border border-gray-700 text-white py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:border-primary cursor-pointer"
                    value={searchParams.get("category") || "all"}
                >
                    {categories.map((c) => (
                        <option key={c.value} value={c.value}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>

            {/* Country Dropdown */}
            <div className="relative group">
                <select
                    onChange={(e) => handleFilterChange("country", e.target.value)}
                    className="appearance-none bg-black border border-gray-700 text-white py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:border-primary cursor-pointer"
                    value={searchParams.get("country") || "all"}
                >
                    {countries.map((c) => (
                        <option key={c.value} value={c.value}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>

            {/* Year Dropdown */}
            <div className="relative group">
                <select
                    onChange={(e) => handleFilterChange("year", e.target.value)}
                    className="appearance-none bg-black border border-gray-700 text-white py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:border-primary cursor-pointer"
                    value={searchParams.get("year") || "all"}
                >
                    {years.map((y) => (
                        <option key={y.value} value={y.value}>
                            {y.name}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
}
