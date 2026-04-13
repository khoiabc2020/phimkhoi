import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import { getResilientMoviesList } from "@/app/actions/movies";
import { getMenuData } from "@/services/api";
import { Metadata } from "next";
import { headers } from "next/headers";
import { getThemeBySlug } from "@/lib/theme";
import { cn } from "@/lib/utils";
import TypeGridClient from "@/components/TypeGridClient";
import FeaturedActors from "@/components/FeaturedActors";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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
        <main className="min-h-screen pb-24 md:pb-16 bg-[#0a0a0a] relative">
            {/* Decorative background glow */}
            <div className={cn("absolute top-0 left-0 right-0 h-[600px] via-transparent to-transparent pointer-events-none -z-10 blur-[150px] opacity-50", theme.glow)} />
            
            <div className="pt-24 w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 lg:pl-24 lg:pr-12">
                <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="max-w-4xl">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-[13px] font-medium transition-colors mb-4 group"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Quay lại
                        </Link>
                        <div className="space-y-1">
                            <p className="text-[#8FA7C5] text-[11px] font-bold uppercase tracking-[0.2em] opacity-80 pl-1">
                                Danh sách
                            </p>
                            <h1 className="text-[30px] md:text-[40px] lg:text-[48px] font-outfit font-extrabold text-white tracking-tighter leading-tight uppercase drop-shadow-lg">
                                {typeName}
                            </h1>
                        </div>
                    </div>

                    <div className="w-full md:w-auto bg-white/[0.03] backdrop-blur-md rounded-[12px] p-1 border border-white/[0.06] shadow-xl overflow-visible relative z-20">
                        <Suspense fallback={<div className="w-32 h-8 bg-white/5 animate-pulse rounded" />}>
                            <FilterBar categories={categories} countries={countries} />
                        </Suspense>
                    </div>
                </div>

                <FeaturedActors movies={initialData.items} />

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
