import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import { getMenuData } from "@/services/api";
import { getResilientMoviesList } from "@/app/actions/movies";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getThemeBySlug } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";

// Revalidate mỗi 5 phút
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const { categories } = await getMenuData();
    const category = categories.find(c => c.slug === slug);
    const categoryName = category?.name || slug.replace(/-/g, " ");

    const canonical = `https://khoiphim.org/the-loai/${slug}`;
    return {
        title: `Phim ${categoryName} Vietsub HD Mới Nhất | KHOIPHIM`,
        description: `Xem phim ${categoryName} vietsub, thuyết minh, lồng tiếng mới nhất chất lượng cao miễn phí tại KHOIPHIM. Cập nhật hàng ngày.`,
        keywords: `phim ${categoryName}, xem phim ${categoryName} vietsub, ${categoryName} vietsub HD, phim ${categoryName} lồng tiếng, phim ${categoryName} thuyết minh, phim ${categoryName} mới nhất`,
        alternates: { canonical },
        robots: { index: true, follow: true },
        openGraph: {
            title: `Phim ${categoryName} Vietsub HD | KHOIPHIM`,
            description: `Tuyển tập phim ${categoryName} hay nhất, mới nhất - vietsub HD miễn phí.`,
            url: canonical,
            type: "website",
        },
    };
}

import CategoryGridClient from "@/components/CategoryGridClient";

export default async function CategoryPage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ page?: string; country?: string; year?: string }>
}) {
    const { slug } = await params;
    const sParams = await searchParams;
    const currentPage = Number(sParams.page) || 1;

    const userAgent = (await headers()).get('user-agent') || '';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const limit = isMobile ? 28 : 49;

    // Fetch menu data and initial grid data concurrently
    const isSpecialType = slug === 'phim-chieu-rap';
    const [{ categories, countries }, initialData] = await Promise.all([
        getMenuData(),
        getResilientMoviesList(
            isSpecialType ? slug : "category",
            currentPage, limit,
            isSpecialType
                ? { country: sParams.country, year: sParams.year }
                : { category: slug, country: sParams.country, year: sParams.year }
        ).catch(() => ({ items: [], pagination: undefined })),
    ]);

    // Resolve properly formatted name (with full diacritics)
    const category = categories.find(c => c.slug === slug);
    const categoryName = category?.name || (slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "));

    const theme = getThemeBySlug(slug);
    const displayLabel = isSpecialType ? "Danh sách" : "Thể loại";
    const displayTitle = isSpecialType ? "Phim Chiếu Rạp" : categoryName;

    const currentYear = new Date().getFullYear();
    const years = [
        ...Array.from({ length: 30 }, (_, i) => ({
            name: `${currentYear - i}`,
            slug: `${currentYear - i}`,
        })),
        { name: "2010s", slug: "2010" },
        { name: "2000s", slug: "2000" },
        { name: "1990s", slug: "1990" },
    ];

    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a] relative overflow-hidden">
            {/* Onflix-style top banner gradient */}
            <div className={cn("fixed top-0 inset-x-0 h-[55vh] bg-gradient-to-b to-transparent pointer-events-none z-0", theme.banner)} />
            {/* Soft glow blob for depth */}
            <div className={cn("absolute top-0 left-1/4 w-[700px] h-[300px] via-transparent to-transparent pointer-events-none -z-10 blur-[120px] opacity-40", theme.glow)} />
            <div className="pt-24 w-full max-w-[1920px] mx-auto px-2 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 relative z-10">

                <div className="mb-4 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
                    <div className="max-w-4xl">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-[12px] font-medium transition-colors mb-2 sm:mb-3 group"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            Quay lại
                        </Link>

                        <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-[#8FA7C5] text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 pl-0.5">
                                {displayLabel}
                            </p>
                            <h1 className="text-[22px] sm:text-[30px] md:text-[38px] lg:text-[46px] font-outfit font-extrabold text-white tracking-tighter leading-tight uppercase drop-shadow-lg">
                                {displayTitle}
                            </h1>
                        </div>
                    </div>

                    <div className="w-full md:w-auto bg-[#07070b]/78 backdrop-blur-md rounded-[12px] p-1 border border-white/[0.06] shadow-xl overflow-visible relative z-20">
                        <Suspense fallback={<div className="w-32 h-8 bg-white/5 animate-pulse rounded" />}>
                            <FilterBar categories={categories} countries={countries} years={years} hideCategory={!!category} hideCountry={!!sParams.country} />
                        </Suspense>
                    </div>
                </div>

                <CategoryGridClient
                    slug={slug}
                    page={currentPage}
                    country={sParams.country}
                    year={sParams.year}
                    limit={limit}
                    isTypeFallback={isSpecialType}
                    initialMovies={initialData.items}
                    initialPagination={initialData.pagination}
                />
            </div>
        </main>
    );
}

