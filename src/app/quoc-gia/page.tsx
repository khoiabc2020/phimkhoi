import { getMenuData } from "@/services/api";
import Link from "next/link";
import { ChevronLeft, Globe } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Phim theo Quốc gia - KHOIPHIM",
    description: "Khám phá danh sách phim từ các quốc gia: Hàn Quốc, Trung Quốc, Mỹ, Thái Lan, Việt Nam và nhiều hơn nữa tại KHOIPHIM.",
};

export default async function CountriesIndexPage() {
    const { countries } = await getMenuData();

    return (
        <main className="min-h-screen pb-20 bg-[#0a0a0a] relative overflow-hidden">
            <div className="pt-24 w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 relative">
                {/* Decorative background glow */}
                <div className="absolute top-0 left-0 right-0 h-[600px] bg-indigo-500/10 via-transparent to-transparent pointer-events-none -z-10 blur-[150px]" />
                <div className="mb-10">
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-[13px] font-medium transition-colors mb-4 group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Quay lại trang chủ
                    </Link>
                    
                    <div className="flex items-center gap-3 mb-2">
                        <Globe className="w-6 h-6 text-[#8FA7C5]" />
                        <h1 className="text-3xl md:text-4xl font-outfit font-extrabold text-white tracking-tighter uppercase">
                            Phim theo Quốc gia
                        </h1>
                    </div>
                    <p className="text-gray-400 text-sm max-w-2xl">
                        Xem phim từ các nền điện ảnh hàng đầu thế giới. Dữ liệu được cập nhật liên tục với chất lượng tốt nhất.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {countries.map((c) => (
                        <Link
                            key={c.slug}
                            href={`/quoc-gia/${c.slug}`}
                            className="bg-white/5 border border-white/10 hover:border-[#8FA7C5]/50 hover:bg-white/10 p-5 rounded-lg transition-all group flex flex-col items-center justify-center text-center gap-3"
                        >
                            <span className="text-lg font-bold text-white group-hover:text-[#8FA7C5] transition-colors">
                                {c.name}
                            </span>
                            <span className="text-[10px] text-white/30 uppercase tracking-widest font-black">
                                Xem phim →
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
