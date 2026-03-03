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
    tmdbData?: { vote_average?: number; poster_path?: string; backdrop_path?: string } | null;
}

interface PaginatedData {
    items?: Movie[];
    data?: { items?: Movie[]; params?: unknown; pathImage?: string; APP_DOMAIN_CDN_IMAGE?: string };
    status?: boolean | string;
    pathImage?: string;
    movie?: Record<string, unknown>;
    episodes?: Record<string, unknown>[];
}

// Helper to normalize response because API structure varies slightly between endpoints
const getItems = (data: PaginatedData): Movie[] => {
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

// --- Ophim Native Extensions ---

export const getOphimCast = async (slug: string) => {
    try {
        if (!slug) return [];
        const res = await fetch(`https://ophim1.com/phim/${slug}/peoples`, { next: { revalidate: 86400 } });
        const data = await res.json();
        return data.cast || [];
    } catch (error) {
        console.error(`OPhim Web Cast Error [${slug}]:`, error);
        return [];
    }
};

export const getOphimImages = async (slug: string) => {
    try {
        if (!slug) return null;
        const res = await fetch(`https://ophim1.com/phim/${slug}/images`, { next: { revalidate: 86400 } });
        return await res.json();
    } catch (error) {
        console.error(`OPhim Web Images Error [${slug}]:`, error);
        return null;
    }
};

let homeCache: {
    phimMoi: Movie[]; phimLe: Movie[]; phimBo: Movie[]; hoatHinh: Movie[];
    tvShows: Movie[]; phimChieuRap: Movie[]; phimSapChieu: Movie[];
    hanQuoc: Movie[]; trungQuoc: Movie[]; hanhDong: Movie[]; tinhCam: Movie[];
} | null = null;
let homeCacheTime = 0;

export const getHomeData = async () => {
    // 15 phút Memory Cache giúp bảo vệ Next.js VPS khỏi bị spam requests
    if (homeCache && Date.now() - homeCacheTime < 15 * 60 * 1000) {
        return homeCache;
    }

    try {
        const fetchCategory = async (slug: string, endpoint: 'danh-sach' | 'the-loai' | 'quoc-gia' = 'danh-sach') => {
            let nguoncUrl = `${NGUONC_API}/api/films/${endpoint}/${slug}?page=1`;
            if (slug === 'phim-moi-cap-nhat') nguoncUrl = `${NGUONC_API}/api/films/phim-moi-cap-nhat?page=1`;

            const [kkRes, nguoncRes] = await Promise.allSettled([
                fetch(`${API_URL}/v1/api/${endpoint}/${slug}?limit=12`, { next: { revalidate: 3600 } }).then((res) => res.json()),
                fetch(nguoncUrl, { next: { revalidate: 3600 } }).then((res) => res.json())
            ]);
            let items: Movie[] = [];
            if (kkRes.status === 'fulfilled' && kkRes.value?.data?.items) {
                const data = kkRes.value;
                const pathImage = data.pathImage || data.data?.pathImage || "";
                items = [...items, ...getItems(data).map(item => ({
                    ...item,
                    thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : combineUrl(pathImage, item.thumb_url),
                    poster_url: item.poster_url?.startsWith('http') ? item.poster_url : combineUrl(pathImage, item.poster_url)
                }))];
            }
            if (nguoncRes.status === 'fulfilled' && nguoncRes.value?.status === 'success') {
                const nguoncItems = (nguoncRes.value.items || []).map((item: Record<string, unknown>) => ({
                    _id: (item.id || item.slug) as string,
                    name: item.name as string,
                    slug: item.slug as string,
                    origin_name: (item.original_name || item.name) as string,
                    thumb_url: item.thumb_url as string,
                    poster_url: item.poster_url as string,
                    year: parseInt(item.year as string) || new Date().getFullYear(),
                    quality: (item.quality as string) || 'FHD',
                }));
                items = [...items, ...nguoncItems];
            }
            const seen = new Set<string>();
            return items.filter(item => {
                const duplicate = seen.has(item.slug);
                seen.add(item.slug);
                return !duplicate;
            });
        };

        const [
            phimMoi, phimLe, phimBo, hoatHinh, tvShows,
            phimChieuRap, phimSapChieu, hanQuoc, trungQuoc,
            hanhDong, tinhCam
        ] = await Promise.all([
            fetchCategory('phim-moi-cap-nhat'),
            fetchCategory('phim-le'),
            fetchCategory('phim-bo'),
            fetchCategory('hoat-hinh'),
            fetchCategory('tv-shows'),
            fetchCategory('phim-chieu-rap', 'the-loai'),
            fetchCategory('phim-sap-chieu'),
            fetchCategory('han-quoc', 'quoc-gia'),
            fetchCategory('trung-quoc', 'quoc-gia'),
            fetchCategory('hanh-dong', 'the-loai'),
            fetchCategory('tinh-cam', 'the-loai')
        ]);

        const data = {
            phimMoi, phimLe, phimBo, hoatHinh, tvShows,
            phimChieuRap, phimSapChieu, hanQuoc, trungQuoc,
            hanhDong, tinhCam
        };

        homeCache = data;
        homeCacheTime = Date.now();
        return data;
    } catch (error) {
        console.error("Error fetching home data:", error);
        return { phimMoi: [], phimLe: [], phimBo: [], hoatHinh: [], tvShows: [], phimChieuRap: [], phimSapChieu: [], hanQuoc: [], trungQuoc: [], hanhDong: [], tinhCam: [] };
    }
};

export const getMovieDetail = async (slug: string) => {
    try {
        const [kkRes, ophimRes, nguoncRes] = await Promise.allSettled([
            fetch(`${API_URL}/phim/${slug}`, { next: { revalidate: 180 } }).then(r => r.json()),
            fetch(`https://ophim1.com/phim/${slug}`, { next: { revalidate: 180 } }).then(r => r.json()),
            fetch(`${NGUONC_API}/api/film/${slug}`, { next: { revalidate: 180 } }).then(r => r.json())
        ]);

        let combinedData: Record<string, unknown> | null = null;

        // Base movie data prefers KKPhim, fallback to OPhim
        if (kkRes.status === 'fulfilled' && kkRes.value?.status) {
            combinedData = { ...kkRes.value };
            // Tag servers from KKPhim
            if (combinedData.episodes && Array.isArray(combinedData.episodes)) {
                combinedData.episodes = combinedData.episodes.map((epGroup: { server_name?: string }) => ({
                    ...epGroup,
                    server_name: `KKPhim #${epGroup.server_name || "1"}`
                }));
            }
        } else if (ophimRes.status === 'fulfilled' && ophimRes.value?.status) {
            combinedData = { ...ophimRes.value };
            // Ophim structures movie data slightly differently, might need normalization here if used as base
            const ophimMovie = combinedData.movie as Record<string, string> | undefined;
            if (ophimMovie && !ophimMovie.thumb_url?.startsWith('http') && combinedData.pathImage) {
                ophimMovie.thumb_url = combineUrl(combinedData.pathImage as string, ophimMovie.thumb_url);
                ophimMovie.poster_url = combineUrl(combinedData.pathImage as string, ophimMovie.poster_url);
            }
            // Tag servers from OPhim
            if (combinedData.episodes && Array.isArray(combinedData.episodes)) {
                combinedData.episodes = combinedData.episodes.map((epGroup: { server_name?: string }) => ({
                    ...epGroup,
                    server_name: `OPhim #${epGroup.server_name || "1"}`
                }));
            }
        }

        // If we found a base, and the OTHER source also succeeded, merge its episodes
        if (combinedData) {
            if (kkRes.status === 'fulfilled' && kkRes.value?.status && ophimRes.status === 'fulfilled' && ophimRes.value?.status) {
                const ophimEpisodes = ophimRes.value.episodes || [];
                const taggedOphimEpisodes = ophimEpisodes.map((epGroup: { server_name?: string }) => ({
                    ...epGroup,
                    server_name: `OPhim #${epGroup.server_name || "1"}`
                }));
                // Prevent duplicate if names happen to match exactly (rare with our tags, but safe)
                combinedData.episodes = [...((combinedData.episodes as unknown[]) || []), ...taggedOphimEpisodes];
            }

            // Also merge NguonC episodes if available
            if (nguoncRes.status === 'fulfilled' && nguoncRes.value?.status === 'success') {
                const nguoncEpisodes = nguoncRes.value.movie?.episodes || [];
                const taggedNguoncEpisodes = nguoncEpisodes.map((epGroup: { server_name?: string }) => ({
                    ...epGroup,
                    server_name: `NguonC #${epGroup.server_name || "1"}`
                }));
                combinedData.episodes = [...((combinedData.episodes as unknown[]) || []), ...taggedNguoncEpisodes];
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
                episodes: (data.episodes || []).map((epGroup: { server_name?: string }) => ({
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
            const items = (data.data?.items || []).map((item: Record<string, unknown>) => ({
                ...item,
                thumb_url: (typeof item.thumb_url === 'string' && item.thumb_url.startsWith('http')) ? item.thumb_url : combineUrl(pathImage, item.thumb_url as string),
                poster_url: (typeof item.poster_url === 'string' && item.poster_url.startsWith('http')) ? item.poster_url : combineUrl(pathImage, item.poster_url as string)
            }));
            results = [...results, ...items as Movie[]];
        }

        if (ophimRes.status === 'fulfilled') {
            const data = ophimRes.value;
            let pathImage = data.pathImage || data.data?.APP_DOMAIN_CDN_IMAGE || "https://img.ophim.live/uploads/movies/";
            if (pathImage === "https://img.ophim.live" || pathImage === "https://img.ophim.live/") {
                pathImage = "https://img.ophim.live/uploads/movies/";
            }
            const items = (data.data?.items || []).map((item: Record<string, unknown>) => normalizeOphimItem(item, pathImage));
            results = [...results, ...items];
        }

        if (nguoncRes.status === 'fulfilled' && nguoncRes.value?.status === 'success') {
            const items = (nguoncRes.value.items || []).map((item: Record<string, unknown>) => ({
                _id: (item.id || item.slug) as string,
                name: item.name as string,
                slug: item.slug as string,
                origin_name: (item.original_name || item.name) as string,
                thumb_url: item.thumb_url as string,
                poster_url: item.poster_url as string,
                year: parseInt(item.year as string) || new Date().getFullYear(),
                quality: (item.quality as string) || 'FHD',
            })) as Movie[];
            results = [...results, ...items];
        }

        // Deduplicate
        const seen = new Set<string>();
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
const normalizeOphimItem = (item: Record<string, unknown>, pathImage: string): Movie => {
    return {
        ...item,
        _id: item._id as string,
        name: item.name as string,
        slug: item.slug as string,
        origin_name: item.origin_name as string,
        thumb_url: (typeof item.thumb_url === 'string' && item.thumb_url.startsWith('http')) ? item.thumb_url : combineUrl(pathImage, item.thumb_url as string),
        poster_url: (typeof item.poster_url === 'string' && item.poster_url.startsWith('http')) ? item.poster_url : combineUrl(pathImage, item.poster_url as string),
        type: (item.type as string) || 'unknown',
        sub_docquyen: !!item.sub_docquyen,
        chieurap: !!item.chieurap,
        time: (item.time as string) || '',
        episode_current: (item.episode_current as string) || '',
        quality: (item.quality as string) || '',
        lang: (item.lang as string) || '',
        year: (item.year as number) || new Date().getFullYear(),
        category: (item.category as { id: string, name: string, slug: string }[]) || [],
        country: (item.country as { id: string, name: string, slug: string }[]) || [],
    } as Movie;
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
            fetch(`${API_URL}/v1/api/danh-sach/${type}${query}`, { next: { revalidate: 3600 } }).then(r => r.json()),
            fetch(`${OPHIM_API}/v1/api/danh-sach/${type}${query}`, { next: { revalidate: 3600 } }).then(r => r.json()),
            fetch(`${NGUONC_API}/api/films/${type === 'phim-moi-cap-nhat' ? '' : 'danh-sach/'}${type}?page=${page}`, { next: { revalidate: 3600 } }).then(r => r.json())
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
            const nguoncItems = (nguoncRes.value.items || []).map((item: Record<string, unknown>) => ({
                _id: (item.id || item.slug) as string,
                name: item.name as string,
                slug: item.slug as string,
                origin_name: (item.original_name || item.name) as string,
                thumb_url: item.thumb_url as string,
                poster_url: item.poster_url as string,
                year: parseInt(item.year as string) || new Date().getFullYear(),
                quality: (item.quality as string) || 'FHD',
            })) as Movie[];
            items = [...items, ...nguoncItems];
        }

        // Deduplicate by Slug
        const seen = new Set<string>();
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
            fetch(`${NGUONC_API}/api/films/the-loai/${slug}?page=${page}`, { next: { revalidate: 3600 } }).then(r => r.json())
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
            const nguoncItems = (nguoncRes.value.items || []).map((item: Record<string, unknown>) => ({
                _id: (item.id || item.slug) as string,
                name: item.name as string,
                slug: item.slug as string,
                origin_name: (item.original_name || item.name) as string,
                thumb_url: item.thumb_url as string,
                poster_url: item.poster_url as string,
                year: parseInt(item.year as string) || new Date().getFullYear(),
                quality: (item.quality as string) || 'FHD',
            })) as Movie[];
            items = [...items, ...nguoncItems];
        }

        // Deduplicate
        const seen = new Set<string>();
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
            fetch(`${NGUONC_API}/api/films/quoc-gia/${slug}?page=${page}`, { next: { revalidate: 3600 } }).then(r => r.json())
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
            const nguoncItems = (nguoncRes.value.items || []).map((item: Record<string, unknown>) => ({
                _id: (item.id || item.slug) as string,
                name: item.name as string,
                slug: item.slug as string,
                origin_name: (item.original_name || item.name) as string,
                thumb_url: item.thumb_url as string,
                poster_url: item.poster_url as string,
                year: parseInt(item.year as string) || new Date().getFullYear(),
                quality: (item.quality as string) || 'FHD',
            })) as Movie[];
            items = [...items, ...nguoncItems];
        }

        const seen = new Set<string>();
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
function isSameMovieByYear(tmdbItem: Record<string, unknown>, movie: Movie): boolean {
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

        const movies = await Promise.all(trendList.slice(0, 15).map(async (tmdbItem: Record<string, unknown>) => {
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

        return movies.filter((m: unknown) => m !== null);
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
        const uniqueBySlug = (arr: { slug?: string, name?: string }[]) => {
            const seen = new Set<string>();
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
        const TMDB_KEY = process.env.TMDB_API_KEY;
        const searchNames: string[] = [actorName];
        const tmdbCreditTitles: string[] = [];

        // Phase 1: Try to get TMDB person to get English/original name + credit list
        if (TMDB_KEY) {
            try {
                const personSearchUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(actorName)}&language=vi-VN`;
                const personRes = await fetch(personSearchUrl, { next: { revalidate: 3600 } });
                const personData = await personRes.json();

                if (personData.results?.length > 0) {
                    const person = personData.results[0];
                    // Add original_name and known_as names to our search pool
                    if (person.name && !searchNames.includes(person.name)) searchNames.push(person.name);
                    if (person.original_name && !searchNames.includes(person.original_name)) searchNames.push(person.original_name);
                    if (person.also_known_as) {
                        person.also_known_as.slice(0, 3).forEach((aka: string) => {
                            if (aka && !searchNames.includes(aka)) searchNames.push(aka);
                        });
                    }

                    // Phase 1b: Get their combined credits from TMDB
                    const creditsUrl = `https://api.themoviedb.org/3/person/${person.id}/combined_credits?api_key=${TMDB_KEY}&language=vi-VN`;
                    const creditsRes = await fetch(creditsUrl, { next: { revalidate: 3600 } });
                    const creditsData = await creditsRes.json();

                    // Collect known Vietnamese + original titles of their biggest movies
                    const castCredits = (creditsData.cast || [])
                        .sort((a: { popularity?: number }, b: { popularity?: number }) => (b.popularity || 0) - (a.popularity || 0))
                        .slice(0, 30);

                    castCredits.forEach((credit: { title?: string, name?: string, original_title?: string, original_name?: string }) => {
                        const title = credit.title || credit.name;
                        const origTitle = credit.original_title || credit.original_name;
                        if (title) tmdbCreditTitles.push(title);
                        if (origTitle && origTitle !== title) tmdbCreditTitles.push(origTitle);
                    });
                }
            } catch (e) {
                console.warn("TMDB person lookup failed, falling back to keyword search:", e);
            }
        }

        // Phase 2: Search KKPhim with all actor name variants in parallel
        const nameSearchPromises = searchNames.slice(0, 3).flatMap(name => {
            const keyword = encodeURIComponent(name);
            return [
                fetch(`${API_URL}/v1/api/tim-kiem?keyword=${keyword}&limit=100`, { next: { revalidate: 3600 } })
                    .then(r => r.json()).catch(() => null),
                fetch(`${OPHIM_API}/v1/api/tim-kiem?keyword=${keyword}&limit=100`, { next: { revalidate: 3600 } })
                    .then(r => r.json()).catch(() => null),
            ];
        });

        // Phase 3: Also search KKPhim for top TMDB credit titles (limited batch)
        const creditSearchPromises = tmdbCreditTitles.slice(0, 10).map(title => {
            const keyword = encodeURIComponent(title);
            return fetch(`${API_URL}/v1/api/tim-kiem?keyword=${keyword}&limit=10`, { next: { revalidate: 3600 } })
                .then(r => r.json()).catch(() => null);
        });

        const allResults = await Promise.allSettled([...nameSearchPromises, ...creditSearchPromises]);

        const items: Movie[] = [];
        const seen = new Set<string>();

        for (const result of allResults) {
            if (result.status !== 'fulfilled' || !result.value) continue;
            const data = result.value;

            if (!data?.status && !data?.data) continue;

            const pathImage = data.pathImage || data.data?.pathImage || data.data?.APP_DOMAIN_CDN_IMAGE || "";

            const rawItems = (data.data?.items || data.items || []);
            for (const item of rawItems) {
                if (seen.has(item.slug)) continue;

                // Normalize: ensure the image URLs are absolute
                if (pathImage) {
                    if (item.thumb_url && !item.thumb_url.startsWith('http')) {
                        item.thumb_url = combineUrl(pathImage, item.thumb_url);
                    }
                    if (item.poster_url && !item.poster_url.startsWith('http')) {
                        item.poster_url = combineUrl(pathImage, item.poster_url);
                    }
                }

                // For name-searches: check actor list for match
                // For title-searches: movie itself may not have actor list, include it
                const normalizeStr = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
                const isActorMatch = searchNames.some(name => {
                    const searchActorNorm = normalizeStr(name);
                    if (item.actor && Array.isArray(item.actor)) {
                        return item.actor.some((a: string) => normalizeStr(a).includes(searchActorNorm) || searchActorNorm.includes(normalizeStr(a)));
                    }
                    if (typeof item.actor === 'string') {
                        return normalizeStr(item.actor).includes(searchActorNorm);
                    }
                    return false;
                });

                const isTitleMatch = tmdbCreditTitles.some(title => {
                    const norm = normalizeStr(title);
                    return normalizeStr(item.name || '').includes(norm) || normalizeStr(item.origin_name || '').includes(norm) || norm.includes(normalizeStr(item.name || ''));
                });

                if (isActorMatch || isTitleMatch) {
                    seen.add(item.slug);
                    items.push(item);
                }
            }
        }

        // Sort by year descending
        items.sort((a, b) => (b.year || 0) - (a.year || 0));

        // Pagination
        const totalItems = items.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / limit));
        const safePage = Math.min(page, totalPages);
        const startIndex = (safePage - 1) * limit;
        const paginatedItems = items.slice(startIndex, startIndex + limit);

        return {
            items: paginatedItems,
            pagination: { totalItems, totalPages, currentPage: safePage }
        };
    } catch (error) {
        console.error(`Error fetching movies by actor [${actorName}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };

    }
};
