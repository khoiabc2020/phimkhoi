import { getMenuData } from "@/services/api";
import Link from "next/link";
import { ChevronLeft, LayoutGrid } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tất cả Thể loại phim - KHOIPHIM",
    description: "Khám phá tất cả các thể loại phim tại KHOIPHIM: Hành động, Tình cảm, Kinh dị, Hoạt hình và nhiều hơn nữa.",
};

// Mapping of category slugs to high-quality TMDB backdrops for illustration
const CATEGORY_IMAGES: Record<string, string> = {
    "hanh-dong": "https://image.tmdb.org/t/p/w780/7ABsaPNO1D62dPOPSo1Xsqz6x4L.jpg", // John Wick 4
    "tinh-cam": "https://image.tmdb.org/t/p/w780/qJeU7KM4nT2C1WpOrwPcSDGFUWE.jpg", // La La Land
    "kinh-di": "https://image.tmdb.org/t/p/w780/5i6SjyDbDWqyun8klUuCxrlFbyw.jpg", // The Nun
    "hoat-hinh": "https://image.tmdb.org/t/p/w780/8b8R8l88zzH6Q4uL36x2XG2JWGx.jpg", // Spider-Verse
    "vien-tuong": "https://image.tmdb.org/t/p/w780/8rpDcsfLJypbO6vtecsmEZzAUoa.jpg", // Dune
    "hai-huoc": "https://image.tmdb.org/t/p/w780/x2RS3hTbc5bAEuMtjsVcqLAie42.jpg", // Deadpool
    "co-trang": "https://image.tmdb.org/t/p/w780/dKqa850uvbNSCaQCV4Im1XlzEtQ.jpg", // Gladiator
    "tam-ly": "https://image.tmdb.org/t/p/w780/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg", // Oppenheimer
    "hinh-su": "https://image.tmdb.org/t/p/w780/oRiUKwDpcqDdoLwPoA4FIRh3hqY.jpg", // The Batman
    "chien-tranh": "https://image.tmdb.org/t/p/w780/3SDoquTjagne0jWzdxEtTrAVgmd.jpg", // 1917
    "tai-lieu": "https://image.tmdb.org/t/p/w780/1v5ZtoGhrkEFw4XNpxN8jIfg2u2.jpg", // Free Solo
    "bi-an": "https://image.tmdb.org/t/p/w780/5CpsLwDkS0G05cWz2p9F48j2yP0.jpg", // Shutter Island
    "hoc-duong": "https://image.tmdb.org/t/p/w780/p4OweEG5uHlY3mG2LTrL1D6e30a.jpg", // Harry Potter
    "khoa-hoc": "https://image.tmdb.org/t/p/w780/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg", // Interstellar
    "than-thoai": "https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg", // Avengers
    "vo-thuat": "https://image.tmdb.org/t/p/w780/wNXcdsrEcb1kQdYQZtJgV6Z4K51.jpg", // Ip Man
    "gia-dinh": "https://image.tmdb.org/t/p/w780/2u0ZpFXdWe8SowqUuFfH9Qul6rX.jpg", // Paddington
    "phieu-luu": "https://image.tmdb.org/t/p/w780/yF1eOkaYvwiORauRCPWznV9xVvi.jpg", // Indiana Jones
    "am-nhac": "https://image.tmdb.org/t/p/w780/2nEKgG9FwB36398K70gJk1YQpQ4.jpg", // Bohemian Rhapsody
    "the-thao": "https://image.tmdb.org/t/p/w780/xc1k4fG7L6E2o9Vd4sR0z9uR4p3.jpg", // Creed
    "lich-su": "https://image.tmdb.org/t/p/w780/gLqjPj4I4uR0AHzI6K8oXJd9Yn9.jpg", // Schindler's List
    "mien-tay": "https://image.tmdb.org/t/p/w780/x2IqsMlJCemMEkoLL1o2kHnmbY6.jpg", // Django Unchained
    "tre-em": "https://image.tmdb.org/t/p/w780/ig7qVuPh5kdILKrAWFUIdylcwKU.jpg", // Inside Out
    "phim-ngan": "https://image.tmdb.org/t/p/w780/aFdD1V78P8u6A0s3lPz9oI3J2H9.jpg", // Generic short film
    "chinh-kich": "https://image.tmdb.org/t/p/w780/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg", // Shawshank Redemption
    "kinh-dien": "https://image.tmdb.org/t/p/w780/iNpiR5Z8eS4yv1NnQhB958vj5q2.jpg" // The Godfather
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

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {categories.map((cat) => {
                        const bgImage = CATEGORY_IMAGES[cat.slug] || "https://image.tmdb.org/t/p/w780/vIgyYkX8gd1KkSCAIfbS2mRzT7x.jpg"; // Default generic movie backdrop
                        
                        return (
                            <Link
                                key={cat.slug}
                                href={`/the-loai/${cat.slug}`}
                                className="relative overflow-hidden bg-black/40 border border-white/5 hover:border-[#8FA7C5]/60 rounded-lg aspect-[16/9] transition-all duration-300 group flex flex-col items-center justify-center text-center shadow-lg hover:shadow-[#8FA7C5]/10"
                            >
                                {/* Background Image */}
                                <div 
                                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 group-hover:opacity-60 transition-opacity duration-500 group-hover:scale-105"
                                    style={{ backgroundImage: `url(${bgImage})` }}
                                    aria-hidden="true"
                                />
                                {/* Gradient Overlay for better text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/60 to-transparent pointer-events-none" />

                                <div className="relative z-10 flex flex-col items-center gap-1 p-3">
                                    <span className="text-[16px] md:text-lg font-black text-white group-hover:text-[#8FA7C5] transition-colors drop-shadow-md tracking-wide">
                                        {cat.name}
                                    </span>
                                    <span className="text-[9px] md:text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold group-hover:text-[#8FA7C5]/70 transition-colors">
                                        Khám phá →
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
