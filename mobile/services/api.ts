import { CONFIG } from '@/constants/config';

export const API_URL = CONFIG.PHIM_API_URL;
export const BACKEND_URL = CONFIG.BACKEND_URL;

export interface Movie {
    _id: string;
    name: string;
    slug: string;
    origin_name: string;
    content: string;
    type: string;
    status: string;
    thumb_url: string;
    poster_url: string;
    is_copyright: boolean;
    sub_docquyen: boolean;
    chieurap: boolean;
    trailer_url: string;
    time: string;
    episode_current: string;
    episode_total: string;
    quality: string;
    lang: string;
    notify: string;
    showtimes: string;
    year: number;
    view: number;
    actor: string[];
    director: string[];
    category: { id: string; name: string; slug: string }[];
    country: { id: string; name: string; slug: string }[];
    episodes: { server_name: string; server_data: { name: string; slug: string; filename: string; link_embed: string; link_m3u8: string }[] }[];
}

// Helper to normalize response - PhimAPI returns { data: { items: [...] } }
const getItems = (data: any): Movie[] => {
    if (!data) return [];
    if (Array.isArray(data.items)) return data.items;
    if (data.data?.items && Array.isArray(data.data.items)) return data.data.items;
    return [];
};

export const getHomeData = async () => {
    try {
        console.log("Fetching Home Data (Mobile) from:", API_URL);
        const [phimLe, phimBo, hoatHinh, tvShows] = await Promise.all([
            fetch(`${API_URL}/v1/api/danh-sach/phim-le?limit=12`).then((res) => res.json()),
            fetch(`${API_URL}/v1/api/danh-sach/phim-bo?limit=12`).then((res) => res.json()),
            fetch(`${API_URL}/v1/api/danh-sach/hoat-hinh?limit=12`).then((res) => res.json()),
            fetch(`${API_URL}/v1/api/danh-sach/tv-shows?limit=12`).then((res) => res.json()),
        ]);

        console.log("Data fetched successfully:", {
            phimLe: getItems(phimLe).length,
            phimBo: getItems(phimBo).length
        });

        return {
            phimLe: getItems(phimLe),
            phimBo: getItems(phimBo),
            hoatHinh: getItems(hoatHinh),
            tvShows: getItems(tvShows),
        };
    } catch (error) {
        console.error("Error fetching home data DETAILED:", error);
        return { phimLe: [], phimBo: [], hoatHinh: [], tvShows: [] };
    }
};

export const getMovieDetail = async (slug: string) => {
    try {
        const res = await fetch(`${API_URL}/phim/${slug}`);
        const data = await res.json();
        return data; // Returns { status, msg, movie, episodes }
    } catch (error) {
        console.error(`Error fetching movie detail [${slug}]:`, error);
        return null;
    }
};

export const searchMovies = async (keyword: string, limit = 20) => {
    try {
        const res = await fetch(`${API_URL}/v1/api/tim-kiem?keyword=${keyword}&limit=${limit}`);
        const data = await res.json();
        return getItems(data);
    } catch (error) {
        console.error("Error searching movies:", error);
        return [];
    }
};

export const getImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/300x450?text=No+Image';
    if (url.includes("tmdb.org")) return url;
    if (url.startsWith('http')) return url;
    return `https://phimimg.com/${url}`;
};

export const getMenuData = async () => {
    try {
        const [categoriesRes, countriesRes] = await Promise.all([
            fetch(`${API_URL}/the-loai`),
            fetch(`${API_URL}/quoc-gia`),
        ]);
        const categories = await categoriesRes.json();
        const countries = await countriesRes.json();
        return {
            categories: Array.isArray(categories) ? categories : [],
            countries: Array.isArray(countries) ? countries : [],
        };
    } catch (error) {
        console.error('Error fetching menu:', error);
        return { categories: [], countries: [] };
    }
};

export const getMoviesList = async (type: string, page = 1, limit = 24) => {
    try {
        const res = await fetch(`${API_URL}/v1/api/danh-sach/${type}?page=${page}&limit=${limit}`);
        const data = await res.json();
        return { items: getItems(data), pagination: data.data?.params?.pagination || { currentPage: 1, totalPages: 1 } };
    } catch (error) {
        console.error(`Error fetching list [${type}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }
};

export const getMoviesByCategory = async (slug: string, page = 1, limit = 24) => {
    try {
        const res = await fetch(`${API_URL}/v1/api/the-loai/${slug}?page=${page}&limit=${limit}`);
        const data = await res.json();
        return { items: getItems(data), pagination: data.data?.params?.pagination || { currentPage: 1, totalPages: 1 } };
    } catch (error) {
        console.error(`Error fetching category [${slug}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }
};

export const getMoviesByCountry = async (slug: string, page = 1, limit = 24) => {
    try {
        const res = await fetch(`${API_URL}/v1/api/quoc-gia/${slug}?page=${page}&limit=${limit}`);
        const data = await res.json();
        return { items: getItems(data), pagination: data.data?.params?.pagination || { currentPage: 1, totalPages: 1 } };
    } catch (error) {
        console.error(`Error fetching country [${slug}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }
};

export const getRelatedMovies = async (categorySlug: string, limit = 12) => {
    try {
        // Fetch movies from the same category as "related"
        const res = await fetch(`${API_URL}/v1/api/the-loai/${categorySlug}?limit=${limit}`);
        const data = await res.json();
        return getItems(data);
    } catch (error) {
        console.error(`Error fetching related movies [${categorySlug}]:`, error);
        return [];
    }
};

export const checkAppVersion = async () => {
    try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/version`);
        return await res.json();
    } catch (error) {
        console.error("Check version error:", error);
        return null;
    }
};

