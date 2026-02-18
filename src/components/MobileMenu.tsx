'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const categories = [
    { name: 'Hành Động', slug: 'hanh-dong' },
    { name: 'Tình Cảm', slug: 'tinh-cam' },
    { name: 'Hài Hước', slug: 'hai-huoc' },
    { name: 'Cổ Trang', slug: 'co-trang' },
    { name: 'Tâm Lý', slug: 'tam-ly' },
    { name: 'Hình Sự', slug: 'hinh-su' },
    { name: 'Chiến Tranh', slug: 'chien-tranh' },
    { name: 'Thể Thao', slug: 'the-thao' },
    { name: 'Võ Thuật', slug: 'vo-thuat' },
    { name: 'Viễn Tưởng', slug: 'vien-tuong' },
    { name: 'Phiêu Lưu', slug: 'phieu-luu' },
    { name: 'Khoa Học', slug: 'khoa-hoc' },
    { name: 'Kinh Dị', slug: 'kinh-di' },
    { name: 'Âm Nhạc', slug: 'am-nhac' },
    { name: 'Thần Thoại', slug: 'than-thoai' },
    { name: 'Tài Liệu', slug: 'tai-lieu' },
    { name: 'Gia Đình', slug: 'gia-dinh' },
    { name: 'Hoạt Hình', slug: 'hoat-hinh' },
];

const countries = [
    { name: 'Trung Quốc', slug: 'trung-quoc' },
    { name: 'Hàn Quốc', slug: 'han-quoc' },
    { name: 'Nhật Bản', slug: 'nhat-ban' },
    { name: 'Thái Lan', slug: 'thai-lan' },
    { name: 'Âu Mỹ', slug: 'au-my' },
    { name: 'Đài Loan', slug: 'dai-loan' },
    { name: 'Hồng Kông', slug: 'hong-kong' },
    { name: 'Ấn Độ', slug: 'an-do' },
    { name: 'Anh', slug: 'anh' },
    { name: 'Pháp', slug: 'phap' },
    { name: 'Canada', slug: 'canada' },
    { name: 'Quốc Gia Khác', slug: 'quoc-gia-khac' },
    { name: 'Đức', slug: 'duc' },
    { name: 'Tây Ban Nha', slug: 'tay-ban-nha' },
    { name: 'Thổ Nhĩ Kỳ', slug: 'tho-nhi-ky' },
    { name: 'Hà Lan', slug: 'ha-lan' },
    { name: 'Indonesia', slug: 'indonesia' },
    { name: 'Nga', slug: 'nga' },
    { name: 'Mexico', slug: 'mexico' },
    { name: 'Ba Lan', slug: 'ba-lan' },
    { name: 'Úc', slug: 'uc' },
    { name: 'Thụy Điển', slug: 'thuy-dien' },
    { name: 'Malaysia', slug: 'malaysia' },
    { name: 'Brazil', slug: 'brazil' },
    { name: 'Philippines', slug: 'philippines' },
    { name: 'Bồ Đào Nha', slug: 'bo-dao-nha' },
    { name: 'Ý', slug: 'y' },
    { name: 'Đan Mạch', slug: 'dan-mach' },
    { name: 'UAE', slug: 'uae' },
    { name: 'Na Uy', slug: 'na-uy' },
    { name: 'Thụy Sĩ', slug: 'thuy-si' },
    { name: 'Châu Phi', slug: 'chau-phi' },
    { name: 'Nam Phi', slug: 'nam-phi' },
    { name: 'Ukraina', slug: 'ukraina' },
    { name: 'Ả Rập Xê Út', slug: 'a-rap-xe-ut' },
];

const years = Array.from({ length: 30 }, (_, i) => 2025 - i);

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
    const pathname = usePathname();
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const menuItems = [
        { icon: '🏠', label: 'Trang chủ', href: '/' },
        { icon: '🔥', label: 'Phim hot', href: '/danh-sach/phim-hot' },
        { icon: '⭐', label: 'Phim đề cử', href: '/danh-sach/phim-de-cu' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Menu Panel */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-gradient-to-br from-gray-900 via-gray-800 to-black z-50 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-black/40 backdrop-blur-xl border-b border-gray-700/50 p-4 flex items-center justify-between z-10">
                            <Link href="/" onClick={onClose} className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                                    <span className="text-black font-bold text-lg">P</span>
                                </div>
                                <span className="text-white font-bold text-lg">PhimKhoi</span>
                            </Link>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="p-4 border-b border-gray-700/50">
                            <Link href="/tim-kiem" onClick={onClose}>
                                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-gray-700/50 rounded-lg px-4 py-3 hover:bg-white/10 transition-colors">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <span className="text-gray-400 text-sm">Tìm kiếm phim...</span>
                                </div>
                            </Link>
                        </div>

                        {/* User Section */}
                        <div className="p-4 border-b border-gray-700/50">
                            <Link href="/login" onClick={onClose}>
                                <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg px-4 py-3 hover:from-yellow-500 hover:to-yellow-700 transition-all">
                                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="text-black font-semibold">Đăng nhập</span>
                                </div>
                            </Link>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                            {menuItems.map((item) => (
                                <Link key={item.href} href={item.href} onClick={onClose}>
                                    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === item.href
                                            ? 'bg-yellow-400/20 text-yellow-400'
                                            : 'text-gray-300 hover:bg-white/5'
                                        }`}>
                                        <span className="text-xl">{item.icon}</span>
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Expandable Sections */}
                        <div className="p-2 space-y-1">
                            {/* Thể loại */}
                            <div className="border-t border-gray-700/50 pt-2">
                                <button
                                    onClick={() => toggleSection('categories')}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">📂</span>
                                        <span className="text-gray-300 font-medium">Thể loại</span>
                                    </div>
                                    <svg
                                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'categories' ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <AnimatePresence>
                                    {expandedSection === 'categories' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="grid grid-cols-2 gap-2 px-4 py-2">
                                                {categories.map((cat) => (
                                                    <Link key={cat.slug} href={`/the-loai/${cat.slug}`} onClick={onClose}>
                                                        <div className="px-3 py-2 bg-white/5 rounded-lg hover:bg-yellow-400/20 hover:text-yellow-400 transition-colors text-sm text-gray-300 text-center">
                                                            {cat.name}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Quốc gia */}
                            <div>
                                <button
                                    onClick={() => toggleSection('countries')}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">🌍</span>
                                        <span className="text-gray-300 font-medium">Quốc gia</span>
                                    </div>
                                    <svg
                                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'countries' ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <AnimatePresence>
                                    {expandedSection === 'countries' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="grid grid-cols-2 gap-2 px-4 py-2">
                                                {countries.map((country) => (
                                                    <Link key={country.slug} href={`/quoc-gia/${country.slug}`} onClick={onClose}>
                                                        <div className="px-3 py-2 bg-white/5 rounded-lg hover:bg-yellow-400/20 hover:text-yellow-400 transition-colors text-sm text-gray-300 text-center">
                                                            {country.name}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Năm phát hành */}
                            <div>
                                <button
                                    onClick={() => toggleSection('years')}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">📅</span>
                                        <span className="text-gray-300 font-medium">Năm phát hành</span>
                                    </div>
                                    <svg
                                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'years' ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <AnimatePresence>
                                    {expandedSection === 'years' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="grid grid-cols-3 gap-2 px-4 py-2">
                                                {years.map((year) => (
                                                    <Link key={year} href={`/danh-sach/nam-${year}`} onClick={onClose}>
                                                        <div className="px-3 py-2 bg-white/5 rounded-lg hover:bg-yellow-400/20 hover:text-yellow-400 transition-colors text-sm text-gray-300 text-center">
                                                            {year}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Type Links */}
                        <div className="p-2 space-y-1 border-t border-gray-700/50 mt-2">
                            <Link href="/danh-sach/phim-bo" onClick={onClose}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 transition-colors">
                                    <span className="text-xl">📺</span>
                                    <span className="font-medium">Phim bộ</span>
                                </div>
                            </Link>
                            <Link href="/danh-sach/phim-le" onClick={onClose}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 transition-colors">
                                    <span className="text-xl">🎬</span>
                                    <span className="font-medium">Phim lẻ</span>
                                </div>
                            </Link>
                        </div>

                        {/* Bottom Links */}
                        <div className="p-2 space-y-1 border-t border-gray-700/50 mt-2 mb-4">
                            <Link href="/cai-dat" onClick={onClose}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 transition-colors">
                                    <span className="text-xl">⚙️</span>
                                    <span className="font-medium">Cài đặt</span>
                                </div>
                            </Link>
                            <Link href="/gioi-thieu" onClick={onClose}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 transition-colors">
                                    <span className="text-xl">ℹ️</span>
                                    <span className="font-medium">Giới thiệu</span>
                                </div>
                            </Link>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
