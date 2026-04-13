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
import FeaturedActors from "@/components/FeaturedActors";

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
        <main className="min-h-screen pb-24 md:pb-16 bg-[#0a0a0a] relative">
            <div className="pt-24 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 relative">
                {/* Decorative background glow */}
                <div className={cn("absolute top-0 left-0 right-0 h-[500px] via-transparent to-transparent pointer-events-none -z-10 blur-[130px] opacity-60", theme.glow)} />

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

                    <div className="w-full md:w-auto bg-white/[0.03] backdrop-blur-md rounded-[12px] p-1 border border-white/[0.06] shadow-xl overflow-visible relative z-20">
                        <Suspense fallback={<div className="w-32 h-8 bg-white/5 animate-pulse rounded" />}>
                            <FilterBar categories={categories} countries={countries} hideCountry={true} />
                        </Suspense>
                    </div>
                </div>

                <FeaturedActors movies={initialData.items} />

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
