import ChinaHero from "@/components/ChinaHero";
import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMenuData, getMoviesByCountryAndCategory } from "@/services/api";
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
    const menuData = await getMenuData();
    const countries = menuData?.countries || [];
    const slug = "trung-quoc";
    const country = countries.find((item) => item.slug === slug);
    const countryName = country?.name || "Trung Quốc";

    return {
        title: `Phim ${countryName} - KHOIPHIM`,
        description: `Xem hàng ngàn bộ phim ${countryName} hay nhất, chất lượng cao, vietsub chuẩn tại KHOIPHIM.`,
    };
}

const FEATURED_ACTORS = [
    { name: "Tiêu Chiến", role: "Ngọc Cốt Dao", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/468n73j2sSJIbfZvsIZvDpvUaS8.jpg" },
    { name: "Vương Nhất Bác", role: "Trần Tình Lệnh", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/5akr656RvJX8hl1pa1qZckfiQeF.jpg" },
    { name: "Địch Lệ Nhiệt Ba", role: "Trường Ca Hành", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/bLa0rBHdZ4Su1l5Xh0cY4mTB70Z.jpg" },
    { name: "Triệu Lộ Tư", role: "Thần Ẩn", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/y82wmaDqTdXqvtasb4kxAIuT44U.jpg" },
    { name: "Cung Tuấn", role: "An Lạc Truyện", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/rtjBdEF61NySmDDnoDgAtuclAJJ.jpg" },
    { name: "Ngu Thư Hân", role: "Thương Lan Quyết", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/xQ2Bur9AEy0IX3qHMvLbr7tmTyD.jpg" },
    { name: "Dương Tử", role: "Trường Tương Tư", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/uS80R3jOnm9Fm8k6P9uT8H6zF7x.jpg" },
    { name: "Hứa Khải", role: "Kháng Chiến Bút Mặc", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/n555fWjI0uVscG6S5Y0XnB7R5P0.jpg" },
    { name: "Cúc Tịnh Y", role: "Tiên Kiếm Kỳ Hiệp 4", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/jFf6pC5zS5s6E5vXf7G9u6W2zRr.jpg" },
    { name: "Trần Tinh Húc", role: "Người Phiên Dịch", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/pS7m1Gq7b5qWf0z9h8M6p2uX4u.jpg" },
    { name: "Trần Triết Viễn", role: "Vụng Trộm Không Thể Giấu", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/pS7m1Gq7b5qWf0z9h8M6p2uX4u.jpg" },
    { name: "Vương Tử Kỳ", role: "Tình Yêu Thôi Mà", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/uS80R3jOnm9Fm8k6P9uT8H6zF7x.jpg" },
];

const SECTION_CONFIG: CountryHomeSectionConfig[] = [
    { title: "Phim Tình Cảm", categorySlug: "tinh-cam", fallbackOffset: 14 },
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
    "duong-cung-ky-an-thanh-vu-phong-minh",
    "xin-chao-1983",
    "con-ra-the-thong-gi-nua",
    "bach-nguyet-phan-tinh",
    "bui-hoa-hong",
    "dai-mong-quy-ly",
    "giang-ho-da-vu-thap-nien-dang",
    "mac-nhan-tang-kieu",
    "ngoc-minh-tra-cot",
    "truc-ngoc",
];

const HERO_FALLBACK_META: Record<string, { name: string; year?: number }> = {
    "duong-cung-ky-an-thanh-vu-phong-minh": { name: "Đường Cùng Kỳ Án Thành Vụ Phong Minh", year: 2025 },
    "xin-chao-1983": { name: "Xin Chào 1983", year: 2026 },
    "con-ra-the-thong-gi-nua": { name: "Còn Ra Thể Thống Gì Nữa?", year: 2026 },
    "bach-nguyet-phan-tinh": { name: "Bạch Nguyệt Phạn Tinh", year: 2025 },
    "bui-hoa-hong": { name: "Bụi Hoa Hồng", year: 2025 },
    "dai-mong-quy-ly": { name: "Đại Mộng Quy Ly", year: 2025 },
    "giang-ho-da-vu-thap-nien-dang": { name: "Giang Hồ Dạ Vũ Thập Niên Đăng", year: 2025 },
    "mac-nhan-tang-kieu": { name: "Mạc Nhan Tàng Kiều", year: 2025 },
    "ngoc-minh-tra-cot": { name: "Ngọc Minh Trà Cốt", year: 2025 },
    "truc-ngoc": { name: "Trục Ngọc", year: 2025 },
};

const HERO_FALLBACK_DESC: Record<string, string> = {
    "duong-cung-ky-an-thanh-vu-phong-minh": "Vụ án cung đình bí ẩn, quyền lực và những lời thề bị che giấu.",
    "xin-chao-1983": "Chuyện đời, chuyện người và những lựa chọn đổi thay số phận.",
    "con-ra-the-thong-gi-nua": "Hài hước, lãng mạn và những cú twist bất ngờ.",
    "bach-nguyet-phan-tinh": "Mối duyên định mệnh dưới ánh trăng.",
    "bui-hoa-hong": "Danh vọng, tình yêu và bí mật bị vùi lấp.",
    "dai-mong-quy-ly": "Giang hồ dậy sóng, anh hùng trỗi dậy giữa mộng và thực.",
    "giang-ho-da-vu-thap-nien-dang": "Ân oán tái hiện trong đêm mưa dài.",
    "mac-nhan-tang-kieu": "Bí mật chôn vùi và hành trình tìm lại công bằng.",
    "ngoc-minh-tra-cot": "Báo thù, tình thân và sự thật cuối cùng.",
    "truc-ngoc": "Một mối tình cổ trang đầy định mệnh.",
};

async function resolveHeroMovies(slugs: string[], fallbackItems: any[], countryName: string) {
    const bySlug = new Map(fallbackItems.map((movie) => [movie.slug, movie]));

    const resolved = await Promise.all(
        slugs.map(async (slug) => {
            const cached = bySlug.get(slug);
            if (cached) return cached;

            const fallback = HERO_FALLBACK_META[slug];
            if (!fallback) return null;

            return {
                _id: slug,
                slug,
                name: fallback.name,
                origin_name: fallback.name,
                content: HERO_FALLBACK_DESC[slug] || "",
                category: [],
                country: [{ name: countryName, slug: "trung-quoc" }],
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

async function PhimTrungHome() {
    const pool = await getCountryPagePool("trung-quoc").catch(() => ({
        countryItems: [] as any[],
        fallbackItems: [] as any[],
    }));
    let countryItems = pool.countryItems || [];
    let fallbackItems = pool.fallbackItems || [];

    if (countryItems.length < 16) {
        const resilient = await getResilientMoviesList("country", 1, 120, { country: "trung-quoc" });
        if (resilient.items?.length) {
            countryItems = resilient.items;
            fallbackItems = resilient.items;
        }
    }

    const latestMovies = fallbackItems.length > 0
        ? fallbackItems.slice(0, 14)
        : (await getResilientMoviesList("trung-quoc", 1, 14, { country: "trung-quoc" })).items || [];
    const sections = await resolveCountrySections("trung-quoc", countryItems, SECTION_CONFIG);

    return (
        <div className="space-y-12 md:space-y-16 pb-12">
            <MovieRow title="Phim Đang Chiếu" movies={latestMovies} slug="/quoc-gia/trung-quoc" priorityFirst />

            {sections.slice(0, 2).map((section) => (
                <MovieRow
                    key={section.categorySlug}
                    title={section.title}
                    movies={section.movies}
                    slug={`/the-loai/${section.categorySlug}`}
                    priorityFirst={section.priorityFirst}
                />
            ))}

            <ActorRow title="Diễn viên nổi bật" actors={FEATURED_ACTORS} />

            {sections.slice(2).map((section) => (
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

async function ChinaHeroWithData() {
    const { fallbackItems } = await getCountryPagePool("trung-quoc").catch(() => ({
        countryItems: [] as any[],
        fallbackItems: [] as any[],
    }));
    const heroMovies = await resolveHeroMovies(HERO_SLUGS, fallbackItems, "Trung Quốc");

    return <ChinaHero initialMovies={heroMovies} />;
}

export default async function PhimTrungPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const sParams = await searchParams;
    const currentPage = Number(sParams.page) || 1;
    const limit = 49;
    const slug = "trung-quoc";
    const theme = getThemeBySlug(slug);

    const menuData = await withTimeout(getMenuData(), 1500, { categories: [], countries: [] });
    const categories = menuData?.categories || [];
    const countries = menuData?.countries || [];
    const country = countries.find((item) => item.slug === slug);
    const countryName = country?.name || "Phim Trung Quốc";

    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a]">
            {currentPage === 1 && <ChinaHeroWithData />}

            <div className={cn("relative z-10", currentPage === 1 ? "" : "pt-24", "lg:pl-20")}>
                <div className={cn("absolute top-0 left-0 right-0 h-[600px] via-transparent to-transparent pointer-events-none -z-10 blur-[150px] opacity-50", theme.glow)} />

                {currentPage === 1 ? (
                    <div className="-mt-10 md:-mt-16 lg:-mt-20 xl:-mt-24 relative z-50 w-full">
                        <PhimTrungHome />
                    </div>
                ) : (
                    <div className="w-full max-w-[1920px] mx-auto">
                        <div className="px-2 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="max-w-4xl">
                                <Link
                                    href="/phim-trung"
                                    className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-[13px] font-medium transition-colors mb-4 group"
                                >
                                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                    Quay lại Phim Trung
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
