import KoreaHero from "@/components/KoreaHero";
import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMenuData, getMoviesByCountry } from "@/services/api";
import { getMoviesByFilterFromCache, getMoviesFromCache } from "@/lib/movie-cache";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import MovieRow from "@/components/MovieRow";
import ActorRow from "@/components/ActorRow";
import { cn } from "@/lib/utils";
import { getThemeBySlug } from "@/lib/theme";
import {
    buildCountryHeroMovies,
    buildCountryHomeSections,
    getCountryPagePool,
    type CountryHomeSectionConfig,
} from "@/services/country-page";

export const revalidate = 300;

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

async function PhimHanHome() {
    const { countryItems, globalItems, fallbackItems } = await getCountryPagePool("han-quoc");
    const latestMovies = fallbackItems.slice(0, 14);
    const sections = buildCountryHomeSections(countryItems, globalItems, SECTION_CONFIG);

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
    const local = await getMoviesByFilterFromCache("country", slug, page, limit).catch((): null => null);
    const cached = page <= 3 ? await getMoviesFromCache(slug, page, limit).catch((): null => null) : null;
    const data = local || cached || await getMoviesByCountry(slug, page, limit);

    if (!data.items || data.items.length === 0) {
        return <div className="py-20 text-center text-white/40">Không tìm thấy phim nào.</div>;
    }

    return (
        <div className="px-2 sm:px-6 md:px-12 lg:pl-24 lg:pr-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 mb-12">
                {data.items.map((movie: any) => (
                    <MovieCard key={movie._id || movie.slug} movie={movie} />
                ))}
            </div>
            <Pagination currentPage={data.pagination.currentPage} totalPages={data.pagination.totalPages} />
        </div>
    );
}

async function KoreaHeroWithData() {
    const { fallbackItems } = await getCountryPagePool("han-quoc");
    const heroMovies = buildCountryHeroMovies(
        fallbackItems,
        [
            "nghe-thuat-lua-doi-cua-sarah",
            "khi-cuoc-doi-cho-ban-qua-quyt",
            "tieng-yeu-nay-anh-dich-duoc-khong",
            "ban-trai-theo-yeu-cau",
            "trao-em-ca-vu-tru",
        ],
        8
    );

    return <KoreaHero initialMovies={heroMovies} />;
}

export default async function PhimHanPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const sParams = await searchParams;
    const currentPage = Number(sParams.page) || 1;
    const limit = 49;
    const slug = "han-quoc";
    const theme = getThemeBySlug(slug);

    const menuData = await getMenuData();
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
