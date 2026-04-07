import { getMenuData } from "@/services/api";
import Link from "next/link";
import Image from "next/image";
import {
    ChevronLeft, Swords, Heart, Smile, Brain, Eye, Rocket, Zap,
    Shield, Music, Compass, Scroll, Home, Baby, Beaker, BookOpen,
    Flame, Star, Film, Trophy, GraduationCap, Sword, MapPin,
} from "lucide-react";
import { Metadata } from "next";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Thể Loại Phim - KHOIPHIM",
    description: "Khám phá tất cả các thể loại phim tại KHOIPHIM: Hành động, Tình cảm, Kinh dị, Hoạt hình và nhiều hơn nữa.",
    alternates: { canonical: "https://khoiphim.org/the-loai" },
};

// Unsplash stable photo IDs — reliable, no auth, always available
const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=780&q=75&auto=format&fit=crop`;

const CATEGORY_META: Record<string, {
    image: string;
    gradient: string;
    accent: string;
    icon: React.ElementType;
    sub: string;
    badge?: string;
}> = {
    "hanh-dong": {
        image: U("1536440136628-849c177e76a1"),   // dark cinematic action
        gradient: "from-red-950/80 to-red-900/20",
        accent: "#f87171",
        icon: Swords,
        sub: "Căng thẳng từng giây",
        badge: "Phổ biến",
    },
    "tinh-cam": {
        image: U("1518199266791-5375a83190b7"),   // couple romantic
        gradient: "from-pink-950/80 to-pink-900/20",
        accent: "#f9a8d4",
        icon: Heart,
        sub: "Ngọt ngào & lãng mạn",
    },
    "co-trang": {
        image: U("1548586196-aa5803b77379"),       // ancient east asian architecture
        gradient: "from-indigo-950/80 to-indigo-900/20",
        accent: "#a5b4fc",
        icon: Scroll,
        sub: "Cung đấu & kiếm hiệp",
        badge: "Hot",
    },
    "kinh-di": {
        image: U("1504701954957-2010ec3bcec1"),   // dark forest horror
        gradient: "from-neutral-950/80 to-neutral-900/20",
        accent: "#d4d4d4",
        icon: Eye,
        sub: "Nỗi sợ ám ảnh",
    },
    "vien-tuong": {
        image: U("1451187580459-43490279c0fa"),   // galaxy / space
        gradient: "from-blue-950/80 to-blue-900/20",
        accent: "#93c5fd",
        icon: Rocket,
        sub: "Khám phá tương lai",
        badge: "4K",
    },
    "hai-huoc": {
        image: U("1527161153332-99adcc6112d6"),   // laughing crowd
        gradient: "from-amber-950/80 to-amber-900/20",
        accent: "#fcd34d",
        icon: Smile,
        sub: "Tiếng cười sảng khoái",
    },
    "tam-ly": {
        image: U("1474552226712-ac0f0961a954"),   // solitude / contemplation
        gradient: "from-violet-950/80 to-violet-900/20",
        accent: "#c4b5fd",
        icon: Brain,
        sub: "Câu chuyện lắng đọng",
    },
    "hinh-su": {
        image: U("1519074069399-e3a7e80a1e90"),   // dark city noir
        gradient: "from-slate-950/80 to-slate-900/20",
        accent: "#94a3b8",
        icon: Shield,
        sub: "Đấu trí nghẹt thở",
    },
    "vo-thuat": {
        image: U("1555597408-26bc8e548a46"),       // martial arts / fighter silhouette
        gradient: "from-orange-950/80 to-orange-900/20",
        accent: "#fb923c",
        icon: Zap,
        sub: "Kỹ năng đỉnh cao",
    },
    "am-nhac": {
        image: U("1511379938547-c1f69419868d"),   // concert / stage lights
        gradient: "from-fuchsia-950/80 to-fuchsia-900/20",
        accent: "#e879f9",
        icon: Music,
        sub: "Giai điệu cảm xúc",
    },
    "phieu-luu": {
        image: U("1469474968028-56623f02e42e"),   // epic mountain adventure
        gradient: "from-green-950/80 to-green-900/20",
        accent: "#86efac",
        icon: Compass,
        sub: "Hành trình vĩ đại",
    },
    "lich-su": {
        image: U("1461360228754-6e81c478b882"),   // ancient ruins / historical
        gradient: "from-yellow-950/80 to-yellow-900/20",
        accent: "#fde68a",
        icon: BookOpen,
        sub: "Ghi dấu thời gian",
    },
    "hoat-hinh": {
        image: U("1534972195531-d1057b9d1dcc"),   // colorful digital art
        gradient: "from-teal-950/80 to-teal-900/20",
        accent: "#5eead4",
        icon: Star,
        sub: "Thế giới đầy màu sắc",
    },
    "gia-dinh": {
        image: U("1542051841857-5f90071e7989"),   // family warmth
        gradient: "from-purple-950/80 to-purple-900/20",
        accent: "#d8b4fe",
        icon: Home,
        sub: "Gắn kết yêu thương",
    },
    "tre-em": {
        image: U("1503454537195-1dcabb73ffb9"),   // children playing
        gradient: "from-cyan-950/80 to-cyan-900/20",
        accent: "#67e8f9",
        icon: Baby,
        sub: "Dành cho bé yêu",
    },
    "khoa-hoc": {
        image: U("1507413245164-6160d8298b31"),   // science lab / futuristic
        gradient: "from-sky-950/80 to-sky-900/20",
        accent: "#7dd3fc",
        icon: Beaker,
        sub: "Kiến thức vô tận",
    },
    "than-thoai": {
        image: U("1518709414768-a88981a4515d"),   // mystical / mythology
        gradient: "from-purple-950/80 to-violet-900/20",
        accent: "#c4b5fd",
        icon: Flame,
        sub: "Huyền thoại muôn đời",
    },
    "chien-tranh": {
        image: U("1526374965328-7f61d4dc18c5"),   // war silhouette
        gradient: "from-stone-950/80 to-stone-900/20",
        accent: "#a8a29e",
        icon: Sword,
        sub: "Bi hùng & khốc liệt",
    },
    "bi-an": {
        image: U("1519074002246-1f9e6f2a96e7"),   // foggy mysterious
        gradient: "from-zinc-950/80 to-zinc-900/20",
        accent: "#a1a1aa",
        icon: Eye,
        sub: "Bí ẩn chờ giải mã",
    },
    "hoc-duong": {
        image: U("1523050854058-8df90110c9f1"),   // school / university
        gradient: "from-lime-950/80 to-lime-900/20",
        accent: "#a3e635",
        icon: GraduationCap,
        sub: "Tuổi trẻ tươi sáng",
    },
    "tai-lieu": {
        image: U("1485846234645-a62644f84728"),   // documentary / camera
        gradient: "from-emerald-950/80 to-emerald-900/20",
        accent: "#6ee7b7",
        icon: Film,
        sub: "Sự thật cuộc sống",
    },
    "the-thao": {
        image: U("1461896836934-ffe607ba8211"),   // stadium sports
        gradient: "from-red-950/80 to-orange-900/20",
        accent: "#fca5a5",
        icon: Trophy,
        sub: "Tinh thần vô địch",
    },
    "mien-tay": {
        image: U("1506905925346-21bda4d32df4"),   // river / countryside landscape
        gradient: "from-green-950/80 to-emerald-900/20",
        accent: "#86efac",
        icon: MapPin,
        sub: "Hương vị miền sông nước",
    },
};

const FALLBACK_META = {
    image: "https://image.tmdb.org/t/p/w780/8rpDcsfLJypbO6vtecsmEZzAUoa.jpg",
    gradient: "from-zinc-950/80 to-zinc-900/20",
    accent: "#8FA7C5",
    icon: Film,
    sub: "Tuyển tập phim hay",
};

export default async function GenresIndexPage() {
    const { categories } = await getMenuData();

    return (
        <main className="min-h-screen pb-24 bg-[#060913]">
            {/* Ambient glow */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(30,41,75,0.45)_0%,transparent_65%)] pointer-events-none" />

            <div className="pt-24 md:pt-28 w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 lg:pl-24 lg:pr-10 relative">

                {/* ── Header ────────────────────────────────────────────── */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/70 text-[13px] font-medium transition-colors mb-5 group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Trang chủ
                    </Link>
                    <h1 className="text-2xl md:text-[36px] font-black text-white tracking-tighter leading-none mb-1.5">
                        Thể Loại <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8FA7C5] to-white/40">Phim</span>
                    </h1>
                    <p className="text-white/30 text-[13px]">
                        {categories.length} thể loại · Từ hành động kịch tính đến chuyện tình ngọt ngào
                    </p>
                </div>

                {/* ── Uniform grid — tất cả thể loại ───────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-3.5">
                    {categories.map((cat, i) => {
                        const meta = CATEGORY_META[cat.slug] || FALLBACK_META;
                        const Icon = meta.icon;

                        return (
                            <Link
                                key={cat.slug}
                                href={`/the-loai/${cat.slug}`}
                                className={cn(
                                    "group relative overflow-hidden rounded-2xl",
                                    "aspect-[16/9]",
                                    "border border-white/[0.07] hover:border-white/20",
                                    "shadow-[0_4px_20px_rgba(0,0,0,0.5)]",
                                    "hover:shadow-[0_8px_32px_rgba(0,0,0,0.7)]",
                                    "transition-all duration-300 hover:-translate-y-0.5"
                                )}
                            >
                                {/* Backdrop image */}
                                <Image
                                    src={meta.image}
                                    alt={cat.name}
                                    fill
                                    className="object-cover object-center group-hover:scale-[1.06] transition-transform duration-500 ease-out"
                                    sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                                    quality={68}
                                    priority={i < 8}
                                />

                                {/* Colour tint overlay */}
                                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-75", meta.gradient)} />
                                {/* Bottom fade for text legibility */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                                {/* Hover accent glow */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                                    style={{ background: `radial-gradient(ellipse at 50% 100%, ${meta.accent}18 0%, transparent 65%)` }}
                                />

                                {/* Top-left: icon badge */}
                                <div className="absolute top-3 left-3 z-10">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                                        style={{ background: `${meta.accent}22`, border: `1px solid ${meta.accent}40` }}
                                    >
                                        <Icon className="w-4 h-4" style={{ color: meta.accent }} strokeWidth={2} />
                                    </div>
                                </div>

                                {/* Top-right: optional badge */}
                                {meta.badge && (
                                    <div className="absolute top-3 right-3 z-10">
                                        <span
                                            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                                            style={{ background: `${meta.accent}22`, color: meta.accent, border: `1px solid ${meta.accent}35` }}
                                        >
                                            {meta.badge}
                                        </span>
                                    </div>
                                )}

                                {/* Bottom: name + subtitle */}
                                <div className="absolute inset-x-0 bottom-0 p-3.5 z-10">
                                    <h3 className="font-black text-white leading-tight tracking-tight text-[15px] md:text-[17px] group-hover:text-white transition-colors drop-shadow-md">
                                        {cat.name}
                                    </h3>
                                    <p
                                        className="text-[11px] font-medium mt-0.5 opacity-60 group-hover:opacity-90 transition-opacity line-clamp-1"
                                        style={{ color: meta.accent }}
                                    >
                                        {meta.sub}
                                    </p>
                                </div>

                                {/* Bottom accent line on hover */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}70, transparent)` }}
                                />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
