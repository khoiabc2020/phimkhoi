import { Suspense } from "react";
import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMoviesFromCache } from "@/lib/movie-cache";
import { getMenuData, getMoviesList } from "@/services/api";
import { Metadata } from "next";
import { headers } from "next/headers";
import { getThemeBySlug } from "@/lib/theme";
import { cn } from "@/lib/utils";

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
    "phim-vietsub": "Phim Vietsub",
    "phim-thuyet-minh": "Phim Thuyết Minh",
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
    const { categories, countries } = await getMenuData();
    const typeName = TYPE_NAMES[type] || type;

    // [Elite Performance] Try DB Cache on page 1-3 with no complex filters
    let data;
    try {
        if (!year && !category && !country && !quality && page <= 3) {
            const endpoint = type === 'tat-ca-the-loai' ? 'phim-moi-cap-nhat' : (type === 'phim-moi' ? 'phim-moi' : type);
            const cached = await getMoviesFromCache(endpoint, page, limit);
            if (cached) {
                data = cached;
            }
        }

        if (!data) {
            if (type === 'phim-moi' || type === 'tat-ca-the-loai') {
                const endpoint = type === 'tat-ca-the-loai' ? 'phim-moi-cap-nhat' : type;
                data = await getMoviesList(endpoint, { page, year, category, country, quality, limit });
            } else {
                data = await getMoviesList(type, { page, year, category, country, quality, limit });
            }
        }
    } catch (error) {
        console.error("Catalog Error", error);
        data = { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }

    const { items, pagination } = data;

    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a] relative overflow-hidden">
            {/* Decorative background glow */}
            <div className={cn("absolute top-0 left-0 right-0 h-[600px] via-transparent to-transparent pointer-events-none -z-10 blur-[150px] opacity-50", theme.glow)} />
            
            <div className="pt-24 w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 lg:pl-24 lg:pr-12">
                <div className="mb-6 rounded-[12px] border border-white/[0.06] bg-[#07070b]/78 backdrop-blur-md p-4 md:p-5 shadow-xl transition-all">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-[#8FA7C5] text-[11px] font-bold uppercase tracking-[0.2em] opacity-80 pl-1">
                                Danh sách / {typeName}
                            </p>
                            <h1 className="text-[30px] md:text-[40px] font-outfit font-extrabold text-white tracking-tighter leading-tight italic uppercase drop-shadow-lg">
                                {typeName}
                            </h1>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3 flex-1">
                            <p className="text-white/40 text-xs font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                Trang <span className="text-white font-bold">{pagination?.currentPage}</span> / <span className="text-white/60">{pagination?.totalPages}</span>
                            </p>
                            <div className="w-full md:w-auto">
                                <Suspense fallback={<div className="w-32 h-8 bg-white/5 animate-pulse rounded" />}>
                                    <FilterBar categories={categories} countries={countries} />
                                </Suspense>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid: content-visibility giúp giảm CPU khi cuộn */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-2.5 md:gap-3 mt-6 [contain:layout_paint]">
                    {items?.length > 0 ? (
                        items.map((movie: any, idx: number) => (
                            <MovieCard key={movie._id} movie={movie} priority={idx < 14} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-gray-400">
                            Không tìm thấy phim nào.
                        </div>
                    )}
                </div>
                {/* Pagination */}
                {pagination && (
                    <Suspense fallback={<div className="h-10 bg-white/5 rounded-lg animate-pulse" />}>
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                        />
                    </Suspense>
                )}
            </div>
        </main>
    );
}
