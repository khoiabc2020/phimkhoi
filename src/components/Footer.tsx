import Link from "next/link";
import { Facebook, Instagram, Send, MapPin, Mail, Phone, Smartphone, Star, Shield, BookOpen, FilmIcon } from "lucide-react";

const GENRES = [
    { label: "Hành động", slug: "hanh-dong" },
    { label: "Kinh dị", slug: "kinh-di" },
    { label: "Hài hước", slug: "hai-huoc" },
    { label: "Tình cảm", slug: "tinh-cam" },
    { label: "Phiêu lưu", slug: "phieu-luu" },
    { label: "Khoa học viễn tưởng", slug: "khoa-hoc" },
    { label: "Hoạt hình", slug: "hoat-hinh" },
    { label: "Tâm lý", slug: "tam-ly" },
    { label: "Tội phạm", slug: "toi-pham" },
    { label: "Thần thoại", slug: "than-thoai" },
    { label: "Chiến tranh", slug: "chien-tranh" },
    { label: "Cổ trang", slug: "co-trang" },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#080a0e] text-gray-400 border-t border-gray-800/40 relative z-10 w-full mb-16 lg:mb-0">

            {/* App Download Banner */}
            <div className="bg-gradient-to-r from-green-900/20 via-[#0e1117] to-yellow-900/10 border-b border-gray-800/40">
                <div className="container mx-auto px-4 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Smartphone size={22} className="text-green-400 shrink-0" />
                        <div>
                            <p className="text-white font-semibold">Tải ứng dụng PhimKhởi</p>
                            <p className="text-gray-500 text-sm">Xem phim mọi lúc, mọi nơi — cả khi không có internet</p>
                        </div>
                    </div>
                    <a
                        href="https://khoiphim.io.vn/api/download/apk"
                        className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-green-900/30"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14l-4-4 1.41-1.41L11 13.17l6.59-6.59L19 8l-8 8z" />
                        </svg>
                        Tải APK Android
                    </a>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="container mx-auto px-4 md:px-8 pt-12 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">

                    {/* Col 1: Brand */}
                    <div className="flex flex-col gap-5">
                        <Link href="/" className="inline-block">
                            <span className="text-3xl font-black tracking-tight text-white uppercase">
                                PhimKhởi<span className="text-green-400">.</span>
                            </span>
                        </Link>
                        <p className="text-sm leading-relaxed text-gray-500">
                            Trải nghiệm điện ảnh đỉnh cao ngay tại nhà. Hàng ngàn bộ phim bom tấn, phim bộ và show truyền hình hấp dẫn — miễn phí và cập nhật hàng ngày.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-green-950/50 text-green-400 border border-green-800/40">
                                <Star size={10} />HD &amp; 4K
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-950/50 text-blue-400 border border-blue-800/40">
                                <Shield size={10} />Vietsub
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-purple-950/50 text-purple-400 border border-purple-800/40">
                                <FilmIcon size={10} />10,000+ phim
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all duration-300 border border-gray-800/80">
                                <Facebook size={15} />
                            </a>
                            <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all duration-300 border border-gray-800/80">
                                <Instagram size={15} />
                            </a>
                            <a href="#" aria-label="Telegram" className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all duration-300 border border-gray-800/80">
                                <Send size={15} />
                            </a>
                        </div>
                    </div>

                    {/* Col 2: Khám phá */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-1 flex items-center gap-2">
                            <BookOpen size={13} className="text-green-400" />
                            Khám phá
                        </h3>
                        {[
                            { href: "/danh-sach/phim-moi-cap-nhat", label: "Phim mới cập nhật" },
                            { href: "/danh-sach/phim-le", label: "Phim lẻ" },
                            { href: "/danh-sach/phim-bo", label: "Phim bộ" },
                            { href: "/danh-sach/hoat-hinh", label: "Hoạt hình" },
                            { href: "/danh-sach/tv-shows", label: "TV Shows" },
                            { href: "/danh-sach/phim-sap-chieu", label: "Phim sắp chiếu" },
                        ].map(({ href, label }) => (
                            <Link key={href} href={href} className="text-sm text-gray-500 hover:text-green-400 hover:translate-x-1 transition-all duration-200 w-fit">
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Col 3: Quốc gia */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-1 flex items-center gap-2">
                            <FilmIcon size={13} className="text-green-400" />
                            Phim theo khu vực
                        </h3>
                        {[
                            { href: "/quoc-gia/han-quoc", label: "🇰🇷 Phim Hàn Quốc" },
                            { href: "/quoc-gia/trung-quoc", label: "🇨🇳 Phim Trung Quốc" },
                            { href: "/quoc-gia/au-my", label: "🇺🇸 Phim Âu Mỹ" },
                            { href: "/quoc-gia/nhat-ban", label: "🇯🇵 Phim Nhật Bản" },
                            { href: "/quoc-gia/thai-lan", label: "🇹🇭 Phim Thái Lan" },
                            { href: "/quoc-gia/viet-nam", label: "🇻🇳 Phim Việt Nam" },
                        ].map(({ href, label }) => (
                            <Link key={href} href={href} className="text-sm text-gray-500 hover:text-green-400 hover:translate-x-1 transition-all duration-200 w-fit">
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Col 4: Hỗ trợ & Liên hệ */}
                    <div className="flex flex-col gap-5">
                        <div>
                            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Shield size={13} className="text-green-400" />
                                Hỗ trợ
                            </h3>
                            <div className="flex flex-col gap-2.5">
                                {[
                                    { href: "#", label: "Câu hỏi thường gặp" },
                                    { href: "#", label: "Chính sách bảo mật" },
                                    { href: "#", label: "Điều khoản sử dụng" },
                                    { href: "#", label: "Liên hệ quảng cáo" },
                                ].map(({ href, label }) => (
                                    <Link key={label} href={href} className="text-sm text-gray-500 hover:text-green-400 transition-colors w-fit">
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-3">Liên hệ</h3>
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-start gap-2.5">
                                    <MapPin size={14} className="text-green-500 mt-0.5 shrink-0" />
                                    <span className="text-sm text-gray-500">TP. Hồ Chí Minh, Việt Nam</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Mail size={14} className="text-green-500 shrink-0" />
                                    <a href="mailto:contact@phimkhoi.io.vn" className="text-sm text-gray-500 hover:text-green-400 transition-colors">
                                        contact@phimkhoi.io.vn
                                    </a>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Phone size={14} className="text-green-500 shrink-0" />
                                    <span className="text-sm text-gray-500">+84 900 123 456</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Genre Tags Cloud */}
                <div className="py-6 border-t border-gray-800/40">
                    <p className="text-xs text-gray-700 uppercase tracking-widest mb-3">Thể loại phổ biến</p>
                    <div className="flex flex-wrap gap-2">
                        {GENRES.map(({ label, slug }) => (
                            <Link
                                key={slug}
                                href={`/the-loai/${slug}`}
                                className="px-3 py-1 text-xs bg-gray-900 text-gray-500 hover:text-green-400 hover:border-green-700 border border-gray-800 rounded-full transition-all duration-200"
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-5 border-t border-gray-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div>
                        <p className="text-gray-600">
                            &copy; {currentYear} <span className="text-white font-semibold">PHIMKHỞI</span>. All rights reserved.
                        </p>
                        <p className="text-gray-700 mt-1">
                            PhimKhởi không lưu trữ phim trên máy chủ. Tất cả nội dung được lấy từ các nguồn công khai trên internet.
                        </p>
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                        <Link href="#" className="text-gray-600 hover:text-white transition-colors">Privacy</Link>
                        <Link href="#" className="text-gray-600 hover:text-white transition-colors">Terms</Link>
                        <Link href="#" className="text-gray-600 hover:text-white transition-colors">Sitemap</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
