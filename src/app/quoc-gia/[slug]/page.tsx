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
    const { countries } = await getMenuData();
    const country = countries.find(c => c.slug === slug);
    const countryName = country?.name || slug.replace(/-/g, " ");

    const canonical = `https://khoiphim.org/quoc-gia/${slug}`;
    return {
        title: `Phim ${countryName} Vietsub HD Mới Nhất | KHOIPHIM`,
        description: `Xem phim ${countryName} vietsub, thuyết minh chất lượng cao miễn phí tại KHOIPHIM. Hàng ngàn bộ phim ${countryName} hay nhất cập nhật hàng ngày.`,
        keywords: `phim ${countryName}, xem phim ${countryName} vietsub, phim ${countryName} vietsub HD, phim ${countryName} lồng tiếng, phim ${countryName} mới nhất`,
        alternates: { canonical },
        robots: { index: true, follow: true },
        openGraph: {
            title: `Phim ${countryName} Vietsub HD | KHOIPHIM`,
            description: `Tuyển tập phim ${countryName} hay nhất, mới nhất - vietsub HD miễn phí tại KHOIPHIM.`,
            url: canonical,
            type: "website",
        },
    };
}

import CountryGridClient from "@/components/CountryGridClient";

export default async function CountryPage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ slug: string }>, 
    searchParams: Promise<{ page?: string; category?: string; year?: string }> 
}) {
    const { slug } = await params;
    const sParams = await searchParams;
    const currentPage = Number(sParams.page) || 1;

    const userAgent = (await headers()).get('user-agent') || '';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const limit = isMobile ? 28 : 49;

    // Fetch menu data and initial grid data concurrently
    const [{ categories, countries }, initialData] = await Promise.all([
        getMenuData(),
        getResilientMoviesList("country", currentPage, limit, {
            country: slug,
            category: sParams.category,
            year: sParams.year,
        }).catch(() => ({ items: [], pagination: undefined })),
    ]);

    // Resolve properly formatted name (with full diacritics)
    const country = countries.find(c => c.slug === slug);
    const countryName = country?.name || (slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "));

    const theme = getThemeBySlug(slug);
    const displayLabel = "Quốc gia";
    const displayTitle = countryName;

    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a] relative">
            {/* Onflix-style top banner gradient */}
            <div className={cn("absolute top-0 inset-x-0 h-[60vh] bg-gradient-to-b to-transparent pointer-events-none", theme.banner)} />
            <div className="pt-24 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 relative">

                <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-[11px] font-medium transition-colors mb-3 group"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            Quay lại
                        </Link>
                        <p className="text-[#8FA7C5] text-[10px] font-bold uppercase tracking-[0.22em] mb-2 opacity-70">
                            {displayLabel}
                        </p>
                        <h1 className="text-[26px] sm:text-[34px] md:text-[44px] font-outfit font-black text-white tracking-tight leading-none uppercase drop-shadow-lg">
                            {displayTitle}
                        </h1>
                    </div>
                    <div className="shrink-0 overflow-visible relative z-20">
                        <Suspense fallback={<div className="w-32 h-8 bg-white/5 animate-pulse rounded" />}>
                            <FilterBar categories={categories} countries={countries} hideCountry={true} />
                        </Suspense>
                    </div>
                </div>

                <CountryGridClient
                    slug={slug}
                    page={currentPage}
                    category={sParams.category}
                    year={sParams.year}
                    limit={limit}
                    initialMovies={initialData.items}
                    initialPagination={initialData.pagination}
                />
            </div>
        </main>
    );
}
