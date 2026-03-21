import { getMenuData } from "@/services/api";
import Link from "next/link";
import { ChevronLeft, LayoutGrid } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tất cả Thể loại phim - KHOIPHIM",
    description: "Khám phá tất cả các thể loại phim tại KHOIPHIM: Hành động, Tình cảm, Kinh dị, Hoạt hình và nhiều hơn nữa.",
};

// Mapping of category slugs to high-quality TMDB backdrops
// Using reliable TMDB backdrops from the top 20 most popular movies
const CATEGORY_IMAGES: Record<string, string> = {
    "hanh-dong": "https://image.tmdb.org/t/p/w780/jXJxMcVoEuXzym3vFnjqDW4Z6oM.jpg", // reliable action
    "tinh-cam": "https://image.tmdb.org/t/p/w780/qJeU7KM4nT2C1WpOrwPcSDGFUWE.jpg",
    "kinh-di": "https://image.tmdb.org/t/p/w780/5i6SjyDbDWqyun8klUuCxrlFbyw.jpg",
    "hoat-hinh": "https://image.tmdb.org/t/p/w780/vIgyYkX8gd1KkSCAIfbS2mRzT7x.jpg", 
    "vien-tuong": "https://image.tmdb.org/t/p/w780/8rpDcsfLJypbO6vtecsmEZzAUoa.jpg",
    "hai-huoc": "https://image.tmdb.org/t/p/w780/x2RS3hTbc5bAEuMtjsVcqLAie42.jpg",
    "co-trang": "https://image.tmdb.org/t/p/w780/dKqa850uvbNSCaQCV4Im1XlzEtQ.jpg",
    "tam-ly": "https://image.tmdb.org/t/p/w780/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    "hinh-su": "https://image.tmdb.org/t/p/w780/oRiUKwDpcqDdoLwPoA4FIRh3hqY.jpg",
    "chien-tranh": "https://image.tmdb.org/t/p/w780/3SDoquTjagne0jWzdxEtTrAVgmd.jpg",
    "tai-lieu": "https://image.tmdb.org/t/p/w780/1v5ZtoGhrkEFw4XNpxN8jIfg2u2.jpg",
    "bi-an": "https://image.tmdb.org/t/p/w780/5CpsLwDkS0G05cWz2p9F48j2yP0.jpg",
    "hoc-duong": "https://image.tmdb.org/t/p/w780/p4OweEG5uHlY3mG2LTrL1D6e30a.jpg",
    "khoa-hoc": "https://image.tmdb.org/t/p/w780/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
    "than-thoai": "https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    "vo-thuat": "https://image.tmdb.org/t/p/w780/wNXcdsrEcb1kQdYQZtJgV6Z4K51.jpg",
    "gia-dinh": "https://image.tmdb.org/t/p/w780/2u0ZpFXdWe8SowqUuFfH9Qul6rX.jpg",
    "phieu-luu": "https://image.tmdb.org/t/p/w780/yF1eOkaYvwiORauRCPWznV9xVvi.jpg",
    "am-nhac": "https://image.tmdb.org/t/p/w780/2nEKgG9FwB36398K70gJk1YQpQ4.jpg",
    "the-thao": "https://image.tmdb.org/t/p/w780/xc1k4fG7L6E2o9Vd4sR0z9uR4p3.jpg",
    "lich-su": "https://image.tmdb.org/t/p/w780/gLqjPj4I4uR0AHzI6K8oXJd9Yn9.jpg",
    "mien-tay": "https://image.tmdb.org/t/p/w780/x2IqsMlJCemMEkoLL1o2kHnmbY6.jpg",
    "tre-em": "https://image.tmdb.org/t/p/w780/ig7qVuPh5kdILKrAWFUIdylcwKU.jpg",
    "phim-ngan": "https://image.tmdb.org/t/p/w780/aFdD1V78P8u6A0s3lPz9oI3J2H9.jpg",
    "chinh-kich": "https://image.tmdb.org/t/p/w780/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
    "kinh-dien": "https://image.tmdb.org/t/p/w780/iNpiR5Z8eS4yv1NnQhB958vj5q2.jpg"
};

export default async function GenresIndexPage() {
    // getMenuData already filters out 'phim-18' via our api.ts change
    const { categories } = await getMenuData();

    return (
        <main className="min-h-screen pb-20">
            <div className="pt-24 w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 relative">
                <div className="mb-10">
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-[13px] font-medium transition-colors mb-4 group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Quay lại trang chủ
                    </Link>
                    
                    <div className="flex items-center gap-3 mb-2">
                        <LayoutGrid className="w-6 h-6 text-[#8FA7C5]" />
                        <h1 className="text-3xl md:text-4xl font-outfit font-extrabold text-white tracking-tighter uppercase italic">
                            Các Thể loại
                        </h1>
                    </div>
                    <p className="text-gray-400 text-sm max-w-2xl">
                        Tìm kiếm phim theo thể loại yêu thích của bạn. Khám phá những câu chuyện điện ảnh qua từng khung hình.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {categories.map((cat, index) => {
                        const bgImage = CATEGORY_IMAGES[cat.slug] || "https://image.tmdb.org/t/p/w780/vIgyYkX8gd1KkSCAIfbS2mRzT7x.jpg"; // Default generic movie backdrop
                        
                        // Mảng màu gradient đẹp cho icon # (giống Onflix)
                        const accentColors = [
                            "text-[#ff3b3b]", // Đỏ tươi
                            "text-[#00e281]", // Xanh lá mạ
                            "text-[#3b82f6]", // Xanh biển
                            "text-[#facc15]", // Vàng
                            "text-[#a855f7]", // Tím mộng mơ
                            "text-[#06b6d4]", // Xanh lơ (Cyan)
                            "text-[#f97316]", // Cam
                            "text-[#ec4899]", // Hồng
                        ];
                        const accent = accentColors[index % accentColors.length];

                        return (
                            <Link
                                key={cat.slug}
                                href={`/the-loai/${cat.slug}`}
                                className="relative overflow-hidden bg-[#14151a] rounded-[14px] lg:rounded-2xl aspect-[2/1] sm:aspect-[16/9] transition-all duration-300 group shadow-lg hover:shadow-2xl hover:-translate-y-1 block border border-white/5 hover:border-white/10"
                            >
                                {/* Nửa phải: Ảnh Background TMDB */}
                                <div className="absolute top-0 bottom-0 right-0 w-[70%] sm:w-[75%]">
                                    <div 
                                        className="w-full h-full bg-cover bg-center transition-all duration-700 group-hover:scale-[1.03] opacity-60 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-100"
                                        style={{ backgroundImage: `url(${bgImage})` }}
                                        aria-hidden="true"
                                    />
                                    {/* Gradient Fade ngang (trái sang phải) để nối mượt ảnh với background solid */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#14151a] via-[#14151a]/70 to-transparent" />
                                </div>

                                {/* Gradient dọc kéo từ dưới lên để tôn chữ Title luôn dễ đọc */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#14151a]/95 via-[#14151a]/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Nội dung chữ (Góc trái dưới) */}
                                <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end pointer-events-none">
                                    <div className="mb-2 sm:mb-2.5 w-6 h-6 sm:w-7 sm:h-7 rounded-[6px] bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-sm group-hover:scale-110 group-hover:bg-white/5 transition-all duration-300">
                                        <span className={`font-black text-sm sm:text-[15px] ${accent}`}>#</span>
                                    </div>
                                    <h3 className="text-white font-display font-bold text-lg sm:text-xl lg:text-2xl drop-shadow-md tracking-tight group-hover:text-white transition-colors capitalize">
                                        {cat.name}
                                    </h3>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
