import KoreaHero from "@/components/KoreaHero";
import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMenuData, getMovieDetail, getMoviesByCountryAndCategory } from "@/services/api";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import MovieRow from "@/components/MovieRow";
import ActorRow from "@/components/ActorRow";
import { cn } from "@/lib/utils";
import { getThemeBySlug } from "@/lib/theme";
import { getResilientMoviesList } from "@/app/actions/movies";
import { sanitizeMovieList } from "@/lib/movie-list";
import {
    buildCountryHomeSections,
    filterByCategory,
    getCountryPagePool,
    type CountryHomeSectionConfig,
} from "@/services/country-page";
import { matchesCountryForDisplay } from "@/lib/movie-country";

export const revalidate = 300;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
    let timer: NodeJS.Timeout | null = null;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((resolve) => {
                timer = setTimeout(() => resolve(fallback), timeoutMs);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
};

export async function generateMetadata(): Promise<Metadata> {
    const { countries } = await getMenuData();
    const country = countries.find((item) => item.slug === "han-quoc");
    const countryName = country?.name || "Hàn Quốc";

    return {
        title: `Phim ${countryName} - KHOIPHIM`,
        description: `Xem hàng ngàn bộ phim ${countryName} hay nhất, chất lượng cao, vietsub chuẩn tại KHOIPHIM.`,
    };
}

const FEATURED_ACTORS = [
    { name: "Kim Soo-hyun", role: "Nữ Hoàng Nước Mắt", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/q24P4pmtWGhe08T7rTkoDc5EC1p.jpg" },
    { name: "Kim Ji-won", role: "Nữ Hoàng Nước Mắt", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/lX7W1j9kg4jV6XNn5XEE3rKsd3x.jpg" },
    { name: "Ji Chang-wook", role: "Chào mừng tới Samdal-ri", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/sBmHrO5Tn27Ot5hy0yAKniROmNb.jpg" },
    { name: "Song Hye-kyo", role: "Vinh Quang Trong Hận Thù", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/tlAX3f82Mf5h0rznpVBVK7nD2om.jpg" },
    { name: "Hyun Bin", role: "Hạ Cánh Nơi Anh", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/JQFzhO9j8HRiyr7leGPj6cqhvM.jpg" },
    { name: "Son Ye-jin", role: "Hạ Cánh Nơi Anh", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/pR3QiJKcMBG7oseZUnnU54lgU1V.jpg" },
    { name: "Gong Yoo", role: "Yêu Tinh (Goblin)", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/ocGoFb6TrK3uWGXt4WnuibUG1vD.jpg" },
    { name: "Bae Suzy", role: "Khởi Nghiệp (Start-up)", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/xdmQeM0UuwVGyZucc3eLhynlb7b.jpg" },
    { name: "Lee Jung-jae", role: "Trò Chơi Con Mực", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/lx8oiTXL9lIx78KOXlrlvNfoz43.jpg" },
    { name: "Jun Ji-hyun", role: "Vì Sao Đưa Anh Tới", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/pM5U2KH8RmuV1F7RsoE7Pn6AyhP.jpg" },
    { name: "Song Joong-ki", role: "Hậu Duệ Mặt Trời", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/kgjb5OppOVTh5tz3hhnfDVnTvDv.jpg" },
    { name: "Park Shin-hye", role: "Người Thừa Kế", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/pumaPD2AtInYXXYsLirfFdYa4yc.jpg" },
];

const SECTION_CONFIG: CountryHomeSectionConfig[] = [
    { title: "Phim Tình Cảm", categorySlug: "tinh-cam", fallbackOffset: 14, priorityFirst: true },
    { title: "Phim Hành Động", categorySlug: "hanh-dong", fallbackOffset: 46 },
    { title: "Phim Cổ Trang", categorySlug: "co-trang", fallbackOffset: 78 },
    { title: "Phim Hài Hước", categorySlug: "hai-huoc", fallbackOffset: 110 },
    { title: "Phim Kinh Dị", categorySlug: "kinh-di", fallbackOffset: 142 },
    { title: "Phim Hoạt Hình", categorySlug: "hoat-hinh", fallbackOffset: 174 },
    { title: "Phim Hình Sự", categorySlug: "hinh-su", fallbackOffset: 206 },
    { title: "Phim Võ Thuật", categorySlug: "vo-thuat", fallbackOffset: 238 },
    { title: "Phim Tâm Lý", categorySlug: "tam-ly", fallbackOffset: 14 },
];

const HERO_SLUGS = [
    "nghe-thuat-lua-doi-cua-sarah",
    "khi-cuoc-doi-cho-ban-qua-quyt",
    "tieng-yeu-nay-anh-dich-duoc-khong",
    "ban-trai-theo-yeu-cau",
    "trao-em-ca-vu-tru",
];

const HERO_FALLBACK_META: Record<string, { name: string; year?: number }> = {
    "nghe-thuat-lua-doi-cua-sarah": { name: "Nghệ Thuật Lừa Dối Của Sarah", year: 2026 },
    "khi-cuoc-doi-cho-ban-qua-quyt": { name: "Khi Cuộc Đời Cho Bạn Quả Quýt", year: 2025 },
    "tieng-yeu-nay-anh-dich-duoc-khong": { name: "Tiếng Yêu Này Anh Dịch Được Không?", year: 2025 },
    "ban-trai-theo-yeu-cau": { name: "Bạn Trai Theo Yêu Cầu", year: 2025 },
    "trao-em-ca-vu-tru": { name: "Trao Em Cả Vũ Trụ", year: 2025 },
};

async function resolveHeroMovies(slugs: string[], fallbackItems: any[], countryName: string) {
    const bySlug = new Map(fallbackItems.map((movie) => [movie.slug, movie]));

    const resolved = await Promise.all(
        slugs.map(async (slug) => {
            const cached = bySlug.get(slug);
            if (cached) return cached;

            try {
                const detail = await getMovieDetail(slug);
                if (detail?.movie) {
                    return detail.movie;
                }
            } catch {}

            const fallback = HERO_FALLBACK_META[slug];
            if (!fallback) return null;

            return {
                _id: slug,
                slug,
                name: fallback.name,
                origin_name: fallback.name,
                content: "",
                category: [],
                country: [{ name: countryName, slug: "han-quoc" }],
                year: fallback.year || 2025,
                episode_current: "Full",
            };
        })
    );

    return resolved.filter(Boolean);
}

async function resolveCountrySections(
    countrySlug: string,
    countryItems: any[],
    configs: CountryHomeSectionConfig[]
) {
    const baseSections = buildCountryHomeSections(countryItems, configs);

    const sections = await Promise.all(
        configs.map(async (config) => {
            const baseSection = baseSections.find((section) => section.categorySlug === config.categorySlug);
            const localCategory = filterByCategory(countryItems, config.categorySlug);
            const baseMovies = sanitizeMovieList(
                [...(baseSection?.movies || []), ...localCategory],
                { limit: 24 }
            );

            if (baseMovies.length >= 8) {
                return { ...config, movies: baseMovies };
            }

            const remote = await withTimeout(
                getMoviesByCountryAndCategory(countrySlug, config.categorySlug, 72),
                5200,
                { items: [] as any[], pagination: { currentPage: 1, totalPages: 1 } }
            );

            const merged = sanitizeMovieList(
                [...baseMovies, ...(remote.items || [])],
                { limit: 24 }
            );

            return merged.length >= 4 ? { ...config, movies: merged } : null;
        })
    );

    return sections.filter(Boolean);
}

async function PhimHanHome() {
    const { countryItems, fallbackItems } = await getCountryPagePool("han-quoc").catch(() => ({
        countryItems: [] as any[],
        fallbackItems: [] as any[],
    }));
    const latestMovies = fallbackItems.length > 0
        ? fallbackItems.slice(0, 14)
        : (await getResilientMoviesList("han-quoc", 1, 14, { country: "han-quoc" })).items || [];
    const sections = await resolveCountrySections("han-quoc", countryItems, SECTION_CONFIG);

    return (
        <div className="space-y-12 md:space-y-16 pb-12">
            <MovieRow title="Phim Mới Cập Nhật" movies={latestMovies} slug="/quoc-gia/han-quoc" priorityFirst />

            {sections.slice(0, 3).map((section) => (
                <MovieRow
                    key={section.categorySlug}
                    title={section.title}
                    movies={section.movies}
                    slug={`/the-loai/${section.categorySlug}`}
                    priorityFirst={section.priorityFirst}
                />
            ))}

            <ActorRow title="Diễn viên nổi bật" actors={FEATURED_ACTORS} />

            {sections.slice(3).map((section) => (
                <MovieRow
                    key={section.categorySlug}
                    title={section.title}
                    movies={section.movies}
                    slug={`/the-loai/${section.categorySlug}`}
                    priorityFirst={section.priorityFirst}
                />
            ))}
        </div>
    );
}

async function CountryGridStream({ slug, page, limit = 49 }: { slug: string; page: number; limit?: number }) {
    const data = await getResilientMoviesList("country", page, limit, { country: slug });
    const movies = (data.items || []).filter((movie: any) => matchesCountryForDisplay(movie, slug));

    if (movies.length === 0) {
        return <div className="py-20 text-center text-white/40">Không tìm thấy phim nào.</div>;
    }

    return (
        <div className="px-2 sm:px-6 md:px-12 lg:pl-24 lg:pr-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 mb-12">
                {movies.map((movie: any) => (
                    <MovieCard key={movie._id || movie.slug} movie={movie} />
                ))}
            </div>
            <Pagination currentPage={data.pagination.currentPage} totalPages={data.pagination.totalPages} />
        </div>
    );
}

async function KoreaHeroWithData() {
    const { fallbackItems } = await getCountryPagePool("han-quoc").catch(() => ({
        countryItems: [] as any[],
        fallbackItems: [] as any[],
    }));
    const heroMovies = await resolveHeroMovies(HERO_SLUGS, fallbackItems, "Hàn Quốc");

    return <KoreaHero initialMovies={heroMovies} />;
}

export default async function PhimHanPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const sParams = await searchParams;
    const currentPage = Number(sParams.page) || 1;
    const limit = 49;
    const slug = "han-quoc";
    const theme = getThemeBySlug(slug);

    const menuData = await withTimeout(getMenuData(), 1500, { categories: [], countries: [] });
    const categories = menuData?.categories || [];
    const countries = menuData?.countries || [];
    const country = countries.find((item) => item.slug === slug);
    const countryName = country?.name || "Phim Hàn Quốc";

    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a]">
            {currentPage === 1 && <KoreaHeroWithData />}

            <div className={cn("relative z-10", currentPage === 1 ? "" : "pt-24", "lg:pl-20")}>
                <div className={cn("absolute top-0 left-0 right-0 h-[600px] via-transparent to-transparent pointer-events-none -z-10 blur-[150px] opacity-50", theme.glow)} />

                {currentPage === 1 ? (
                    <div className="-mt-4 md:-mt-8 lg:-mt-10 xl:-mt-12 relative z-50 w-full">
                        <PhimHanHome />
                    </div>
                ) : (
                    <div className="w-full max-w-[1920px] mx-auto">
                        <div className="px-2 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="max-w-4xl">
                                <Link
                                    href="/phim-han"
                                    className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-[13px] font-medium transition-colors mb-4 group"
                                >
                                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                    Quay lại Phim Hàn
                                </Link>

                                <div className="space-y-1">
                                    <h1 className="text-[32px] md:text-[40px] lg:text-[48px] font-outfit font-extrabold text-white tracking-tighter leading-tight uppercase drop-shadow-lg">
                                        {countryName} <span className="text-primary/50 mx-2">/</span> Trang {currentPage}
                                    </h1>
                                </div>
                            </div>

                            <div className="w-full md:w-auto bg-[#0a0a0a]/80 backdrop-blur-md rounded-[12px] p-1 border border-white/[0.05] shadow-xl">
                                <FilterBar categories={categories} countries={countries} />
                            </div>
                        </div>

                        <CountryGridStream slug={slug} page={currentPage} limit={limit} />
                    </div>
                )}
            </div>
        </main>
    );
}
