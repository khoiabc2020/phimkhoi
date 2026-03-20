import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMoviesList } from "@/services/api";
import { Metadata } from "next";

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
    const canonical = `https://khoiphim.io.vn/danh-sach/${type}`;
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
    const year = Number(resolvedSearchParams.year) || undefined;
    const category = (resolvedSearchParams.category as string) || undefined;
    const country = (resolvedSearchParams.country as string) || undefined;
    const quality = (resolvedSearchParams.quality as string) || undefined;
    const typeName = TYPE_NAMES[type] || type;

    // Handle special case for 'phim-moi-cap-nhat' vs 'danh-sach'
    let data;
    try {
        if (type === 'phim-moi' || type === 'tat-ca-the-loai') {
            const endpoint = type === 'tat-ca-the-loai' ? 'phim-moi-cap-nhat' : type;
            data = await getMoviesList(endpoint, { page, year, category, country, quality });
        } else {
            data = await getMoviesList(type, { page, year, category, country, quality });
        }
    } catch (error) {
        console.error("Catalog Error", error);
        data = { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }

    const { items, pagination } = data;

    return (
        <main className="min-h-screen pb-20">
            <div className="pt-24 w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-8 lg:pl-24 lg:pr-12">
                <div className="mb-6 rounded-[12px] border border-white/[0.06] bg-[#07070b]/78 p-4 md:p-5 shadow-xl transition-all">
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
                                <FilterBar />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid: content-visibility giúp giảm CPU khi cuộn */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-2.5 md:gap-3 mt-6 [contain:layout_paint]">
                    {items?.length > 0 ? (
                        items.map((movie: any) => (
                            <MovieCard key={movie._id} movie={movie} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-gray-400">
                            Không tìm thấy phim nào.
                        </div>
                    )}
                </div>
                {/* Pagination */}
                {pagination && (
                    <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                    />
                )}
            </div>
        </main>
    );
}
