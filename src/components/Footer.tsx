import Link from "next/link";

const DISCOVER_LINKS = [
    { href: "/danh-sach/phim-moi-cap-nhat", label: "Phim mới cập nhật" },
    { href: "/danh-sach/phim-le", label: "Phim lẻ" },
    { href: "/danh-sach/phim-bo", label: "Phim bộ" },
    { href: "/danh-sach/hoat-hinh", label: "Hoạt hình" },
    { href: "/danh-sach/tv-shows", label: "TV Shows" },
    { href: "/danh-sach/phim-sap-chieu", label: "Phim sắp chiếu" },
];

const COUNTRY_LINKS = [
    { href: "/quoc-gia/han-quoc", label: "Hàn Quốc" },
    { href: "/quoc-gia/trung-quoc", label: "Trung Quốc" },
    { href: "/quoc-gia/au-my", label: "Âu Mỹ" },
    { href: "/quoc-gia/nhat-ban", label: "Nhật Bản" },
    { href: "/quoc-gia/thai-lan", label: "Thái Lan" },
    { href: "/quoc-gia/viet-nam", label: "Việt Nam" },
];

const GENRES = [
    { label: "Hành động", slug: "hanh-dong" },
    { label: "Kinh dị", slug: "kinh-di" },
    { label: "Hài hước", slug: "hai-huoc" },
    { label: "Tình cảm", slug: "tinh-cam" },
    { label: "Phiêu lưu", slug: "phieu-luu" },
    { label: "Viễn tưởng", slug: "khoa-hoc" },
    { label: "Hoạt hình", slug: "hoat-hinh" },
    { label: "Tâm lý", slug: "tam-ly" },
    { label: "Tội phạm", slug: "toi-pham" },
    { label: "Cổ trang", slug: "co-trang" },
    { label: "Chiến tranh", slug: "chien-tranh" },
    { label: "Thần thoại", slug: "than-thoai" },
];

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-[#0a0b0f] border-t border-white/5 w-full mb-0 lg:mb-0">

            {/* Main grid */}
            <div className="w-full max-w-[1920px] mx-auto px-4 md:px-12 pt-14 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">

                    {/* Brand column */}
                    <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
                        <Link href="/" className="inline-flex items-center">
                            <span className="font-display text-[22px] font-black uppercase tracking-tighter text-white">
                                KHOIPHIM<span className="text-[#8FA7C5] ml-0.5">.</span>
                            </span>
                        </Link>
                        <p className="text-[13px] text-gray-500 leading-relaxed max-w-[220px]">
                            Xem hàng ngàn bộ phim chất lượng cao, vietsub chuẩn, miễn phí — cập nhật hàng ngày.
                        </p>
                        <a href="https://khoiphim.io.vn/api/download/apk"
                            className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full border border-[#8FA7C5]/40 text-[#8FA7C5] text-[12px] font-medium hover:bg-[#8FA7C5]/10 transition-all duration-200 mt-1">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-5h2v2h-2zm0-8h2v6h-2z" />
                            </svg>
                            Tải APK Android
                        </a>
                        <div className="flex gap-2.5 mt-2">
                            {/* Facebook */}
                            <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-gray-600 hover:border-white/20 hover:text-white transition-all duration-200">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
                            </a>
                            {/* Instagram */}
                            <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-gray-600 hover:border-white/20 hover:text-white transition-all duration-200">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                            </a>
                            {/* Telegram */}
                            <a href="#" aria-label="Telegram" className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-gray-600 hover:border-white/20 hover:text-white transition-all duration-200">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M21.94 3.3a1 1 0 00-1.02-.15l-18 7a1 1 0 00.08 1.88l4.5 1.5 1.5 5.25a1 1 0 001.72.37L13 17.06l4.6 3.45a1 1 0 001.55-.72l2-15a1 1 0 00-.21-.49z" /></svg>
                            </a>
                        </div>
                    </div>

                    {/* Discover */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#8FA7C5] mb-1">Khám phá</p>
                        {DISCOVER_LINKS.map(({ href, label }) => (
                            <Link key={href} href={href}
                                className="text-[13px] text-gray-500 hover:text-white transition-colors">
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Countries */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#8FA7C5] mb-1">Quốc gia</p>
                        {COUNTRY_LINKS.map(({ href, label }) => (
                            <Link key={href} href={href}
                                className="text-[13px] text-gray-500 hover:text-white transition-colors">
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Support */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#8FA7C5] mb-1">Hỗ trợ</p>
                            {[
                            { href: "#", label: "Câu hỏi thường gặp" },
                            { href: "#", label: "Chính sách bảo mật" },
                            { href: "#", label: "Điều khoản sử dụng" },
                            { href: "#", label: "Liên hệ quảng cáo" },
                            { href: "mailto:support@khoiphim.io.vn", label: "support@khoiphim.io.vn" },
                        ].map(({ href, label }) => (
                            <a key={label} href={href}
                                className="text-[13px] text-gray-500 hover:text-white transition-colors">
                                {label}
                            </a>
                        ))}
                    </div>

                </div>



                {/* Bottom */}
                <div className="pt-5 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="text-[12px] text-gray-700">
                        <p>&copy; {year} <span className="text-white/60">KHOIPHIM</span>. All rights reserved.</p>
                        <p className="mt-0.5">Nội dung được tổng hợp từ các nguồn công khai. Chúng tôi không lưu trữ video trên máy chủ.</p>
                    </div>
                    <div className="flex gap-4 text-[12px] text-gray-700 shrink-0">
                        <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="#" className="hover:text-white transition-colors">Sitemap</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
