import ChinaHero from "@/components/ChinaHero";
import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMenuData } from "@/services/api";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import HomeRowInstant from "@/components/HomeRowInstant";
import ActorRow from "@/components/ActorRow";
import CountryGridClient from "@/components/CountryGridClient";
import { cn } from "@/lib/utils";
import { getThemeBySlug } from "@/lib/theme";
import { getResilientMoviesList } from "@/app/actions/movies";
import { sanitizeMovieList } from "@/lib/movie-list";
import {
    buildCountryHomeSections,
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
    { name: "Dương Tử", role: "Trường Tương Tư", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/3b8qY8UqT2t4n95JjP1r74jQv2D.jpg" },
    { name: "Hứa Khải", role: "Kháng Chiến Bút Mặc", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/n555fWjI0uVscG6S5Y0XnB7R5P0.jpg" },
    { name: "Cúc Tịnh Y", role: "Tiên Kiếm Kỳ Hiệp 4", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/mJk3p1q4x4y7M2m9a0V4Q6v9a4t.jpg" },
    { name: "Trần Tinh Húc", role: "Người Phiên Dịch", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/2g2K3S8H4Y9Z9x4r0x2w7S6R5l4.jpg" },
    { name: "Trần Triết Viễn", role: "Vụng Trộm Không Thể Giấu", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/7Y5t9Y5wA4E8O9X5dZ6A8K8D8D.jpg" },
    { name: "Vương Tử Kỳ", role: "Tình Yêu Thôi Mà", image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/9O3wQ9Q4y5Q8R1M4g8P3R9J1Y8t.jpg" },
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
    "mac-nhan-tang-kieu": { name: "Mặc Nhan Tàng Kiều", year: 2025 },
    "ngoc-minh-tra-cot": { name: "Ngọc Minh Trà Cốt", year: 2025 },
    "truc-ngoc": { name: "Trục Ngọc", year: 2025 },
};

const HERO_FALLBACK_DESC: Record<string, string> = {
    "duong-cung-ky-an-thanh-vu-phong-minh": "Tại cấm thành nơi quyền lực che mờ lý trí, một vụ án tàn khốc bắt đầu chuỗi ngày đẫm máu. Những lời thề trung thành bị xé nát, để lộ một bí mật động trời có thể kéo theo sự sụp đổ của cả một vương triều.",
    "xin-chao-1983": "Một bức tranh hoài niệm tuyệt đẹp đưa người xem trở về những con ngõ nhỏ của năm 1983. Nơi đó, những mảnh đời đan xen vào nhau, cùng khóc, cùng cười và cùng trăn trở giữa sức mạnh nghiệt ngã của thời đại và những lựa chọn thay đổi số phận.",
    "con-ra-the-thong-gi-nua": "Từ những hiểu lầm chồng chất đến loạt tình huống 'dở khóc dở cười', mối tình tay ba oan gia ngõ hẹp này không chỉ mang đến tràng cười sảng khoái mà còn giấu giếm những cú twist lãng mạn khiến trái tim người xem lỡ nhịp.",
    "bach-nguyet-phan-tinh": "Dưới ánh trăng dịu dàng của đêm Nguyên Tiêu, một mối duyên định mệnh vắt ngang hàng thu kỷ được viết tiếp. Giữa tiên giới và phàm trần, tình yêu của họ phải trải qua muôn vàn kiếp nạn sinh tử mới có hi vọng đoàn tụ.",
    "bui-hoa-hong": "Trong ánh đèn rực rỡ của bến Thượng Hải hoa lệ, danh vọng và tình yêu là những quân bài rủi ro nhất. Một bông hồng rực lửa vùng lên từ bùn lầy, dùng trí thông minh thao túng giới tài phiệt để trả thù những kẻ đã tước đoạt cuộc sống của cô.",
    "dai-mong-quy-ly": "Trong thời loạn lạc khi mà ranh giới giữa chính và tà bị lu mờ, một nam tử hán lang bạt giang hồ gánh trên vai nợ nước thù nhà. Giữa giấc mộng công danh và sự tàn khốc của thực tại, liệu anh hùng có thể tìm thấy lối đi cho riêng mình?",
    "giang-ho-da-vu-thap-nien-dang": "Mười năm ân oán nhuộm máu giang hồ, tái hiện sống động trong một đêm mưa bão kéo dài đằng đẵng. Đao kiếm vô tình nhắm thẳng vào nhau, cắt đứt tình huynh đệ từng đồng cam cộng khổ.",
    "mac-nhan-tang-kieu": "Ẩn sau vẻ ngoài kiều diễm là một sát thủ lạnh lùng chưa từng biết đến sợ hãi. Hành trình đi tìm công lý của nàng chứa đầy rẫy sự dối trá, cạm bẫy và một cuộc tương phùng oan nghiệt với kẻ thù không đội trời chung.",
    "ngoc-minh-tra-cot": "Cuộc chiến sinh tồn khốc liệt giữa các thế lực gia tộc hùng mạnh. Những giọt nước mắt vỡ vụn xen lẫn âm mưu thâm độc hòng chiếm đoạt quyền lực, nơi tình thâm chỉ là lớp vỏ bọc hoàn hảo cho sự phản bội.",
    "truc-ngoc": "Bản thiên tình ca bi tráng thời cổ đại về hai tâm hồn tự do bị trói buộc bởi vận mệnh quốc gia. Tình yêu mãnh liệt của họ giống như viên ngọc quý giữa biển lửa, sáng rực rỡ tuyệt đẹp nhưng lại mong manh dễ vỡ."
};

function hasRealDescription(value: string) {
    const normalized = value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    return Boolean(
        normalized &&
        !normalized.includes("dang cap nhat noi dung") &&
        !normalized.includes("dang cap nhat")
    );
}

async function resolveHeroMovies(slugs: string[], fallbackItems: any[], countryName: string) {
    const bySlug = new Map(fallbackItems.map((movie) => [movie.slug, movie]));

    const resolved = await Promise.all(
        slugs.map(async (slug) => {
            const cached = bySlug.get(slug);
            if (cached) {
                const resolvedContent = String(cached?.content || "").trim();
                return {
                    ...cached,
                    content: hasRealDescription(resolvedContent) ? resolvedContent : HERO_FALLBACK_DESC[slug] || "",
                    year: cached?.year || HERO_FALLBACK_META[slug]?.year || 2025,
                    country: Array.isArray(cached?.country) && cached.country.length > 0
                        ? cached.country
                        : [{ name: countryName, slug: "trung-quoc" }],
                };
            }

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

async function PhimTrungHome() {
    return (
        <div className="space-y-12 md:space-y-16 pb-12">
            <HomeRowInstant title="Phim Mới Cập Nhật" slug="trung-quoc" endpoint="quoc-gia" viewAllHref="/quoc-gia/trung-quoc" priorityFirst />

            {SECTION_CONFIG.slice(0, 2).map((section) => (
                <HomeRowInstant
                    key={section.categorySlug}
                    title={section.title}
                    slug="category"
                    viewAllHref={`/the-loai/${section.categorySlug}`}
                    category={section.categorySlug}
                    country="trung-quoc"
                    cacheKeyPrefix={`trung-quoc_${section.categorySlug}`}
                    priorityFirst={section.priorityFirst}
                />
            ))}

            <ActorRow title="Diễn viên nổi bật" actors={FEATURED_ACTORS} />

            {SECTION_CONFIG.slice(2).map((section) => (
                <HomeRowInstant
                    key={section.categorySlug}
                    title={section.title}
                    slug="category"
                    viewAllHref={`/the-loai/${section.categorySlug}`}
                    category={section.categorySlug}
                    country="trung-quoc"
                    cacheKeyPrefix={`trung-quoc_${section.categorySlug}`}
                    priorityFirst={section.priorityFirst}
                />
            ))}
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
                    <div className="-mt-2 sm:-mt-6 md:-mt-12 lg:-mt-16 relative z-50 w-full">
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

                        <CountryGridClient slug={slug} page={currentPage} limit={limit} />
                    </div>
                )}
            </div>
        </main>
    );
}
