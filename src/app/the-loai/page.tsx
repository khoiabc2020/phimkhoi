import { getMenuData } from "@/services/api";
import Link from "next/link";
import Image from "next/image";
import {
    ChevronLeft, Swords, Heart, Smile, Brain, Eye, Rocket, Zap,
    Shield, Music, Compass, Scroll, Home, Baby, Beaker, BookOpen,
    Flame, Star, Film, Trophy, GraduationCap, Sword,
} from "lucide-react";
import { Metadata } from "next";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Thể Loại Phim - KHOIPHIM",
    description: "Khám phá tất cả các thể loại phim tại KHOIPHIM: Hành động, Tình cảm, Kinh dị, Hoạt hình và nhiều hơn nữa.",
    alternates: { canonical: "https://khoiphim.org/the-loai" },
};

const CATEGORY_META: Record<string, {
    image: string;
    gradient: string;
    accent: string;
    icon: React.ElementType;
    sub: string;
    badge?: string;
}> = {
    "hanh-dong": {
        image: "https://image.tmdb.org/t/p/w780/jXJxMcVoEuXzym3vFnjqDW4Z6oM.jpg",
        gradient: "from-red-950/90 via-red-900/50 to-transparent",
        accent: "#f87171",
        icon: Swords,
        sub: "Căng thẳng từng giây",
        badge: "🔥 Phổ biến",
    },
    "tinh-cam": {
        image: "https://image.tmdb.org/t/p/w780/qJeU7KM4nT2C1WpOrwPcSDGFUWE.jpg",
        gradient: "from-pink-950/90 via-pink-900/50 to-transparent",
        accent: "#f9a8d4",
        icon: Heart,
        sub: "Ngọt ngào & lãng mạn",
        badge: "Thanh xuân",
    },
    "co-trang": {
        image: "https://image.tmdb.org/t/p/w780/dKqa850uvbNSCaQCV4Im1XlzEtQ.jpg",
        gradient: "from-indigo-950/90 via-indigo-900/50 to-transparent",
        accent: "#a5b4fc",
        icon: Scroll,
        sub: "Cung đấu & kiếm hiệp",
        badge: "Huyền ảo",
    },
    "kinh-di": {
        image: "https://image.tmdb.org/t/p/w780/5i6SjyDbDWqyun8klUuCxrlFbyw.jpg",
        gradient: "from-neutral-950/90 via-neutral-900/60 to-transparent",
        accent: "#d4d4d4",
        icon: Eye,
        sub: "Nỗi sợ ám ảnh",
        badge: "Tâm linh",
    },
    "vien-tuong": {
        image: "https://image.tmdb.org/t/p/w780/8rpDcsfLJypbO6vtecsmEZzAUoa.jpg",
        gradient: "from-blue-950/90 via-blue-900/50 to-transparent",
        accent: "#93c5fd",
        icon: Rocket,
        sub: "Khám phá tương lai",
        badge: "4K",
    },
    "hai-huoc": {
        image: "https://image.tmdb.org/t/p/w780/x2RS3hTbc5bAEuMtjsVcqLAie42.jpg",
        gradient: "from-amber-950/90 via-amber-900/50 to-transparent",
        accent: "#fcd34d",
        icon: Smile,
        sub: "Tiếng cười sảng khoái",
    },
    "tam-ly": {
        image: "https://image.tmdb.org/t/p/w780/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
        gradient: "from-violet-950/90 via-violet-900/50 to-transparent",
        accent: "#c4b5fd",
        icon: Brain,
        sub: "Câu chuyện lắng đọng",
        badge: "🔥 Hot",
    },
    "hinh-su": {
        image: "https://image.tmdb.org/t/p/w780/oRiUKwDpcqDdoLwPoA4FIRh3hqY.jpg",
        gradient: "from-slate-950/90 via-slate-900/50 to-transparent",
        accent: "#94a3b8",
        icon: Shield,
        sub: "Đấu trí nghẹt thở",
    },
    "vo-thuat": {
        image: "https://image.tmdb.org/t/p/w780/wNXcdsrEcb1kQdYQZtJgV6Z4K51.jpg",
        gradient: "from-orange-950/90 via-orange-900/50 to-transparent",
        accent: "#fb923c",
        icon: Zap,
        sub: "Kỹ năng đỉnh cao",
    },
    "am-nhac": {
        image: "https://image.tmdb.org/t/p/w780/2nEKgG9FwB36398K70gJk1YQpQ4.jpg",
        gradient: "from-fuchsia-950/90 via-fuchsia-900/50 to-transparent",
        accent: "#e879f9",
        icon: Music,
        sub: "Giai điệu cảm xúc",
    },
    "phieu-luu": {
        image: "https://image.tmdb.org/t/p/w780/yF1eOkaYvwiORauRCPWznV9xVvi.jpg",
        gradient: "from-green-950/90 via-green-900/50 to-transparent",
        accent: "#86efac",
        icon: Compass,
        sub: "Hành trình vĩ đại",
        badge: "Khám phá",
    },
    "lich-su": {
        image: "https://image.tmdb.org/t/p/w780/gLqjPj4I4uR0AHzI6K8oXJd9Yn9.jpg",
        gradient: "from-yellow-950/90 via-yellow-900/50 to-transparent",
        accent: "#fde68a",
        icon: BookOpen,
        sub: "Ghi dấu thời gian",
    },
    "hoat-hinh": {
        image: "https://image.tmdb.org/t/p/w780/vIgyYkX8gd1KkSCAIfbS2mRzT7x.jpg",
        gradient: "from-teal-950/90 via-teal-900/50 to-transparent",
        accent: "#5eead4",
        icon: Star,
        sub: "Thế giới đầy màu sắc",
    },
    "gia-dinh": {
        image: "https://image.tmdb.org/t/p/w780/2u0ZpFXdWe8SowqUuFfH9Qul6rX.jpg",
        gradient: "from-purple-950/90 via-purple-900/50 to-transparent",
        accent: "#d8b4fe",
        icon: Home,
        sub: "Gắn kết yêu thương",
    },
    "tre-em": {
        image: "https://image.tmdb.org/t/p/w780/vIgyYkX8gd1KkSCAIfbS2mRzT7x.jpg",
        gradient: "from-cyan-950/90 via-cyan-900/50 to-transparent",
        accent: "#67e8f9",
        icon: Baby,
        sub: "Dành cho bé yêu",
    },
    "khoa-hoc": {
        image: "https://image.tmdb.org/t/p/w780/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
        gradient: "from-sky-950/90 via-sky-900/50 to-transparent",
        accent: "#7dd3fc",
        icon: Beaker,
        sub: "Kiến thức vô tận",
    },
    "than-thoai": {
        image: "https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
        gradient: "from-purple-950/90 via-violet-900/50 to-transparent",
        accent: "#c4b5fd",
        icon: Flame,
        sub: "Huyền thoại muôn đời",
    },
    "chien-tranh": {
        image: "https://image.tmdb.org/t/p/w780/2vR0xKGm0jLaxHY9WT97ZlnTKHQ.jpg",
        gradient: "from-stone-950/90 via-stone-900/50 to-transparent",
        accent: "#a8a29e",
        icon: Sword,
        sub: "Bi hùng & khốc liệt",
    },
    "bi-an": {
        image: "https://image.tmdb.org/t/p/w780/pfMk9UaCwIxGVFl22oFCBNhBBaO.jpg",
        gradient: "from-zinc-950/90 via-zinc-900/60 to-transparent",
        accent: "#a1a1aa",
        icon: Eye,
        sub: "Bí ẩn chờ giải mã",
    },
    "hoc-duong": {
        image: "https://image.tmdb.org/t/p/w780/bvYjhsbxOBwpm8xLE5BhdA3a65Y.jpg",
        gradient: "from-lime-950/90 via-lime-900/50 to-transparent",
        accent: "#a3e635",
        icon: GraduationCap,
        sub: "Tuổi trẻ tươi sáng",
    },
    "tai-lieu": {
        image: "https://image.tmdb.org/t/p/w780/8YFL5QQVPy3AgrEQxNYVSgiPEbe.jpg",
        gradient: "from-emerald-950/90 via-emerald-900/50 to-transparent",
        accent: "#6ee7b7",
        icon: Film,
        sub: "Sự thật cuộc sống",
    },
    "the-thao": {
        image: "https://image.tmdb.org/t/p/w780/q6y0Go1tsGEsmtFryDd0fQ.jpg",
        gradient: "from-red-950/90 via-orange-900/50 to-transparent",
        accent: "#fca5a5",
        icon: Trophy,
        sub: "Tinh thần vô địch",
    },
};

// First 4 slugs shown in the hero bento — order matters
const HERO_SLUGS = ["hanh-dong", "co-trang", "kinh-di", "tinh-cam"];

const FALLBACK_META = {
    image: "https://image.tmdb.org/t/p/w780/8rpDcsfLJypbO6vtecsmEZzAUoa.jpg",
    gradient: "from-zinc-950/90 via-zinc-900/60 to-transparent",
    accent: "#8FA7C5",
    icon: Film,
    sub: "Tuyển tập phim hay",
};

export default async function GenresIndexPage() {
    const { categories } = await getMenuData();

    // Hero: the 4 fixed slugs (in order), fallback to first 4 API categories if not found
    const heroCategories = HERO_SLUGS
        .map(slug => categories.find(c => c.slug === slug))
        .filter(Boolean) as typeof categories;

    // Remaining categories not in hero
    const heroSlugs = new Set(heroCategories.map(c => c.slug));
    const restCategories = categories.filter(c => !heroSlugs.has(c.slug));

    return (
        <main className="min-h-screen pb-24 bg-[#060913]">
            {/* Ambient glow */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(30,41,75,0.45)_0%,transparent_65%)] pointer-events-none" />

            <div className="pt-28 w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 lg:pl-24 lg:pr-10 relative">

                {/* Header */}
                <div className="mb-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-white/35 hover:text-white/80 text-[13px] font-medium transition-colors mb-7 group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Trang chủ
                    </Link>
                    <h1 className="text-3xl md:text-[42px] font-black text-white tracking-tighter leading-none mb-2">
                        Thể Loại <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8FA7C5] to-white/40">Phim</span>
                    </h1>
                    <p className="text-white/35 text-[14px]">
                        {categories.length} thể loại · Từ hành động kịch tính đến chuyện tình ngọt ngào
                    </p>
                </div>

                {/* ── HERO BENTO — 4 cards, fixed layout ─────────────────────────── */}
                {heroCategories.length > 0 && (
                    <div className="mb-4">
                        {/* Desktop: 3-col bento — left tall card + right 3 stacked in 2 rows */}
                        <div className="hidden lg:grid lg:grid-cols-3 lg:grid-rows-2 gap-3 h-[460px]">
                            {heroCategories.map((cat, i) => {
                                const meta = CATEGORY_META[cat.slug] || FALLBACK_META;
                                const Icon = meta.icon;
                                const isHero = i === 0; // left tall card

                                return (
                                    <Link
                                        key={cat.slug}
                                        href={`/the-loai/${cat.slug}`}
                                        className={cn(
                                            "group relative overflow-hidden border border-white/[0.07] hover:border-white/15",
                                            "shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.8)]",
                                            "transition-all duration-500 hover:-translate-y-0.5",
                                            isHero
                                                ? "row-span-2 rounded-2xl"
                                                : "col-span-1 rounded-xl"
                                        )}
                                    >
                                        <Image
                                            src={meta.image}
                                            alt={cat.name}
                                            fill
                                            className="object-cover object-center scale-[1.02] group-hover:scale-[1.07] transition-transform duration-700 ease-out"
                                            sizes={isHero ? "33vw" : "22vw"}
                                            priority={i === 0}
                                            quality={70}
                                        />
                                        <div className={cn("absolute inset-0 bg-gradient-to-r", meta.gradient)} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                        {meta.badge && (
                                            <div
                                                className="absolute top-3.5 right-3.5 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                                                style={{ background: `${meta.accent}20`, color: meta.accent, border: `1px solid ${meta.accent}40` }}
                                            >
                                                {meta.badge}
                                            </div>
                                        )}

                                        <div className={cn("absolute inset-0 flex flex-col justify-end z-10", isHero ? "p-6" : "p-4")}>
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
                                                style={{ background: `${meta.accent}18`, border: `1px solid ${meta.accent}35` }}
                                            >
                                                <Icon className="w-4 h-4" style={{ color: meta.accent }} strokeWidth={2} />
                                            </div>
                                            <h3 className={cn(
                                                "font-black tracking-tight leading-none text-white drop-shadow-lg",
                                                isHero ? "text-4xl" : "text-2xl"
                                            )}>
                                                {cat.name}
                                            </h3>
                                            <p className="text-white/50 text-[12px] font-medium mt-1.5">{meta.sub}</p>
                                            <div className="mt-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                                                <span className="text-[11px] font-bold" style={{ color: meta.accent }}>Xem ngay →</span>
                                            </div>
                                        </div>

                                        <div
                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                            style={{ background: `radial-gradient(circle at 30% 70%, ${meta.accent}08 0%, transparent 55%)` }}
                                        />
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Mobile / tablet: 2-col uniform grid */}
                        <div className="grid grid-cols-2 gap-3 lg:hidden">
                            {heroCategories.map((cat) => {
                                const meta = CATEGORY_META[cat.slug] || FALLBACK_META;
                                const Icon = meta.icon;
                                return (
                                    <Link
                                        key={cat.slug}
                                        href={`/the-loai/${cat.slug}`}
                                        className="group relative overflow-hidden rounded-xl border border-white/[0.07] aspect-[4/3] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-white/14 transition-all duration-400"
                                    >
                                        <Image
                                            src={meta.image}
                                            alt={cat.name}
                                            fill
                                            className="object-cover object-center group-hover:scale-[1.06] transition-transform duration-600"
                                            sizes="50vw"
                                            quality={70}
                                        />
                                        <div className={cn("absolute inset-0 bg-gradient-to-r", meta.gradient)} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                        <div className="absolute inset-0 p-4 flex flex-col justify-end z-10">
                                            <h3 className="font-black text-xl text-white leading-tight">{cat.name}</h3>
                                            <p className="text-white/50 text-[11px] mt-0.5">{meta.sub}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── REST — uniform card grid ─────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {restCategories.map((cat) => {
                        const meta = CATEGORY_META[cat.slug] || FALLBACK_META;
                        const Icon = meta.icon;

                        return (
                            <Link
                                key={cat.slug}
                                href={`/the-loai/${cat.slug}`}
                                className={cn(
                                    "group relative overflow-hidden rounded-xl border border-white/[0.06] hover:border-white/13",
                                    "aspect-[3/2]",
                                    "transition-all duration-400 shadow-[0_4px_16px_rgba(0,0,0,0.45)]",
                                    "hover:-translate-y-0.5 hover:shadow-[0_10px_32px_rgba(0,0,0,0.7)]"
                                )}
                            >
                                <Image
                                    src={meta.image}
                                    alt={cat.name}
                                    fill
                                    className="object-cover object-center scale-[1.03] group-hover:scale-[1.1] transition-transform duration-600 ease-out"
                                    sizes="(max-width:640px) 50vw, (max-width:1024px) 25vw, 16vw"
                                    quality={70}
                                />
                                {/* Gradient overlay */}
                                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-85", meta.gradient)} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                                <div className="absolute inset-0 p-3 flex flex-col justify-between z-10">
                                    {/* Icon */}
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center self-start transition-transform duration-300 group-hover:scale-110"
                                        style={{ background: `${meta.accent}18`, border: `1px solid ${meta.accent}30` }}
                                    >
                                        <Icon className="w-3.5 h-3.5" style={{ color: meta.accent }} strokeWidth={2.5} />
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <h3 className="font-black text-sm sm:text-base text-white leading-tight tracking-tight">
                                            {cat.name}
                                        </h3>
                                        <p className="text-white/40 text-[10px] sm:text-[11px] mt-0.5 line-clamp-1 group-hover:text-white/60 transition-colors">
                                            {meta.sub}
                                        </p>
                                    </div>
                                </div>

                                {/* Bottom accent line */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}55, transparent)` }}
                                />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
