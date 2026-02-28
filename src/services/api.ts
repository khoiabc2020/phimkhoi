export const API_URL = "https://phimapi.com";

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
    vote_average?: number;
    duration?: string;
    match?: string;
    actor: string[];
    director: string[];
    category: { id: string; name: string; slug: string }[];
    country: { id: string; name: string; slug: string }[];
    episodes: { server_name: string; server_data: { name: string; slug: string; filename: string; link_embed: string; link_m3u8: string }[] }[];
}

interface ListResponse {
    status: boolean;
    items: Movie[];
    pathImage: string;
    pagination: {
        totalItems: number;
        totalItemsPerPage: number;
        currentPage: number;
        totalPages: number;
    };
    data?: {
        items: Movie[];
        params: any;
    }
}

// Helper to normalize response because API structure varies slightly between endpoints
const getItems = (data: any): Movie[] => {
    if (data.items) return data.items;
    if (data.data && data.data.items) return data.data.items;
    return [];
};

// Safe URI concatenation
const combineUrl = (base: string, path: string) => {
    if (!base) return path;
    if (!path) return base;
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
};

export const getHomeData = async () => {
    try {
        const [phimLe, phimBo, hoatHinh, tvShows] = await Promise.all([
            fetch(`${API_URL}/v1/api/danh-sach/phim-le?limit=12`, { next: { revalidate: 60 } }).then((res) => res.json()),
            fetch(`${API_URL}/v1/api/danh-sach/phim-bo?limit=12`, { next: { revalidate: 60 } }).then((res) => res.json()),
            fetch(`${API_URL}/v1/api/danh-sach/hoat-hinh?limit=12`, { next: { revalidate: 60 } }).then((res) => res.json()),
            fetch(`${API_URL}/v1/api/danh-sach/tv-shows?limit=12`, { next: { revalidate: 60 } }).then((res) => res.json()),
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
        // Try KKPhim first
        const res = await fetch(`${API_URL}/phim/${slug}`, { next: { revalidate: 60 } });

        if (res.ok) {
            const data = await res.json();
            if (data.status) return data;
        }

        // Fallback to OPhim
        const ophimRes = await fetch(`https://ophim1.com/phim/${slug}`, { next: { revalidate: 60 } });

        if (ophimRes.ok) {
            const data = await ophimRes.json();
            return data; // OPhim detail structure is usually compatible
        }

        return null;
    } catch (error) {
        console.error(`Error fetching movie detail [${slug}]:`, error);
        return null;
    }
};

export const searchMovies = async (keyword: string) => {
    try {
        const [kkRes, ophimRes] = await Promise.allSettled([
            fetch(`${API_URL}/v1/api/tim-kiem?keyword=${keyword}&limit=20`).then(r => r.json()),
            fetch(`${OPHIM_API}/v1/api/tim-kiem?keyword=${keyword}&limit=20`).then(r => r.json())
        ]);

        let results: Movie[] = [];

        if (kkRes.status === 'fulfilled') {
            const data = kkRes.value;
            const pathImage = data.pathImage || data.data?.pathImage || "";
            // Ensure we construct full URL if strictly needed, though search endpoint sometimes gives full url
            const items = (data.data?.items || []).map((item: any) => ({
                ...item,
                thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : combineUrl(pathImage, item.thumb_url),
                poster_url: item.poster_url?.startsWith('http') ? item.poster_url : combineUrl(pathImage, item.poster_url)
            }));
            results = [...results, ...items];
        }

        if (ophimRes.status === 'fulfilled') {
            const data = ophimRes.value;
            const pathImage = data.pathImage || data.data?.APP_DOMAIN_CDN_IMAGE || "https://img.ophim.live/uploads/movies/";
            const items = (data.data?.items || []).map((item: any) => normalizeOphimItem(item, pathImage));
            results = [...results, ...items];
        }

        // Deduplicate
        const seen = new Set();
        return results.filter(item => {
            const duplicate = seen.has(item.slug);
            seen.add(item.slug);
            return !duplicate;
        });

    } catch (error) {
        console.error(`Error searching movies [${keyword}]:`, error);
        return [];
    }
};

export const OPHIM_API = "https://ophim1.com";

// Helper to normalize OPhim data to match our Movie interface
const normalizeOphimItem = (item: any, pathImage: string): Movie => {
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

export const getMoviesList = async (type: string, params: { page?: number; year?: number; category?: string; country?: string; limit?: number } = {}) => {
    try {
        const { page = 1, year, category, country, limit = 24 } = params;
        let query = `?page=${page}&limit=${limit}`;
        if (year) query += `&year=${year}`;
        if (category) query += `&category=${category}`;
        if (country) query += `&country=${country}`;

        // Fetch from BOTH sources in parallel
        const [kkRes, ophimRes] = await Promise.allSettled([
            fetch(`${API_URL}/v1/api/danh-sach/${type}${query}`, { next: { revalidate: 60 } }).then(r => r.json()),
            fetch(`${OPHIM_API}/v1/api/danh-sach/${type}${query}`, { next: { revalidate: 60 } }).then(r => r.json()) // Ignore cache for testing or separate key
        ]);

        let items: Movie[] = [];
        let kkPagination = { currentPage: 1, totalPages: 1 };

        // Process KKPhim Data
        if (kkRes.status === 'fulfilled' && kkRes.value?.data?.items) {
            const data = kkRes.value;
            const pathImage = data.pathImage || data.data?.pathImage || "";
            const kkItems = getItems(data).map(item => ({
                ...item,
                thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : combineUrl(pathImage, item.thumb_url),
                poster_url: item.poster_url?.startsWith('http') ? item.poster_url : combineUrl(pathImage, item.poster_url)
            }));
            items = [...items, ...kkItems];
            kkPagination = data.data?.params?.pagination || kkPagination;
        }

        // Process OPhim Data
        if (ophimRes.status === 'fulfilled' && ophimRes.value?.data?.items) {
            const data = ophimRes.value;
            const pathImage = data.pathImage || data.data?.pathImage || "https://img.ophim.live/uploads/movies/";
            const ophimItems = getItems(data).map(item => normalizeOphimItem(item, pathImage));
            items = [...items, ...ophimItems];
        }

        // Deduplicate by Slug
        const seen = new Set();
        const uniqueItems = items.filter(item => {
            const duplicate = seen.has(item.slug);
            seen.add(item.slug);
            return !duplicate;
        });

        return {
            items: uniqueItems,
            pagination: kkPagination // Use KK pagination as primary source of truth for simplicity in this hybrid mode
        };
    } catch (error) {
        console.error(`Error fetching movies list [${type}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }
};

export const getMoviesByCategory = async (slug: string, page: number = 1, limit: number = 24) => {
    try {
        // Hybrid fetch for categories too
        const [kkRes, ophimRes] = await Promise.allSettled([
            fetch(`${API_URL}/v1/api/the-loai/${slug}?page=${page}&limit=${limit}`, { next: { revalidate: 3600 } }).then(r => r.json()),
            fetch(`${OPHIM_API}/v1/api/the-loai/${slug}?page=${page}&limit=${limit}`, { next: { revalidate: 3600 } }).then(r => r.json())
        ]);

        let items: Movie[] = [];
        let kkPagination = { currentPage: 1, totalPages: 1 };

        if (kkRes.status === 'fulfilled') {
            const data = kkRes.value;
            const pathImage = data.pathImage || data.data?.pathImage || "";
            const kkItems = getItems(data).map(item => ({
                ...item,
                thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : combineUrl(pathImage, item.thumb_url),
                poster_url: item.poster_url?.startsWith('http') ? item.poster_url : combineUrl(pathImage, item.poster_url)
            }));
            items = [...items, ...kkItems];
            kkPagination = data.data?.params?.pagination || kkPagination;
        }

        if (ophimRes.status === 'fulfilled') {
            const data = ophimRes.value;
            const pathImage = data.pathImage || "https://img.ophim.live/uploads/movies/";
            const ophimItems = getItems(data).map(item => normalizeOphimItem(item, pathImage));
            items = [...items, ...ophimItems];
        }

        // Deduplicate
        const seen = new Set();
        const uniqueItems = items.filter(item => {
            const duplicate = seen.has(item.slug);
            seen.add(item.slug);
            return !duplicate;
        });

        return {
            items: uniqueItems,
            pagination: kkPagination
        };
    } catch (error) {
        console.error(`Error fetching category [${slug}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }
};

export const getMoviesByCountry = async (slug: string, page: number = 1, limit: number = 24) => {
    try {
        const [kkRes, ophimRes] = await Promise.allSettled([
            fetch(`${API_URL}/v1/api/quoc-gia/${slug}?page=${page}&limit=${limit}`, { next: { revalidate: 3600 } }).then(r => r.json()),
            fetch(`${OPHIM_API}/v1/api/quoc-gia/${slug}?page=${page}&limit=${limit}`, { next: { revalidate: 3600 } }).then(r => r.json())
        ]);

        let items: Movie[] = [];
        let kkPagination = { currentPage: 1, totalPages: 1 };

        if (kkRes.status === 'fulfilled') {
            const data = kkRes.value;
            const pathImage = data.pathImage || data.data?.pathImage || "";
            const kkItems = getItems(data).map(item => ({
                ...item,
                thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : combineUrl(pathImage, item.thumb_url),
                poster_url: item.poster_url?.startsWith('http') ? item.poster_url : combineUrl(pathImage, item.poster_url)
            }));
            items = [...items, ...kkItems];
            kkPagination = data.data?.params?.pagination || kkPagination;
        }

        if (ophimRes.status === 'fulfilled') {
            const data = ophimRes.value;
            const pathImage = data.pathImage || "https://img.ophim.live/uploads/movies/";
            const ophimItems = getItems(data).map(item => normalizeOphimItem(item, pathImage));
            items = [...items, ...ophimItems];
        }

        const seen = new Set();
        const uniqueItems = items.filter(item => {
            const duplicate = seen.has(item.slug);
            seen.add(item.slug);
            return !duplicate;
        });

        return {
            items: uniqueItems,
            pagination: kkPagination
        };
    } catch (error) {
        console.error(`Error fetching country [${slug}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }
};


// ... existing code ...
import { getTMDBTrending } from "./tmdb";

// Kiểm tra năm TMDB vs phim nguồn có khớp (cùng phim) để dùng ảnh TMDB chất lượng cao
function isSameMovieByYear(tmdbItem: any, movie: any): boolean {
    const tmdbYear = tmdbItem.release_date
        ? parseInt(String(tmdbItem.release_date).substring(0, 4), 10)
        : tmdbItem.first_air_date
            ? parseInt(String(tmdbItem.first_air_date).substring(0, 4), 10)
            : null;
    const sourceYear = movie.year ? parseInt(String(movie.year).substring(0, 4), 10) : null;
    if (tmdbYear == null || sourceYear == null) return false;
    return Math.abs(tmdbYear - sourceYear) <= 2;
}

export const getTrendMovies = async (type: 'movie' | 'tv' | 'all' = 'all') => {
    try {
        const trendList = await getTMDBTrending(type);

        const movies = await Promise.all(trendList.slice(0, 15).map(async (tmdbItem: any) => {
            const query = tmdbItem.original_name || tmdbItem.original_title || tmdbItem.name || tmdbItem.title;
            const searchResults = await searchMovies(query);

            if (searchResults && searchResults.length > 0) {
                const movie = searchResults[0];
                const useTmdbImages = isSameMovieByYear(tmdbItem, movie);

                return {
                    ...movie,
                    vote_average: tmdbItem.vote_average,
                    tmdb_id: tmdbItem.id,
                    // Chỉ override bằng ảnh TMDB khi đã xác định cùng phim (năm khớp) → ảnh chất lượng cao và chính xác
                    poster_url: useTmdbImages && tmdbItem.poster_path
                        ? `https://image.tmdb.org/t/p/w500${tmdbItem.poster_path}`
                        : (movie.poster_url || movie.thumb_url || ""),
                    thumb_url: useTmdbImages && tmdbItem.backdrop_path
                        ? `https://image.tmdb.org/t/p/original${tmdbItem.backdrop_path}`
                        : (movie.thumb_url || movie.poster_url || ""),
                };
            }
            return null;
        }));

        return movies.filter((m: any) => m !== null);
    } catch (error) {
        console.error("Error fetching trend movies:", error);
        return [];
    }
};

export const getMenuData = async () => {
    // ... existing code ...
    try {
        const [categoriesRes, countriesRes] = await Promise.all([
            fetch(`${API_URL}/the-loai`, { next: { revalidate: 86400 } }), // Cache for 24h
            fetch(`${API_URL}/quoc-gia`, { next: { revalidate: 86400 } })
        ]);

        const categories = await categoriesRes.json();
        const countries = await countriesRes.json();

        return {
            categories: Array.isArray(categories) ? categories : [],
            countries: Array.isArray(countries) ? countries : []
        };
    } catch (error) {
        console.error("Error fetching menu data:", error);
        return { categories: [], countries: [] };
    }
};
