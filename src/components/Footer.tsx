import Link from "next/link";

const DISCOVER_LINKS = [
    { href: "/danh-sach/phim-moi-cap-nhat", label: "Phim mới" },
    { href: "/danh-sach/phim-le", label: "Phim lẻ" },
    { href: "/danh-sach/phim-bo", label: "Phim bộ" },
    { href: "/danh-sach/hoat-hinh", label: "Hoạt hình" },
    { href: "/danh-sach/tv-shows", label: "TV Shows" },
    { href: "/danh-sach/phim-sap-chieu", label: "Sắp chiếu" },
];

const COUNTRY_LINKS = [
    { href: "/quoc-gia/han-quoc", label: "Hàn Quốc" },
    { href: "/quoc-gia/trung-quoc", label: "Trung Quốc" },
    { href: "/quoc-gia/au-my", label: "Âu Mỹ" },
    { href: "/quoc-gia/nhat-ban", label: "Nhật Bản" },
    { href: "/quoc-gia/thai-lan", label: "Thái Lan" },
    { href: "/quoc-gia/viet-nam", label: "Việt Nam" },
];

const SUPPORT_LINKS = [
    { href: "/the-loai", label: "Thể loại" },
    { href: "/quoc-gia", label: "Quốc gia" },
    { href: "/loc-phim", label: "Lọc phim" },
    { href: "mailto:support@khoiphim.org", label: "Liên hệ" },
];

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-[#0a0b0f] border-t border-white/5 w-full">
            <div className="w-full max-w-[1920px] mx-auto px-4 md:px-12 lg:pl-24 lg:pr-12 pt-6 md:pt-12 pb-4">

                {/* Mobile: compact 2-row layout | Desktop: 4-col grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 mb-6">

                    {/* Brand — horizontal on mobile */}
                    <div className="flex flex-row md:flex-col items-start gap-4 md:gap-4">
                        <div className="shrink-0">
                            <Link href="/" className="inline-flex items-center">
                                <span className="font-display text-[18px] md:text-[22px] font-black uppercase tracking-tighter text-white">
                                    KHOIPHIM<span className="text-primary ml-0.5">.</span>
                                </span>
                            </Link>
                            <p className="text-[11px] text-white/25 leading-relaxed mt-1 max-w-[200px] md:max-w-[220px] hidden md:block">
                                Xem phim chất lượng cao, vietsub chuẩn, miễn phí — cập nhật hàng ngày.
                            </p>
                        </div>
                        {/* Social + APK buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <a href="/api/download/apk"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-primary/40 text-primary text-[10px] font-bold hover:bg-primary/10 transition-all">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                                    <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 14.93V17h-2v-.07A8 8 0 014.07 13H5v-2h-.93A8 8 0 0111 4.07V5h2v-.93A8 8 0 0119.93 11H19v2h.93A8 8 0 0113 16.93z"/>
                                </svg>
                                APK
                            </a>
                            <a href="#" aria-label="Facebook" className="w-7 h-7 rounded-md border border-white/[0.07] flex items-center justify-center text-white/30 hover:text-white hover:border-white/20 transition-all">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
                            </a>
                            <a href="#" aria-label="Telegram" className="w-7 h-7 rounded-md border border-white/[0.07] flex items-center justify-center text-white/30 hover:text-white hover:border-white/20 transition-all">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M21.94 3.3a1 1 0 00-1.02-.15l-18 7a1 1 0 00.08 1.88l4.5 1.5 1.5 5.25a1 1 0 001.72.37L13 17.06l4.6 3.45a1 1 0 001.55-.72l2-15a1 1 0 00-.21-.49z"/></svg>
                            </a>
                        </div>
                    </div>

                    {/* Links — 3 columns on mobile in a compact grid */}
                    <div className="col-span-1 md:col-span-3 grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-8">
                        {/* Discover */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8FA7C5] mb-2 md:mb-3">Khám phá</p>
                            <div className="flex flex-col gap-1.5 md:gap-2.5">
                                {DISCOVER_LINKS.map(({ href, label }) => (
                                    <Link key={href} href={href}
                                        className="text-[11px] md:text-[13px] text-white/30 hover:text-white/70 transition-colors leading-tight">
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Countries */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8FA7C5] mb-2 md:mb-3">Quốc gia</p>
                            <div className="flex flex-col gap-1.5 md:gap-2.5">
                                {COUNTRY_LINKS.map(({ href, label }) => (
                                    <Link key={href} href={href}
                                        className="text-[11px] md:text-[13px] text-white/30 hover:text-white/70 transition-colors leading-tight">
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Support */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8FA7C5] mb-2 md:mb-3">Hỗ trợ</p>
                            <div className="flex flex-col gap-1.5 md:gap-2.5">
                                {SUPPORT_LINKS.map(({ href, label }) => (
                                    <a key={label} href={href}
                                        className="text-[11px] md:text-[13px] text-white/30 hover:text-white/70 transition-colors leading-tight">
                                        {label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-4 border-t border-white/[0.05] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
                    <p className="text-[11px] text-white/20">&copy; {year} KHOIPHIM — Nội dung tổng hợp từ nguồn công khai.</p>
                    <div className="flex gap-3 text-[11px] text-white/20">
                        <a href="mailto:support@khoiphim.org" className="hover:text-white/50 transition-colors">Liên hệ</a>
                        <Link href="/the-loai" className="hover:text-white/50 transition-colors">Thể loại</Link>
                        <Link href="/quoc-gia" className="hover:text-white/50 transition-colors">Quốc gia</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
