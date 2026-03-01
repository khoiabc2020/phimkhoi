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
        const [kkRes, ophimRes, nguoncRes] = await Promise.allSettled([
            fetch(`${API_URL}/phim/${slug}`, { next: { revalidate: 60 } }).then(r => r.json()),
            fetch(`https://ophim1.com/phim/${slug}`, { next: { revalidate: 60 } }).then(r => r.json()),
            fetch(`${NGUONC_API}/api/film/${slug}`, { next: { revalidate: 60 } }).then(r => r.json())
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
                // Prevent duplicate if names happen to match exactly (rare with our tags, but safe)
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

export const OPHIM_API = "https://ophim1.com";
export const NGUONC_API = "https://phim.nguonc.com";

export const searchMovies = async (keyword: string) => {
    try {
        const [kkRes, ophimRes, nguoncRes] = await Promise.allSettled([
            fetch(`${API_URL}/v1/api/tim-kiem?keyword=${keyword}&limit=20`).then(r => r.json()),
            fetch(`${OPHIM_API}/v1/api/tim-kiem?keyword=${keyword}&limit=20`).then(r => r.json()),
            fetch(`${NGUONC_API}/api/films/search?keyword=${keyword}`).then(r => r.json())
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
        const [kkRes, ophimRes, nguoncRes] = await Promise.allSettled([
            fetch(`${API_URL}/v1/api/danh-sach/${type}${query}`, { next: { revalidate: 60 } }).then(r => r.json()),
            fetch(`${OPHIM_API}/v1/api/danh-sach/${type}${query}`, { next: { revalidate: 60 } }).then(r => r.json()), // Ignore cache for testing or separate key
            fetch(`${NGUONC_API}/api/films/danh-sach/${type}?page=${page}`).then(r => r.json())
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
            let pathImage = data.pathImage || data.data?.pathImage || "https://img.ophim.live/uploads/movies/";
            if (pathImage === "https://img.ophim.live" || pathImage === "https://img.ophim.live/") {
                pathImage = "https://img.ophim.live/uploads/movies/";
            }
            const ophimItems = getItems(data).map(item => normalizeOphimItem(item, pathImage));
            items = [...items, ...ophimItems];
        }

        if (nguoncRes.status === 'fulfilled' && nguoncRes.value?.status === 'success') {
            const nguoncItems = (nguoncRes.value.items || []).map((item: any) => ({
                _id: item.id || item.slug,
                name: item.name,
                slug: item.slug,
                origin_name: item.original_name || item.name,
                thumb_url: item.thumb_url,
                poster_url: item.poster_url,
                year: parseInt(item.year) || new Date().getFullYear(),
                quality: item.quality || 'FHD',
            }));
            items = [...items, ...nguoncItems];
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
        // Hybrid fetch for categories too
        const [kkRes, ophimRes, nguoncRes] = await Promise.allSettled([
            fetch(`${API_URL}/v1/api/the-loai/${slug}?page=${page}&limit=${limit}`, { next: { revalidate: 3600 } }).then(r => r.json()),
            fetch(`${OPHIM_API}/v1/api/the-loai/${slug}?page=${page}&limit=${limit}`, { next: { revalidate: 3600 } }).then(r => r.json()),
            fetch(`${NGUONC_API}/api/films/the-loai/${slug}?page=${page}`).then(r => r.json())
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
            let pathImage = data.pathImage || "https://img.ophim.live/uploads/movies/";
            if (pathImage === "https://img.ophim.live" || pathImage === "https://img.ophim.live/") {
                pathImage = "https://img.ophim.live/uploads/movies/";
            }
            const ophimItems = getItems(data).map(item => normalizeOphimItem(item, pathImage));
            items = [...items, ...ophimItems];
        }

        if (nguoncRes.status === 'fulfilled' && nguoncRes.value?.status === 'success') {
            const nguoncItems = (nguoncRes.value.items || []).map((item: any) => ({
                _id: item.id || item.slug,
                name: item.name,
                slug: item.slug,
                origin_name: item.original_name || item.name,
                thumb_url: item.thumb_url,
                poster_url: item.poster_url,
                year: parseInt(item.year) || new Date().getFullYear(),
                quality: item.quality || 'FHD',
            }));
            items = [...items, ...nguoncItems];
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
        const [kkRes, ophimRes, nguoncRes] = await Promise.allSettled([
            fetch(`${API_URL}/v1/api/quoc-gia/${slug}?page=${page}&limit=${limit}`, { next: { revalidate: 3600 } }).then(r => r.json()),
            fetch(`${OPHIM_API}/v1/api/quoc-gia/${slug}?page=${page}&limit=${limit}`, { next: { revalidate: 3600 } }).then(r => r.json()),
            fetch(`${NGUONC_API}/api/films/quoc-gia/${slug}?page=${page}`).then(r => r.json())
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
            let pathImage = data.pathImage || "https://img.ophim.live/uploads/movies/";
            if (pathImage === "https://img.ophim.live" || pathImage === "https://img.ophim.live/") {
                pathImage = "https://img.ophim.live/uploads/movies/";
            }
            const ophimItems = getItems(data).map(item => normalizeOphimItem(item, pathImage));
            items = [...items, ...ophimItems];
        }

        if (nguoncRes.status === 'fulfilled' && nguoncRes.value?.status === 'success') {
            const nguoncItems = (nguoncRes.value.items || []).map((item: any) => ({
                _id: item.id || item.slug,
                name: item.name,
                slug: item.slug,
                origin_name: item.original_name || item.name,
                thumb_url: item.thumb_url,
                poster_url: item.poster_url,
                year: parseInt(item.year) || new Date().getFullYear(),
                quality: item.quality || 'FHD',
            }));
            items = [...items, ...nguoncItems];
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
    try {
        // Fetch from both KKPhim and OPhim to maximize coverage
        const [kkCatRes, kkCountRes, ophimCountRes] = await Promise.all([
            fetch(`${API_URL}/the-loai`, { next: { revalidate: 86400 } }),
            fetch(`${API_URL}/quoc-gia`, { next: { revalidate: 86400 } }),
            fetch(`${OPHIM_API}/v1/api/quoc-gia`, { next: { revalidate: 86400 } })
        ]);

        const kkCategories = await kkCatRes.json().catch(() => []);
        const kkCountries = await kkCountRes.json().catch(() => []);
        const ophimCountriesData = await ophimCountRes.json().catch(() => null);
        const ophimCountries = ophimCountriesData?.data?.items || [];

        // Deduplicate functions
        const uniqueBySlug = (arr: any[]) => {
            const seen = new Set();
            return arr.filter(item => {
                if (!item || !item.slug) return false;
                const duplicate = seen.has(item.slug);
                seen.add(item.slug);
                return !duplicate;
            });
        };

        const mergedCountries = uniqueBySlug([...(Array.isArray(kkCountries) ? kkCountries : []), ...ophimCountries]);

        // Clean up weird HTML entities from API (e.g. Cote D&#039;Ivoire)
        const cleanName = (name: string) => name.replace(/&#039;/g, "'").replace(/&amp;/g, "&");

        return {
            categories: (Array.isArray(kkCategories) ? kkCategories : []).map(c => ({ ...c, name: cleanName(c.name) })),
            countries: mergedCountries.map(c => ({ ...c, name: cleanName(c.name) }))
        };
    } catch (error) {
        console.error("Error fetching menu data:", error);
        return { categories: [], countries: [] };
    }
};

export const getMoviesByActor = async (actorName: string, page: number = 1, limit: number = 24) => {
    try {
        // Search by actor using the standard keyword search since there is no direct actor endpoint
        // Then manually filter the array to ensure the actor is actually in the cast list
        const keyword = encodeURIComponent(actorName);
        const [kkRes, ophimRes] = await Promise.allSettled([
            fetch(`${API_URL}/v1/api/tim-kiem?keyword=${keyword}&limit=100`, { next: { revalidate: 3600 } }).then(r => r.json()),
            fetch(`${OPHIM_API}/v1/api/tim-kiem?keyword=${keyword}&limit=100`, { next: { revalidate: 3600 } }).then(r => r.json())
        ]);

        let items: Movie[] = [];

        // Process KKPhim Data
        if (kkRes.status === 'fulfilled' && kkRes.value?.status) {
            const data = kkRes.value;
            const pathImage = data.pathImage || data.data?.pathImage || "";
            const kkItems = getItems(data).map(item => ({
                ...item,
                thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : combineUrl(pathImage, item.thumb_url),
                poster_url: item.poster_url?.startsWith('http') ? item.poster_url : combineUrl(pathImage, item.poster_url)
            }));
            items = [...items, ...kkItems];
        }

        // Process OPhim Data
        if (ophimRes.status === 'fulfilled' && ophimRes.value?.status) {
            const data = ophimRes.value;
            let pathImage = data.pathImage || data.data?.pathImage || "https://img.ophim.live/uploads/movies/";
            if (pathImage === "https://img.ophim.live" || pathImage === "https://img.ophim.live/") {
                pathImage = "https://img.ophim.live/uploads/movies/";
            }
            const ophimItems = getItems(data).map(item => normalizeOphimItem(item, pathImage));
            items = [...items, ...ophimItems];
        }

        // Filter and Deduplicate
        const seen = new Set();
        const normalizeString = (str: string) => str.toLowerCase().replace(/\s+/g, ' ').trim();
        const searchActor = normalizeString(actorName);

        const filteredItems = items.filter(item => {
            if (seen.has(item.slug)) return false;

            // Check if actor exists in the actor list
            if (item.actor && Array.isArray(item.actor)) {
                const hasActor = item.actor.some((a: string) => normalizeString(a).includes(searchActor));
                if (hasActor) {
                    seen.add(item.slug);
                    return true;
                }
            } else if (typeof item.actor === 'string') {
                // Sometime actor is a comma separated string
                if (normalizeString(item.actor).includes(searchActor)) {
                    seen.add(item.slug);
                    return true;
                }
            }
            return false;
        });

        // Pagination manually since we have aggregated results
        const totalItems = filteredItems.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / limit));
        const safePage = Math.min(page, totalPages);
        const startIndex = (safePage - 1) * limit;
        const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);

        return {
            items: paginatedItems,
            pagination: {
                totalItems,
                totalPages,
                currentPage: safePage
            }
        };
    } catch (error) {
        console.error(`Error fetching movies by actor [${actorName}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
    }
};
