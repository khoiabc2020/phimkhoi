import MovieCard from "@/components/MovieCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import { getMoviesList } from "@/services/api";
import { Metadata } from "next";

// Revalidate every 60 seconds for real-time updates
export const revalidate = 60;

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
    return {
        title: `${typeName} - Khôi Phim`,
        description: `Xem ${typeName} chất lượng cao tại Khôi Phim.`,
    };
}

export default async function CatalogPage({ params, searchParams }: PageProps) {
    const { type } = await params;
    const resolvedSearchParams = await searchParams;

    const page = Number(resolvedSearchParams.page) || 1;
    const year = Number(resolvedSearchParams.year) || undefined;
    const category = (resolvedSearchParams.category as string) || undefined;
    const country = (resolvedSearchParams.country as string) || undefined;
    const typeName = TYPE_NAMES[type] || type;

    // Handle special case for 'phim-moi-cap-nhat' vs 'danh-sach'
    let data;
    try {
        if (type === 'phim-moi' || type === 'tat-ca-the-loai') {
            const endpoint = type === 'tat-ca-the-loai' ? 'phim-moi-cap-nhat' : type;
            data = await getMoviesList(endpoint, { page, year, category, country });
        } else {
            data = await getMoviesList(type, { page, year, category, country });
        }
    } catch (error) {
        console.error("Catalog Error", error);
        data = { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }

    const { items, pagination } = data;

    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a]">
            <div className="pt-24 container mx-auto px-4 md:px-12">
                {/* Title & Badge */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-[18px] md:text-xl font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                            <span className="w-1 h-5 bg-[#fbbf24] rounded-full shadow-[0_0_10px_#fbbf24]"></span>
                            {typeName}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Trang {pagination?.currentPage} / {pagination?.totalPages}
                        </p>
                    </div>
                </div>

                {/* Filter Bar */}
                <FilterBar />

                {/* Optimized Grid for Mobile */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mt-6">
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
