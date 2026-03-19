/**
 * Đồng bộ với web: slug + endpoint (list = danh-sach, category = the-loai, country = quoc-gia).
 * Dùng cho link "Xem tất cả" và từ khóa hot chính xác với API PhimAPI/NguonC.
 */
export type SectionType = 'list' | 'category' | 'country';

export interface SectionItem {
  slug: string;
  type: SectionType;
  label: string;
}

/** Các danh sách (danh-sach) */
export const LIST_SECTIONS: SectionItem[] = [
  { slug: 'phim-moi-cap-nhat', type: 'list', label: 'Phim Mới Cập Nhật' },
  { slug: 'phim-le', type: 'list', label: 'Phim Lẻ' },
  { slug: 'phim-bo', type: 'list', label: 'Phim Bộ' },
  { slug: 'hoat-hinh', type: 'list', label: 'Hoạt Hình' },
  { slug: 'tv-shows', type: 'list', label: 'TV Shows' },
  { slug: 'phim-sap-chieu', type: 'list', label: 'Phim Sắp Chiếu' },
];

/** Thể loại (the-loai) */
export const CATEGORY_SLUGS: Record<string, string> = {
  'phim-chieu-rap': 'Phim Chiếu Rạp',
  'hanh-dong': 'Hành Động',
  'tinh-cam': 'Tình Cảm',
  'kinh-di': 'Kinh Dị',
  'co-trang': 'Cổ Trang',
  'vien-tuong': 'Viễn Tưởng',
  'hai-huoc': 'Hài Hước',
  'gia-dinh': 'Gia Đình',
  'hoc-duong': 'Học Đường',
  'chien-tranh': 'Chiến Tranh',
  'tam-ly': 'Tâm Lý',
  'vo-thuat': 'Võ Thuật',
};

/** Quốc gia (quoc-gia) */
export const COUNTRY_SLUGS: Record<string, string> = {
  'han-quoc': 'Hàn Quốc',
  'trung-quoc': 'Trung Quốc',
  'my': 'Mỹ',
  'thai-lan': 'Thái Lan',
  'nhat-ban': 'Nhật Bản',
};

/** Từ khóa hot — slug + type + label + màu (cho UI) */
export interface HotKeywordItem {
  label: string;
  slug: string;
  type: SectionType;
  color: string;
}

export const HOT_KEYWORDS: HotKeywordItem[] = [
  { label: 'Hành Động', slug: 'hanh-dong', type: 'category', color: '#059669' },
  { label: 'Tình Cảm', slug: 'tinh-cam', type: 'category', color: '#ec4899' },
  { label: 'Cổ Trang', slug: 'co-trang', type: 'category', color: '#b45309' },
  { label: 'Kinh Dị', slug: 'kinh-di', type: 'category', color: '#7c3aed' },
  { label: 'Viễn Tưởng', slug: 'vien-tuong', type: 'category', color: '#0ea5e9' },
  { label: 'Hàn Quốc', slug: 'han-quoc', type: 'country', color: '#db2777' },
  { label: 'Hoạt Hình', slug: 'hoat-hinh', type: 'list', color: '#22c55e' },
  { label: 'Hài Hước', slug: 'hai-huoc', type: 'category', color: '#eab308' },
  { label: 'Gia Đình', slug: 'gia-dinh', type: 'category', color: '#f97316' },
  { label: 'Học Đường', slug: 'hoc-duong', type: 'category', color: '#06b6d4' },
  { label: 'Chiến Tranh', slug: 'chien-tranh', type: 'category', color: '#78716c' },
  { label: 'Tâm Lý', slug: 'tam-ly', type: 'category', color: '#a855f7' },
  { label: 'Võ Thuật', slug: 'vo-thuat', type: 'category', color: '#dc2626' },
  { label: 'Chiếu Rạp', slug: 'phim-chieu-rap', type: 'category', color: '#E50914' },
  { label: 'Trung Quốc', slug: 'trung-quoc', type: 'country', color: '#ef4444' },
];

/** Helper: href cho màn list/category/country */
export function getSectionHref(slug: string, type: SectionType): string {
  return `/${type}/${slug}`;
}
