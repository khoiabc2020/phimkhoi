'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    categories?: { name: string; slug: string }[];
    countries?: { name: string; slug: string }[];
}

const defaultCategories = [
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
    { name: 'Kinh Dị', slug: 'kinh-di' },
    { name: 'Hoạt Hình', slug: 'hoat-hinh' },
    { name: 'Tài Liệu', slug: 'tai-lieu' },
    { name: 'Gia Đình', slug: 'gia-dinh' },
    { name: 'Âm Nhạc', slug: 'am-nhac' },
    { name: 'Thần Thoại', slug: 'than-thoai' },
    { name: 'Khoa Học', slug: 'khoa-hoc' },
];

const defaultCountries = [
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
    { name: 'Đức', slug: 'duc' },
    { name: 'Tây Ban Nha', slug: 'tay-ban-nha' },
    { name: 'Thổ Nhĩ Kỳ', slug: 'tho-nhi-ky' },
    { name: 'Nga', slug: 'nga' },
    { name: 'Úc', slug: 'uc' },
    { name: 'Malaysia', slug: 'malaysia' },
    { name: 'Philippines', slug: 'philippines' },
];

const years = Array.from({ length: 20 }, (_, i) => 2025 - i);

// SVG Icons
const Icons = {
    Home: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
    ),
    Fire: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
        </svg>
    ),
    Star: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    ),
    Film: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5v2H4V5h1zm0 4H4v2h1V9zm-1 4h1v2H4v-2z" clipRule="evenodd" />
        </svg>
    ),
    TV: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l4 2A1 1 0 0020 14V6a1 1 0 00-1.447-.894l-4 2zM4 12a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4z" />
        </svg>
    ),
    Grid: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    ),
    Globe: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16A8 8 0 0010 2zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
        </svg>
    ),
    Calendar: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
    ),
    Search: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    User: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
    ),
    History: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
    ),
    Heart: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
    ),
    Settings: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
    ),
    Logout: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
        </svg>
    ),
    ChevronDown: ({ rotated }: { rotated: boolean }) => (
        <svg
            className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${rotated ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    ),
    Close: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
};

function NavItem({ href, icon, label, active, onClick }: {
    href: string; icon: React.ReactNode; label: string; active?: boolean; onClick: () => void;
}) {
    return (
        <Link href={href} onClick={onClick}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
                ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}>
                <span className={`transition-colors ${active ? 'text-yellow-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {icon}
                </span>
                <span className="font-medium text-sm">{label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400" />}
            </div>
        </Link>
    );
}

function ExpandableSection({ title, icon, isOpen, onToggle, children }: {
    title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl overflow-hidden">
            <button
                onClick={onToggle}
                className={`w-full flex items-center justify-between px-4 py-3 transition-all duration-200 ${isOpen ? 'bg-white/8 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <span className={`transition-colors ${isOpen ? 'text-yellow-400' : 'text-gray-500'}`}>{icon}</span>
                    <span className="font-medium text-sm">{title}</span>
                </div>
                <Icons.ChevronDown rotated={isOpen} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function MobileMenu({ isOpen, onClose, categories, countries }: MobileMenuProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const cats = categories || defaultCategories;
    const ctrs = countries || defaultCountries;

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const mainNav = [
        { href: '/', icon: <Icons.Home />, label: 'Trang chủ' },
        { href: '/danh-sach/phim-hot', icon: <Icons.Fire />, label: 'Phim hot' },
        { href: '/danh-sach/phim-de-cu', icon: <Icons.Star />, label: 'Phim đề cử' },
        { href: '/danh-sach/phim-bo', icon: <Icons.TV />, label: 'Phim bộ' },
        { href: '/danh-sach/phim-le', icon: <Icons.Film />, label: 'Phim lẻ' },
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
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
                        onClick={onClose}
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="fixed top-0 left-0 bottom-0 w-[82%] max-w-[320px] z-50 flex flex-col"
                        style={{
                            background: 'linear-gradient(160deg, rgba(15,15,20,0.98) 0%, rgba(10,10,15,0.99) 100%)',
                            borderRight: '1px solid rgba(255,255,255,0.07)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                            <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l4 2A1 1 0 0020 14V6a1 1 0 00-1.447-.894l-4 2zM4 12a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4z" />
                                    </svg>
                                </div>
                                <span className="text-white font-bold text-base tracking-wide">MovieBox</span>
                            </Link>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-all"
                            >
                                <Icons.Close />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain">

                            {/* User Section */}
                            <div className="px-4 py-4 border-b border-white/5">
                                {session?.user ? (
                                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/8">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                                            {session.user.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-semibold text-sm truncate">{session.user.name}</p>
                                            <p className="text-gray-500 text-xs truncate">{session.user.email}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Link href="/login" onClick={onClose} className="flex-1">
                                            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold text-sm hover:brightness-110 transition-all">
                                                <Icons.User />
                                                Đăng nhập
                                            </div>
                                        </Link>
                                        <Link href="/register" onClick={onClose} className="flex-1">
                                            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 text-gray-300 font-medium text-sm hover:bg-white/5 transition-all">
                                                Đăng ký
                                            </div>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Search */}
                            <div className="px-4 pt-4 pb-2">
                                <Link href="/tim-kiem" onClick={onClose}>
                                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-gray-500 hover:border-white/15 hover:text-gray-400 transition-all">
                                        <Icons.Search />
                                        <span className="text-sm">Tìm kiếm phim...</span>
                                    </div>
                                </Link>
                            </div>

                            {/* Main Navigation */}
                            <div className="px-3 py-2">
                                <p className="px-4 py-1.5 text-xs font-semibold text-gray-600 uppercase tracking-widest">Điều hướng</p>
                                <div className="space-y-0.5">
                                    {mainNav.map((item) => (
                                        <NavItem
                                            key={item.href}
                                            href={item.href}
                                            icon={item.icon}
                                            label={item.label}
                                            active={pathname === item.href}
                                            onClick={onClose}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Expandable Sections */}
                            <div className="px-3 py-2 border-t border-white/5">
                                <p className="px-4 py-1.5 text-xs font-semibold text-gray-600 uppercase tracking-widest">Khám phá</p>
                                <div className="space-y-0.5">
                                    <ExpandableSection
                                        title="Thể loại"
                                        icon={<Icons.Grid />}
                                        isOpen={expandedSection === 'categories'}
                                        onToggle={() => toggleSection('categories')}
                                    >
                                        <div className="grid grid-cols-2 gap-1.5 px-3 pb-3 pt-1">
                                            {cats.map((cat) => (
                                                <Link key={cat.slug} href={`/the-loai/${cat.slug}`} onClick={onClose}>
                                                    <div className="px-3 py-2 rounded-lg bg-white/4 hover:bg-yellow-400/15 hover:text-yellow-400 text-gray-400 text-xs text-center transition-all border border-transparent hover:border-yellow-400/20">
                                                        {cat.name}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </ExpandableSection>

                                    <ExpandableSection
                                        title="Quốc gia"
                                        icon={<Icons.Globe />}
                                        isOpen={expandedSection === 'countries'}
                                        onToggle={() => toggleSection('countries')}
                                    >
                                        <div className="grid grid-cols-2 gap-1.5 px-3 pb-3 pt-1">
                                            {ctrs.map((country) => (
                                                <Link key={country.slug} href={`/quoc-gia/${country.slug}`} onClick={onClose}>
                                                    <div className="px-3 py-2 rounded-lg bg-white/4 hover:bg-yellow-400/15 hover:text-yellow-400 text-gray-400 text-xs text-center transition-all border border-transparent hover:border-yellow-400/20">
                                                        {country.name}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </ExpandableSection>

                                    <ExpandableSection
                                        title="Năm phát hành"
                                        icon={<Icons.Calendar />}
                                        isOpen={expandedSection === 'years'}
                                        onToggle={() => toggleSection('years')}
                                    >
                                        <div className="grid grid-cols-3 gap-1.5 px-3 pb-3 pt-1">
                                            {years.map((year) => (
                                                <Link key={year} href={`/danh-sach/nam-${year}`} onClick={onClose}>
                                                    <div className="px-2 py-2 rounded-lg bg-white/4 hover:bg-yellow-400/15 hover:text-yellow-400 text-gray-400 text-xs text-center transition-all border border-transparent hover:border-yellow-400/20">
                                                        {year}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </ExpandableSection>
                                </div>
                            </div>

                            {/* User Actions (if logged in) */}
                            {session?.user && (
                                <div className="px-3 py-2 border-t border-white/5">
                                    <p className="px-4 py-1.5 text-xs font-semibold text-gray-600 uppercase tracking-widest">Tài khoản</p>
                                    <div className="space-y-0.5">
                                        <NavItem href="/lich-su-xem" icon={<Icons.History />} label="Lịch sử xem" active={pathname === '/lich-su-xem'} onClick={onClose} />
                                        <NavItem href="/phim-yeu-thich" icon={<Icons.Heart />} label="Phim yêu thích" active={pathname === '/phim-yeu-thich'} onClick={onClose} />
                                        <NavItem href="/thong-tin-tai-khoan" icon={<Icons.Settings />} label="Cài đặt tài khoản" active={pathname === '/thong-tin-tai-khoan'} onClick={onClose} />
                                    </div>
                                </div>
                            )}

                            {/* Bottom padding */}
                            <div className="h-6" />
                        </div>

                        {/* Footer - Logout or version */}
                        <div className="px-4 py-4 border-t border-white/5">
                            {session?.user ? (
                                <button
                                    onClick={() => { signOut(); onClose(); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-sm font-medium"
                                >
                                    <Icons.Logout />
                                    Đăng xuất
                                </button>
                            ) : (
                                <p className="text-center text-gray-700 text-xs">MovieBox © 2025</p>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
