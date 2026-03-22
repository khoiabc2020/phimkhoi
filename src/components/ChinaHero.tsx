"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Info } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MovieSlide {
    title: string;
    bg: string;
    actor: string;
    logo: string;
    description: string;
    tags: string[];
    year: string;
    episodes: string;
    slug: string;
}

const CHINA_MOVIES_DATA: MovieSlide[] = [
    {
        title: "Trục Ngọc",
        bg: "/images/china-hero/truc-ngoc-bg.webp",
        actor: "/images/china-hero/truc-ngoc-actor.webp",
        logo: "/images/china-hero/truc-ngoc-logo.webp",
        description: "Hành trình tìm lại công lý và tình yêu chốn cung đình đầy sóng gió của nàng thiếu nữ tài năng...",
        tags: ["Cổ Trang", "Tình Cảm", "Kịch Tính"],
        year: "2024",
        episodes: "Tập 32/40",
        slug: "truc-ngoc"
    },
    {
        title: "Xin Chào 1983",
        bg: "/images/china-hero/xin-chao-bg.webp",
        actor: "/images/china-hero/xin-chao-actor.webp",
        logo: "/images/china-hero/xin-chao-logo.webp",
        description: "Bản tình ca về tuổi thanh xuân rực rỡ và những ký ức không bao giờ phai tại con ngõ nhỏ đầy tình thân...",
        tags: ["Thanh Xuân", "Học Đường", "Gia Đình"],
        year: "2024",
        episodes: "Tập 40/40",
        slug: "xin-chao-1983"
    },
    {
        title: "Bụi Hoa Hồng",
        bg: "/images/china-hero/bui-hoa-hong-bg.webp",
        actor: "/images/china-hero/bui-hoa-hong-actor.webp",
        logo: "/images/china-hero/bui-hoa-hong-logo.webp",
        description: "Mối duyên trắc trở giữa thời loạn và sự hy sinh cao cả của những con người quả cảm...",
        tags: ["Dân Quốc", "Chiến Tranh", "Ngược Tâm"],
        year: "2024",
        episodes: "Full 24/24",
        slug: "bui-hoa-hong"
    },
    {
        title: "Giang Hồ Dạ Vũ Thập Niên Đăng",
        bg: "/images/china-hero/giang-ho-bg.webp",
        actor: "/images/china-hero/giang-ho-actor.webp",
        logo: "/images/china-hero/giang-ho-logo.png",
        description: "Vụ án mạng bí ẩn dẫn lối hiệp khách vào hành trình giang hồ đầy phong ba bão táp...",
        tags: ["Võ Hiệp", "Hành Động", "Kiếm Hiệp"],
        year: "2024",
        episodes: "Tập 12/24",
        slug: "giang-ho-da-vu-thap-nien-dang"
    },
    {
        title: "Còn Ra Thể Thống Gì Nữa?",
        bg: "/images/china-hero/the-thong-bg.webp",
        actor: "/images/china-hero/the-thong-actor.webp",
        logo: "/images/china-hero/the-thong-logo.webp",
        description: "Cuộc chiến cung đấu đầy hài hước và mưu mẹo giữa nữ chính thông minh và thế lực hắc ám...",
        tags: ["Hài Hước", "Cổ Trang", "Lãng Mạn"],
        year: "2024",
        episodes: "Tập 14/24",
        slug: "con-ra-the-thong-gi-nua"
    },
    {
        title: "Đại Mộng Quy Ly",
        bg: "/images/china-hero/dai-mong-bg.webp",
        actor: "/images/china-hero/dai-mong-actor.webp",
        logo: "/images/china-hero/dai-mong-logo.webp",
        description: "Truyền thuyết về đại yêu tà và hành trình tìm lại sự yên bình cho muôn dân chốn thần tiên...",
        tags: ["Tiên Hiệp", "Huyền Ảo", "Mạo Hiểm"],
        year: "2024",
        episodes: "Tập 34/34",
        slug: "dai-mong-quy-ly"
    },
    {
        title: "Bạch Nguyệt Phạn Tinh",
        bg: "/images/china-hero/bach-nguyet-bg.webp",
        actor: "/images/china-hero/bach-nguyet-actor.webp",
        logo: "/images/china-hero/bach-nguyet-logo.webp",
        description: "Duyên kiếp tiền định giữa tướng quân của Thần giới và thiếu nữ phàm trần đầy kiên cường...",
        tags: ["Huyền Huyễn", "Lãng Mạn", "Tiên Diễn"],
        year: "2024",
        episodes: "Tập 36/40",
        slug: "bach-nguyet-phan-tinh"
    },
    {
        title: "Thanh Vụ Phong Minh",
        bg: "/images/china-hero/tang-cung-bg.png",
        actor: "/images/china-hero/tang-cung-actor.png",
        logo: "/images/china-hero/tang-cung-logo.png",
        description: "Loạt vụ án bí ẩn chốn hậu cung nhà Đường dần được phá giải bởi cặp đôi quái kiệt...",
        tags: ["Trinh Thám", "Cổ Trang", "Kịch Tính"],
        year: "2024",
        episodes: "Tập 24/30",
        slug: "duong-cung-ky-an-thanh-vu-phong-minh"
    },
    {
        title: "Mặc Nhẫn Tàng Kiều",
        bg: "/images/china-hero/mac-nhan-bg.webp",
        actor: "/images/china-hero/mac-nhan-actor.webp",
        logo: "/images/china-hero/mac-nhan-logo.webp",
        description: "Hợp đồng hôn nhân đầy bất ngờ của thiếu gia lạnh lùng và cô gái nghèo vượt khó...",
        tags: ["Hiện Đại", "Ngôn Tình", "Tổng Tài"],
        year: "2024",
        episodes: "Full 24/24",
        slug: "mac-nhan-tang-kieu"
    },
    {
        title: "Ngọc Minh Trà Cốt",
        bg: "/images/china-hero/ngoc-minh-bg.webp",
        actor: "/images/china-hero/ngoc-minh-actor.webp",
        logo: "/images/china-hero/ngoc-minh-logo.webp",
        description: "Âm mưu đoạt bảo trà truyền thế của những thế lực giang hồ hắc ám...",
        tags: ["Cổ Trang", "Võ Hiệp", "Quân Sự"],
        year: "2024",
        episodes: "Tập 20/24",
        slug: "ngoc-minh-tra-cot"
    }
];

export default function ChinaHero() {
    const [current, setCurrent] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);

    useEffect(() => {
        if (!isAutoPlay) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % CHINA_MOVIES_DATA.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [isAutoPlay]);

    const next = () => {
        setIsAutoPlay(false);
        setCurrent((prev) => (prev + 1) % CHINA_MOVIES_DATA.length);
    };

    const prev = () => {
        setIsAutoPlay(false);
        setCurrent((prev) => (prev - 1 + CHINA_MOVIES_DATA.length) % CHINA_MOVIES_DATA.length);
    };

    return (
        <section className="relative w-full h-[450px] md:h-[550px] lg:h-[650px] xl:h-[750px] overflow-hidden bg-black pb-12">
            <AnimatePresence>
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    {/* Layer 1: Background */}
                    <motion.div 
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 10, ease: "linear" }}
                        className="absolute inset-0 z-0"
                    >
                        <Image 
                            src={CHINA_MOVIES_DATA[current].bg}
                            alt={CHINA_MOVIES_DATA[current].title}
                            fill
                            className="object-cover brightness-[0.55]"
                            priority={current < 2}
                            quality={90}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                    </motion.div>

                    {/* Layer 2: Actor Cutout */}
                    <div className="absolute inset-0 z-20 pointer-events-none flex items-end justify-end overflow-hidden">
                        <motion.div
                            initial={{ x: 40, opacity: 0, scale: 0.98 }}
                            animate={{ x: 0, opacity: 0.95, scale: 1 }}
                            transition={{ delay: 0.1, duration: 1.4, ease: "easeOut" }}
                            className="relative w-[70%] h-[80%] md:w-[60%] md:h-[90%] lg:w-[50%] lg:h-[100%] mr-[6%] md:mr-[10%] lg:mr-[15%]"
                        >
                            <Image 
                                src={CHINA_MOVIES_DATA[current].actor}
                                alt="Characters"
                                fill
                                className="object-contain object-right-bottom drop-shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
                                priority={current < 2}
                                quality={95}
                            />
                        </motion.div>
                    </div>

                    {/* Layer 3: Content & Logo */}
                    <div className="absolute inset-0 z-30 flex items-center px-4 md:px-12 lg:pl-28 max-w-[1920px] mx-auto">
                        <div className="max-w-xl flex flex-col items-start gap-4 md:gap-5">
                            {/* Logo */}
                            <motion.div
                                transition={{ delay: 0.2, duration: 1.0 }}
                                className="relative w-full max-w-[300px] md:max-w-[450px] aspect-[3/1]"
                            >
                                <Image 
                                    src={CHINA_MOVIES_DATA[current].logo}
                                    alt="Logo"
                                    fill
                                    className="object-contain object-left drop-shadow-[0_12px_30px_rgba(0,0,0,0.8)]"
                                    priority={current < 2}
                                />
                            </motion.div>

                            {/* Info */}
                            <motion.div
                                transition={{ delay: 0.3, duration: 1.0 }}
                                className="space-y-4"
                            >
                                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                    <span className="bg-primary/95 text-white text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider">Mới</span>
                                    <span className="text-white/80 text-[12px] md:text-[14px] font-medium">{CHINA_MOVIES_DATA[current].year}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/30" />
                                    <span className="text-white/80 text-[12px] md:text-[14px] font-medium">{CHINA_MOVIES_DATA[current].episodes}</span>
                                    <div className="flex gap-2.5">
                                        {CHINA_MOVIES_DATA[current].tags.slice(0, 2).map(tag => (
                                            <span key={tag} className="text-[11px] md:text-[12px] text-white/60 font-medium bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                <p className="text-[14px] md:text-[16px] text-gray-300 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-lg drop-shadow">
                                    {CHINA_MOVIES_DATA[current].description}
                                </p>

                                <div className="flex items-center gap-3 pt-4">
                                    <Link 
                                        href={`/phim/${CHINA_MOVIES_DATA[current].slug}`}
                                        className="flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3.5 bg-primary text-white rounded-full font-bold text-[14px] md:text-[15px] hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 group"
                                    >
                                        <Play className="w-5 h-5 fill-current" />
                                        Xem ngay
                                    </Link>
                                    <Link 
                                        href={`/phim/${CHINA_MOVIES_DATA[current].slug}`}
                                        className="flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3.5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full font-bold text-[14px] md:text-[15px] hover:bg-white/20 transition-all shadow-xl"
                                    >
                                        <Info className="w-5 h-5" />
                                        Thông tin
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Controls */}
            <div className="absolute bottom-10 left-4 md:left-12 lg:left-28 z-40 flex items-center gap-4">
                <div className="flex gap-1.5">
                    {CHINA_MOVIES_DATA.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => { setIsAutoPlay(false); setCurrent(idx); }}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300 shadow-lg",
                                current === idx ? "w-8 bg-primary" : "w-2 bg-white/30 hover:bg-white/50"
                            )}
                        />
                    ))}
                </div>
            </div>

            <div className="absolute right-6 md:right-12 bottom-12 z-40 flex gap-3">
                <button 
                    onClick={prev}
                    className="w-10 h-10 md:w-11 md:h-11 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center text-white/70 hover:bg-white hover:text-black hover:border-white transition-all group"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <button 
                    onClick={next}
                    className="w-10 h-10 md:w-11 md:h-11 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center text-white/70 hover:bg-white hover:text-black hover:border-white transition-all group"
                >
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </section>
    );
}
