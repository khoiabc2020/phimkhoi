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
        <footer className="bg-[#0a0b0f] border-t border-white/5 w-full mb-16 lg:mb-0">

            {/* Main grid */}
            <div className="max-w-screen-xl mx-auto px-5 md:px-8 pt-14 pb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">

                    {/* Brand column */}
                    <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
                        <Link href="/" className="inline-flex items-center gap-1.5">
                            <span className="text-2xl font-black tracking-tight text-white">
                                Movie<span className="text-[#F4C84A]">Box</span>
                            </span>
                        </Link>
                        <p className="text-[13px] text-gray-500 leading-relaxed max-w-[220px]">
                            Xem hàng ngàn bộ phim chất lượng cao, vietsub chuẩn, miễn phí — cập nhật hàng ngày.
                        </p>
                        <div className="flex gap-2.5 mt-1">
                            <a href="https://moviebox.io.vn/api/download/apk"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F4C84A] text-black text-[12px] font-bold hover:bg-[#e6b83e] transition-colors">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.42.07 2.41.74 3.23.8 1.23-.24 2.41-.93 3.73-.84 1.58.14 2.77.71 3.53 1.81-3.24 1.93-2.27 5.85.51 6.99-.6 1.45-1.24 2.88-3 4.12zM13 3.5c.17-2 1.91-3.37 3.37-3.5.29 2.22-1.63 3.75-3.37 3.5z" />
                                </svg>
                                Tải App
                            </a>
                        </div>
                        <div className="flex gap-3 mt-1">
                            {[
                                { label: "FB", href: "#" },
                                { label: "IG", href: "#" },
                                { label: "TG", href: "#" },
                            ].map(({ label, href }) => (
                                <a key={label} href={href}
                                    className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[11px] text-gray-400 hover:border-[#F4C84A] hover:text-[#F4C84A] transition-all">
                                    {label}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Discover */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#F4C84A] mb-1">Khám phá</p>
                        {DISCOVER_LINKS.map(({ href, label }) => (
                            <Link key={href} href={href}
                                className="text-[13px] text-gray-500 hover:text-white transition-colors">
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Countries */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#F4C84A] mb-1">Quốc gia</p>
                        {COUNTRY_LINKS.map(({ href, label }) => (
                            <Link key={href} href={href}
                                className="text-[13px] text-gray-500 hover:text-white transition-colors">
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Support */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#F4C84A] mb-1">Hỗ trợ</p>
                        {[
                            { href: "#", label: "Câu hỏi thường gặp" },
                            { href: "#", label: "Chính sách bảo mật" },
                            { href: "#", label: "Điều khoản sử dụng" },
                            { href: "#", label: "Liên hệ quảng cáo" },
                            { href: "mailto:contact@moviebox.io.vn", label: "contact@moviebox.io.vn" },
                        ].map(({ href, label }) => (
                            <a key={label} href={href}
                                className="text-[13px] text-gray-500 hover:text-white transition-colors">
                                {label}
                            </a>
                        ))}
                    </div>

                </div>

                {/* Genre tags */}
                <div className="py-5 border-t border-white/5">
                    <div className="flex flex-wrap gap-2">
                        {GENRES.map(({ label, slug }) => (
                            <Link key={slug} href={`/the-loai/${slug}`}
                                className="px-3 py-1 rounded-full text-[12px] text-gray-600 border border-white/8 hover:text-[#F4C84A] hover:border-[#F4C84A]/40 transition-all">
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-5 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="text-[12px] text-gray-700">
                        <p>&copy; {year} <span className="text-white/60">MovieBox</span>. All rights reserved.</p>
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
