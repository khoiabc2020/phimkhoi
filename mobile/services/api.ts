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

export const OPHIM_API = "https://ophim1.com";
export const NGUONC_API = "https://phim.nguonc.com";

// Safe URI concatenation
const combineUrl = (base: string, path: string) => {
    if (!base) return path;
    if (!path) return base;
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
};

// ── In-memory cache (session-scoped, 5-minute TTL) ──────────────────────────
const _cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheGet(key: string): any | null {
    const hit = _cache.get(key);
    if (!hit) return null;
    if (Date.now() - hit.ts > CACHE_TTL) { _cache.delete(key); return null; }
    return hit.data;
}
function cacheSet(key: string, data: any) { _cache.set(key, { data, ts: Date.now() }); }
// ────────────────────────────────────────────────────────────────────────────

export const getMovieDetail = async (slug: string) => {
    const cacheKey = `movie:${slug}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;   // ← instant return on repeat visits

    try {
        const [kkRes, ophimRes, nguoncRes] = await Promise.allSettled([
            fetch(`${API_URL}/phim/${slug}`).then(r => r.json()),
            fetch(`${OPHIM_API}/phim/${slug}`).then(r => r.json()),
            fetch(`${NGUONC_API}/api/film/${slug}`).then(r => r.json())
        ]);


        let combinedData: any = null;

        // Base movie data prefers KKPhim, fallback to OPhim
        if (kkRes.status === 'fulfilled' && kkRes.value?.status) {
            combinedData = { ...kkRes.value };
            // Tag servers from KKPhim
            if (combinedData.episodes) {
                combinedData.episodes = combinedData.episodes.map((epGroup: any) => ({
                    ...epGroup,
                    server_name: `KKPhim #${epGroup.server_name || "1"}`
                }));
            }
        } else if (ophimRes.status === 'fulfilled' && ophimRes.value?.status) {
            combinedData = { ...ophimRes.value };
            // Ophim structures movie data slightly differently, might need normalization here if used as base
            if (!combinedData.movie?.thumb_url?.startsWith('http') && combinedData.pathImage) {
                combinedData.movie.thumb_url = combineUrl(combinedData.pathImage, combinedData.movie.thumb_url);
                combinedData.movie.poster_url = combineUrl(combinedData.pathImage, combinedData.movie.poster_url);
            }
            // Tag servers from OPhim
            if (combinedData.episodes) {
                combinedData.episodes = combinedData.episodes.map((epGroup: any) => ({
                    ...epGroup,
                    server_name: `OPhim #${epGroup.server_name || "1"}`
                }));
            }
        }

        // If we found a base, and the OTHER source also succeeded, merge its episodes
        if (combinedData) {
            if (kkRes.status === 'fulfilled' && kkRes.value?.status && ophimRes.status === 'fulfilled' && ophimRes.value?.status) {
                const ophimEpisodes = ophimRes.value.episodes || [];
                const taggedOphimEpisodes = ophimEpisodes.map((epGroup: any) => ({
                    ...epGroup,
                    server_name: `OPhim #${epGroup.server_name || "1"}`
                }));
                combinedData.episodes = [...(combinedData.episodes || []), ...taggedOphimEpisodes];
            }

            // Also merge NguonC episodes if available
            if (nguoncRes.status === 'fulfilled' && nguoncRes.value?.status === 'success') {
                const nguoncEpisodes = nguoncRes.value.movie?.episodes || [];
                const taggedNguoncEpisodes = nguoncEpisodes.map((epGroup: any) => ({
                    ...epGroup,
                    server_name: `NguonC #${epGroup.server_name || "1"}`
                }));
                combinedData.episodes = [...(combinedData.episodes || []), ...taggedNguoncEpisodes];
            }
            return combinedData;
        }

        // What if KK and Ophim failed but NguonC succeeded?
        if (nguoncRes.status === 'fulfilled' && nguoncRes.value?.status === 'success') {
            const data = nguoncRes.value.movie;
            return {
                status: true,
                movie: {
                    _id: data.id || data.slug,
                    name: data.name,
                    slug: data.slug,
                    origin_name: data.original_name,
                    content: data.description,
                    type: data.type === 'single' ? 'single' : 'series',
                    status: data.current_episode,
                    thumb_url: data.thumb_url,
                    poster_url: data.poster_url,
                    time: data.time || "",
                    episode_current: data.current_episode,
                    episode_total: data.total_episodes,
                    quality: data.quality || "FHD",
                    lang: data.language || "Vietsub",
                    year: parseInt(data.category?.[3]?.list?.[0]?.name || new Date().getFullYear()),
                    actor: data.casts?.split(',') || [],
                    director: data.director?.split(',') || [],
                    category: data.category?.['1']?.list || [],
                    country: data.category?.['4']?.list || [],
                    trailer_url: data.trailer_url || "",
                },
                episodes: (data.episodes || []).map((epGroup: any) => ({
                    ...epGroup,
                    server_name: `NguonC #${epGroup.server_name || "1"}`
                }))
            };
        }

        return null;
    } catch (error) {
        console.error(`Error fetching movie detail [${slug}]:`, error);
        return null;
    }
};

// Normalize OPhim Item
const normalizeOphimItem = (item: any, pathImage: string) => {
    return {
        ...item,
        _id: item._id,
        name: item.name,
        slug: item.slug,
        origin_name: item.origin_name,
        thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : combineUrl(pathImage, item.thumb_url),
        poster_url: item.poster_url?.startsWith('http') ? item.poster_url : combineUrl(pathImage, item.poster_url),
        type: item.type || 'unknown',
        sub_docquyen: item.sub_docquyen || false,
        chieurap: item.chieurap || false,
        time: item.time || '',
        episode_current: item.episode_current || '',
        quality: item.quality || '',
        lang: item.lang || '',
        year: item.year || new Date().getFullYear(),
        category: item.category || [],
        country: item.country || [],
    };
};

export const searchMovies = async (keyword: string, limit = 20) => {
    try {
        const [kkRes, ophimRes, nguoncRes] = await Promise.allSettled([
            fetch(`${API_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&limit=${limit}`).then(r => r.json()),
            fetch(`${OPHIM_API}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&limit=${limit}`).then(r => r.json()),
            fetch(`${NGUONC_API}/api/films/search?keyword=${encodeURIComponent(keyword)}`).then(r => r.json())
        ]);

        let results: Movie[] = [];

        if (kkRes.status === 'fulfilled') {
            const data = kkRes.value;
            const pathImage = data.pathImage || data.data?.pathImage || "";
            const items = (data.data?.items || []).map((item: any) => ({
                ...item,
                thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : combineUrl(pathImage, item.thumb_url),
                poster_url: item.poster_url?.startsWith('http') ? item.poster_url : combineUrl(pathImage, item.poster_url)
            }));
            results = [...results, ...items];
        }

        if (ophimRes.status === 'fulfilled') {
            const data = ophimRes.value;
            let pathImage = data.pathImage || data.data?.APP_DOMAIN_CDN_IMAGE || "https://img.ophim.live/uploads/movies/";
            if (pathImage === "https://img.ophim.live" || pathImage === "https://img.ophim.live/") {
                pathImage = "https://img.ophim.live/uploads/movies/";
            }
            const items = (data.data?.items || []).map((item: any) => normalizeOphimItem(item, pathImage));
            results = [...results, ...items];
        }

        if (nguoncRes.status === 'fulfilled' && nguoncRes.value?.status === 'success') {
            const items = (nguoncRes.value.items || []).map((item: any) => ({
                _id: item.id || item.slug,
                name: item.name,
                slug: item.slug,
                origin_name: item.original_name || item.name,
                thumb_url: item.thumb_url,
                poster_url: item.poster_url,
                year: parseInt(item.year) || new Date().getFullYear(),
                quality: item.quality || 'FHD',
            }));
            results = [...results, ...items];
        }

        // Deduplicate by slug
        const seen = new Set();
        return results.filter(item => {
            const duplicate = seen.has(item.slug);
            seen.add(item.slug);
            return !duplicate;
        });

    } catch (error) {
        console.error("Error searching movies:", error);
        return [];
    }
};

const TMDB_API_KEY = "dae5842ebb3cb34367b94550aae10cf3";

export const searchActors = async (keyword: string): Promise<any[]> => {
    if (!keyword || keyword.trim().length < 2) return [];
    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(keyword)}&language=vi-VN&page=1`
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.results || []).slice(0, 8);
    } catch (error) {
        console.error("Error searching actors:", error);
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
        const [categoriesRes, countriesRes] = await Promise.allSettled([
            fetch(`${API_URL}/the-loai`).then(r => r.json()),
            fetch(`${API_URL}/quoc-gia`).then(r => r.json()),
        ]);

        const categories = categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value) ? categoriesRes.value : [];
        const countries = countriesRes.status === 'fulfilled' && Array.isArray(countriesRes.value) ? countriesRes.value : [];

        return { categories, countries };
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

export const getHistoryForEpisode = async (movieSlug: string, episodeSlug: string, token?: string) => {
    try {
        if (!token) return null;
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/history?movieSlug=${movieSlug}&episodeSlug=${episodeSlug}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.history || null; // Returns { progress, currentTime, duration }
    } catch (error) {
        console.error("Error getting episode history:", error);
        return null;
    }
};

export const getComments = async (slug: string) => {
    try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/comments/${slug}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.comments || [];
    } catch (error) {
        console.error(`Error fetching comments for [${slug}]:`, error);
        return [];
    }
};

export const postComment = async (slug: string, content: string, token?: string) => {
    try {
        if (!token) return { error: "Unauthorized" };
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/comments/${slug}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error(`Error posting comment for [${slug}]:`, error);
        return { error: "Lỗi kết nối" };
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

// TMDB Integration (key defined above)

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
