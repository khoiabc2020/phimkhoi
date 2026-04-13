import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import { getResilientMoviesList } from "@/app/actions/movies";
import { getMenuData } from "@/services/api";
import { Metadata } from "next";
import { headers } from "next/headers";
import { getThemeBySlug } from "@/lib/theme";
import { cn } from "@/lib/utils";
import TypeGridClient from "@/components/TypeGridClient";

// Revalidate mỗi 5 phút - cân bằng giữa freshness và server load
export const revalidate = 300;

interface PageProps {
    params: Promise<{ type: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const TYPE_NAMES: Record<string, string> = {
    "phim-le": "Phim Lẻ",
    "phim-bo": "Phim Bộ",
    "hoat-hinh": "Hoạt Hình",
    "tv-shows": "TV Shows",
    "phim-sap-chieu": "Phim Sắp Chiếu",
    "phim-moi": "Phim Mới",
    "phim-moi-cap-nhat": "Phim Mới Cập Nhật",
    "thuyet-minh": "Phim Thuyết Minh",
    "vietsub": "Phim Vietsub",
    "long-tieng": "Phim Lồng Tiếng",
    "phim-thuyet-minh": "Phim Thuyết Minh",
    "phim-vietsub": "Phim Vietsub",
    "phim-long-tieng": "Phim Lồng Tiếng",
    "phim-bo-dang-chieu": "Phim Bộ Đang Chiếu",
    "phim-bo-hoan-thanh": "Phim Bộ Hoàn Thành",
    "phim-le-dang-chieu": "Phim Lẻ Đang Chiếu",
    "phim-le-hoan-thanh": "Phim Lẻ Hoàn Thành",
    "phim-hanh-dong": "Phim Hành Động",
    "phim-tinh-cam": "Phim Tình Cảm",
    "phim-hai-huoc": "Phim Hài Hước",
    "phim-co-trang": "Phim Cổ Trang",
    "phim-tam-ly": "Phim Tâm Lý",
    "phim-hinh-su": "Phim Hình Sự",
    "phim-chien-tranh": "Phim Chiến Tranh",
    "phim-vien-tuong": "Phim Viễn Tưởng",
    "phim-kinh-di": "Phim Kinh Dị",
    "phim-tai-lieu": "Phim Tài Liệu",
    "phim-bi-an": "Phim Bí Ẩn",
    "phim-hoc-duong": "Phim Học Đường",
    "phim-khoa-hoc": "Phim Khoa Học",
    "phim-than-thoai": "Phim Thần Thoại",
    "phim-vo-thuat": "Phim Võ Thuật",
    "phim-gia-dinh": "Phim Gia Đình",
    "phim-hoat-hinh": "Phim Hoạt Hình",
    "phim-chieu-rap": "Phim Chiếu Rạp",
    "phim-18": "Phim 18+",
    "tat-ca-the-loai": "Tất Cả Phim",
};

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
    const { type } = await params;
    const typeName = TYPE_NAMES[type] || "Danh Sách Phim";
    const canonical = `https://khoiphim.org/danh-sach/${type}`;
    return {
        title: `${typeName} - KHOIPHIM`,
        description: `Xem ${typeName} chất lượng cao tại KHOIPHIM.`,
        alternates: {
            canonical,
        },
        openGraph: {
            title: `${typeName} | KHOIPHIM`,
            description: `Xem ${typeName} chất lượng cao tại KHOIPHIM.`,
            url: canonical,
            type: "website",
        },
    };
}

export default async function CatalogPage({ params, searchParams }: PageProps) {
    const { type } = await params;
    const resolvedSearchParams = await searchParams;

    const page = Number(resolvedSearchParams.page) || 1;
    const userAgent = (await headers()).get('user-agent') || '';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const limit = isMobile ? 28 : 49;
    
    const theme = getThemeBySlug(type);
    const year = Number(resolvedSearchParams.year) || undefined;
    const category = (resolvedSearchParams.category as string) || undefined;
    const country = (resolvedSearchParams.country as string) || undefined;
    const quality = (resolvedSearchParams.quality as string) || undefined;
    const [{ categories, countries }, initialData] = await Promise.all([
        getMenuData(),
        getResilientMoviesList(
            (type === 'tat-ca-the-loai' || type === 'phim-moi') ? 'phim-moi-cap-nhat' : type,
            page, limit,
            { year: year?.toString(), category, country }
        ).catch(() => ({ items: [], pagination: undefined })),
    ]);
    const typeName = TYPE_NAMES[type] || type;

    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a] relative">
            {/* Onflix-style top banner gradient */}
            <div className={cn("absolute top-0 inset-x-0 h-[60vh] bg-gradient-to-b to-transparent pointer-events-none", theme.banner)} />

            <div className="pt-24 w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-8 lg:pl-24 lg:pr-12 relative">
                {/* Header — no box, Onflix-style free layout */}
                <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                    <div>
                        <p className="text-[#8FA7C5] text-[10px] font-bold uppercase tracking-[0.22em] mb-2 opacity-70">
                            Danh sách / {typeName}
                        </p>
                        <h1 className="text-[26px] sm:text-[34px] md:text-[44px] font-outfit font-black text-white tracking-tight leading-none uppercase drop-shadow-lg">
                            {typeName}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-white/35 text-xs font-medium">
                            Trang <span className="text-white/70 font-bold">{page}</span>
                        </span>
                        <Suspense fallback={<div className="w-32 h-8 bg-white/5 animate-pulse rounded" />}>
                            <FilterBar categories={categories} countries={countries} />
                        </Suspense>
                    </div>
                </div>

                <TypeGridClient
                    type={type}
                    page={page}
                    limit={limit}
                    category={category}
                    country={country}
                    year={year?.toString()}
                    initialMovies={initialData.items}
                    initialPagination={initialData.pagination}
                />

            </div>
        </main>
    );
}
