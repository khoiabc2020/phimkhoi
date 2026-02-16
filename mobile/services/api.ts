import { CONFIG } from '@/constants/config';

export const API_URL = CONFIG.PHIM_API_URL;
export const BACKEND_URL = CONFIG.API_BASE_URL;

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

// Helper to normalize response
const getItems = (data: any): Movie[] => {
    if (data.items) return data.items;
    if (data.data && data.data.items) return data.data.items;
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

export const searchMovies = async (keyword: string) => {
    try {
        const res = await fetch(`${API_URL}/v1/api/tim-kiem?keyword=${keyword}&limit=20`);
        const data = await res.json();
        return getItems(data);
    } catch (error) {
        console.error("Error searching movies:", error);
        return [];
    }
};

export const getImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/300x450?text=No+Image';
    if (url.startsWith('http')) return url;
    return `${CONFIG.PHIM_API_URL}/${url}`; // Adjust if PhimAPI serves images relative
};
