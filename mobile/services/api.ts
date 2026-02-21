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

// Helper to normalize response
const getItems = (data: any): Movie[] => {
    try {
        if (!data) return [];
        if (Array.isArray(data.items)) return data.items;
        if (data.data?.items && Array.isArray(data.data.items)) return data.data.items;
        return [];
    } catch (e) {
        return [];
    }
};

export const getHomeData = async () => {
    try {
        const [phimLe, phimBo, hoatHinh, tvShows] = await Promise.all([
            fetch(`${API_URL}/v1/api/danh-sach/phim-le?limit=12`).then((res) => res.json()).catch(() => null),
            fetch(`${API_URL}/v1/api/danh-sach/phim-bo?limit=12`).then((res) => res.json()).catch(() => null),
            fetch(`${API_URL}/v1/api/danh-sach/hoat-hinh?limit=12`).then((res) => res.json()).catch(() => null),
            fetch(`${API_URL}/v1/api/danh-sach/tv-shows?limit=12`).then((res) => res.json()).catch(() => null),
        ]);

        return {
            phimLe: getItems(phimLe),
            phimBo: getItems(phimBo),
            hoatHinh: getItems(hoatHinh),
            tvShows: getItems(tvShows),
        };
    } catch (error) {
        console.error("Error fetching home data:", error);
        return { phimLe: [], phimBo: [], hoatHinh: [], tvShows: [] };
    }
};

export const getMovieDetail = async (slug: string) => {
    try {
        const res = await fetch(`${API_URL}/phim/${slug}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data; // Returns { status, msg, movie, episodes }
    } catch (error) {
        console.error(`Error fetching movie detail [${slug}]:`, error);
        return null;
    }
};

export const searchMovies = async (keyword: string, limit = 20) => {
    try {
        const res = await fetch(`${API_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&limit=${limit}`);
        if (!res.ok) return [];
        const data = await res.json();
        return getItems(data);
    } catch (error) {
        console.error("Error searching movies:", error);
        return [];
    }
};

export const getImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/300x450?text=No+Image';

    let finalUrl = url;
    if (!url.startsWith('http')) {
        finalUrl = `https://phimimg.com/${url}`;
    }

    // Tối ưu ảnh siêu tốc qua Global CDN (Cloudflare/Wsrv) với thiết lập WebP nén
    return `https://wsrv.nl/?url=${encodeURIComponent(finalUrl)}&output=webp&q=80`;
};

export const getMenuData = async () => {
    try {
        const [categoriesRes, countriesRes] = await Promise.all([
            fetch(`${API_URL}/the-loai`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/quoc-gia`).then(r => r.json()).catch(() => []),
        ]);
        return {
            categories: Array.isArray(categoriesRes) ? categoriesRes : [],
            countries: Array.isArray(countriesRes) ? countriesRes : [],
        };
    } catch (error) {
        console.error('Error fetching menu:', error);
        return { categories: [], countries: [] };
    }
};

export const getMoviesList = async (type: string, page = 1, limit = 24) => {
    try {
        const res = await fetch(`${API_URL}/v1/api/danh-sach/${type}?page=${page}&limit=${limit}`);
        if (!res.ok) return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
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
        if (!res.ok) return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
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
        if (!res.ok) return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
        const data = await res.json();
        return { items: getItems(data), pagination: data.data?.params?.pagination || { currentPage: 1, totalPages: 1 } };
    } catch (error) {
        console.error(`Error fetching country [${slug}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }
};

export const getRelatedMovies = async (categorySlug: string, limit = 12) => {
    try {
        if (!categorySlug) return [];
        const res = await fetch(`${API_URL}/v1/api/the-loai/${categorySlug}?limit=${limit}`);
        if (!res.ok) return [];
        const data = await res.json();
        const items = getItems(data);
        // Fallback if empty, maybe fetch popular
        return items;
    } catch (error) {
        console.error(`Error fetching related movies [${categorySlug}]:`, error);
        return [];
    }
};

export const checkAppVersion = async () => {
    try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/version`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        return null;
    }
};

export const saveHistory = async (slug: string, episode: string, time: number, duration: number, token?: string) => {
    if (!token) return;

    try {
        // Thống nhất dữ liệu POST (gửi cả slug cũ lẫn movieSlug mới cho an toàn)
        await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ slug, episode, movieSlug: slug, episodeSlug: episode, progress: time, duration })
        });
    } catch (error) {
        console.error("Error saving history:", error);
    }
};

export const getHistory = async (token?: string) => {
    try {
        if (!token) return [];
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return [];
        const data = await res.json();
        // Ánh xạ lại Tên Field (Dự phòng cho Schema WatchHistory mới)
        return (data.history || []).map((h: any) => ({
            ...h,
            slug: h.slug || h.movieSlug,
            episode: h.episode || h.episodeSlug,
            episode_name: h.episode_name || h.episodeName,
            movie: h.movie || { name: h.movieName }
        }));
    } catch (error) {
        console.error("Error getting history:", error);
        return [];
    }
};

export const getFavorites = async (token?: string) => {
    try {
        if (!token) return [];
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/favorites`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.favorites || [];
    } catch (error) {
        console.error("Error getting favorites:", error);
        return [];
    }
};

export const toggleFavorite = async (movie: Movie, isFav: boolean, token?: string) => {
    try {
        if (!token) return { success: false };

        const payload = isFav ? { slug: movie.slug } : {
            movieId: movie._id,
            movieSlug: movie.slug,
            movieName: movie.name,
            movieOriginName: movie.origin_name || "",
            moviePoster: movie.thumb_url || movie.poster_url,
            movieYear: movie.year || new Date().getFullYear(),
            movieQuality: movie.quality || "HD",
            movieCategories: movie.category ? movie.category.map((c: any) => c.name) : []
        };

        const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/favorites`, {
            method: isFav ? 'DELETE' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        return { success: res.ok, favorites: data.favorites || [] };
    } catch (error) {
        console.error("Error toggling favorite:", error);
        return { success: false };
    }
};

// TMDB Integration
const TMDB_API_KEY = "dae5842ebb3cb34367b94550aae10cf3"; // Direct use for mobile to avoid env issues

export const getTMDBRating = async (query: string, year?: number, type: 'movie' | 'tv' = 'movie') => {
    try {
        if (!query) return null;
        const searchUrl = `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&year=${year}`;
        const res = await fetch(searchUrl);
        const data = await res.json();
        if (data.results?.length > 0) {
            return data.results[0].vote_average;
        }
        return null;
    } catch (error) {
        console.error("TMDB Rating Error:", error);
        return null;
    }
};

export const getTMDBCast = async (query: string, year?: number, type: 'movie' | 'tv' = 'movie') => {
    try {
        if (!query) return [];
        // 1. Search for ID
        const searchUrl = `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&year=${year}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.results?.length > 0) {
            const id = searchData.results[0].id;
            // 2. Get Credits
            const creditUrl = `https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${TMDB_API_KEY}`;
            const creditRes = await fetch(creditUrl);
            const creditData = await creditRes.json();
            return creditData.cast || [];
        }
        return [];
    } catch (error) {
        console.error("TMDB Cast Error:", error);
        return [];
    }
};
