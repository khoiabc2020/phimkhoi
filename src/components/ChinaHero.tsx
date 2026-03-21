"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Info } from "lucide-react";
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
}

const CHINA_MOVIES_DATA: MovieSlide[] = [
    {
        title: "Trục Ngọc",
        bg: "/images/china-hero/truc-ngoc-bg.webp",
        actor: "/images/china-hero/truc-ngoc-actor.webp",
        logo: "/images/china-hero/truc-ngoc-logo.webp",
        description: "Câu chuyện hành trình tìm lại bản thân và những âm mưu quyền lực chốn cung đình...",
        tags: ["Cổ Trang", "Tình Cảm", "Kịch Tính"],
        year: "2024",
        episodes: "Tập 32"
    },
    {
        title: "Xin Chào 1983",
        bg: "/images/china-hero/xin-chao-bg.webp",
        actor: "/images/china-hero/xin-chao-actor.webp",
        logo: "/images/china-hero/xin-chao-logo.webp",
        description: "Hồi ức về những năm tháng thanh xuân rực rỡ và những tình bạn không bao giờ phai...",
        tags: ["Thanh Xuân", "Học Đường", "Gia Đình"],
        year: "2024",
        episodes: "Tập 40"
    },
    {
        title: "Bụi Hoa Hồng",
        bg: "/images/china-hero/bui-hoa-hong-bg.webp",
        actor: "/images/china-hero/bui-hoa-hong-actor.webp",
        logo: "/images/china-hero/bui-hoa-hong-logo.webp",
        description: "Mối tình đầy trắc trở giữa khói lửa chiến tranh và những hy sinh cao cả...",
        tags: ["Dân Quốc", "Chiến Tranh", "Ngược Tâm"],
        year: "2024",
        episodes: "Full 24/24"
    },
    {
        title: "Giang Hồ Dạ Vũ Thập Niên Đăng",
        bg: "/images/china-hero/giang-ho-bg.webp",
        actor: "/images/china-hero/giang-ho-actor.webp",
        logo: "/images/china-hero/giang-ho-logo.png",
        description: "Thế giới võ hiệp đầy kịch tính với những bí kíp thất truyền và ân oán giang hồ...",
        tags: ["Võ Hiệp", "Hành Động", "Kiếm Hiệp"],
        year: "2024",
        episodes: "Tập 12"
    },
    {
        title: "Còn Ra Thể Thống Gì Nữa?",
        bg: "/images/china-hero/the-thong-bg.webp",
        actor: "/images/china-hero/the-thong-actor.webp",
        logo: "/images/china-hero/the-thong-logo.webp",
        description: "Câu chuyện hài hước và đầy bất ngờ về những quy tắc kỳ lạ trong hoàng cung...",
        tags: ["Hài Hước", "Cổ Trang", "Lãng Mạn"],
        year: "2024",
        episodes: "Tập 14"
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
        <section className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] overflow-hidden bg-black mt-[64px] lg:mt-[84px]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
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
                            className="object-cover brightness-50"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                    </motion.div>

                    {/* Layer 2: Actor Cutout */}
                    <div className="absolute inset-0 z-20 pointer-events-none flex items-end justify-end overflow-hidden">
                        <motion.div
                            initial={{ x: 100, opacity: 0, scale: 0.95 }}
                            animate={{ x: 0, opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
                            className="relative w-[80%] h-[90%] md:w-[70%] md:h-full lg:w-[60%] lg:h-[110%] -mr-[5%] md:-mr-[10%]"
                        >
                            <Image 
                                src={CHINA_MOVIES_DATA[current].actor}
                                alt="Characters"
                                fill
                                className="object-contain object-right-bottom drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                                priority
                            />
                        </motion.div>
                    </div>

                    {/* Layer 3: Content & Logo */}
                    <div className="absolute inset-0 z-30 flex items-center px-4 md:px-12 lg:pl-28 max-w-[1920px] mx-auto">
                        <div className="max-w-2xl flex flex-col items-start gap-4 md:gap-6 mt-10 md:mt-20">
                            {/* Logo */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="relative w-full max-w-[300px] md:max-w-[450px] aspect-[3/1]"
                            >
                                <Image 
                                    src={CHINA_MOVIES_DATA[current].logo}
                                    alt="Logo"
                                    fill
                                    className="object-contain object-left drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]"
                                    priority
                                />
                            </motion.div>

                            {/* Info */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7, duration: 0.8 }}
                                className="space-y-4"
                            >
                                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                    <span className="bg-primary/95 text-white text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider">Mới</span>
                                    <span className="text-white/80 text-[12px] md:text-[14px] font-medium">{CHINA_MOVIES_DATA[current].year}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/30" />
                                    <span className="text-white/80 text-[12px] md:text-[14px] font-medium">{CHINA_MOVIES_DATA[current].episodes}</span>
                                    <div className="flex gap-2">
                                        {CHINA_MOVIES_DATA[current].tags.map(tag => (
                                            <span key={tag} className="text-[11px] md:text-[12px] text-[#8FA7C5] font-medium border border-[#8FA7C5]/30 px-2 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                <p className="text-[14px] md:text-[16px] text-gray-300 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-lg drop-shadow">
                                    {CHINA_MOVIES_DATA[current].description}
                                </p>

                                <div className="flex items-center gap-3 pt-4">
                                    <button className="flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3.5 bg-primary text-white rounded-full font-bold text-[14px] md:text-[15px] hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 group">
                                        <Play className="w-5 h-5 fill-current" />
                                        Xem ngay
                                    </button>
                                    <button className="flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3.5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full font-bold text-[14px] md:text-[15px] hover:bg-white/20 transition-all shadow-xl">
                                        <Info className="w-5 h-5" />
                                        Thông tin
                                    </button>
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

            <div className="absolute right-4 md:right-12 bottom-10 z-40 flex gap-2">
                <button 
                    onClick={prev}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all group"
                >
                    <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <button 
                    onClick={next}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all group"
                >
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </section>
    );
}
