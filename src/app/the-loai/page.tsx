import { getMenuData } from "@/services/api";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, LayoutGrid, Sparkles } from "lucide-react";
import { Metadata } from "next";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Chủ đề & Tuyển tập - KHOIPHIM",
    description: "Khám phá tất cả các thể loại phim tại KHOIPHIM: Hành động, Tình cảm, Kinh dị, Hoạt hình và nhiều hơn nữa.",
};

// Enhanced metadata for categories: Colors, Character Images, and Catchy Subtitles
const CATEGOR_META: Record<string, { image: string, color: string, sub: string, extra?: string }> = {
    "hanh-dong": { 
        image: "https://image.tmdb.org/t/p/w780/jXJxMcVoEuXzym3vFnjqDW4Z6oM.jpg", 
        color: "bg-[#450a0a]", // Deep Red
        sub: "Căng thẳng từng phút",
        extra: "Hot Rần Rần"
    },
    "tinh-cam": { 
        image: "https://image.tmdb.org/t/p/w780/qJeU7KM4nT2C1WpOrwPcSDGFUWE.jpg", 
        color: "bg-[#4a044e]", // Deep Magenta
        sub: "Ngọt ngào và lãng mạn",
        extra: "Thanh xuân"
    },
    "co-trang": { 
        image: "https://image.tmdb.org/t/p/w780/dKqa850uvbNSCaQCV4Im1XlzEtQ.jpg", 
        color: "bg-[#1e1b4b]", // Deep Indigo
        sub: "Tuyển tập cung đấu & kiếm hiệp",
        extra: "Cổ trang huyền ảo"
    },
    "hoat-hinh": { 
        image: "https://image.tmdb.org/t/p/w780/vIgyYkX8gd1KkSCAIfbS2mRzT7x.jpg", 
        color: "bg-[#064e3b]", // Deep Green
        sub: "Thế giới đầy màu sắc",
        extra: "Hoạt hình chọn lọc"
    },
    "kinh-di": { 
        image: "https://image.tmdb.org/t/p/w780/5i6SjyDbDWqyun8klUuCxrlFbyw.jpg", 
        color: "bg-[#020617]", // Near Black
        sub: "Nỗi sợ ám ảnh",
        extra: "Kinh dị tâm linh"
    },
    "vien-tuong": { 
        image: "https://image.tmdb.org/t/p/w780/8rpDcsfLJypbO6vtecsmEZzAUoa.jpg", 
        color: "bg-[#172554]", // Dark Blue
        sub: "Khám phá tương lai",
        extra: "Phim 4K"
    },
    "hai-huoc": { 
        image: "https://image.tmdb.org/t/p/w780/x2RS3hTbc5bAEuMtjsVcqLAie42.jpg", 
        color: "bg-[#3f2b0f]", // Brown/Bronze
        sub: "Tiếng cười sảng khoái",
        extra: "Giải trí cực đỉnh"
    },
    "tam-ly": { 
        image: "https://image.tmdb.org/t/p/w780/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg", 
        color: "bg-[#312e81]", // Indigo
        sub: "Câu chuyện lắng đọng",
        extra: "Hot rần rần"
    },
    "hinh-su": { 
        image: "https://image.tmdb.org/t/p/w780/oRiUKwDpcqDdoLwPoA4FIRh3hqY.jpg", 
        color: "bg-[#1e293b]", // Slate
        sub: "Đấu trí nghẹt thở",
        extra: "Hình sự tội phạm"
    },
    "vo-thuat": { 
        image: "https://image.tmdb.org/t/p/w780/wNXcdsrEcb1kQdYQZtJgV6Z4K51.jpg", 
        color: "bg-[#7c2d12]", // Terra Cotta
        sub: "Kỹ năng đỉnh cao",
        extra: "Tuyệt đỉnh võ thuật"
    },
    "khoa-hoc": { 
        image: "https://image.tmdb.org/t/p/w780/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg", 
        color: "bg-[#0f172a]", 
        sub: "Kiến thức vô tận"
    },
    "than-thoai": { 
        image: "https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg", 
        color: "bg-[#4c1d95]", // Purple
        sub: "Huyền thoại muôn đời"
    },
    "gia-dinh": { 
        image: "https://image.tmdb.org/t/p/w780/2u0ZpFXdWe8SowqUuFfH9Qul6rX.jpg", 
        color: "bg-[#581c87]", 
        sub: "Gắn kết yêu thương"
    },
    "am-nhac": { 
        image: "https://image.tmdb.org/t/p/w780/2nEKgG9FwB36398K70gJk1YQpQ4.jpg", 
        color: "bg-[#701a75]", 
        sub: "Giai điệu cảm xúc"
    },
    "phieu-luu": { 
        image: "https://image.tmdb.org/t/p/w780/yF1eOkaYvwiORauRCPWznV9xVvi.jpg", 
        color: "bg-[#14532d]", 
        sub: "Hành trình vĩ đại",
        extra: "Khám phá"
    },
    "lich-su": { 
        image: "https://image.tmdb.org/t/p/w780/gLqjPj4I4uR0AHzI6K8oXJd9Yn9.jpg", 
        color: "bg-[#422006]", 
        sub: "Ghi dấu thời gian"
    }
};

export default async function GenresIndexPage() {
    const { categories } = await getMenuData();

    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a]">
            {/* Ambient Background - Đặc trưng KHOIPHIM x Onflix */}
            <div className="fixed inset-0 bg-[#0a0a0a] pointer-events-none" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a202c_0%,_transparent_60%)] pointer-events-none opacity-60" />

            <div className="pt-28 w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 relative z-10">
                <div className="mb-12">
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-[13px] font-medium transition-colors mb-6 group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Quay lại trang chủ
                    </Link>
                    
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#8FA7C5]/20 to-transparent border border-[#8FA7C5]/20 flex items-center justify-center shadow-[0_0_30px_rgba(143,167,197,0.15)] backdrop-blur-md">
                            <LayoutGrid className="w-6 h-6 text-[#8FA7C5]" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-outfit font-black text-white tracking-tighter uppercase drop-shadow-xl flex items-center gap-4">
                            CHỦ ĐỀ <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8FA7C5] to-white/50">& TUYỂN TẬP</span>
                        </h1>
                    </div>
                    <p className="text-white/40 text-[15px] md:text-base max-w-2xl font-medium leading-relaxed">
                        Khám phá kho phim khổng lồ được phân loại đặc biệt dành riêng cho bạn. <br className="hidden md:block" />
                        Từ hành động kịch tính đến những câu chuyện chữa lành tâm hồn, chất lượng đỉnh cao trên <span className="text-[#8FA7C5] font-bold">KHOI</span>PHIM.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {categories.map((cat) => {
                        const meta = CATEGOR_META[cat.slug] || { 
                            image: "https://image.tmdb.org/t/p/w780/vIgyYkX8gd1KkSCAIfbS2mRzT7x.jpg", 
                            color: "bg-[#14151a]",
                            sub: "Tuyển tập phim hay"
                        };
                        
                        return (
                            <Link
                                key={cat.slug}
                                href={`/the-loai/${cat.slug}`}
                                className={cn(
                                    "relative overflow-hidden rounded-[20px] aspect-[2/0.95] sm:aspect-[16/9] transition-all duration-500 group shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:-translate-y-1.5 block border border-white/5 hover:border-white/10",
                                    meta.color
                                )}
                            >
                                {/* Background Image - Căn lề phải, effect zoom */}
                                <div className="absolute top-0 bottom-0 right-0 w-[85%] sm:w-[75%] lg:w-[80%] transition-transform duration-700 ease-out group-hover:scale-[1.05]">
                                    <Image 
                                        src={meta.image} 
                                        alt={cat.name}
                                        fill
                                        className="object-cover object-center sm:object-[center_20%] opacity-50 group-hover:opacity-80 transition-opacity duration-500 will-change-transform mix-blend-luminosity group-hover:mix-blend-normal"
                                        sizes="(max-width: 768px) 100vw, 400px"
                                        unoptimized={true}
                                    />
                                    {/* Gradient thông minh: che mờ từ trái sang phải để lẫn vào màu nền */}
                                    <div className={`absolute inset-0 bg-gradient-to-r via-transparent to-transparent opacity-100 ${meta.color.replace('bg-', 'from-')}`} />
                                    {/* Gradient chéo góc dưới để tôn phần chữ */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                                </div>

                                {/* Content Layer chính */}
                                <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between z-20 pointer-events-none">
                                    <div className="flex justify-between items-start">
                                        <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-sm group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 ease-out">
                                            <span className="font-black text-[15px] text-white">#</span>
                                        </div>
                                        {meta.extra && (
                                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#8FA7C5]/10 border border-[#8FA7C5]/30 backdrop-blur-md">
                                                <Sparkles className="w-2.5 h-2.5 text-[#8FA7C5]" />
                                                <span className="text-[#8FA7C5] text-[9px] font-black uppercase tracking-wider">
                                                    {meta.extra}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1 transform transition-transform duration-500 group-hover:translate-y-0 translate-y-2">
                                        <p className="text-[#8FA7C5] text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:-translate-y-1">
                                            Khám phá
                                        </p>
                                        <h3 className="text-white font-outfit font-black text-2xl sm:text-[26px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] tracking-tight capitalize leading-none group-hover:text-white transition-colors">
                                            {cat.name}
                                        </h3>
                                        <p className="text-white/60 text-[12px] font-medium line-clamp-1 max-w-[70%] sm:max-w-[80%] drop-shadow-md">
                                            {meta.sub}
                                        </p>
                                    </div>
                                </div>

                                {/* Đặc trưng KHOIPHIM Watermark */}
                                <div className="absolute top-4 right-5 text-[10px] font-black text-white/[0.03] uppercase tracking-[0.4em] pointer-events-none select-none mix-blend-overlay group-hover:text-white/[0.06] transition-colors duration-500 z-10 rotate-90 origin-right whitespace-nowrap hidden sm:block">
                                    KHOIPHIM EXCLUSIVE
                                </div>

                                {/* Hover Glow */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] bg-white transition-opacity duration-300 pointer-events-none" />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
