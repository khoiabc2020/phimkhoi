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

/** Chuẩn hóa item từ NguonC về đúng kiểu Movie để card và link hoạt động đầy đủ */
function normalizeNguoncItem(item: Record<string, unknown>): Movie {
    const name = (item.name as string) || "";
    const slug = (item.slug as string) || "";
    const id = (item.id || item.slug || slug) as string;
    return {
        _id: id,
        name,
        slug,
        origin_name: (item.original_name as string) || name,
        content: "",
        type: (item.type as string) || "single",
        status: "",
        thumb_url: (item.thumb_url as string) || "",
        // Poster must stay "poster-only". Do not auto-fallback to thumb here,
        // otherwise portrait slots get landscape images too early.
        poster_url: (item.poster_url as string) || "",
        is_copyright: false,
        sub_docquyen: false,
        chieurap: false,
        trailer_url: "",
        time: "",
        episode_current: (item.current_episode as string) || "",
        episode_total: "",
        quality: (item.quality as string) || "FHD",
        lang: "",
        notify: "",
        showtimes: "",
        year: toValidYear(item.year as string) || 0,
        view: 0,
        actor: [],
        director: [],
        category: Array.isArray(item.category) ? item.category as { id: string; name: string; slug: string }[] : [],
        country: Array.isArray(item.country) ? item.country as { id: string; name: string; slug: string }[] : [],
        episodes: [],
    };
}

// Safe URI concatenation
const combineUrl = (base: string, path: string) => {
    if (!path) return "";
    if (!base) return path;
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
};

const toValidYear = (value: unknown): number | undefined => {
    const parsed = parseInt(String(value || "").substring(0, 4), 10);
    if (!Number.isFinite(parsed)) return undefined;
    if (parsed < 1900 || parsed > 2100) return undefined;
    return parsed;
};

// --- Utilities ---
export const parseServerLabel = (
    serverName: string,
    serverGroups: Map<string, number> = new Map() // Pass a map if you need numbering (e.g. NguonC 1, NguonC 2)
): string => {
    if (!serverName) return "VIP";

    // Common prefixes to strip out when determining the base domain
    let baseName = serverName;
    const prefixesToRemove = ["vip", "vietsub", "thuyết minh", "thuyetminh", "lồng tiếng", "longtieng", "[]", "()", "#"];

    // 1) Clean common noise words
    const lowerName = baseName.toLowerCase();
    for (const prefix of prefixesToRemove) {
        if (lowerName.includes(prefix)) {
            // Regex case-insensitive replace
            const regex = new RegExp(`\\b${prefix}\\b|\\[${prefix}\\]|\\(${prefix}\\)|#`, 'gi');
            baseName = baseName.replace(regex, "");
        }
    }

    baseName = baseName.trim().replace(/^[-_\s]+|[-_\s]+$/g, "");

    // 2) Map domains to friendly names
    const lowerBase = baseName.toLowerCase();
    let finalLabel = baseName || "VIP";

    if (lowerBase.includes("kkphim")) {
        finalLabel = "KKPhim";
    } else if (lowerBase.includes("ophim")) {
        finalLabel = "OPhim";
    } else if (lowerBase.includes("nguonc")) {
        finalLabel = "NguonC";
    } else if (lowerBase.includes("tkb")) {
        finalLabel = "TKB";
    } else if (finalLabel.length > 15) {
        // If it's still just a long garbage string, return a fallback
        finalLabel = "Server";
    }

    // Default to the mapping logic
    const currentCount = serverGroups.get(finalLabel) || 0;
    serverGroups.set(finalLabel, currentCount + 1);

    if (currentCount > 0) {
        return `${finalLabel} ${currentCount + 1}`;
    }

    return finalLabel;
};

// Merge image fields from multiple sources for the same movie slug.
// Ưu tiên: nguồn được push trước (KKPhim) giữ làm gốc, nhưng nếu thiếu poster/thumbnail
// thì lấy bù từ các nguồn sau (OPhim, NguonC, ...), sau đó mới tới TMDB ở các bước khác.
const mergeMovieImages = (primary: Movie, candidate: Movie): Movie => {
    if (!candidate) return primary;
    const merged: Movie = { ...primary };

    const isEmpty = (v?: string) => !v || String(v).trim() === "";
    const toLower = (v?: string) => String(v || "").toLowerCase();
    const isOphimAsset = (v?: string) => toLower(v).includes("img.ophim.live");
    const detectByDimensionToken = (v?: string): "portrait" | "landscape" | "unknown" => {
        const u = toLower(v);
        const m = u.match(/(\d{2,4})x(\d{2,4})/);
        if (!m) return "unknown";
        const w = parseInt(m[1], 10);
        const h = parseInt(m[2], 10);
        if (!Number.isFinite(w) || !Number.isFinite(h)) return "unknown";
        if (w === h) return "unknown";
        return h > w ? "portrait" : "landscape";
    };
    const detectOrientation = (v?: string): "portrait" | "landscape" | "unknown" => {
        const u = toLower(v);
        if (!u) return "unknown";
        // OPhim thực tế hay dùng *-thumb.jpg làm ảnh dọc card.
        if (isOphimAsset(v) && (u.includes("-thumb.") || u.includes("/thumb-"))) return "portrait";
        // Với OPhim, *-poster.jpg thường là ảnh ngang.
        if (isOphimAsset(v) && (u.includes("-poster.") || u.includes("/poster-"))) return "landscape";
        if (u.includes("backdrop") || u.includes("banner") || u.includes("landscape") || u.includes("horizontal")) return "landscape";
        if (u.includes("poster-vertical") || u.includes("portrait") || u.includes("vertical")) return "portrait";
        if (u.includes("/poster") || u.includes("poster.")) return "portrait";
        return detectByDimensionToken(v);
    };
    const looksPortrait = (v?: string) => detectOrientation(v) === "portrait";
    const looksLandscape = (v?: string) => detectOrientation(v) === "landscape";
    const pickFirstNonEmpty = (arr: (string | undefined)[]) => arr.find(v => !isEmpty(v)) || "";
    const pickPortrait = (arr: (string | undefined)[]) => {
        for (const v of arr) if (!isEmpty(v) && looksPortrait(v)) return v as string;
        for (const v of arr) if (!isEmpty(v) && detectOrientation(v) === "unknown") return v as string;
        return "";
    };
    const pickLandscape = (arr: (string | undefined)[]) => {
        for (const v of arr) if (!isEmpty(v) && looksLandscape(v)) return v as string;
        for (const v of arr) if (!isEmpty(v) && detectOrientation(v) === "unknown") return v as string;
        return "";
    };

    // Enforce semantics:
    // - poster_url: portrait-first
    // - thumb_url: landscape-first
    const portrait = pickPortrait([
        merged.poster_url,
        candidate.poster_url,
        merged.thumb_url,
        candidate.thumb_url,
    ]);
    const landscape = pickLandscape([
        merged.thumb_url,
        candidate.thumb_url,
        merged.poster_url,
        candidate.poster_url,
    ]);

    merged.poster_url = portrait || merged.poster_url || candidate.poster_url || "";
    merged.thumb_url =
        landscape ||
        merged.thumb_url ||
        candidate.thumb_url ||
        pickFirstNonEmpty([merged.poster_url, candidate.poster_url]);

    return merged;
};

const normalizeMovieImageRoles = (movie: Movie): Movie => {
    const isEmpty = (v?: string) => !v || String(v).trim() === "";
    const toLower = (v?: string) => String(v || "").toLowerCase();
    const isOphimAsset = (v?: string) => toLower(v).includes("img.ophim.live");
    const detectByDimensionToken = (v?: string): "portrait" | "landscape" | "unknown" => {
        const u = toLower(v);
        const m = u.match(/(\d{2,4})x(\d{2,4})/);
        if (!m) return "unknown";
        const w = parseInt(m[1], 10);
        const h = parseInt(m[2], 10);
        if (!Number.isFinite(w) || !Number.isFinite(h)) return "unknown";
        if (w === h) return "unknown";
        return h > w ? "portrait" : "landscape";
    };
    const detectOrientation = (v?: string): "portrait" | "landscape" | "unknown" => {
        const u = toLower(v);
        if (!u) return "unknown";
        if (isOphimAsset(v) && (u.includes("-thumb.") || u.includes("/thumb-"))) return "portrait";
        if (isOphimAsset(v) && (u.includes("-poster.") || u.includes("/poster-"))) return "landscape";
        if (u.includes("backdrop") || u.includes("banner") || u.includes("landscape") || u.includes("horizontal")) return "landscape";
        if (u.includes("poster-vertical") || u.includes("portrait") || u.includes("vertical")) return "portrait";
        if (u.includes("/poster") || u.includes("poster.")) return "portrait";
        return detectByDimensionToken(v);
    };
    const pickPortrait = (arr: (string | undefined)[]) => {
        for (const v of arr) if (!isEmpty(v) && detectOrientation(v) === "portrait") return v as string;
        for (const v of arr) if (!isEmpty(v) && detectOrientation(v) === "unknown") return v as string;
        return "";
    };
    const pickLandscape = (arr: (string | undefined)[]) => {
        for (const v of arr) if (!isEmpty(v) && detectOrientation(v) === "landscape") return v as string;
        for (const v of arr) if (!isEmpty(v) && detectOrientation(v) === "unknown") return v as string;
        return "";
    };

    const portrait = pickPortrait([movie.poster_url, movie.thumb_url]);
    const landscape = pickLandscape([movie.thumb_url, movie.poster_url]);

    return {
        ...movie,
        poster_url: portrait || movie.poster_url || "",
        thumb_url: landscape || movie.thumb_url || movie.poster_url || "",
    };
};

const inferTmdbType = (movie: Movie): "movie" | "tv" => {
    const t = String(movie?.type || "").toLowerCase();
    if (t.includes("series") || t.includes("tv") || t.includes("phim-bo") || t.includes("hoat-hinh")) {
        return "tv";
    }
    return "movie";
};

const enrichMoviesWithTMDB = async (movies: Movie[], maxItems = 18): Promise<Movie[]> => {
    if (!Array.isArray(movies) || movies.length === 0) return movies;
    if (!process.env.TMDB_API_KEY) return movies;

    const limit = Math.max(0, Math.min(maxItems, movies.length));
    const head = movies.slice(0, limit);
    const tail = movies.slice(limit);

    const enrichedHead = await Promise.all(head.map(async (movie) => {
        try {
            const query = movie.origin_name || movie.name;
            if (!query) return movie;
            const tmdb = await searchTMDBMovie(
                query,
                toValidYear(movie.year),
                inferTmdbType(movie),
                { originalName: movie.origin_name, localName: movie.name, countrySlug: movie.country?.[0]?.slug }
            );
            if (!tmdb) return movie;

            const tmdbYear = toValidYear((tmdb as any).release_date || (tmdb as any).first_air_date);
            const tmdbPoster = (tmdb as any).poster_path ? `https://image.tmdb.org/t/p/w500${(tmdb as any).poster_path}` : "";
            const tmdbBackdrop = (tmdb as any).backdrop_path ? `https://image.tmdb.org/t/p/w1280${(tmdb as any).backdrop_path}` : "";

            return normalizeMovieImageRoles({
                ...movie,
                year: tmdbYear || movie.year || 0,
                // Prioritize TMDB images if they exist
                poster_url: tmdbPoster || movie.poster_url,
                thumb_url: tmdbBackdrop || movie.thumb_url,
                tmdbData: {
                    vote_average: (tmdb as any).vote_average,
                    poster_path: (tmdb as any).poster_path,
                    backdrop_path: (tmdb as any).backdrop_path,
                },
            } as Movie);
        } catch {
            return movie;
        }
    }));

    return [...enrichedHead, ...tail];
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

/** Cấu hình đề mục trang chủ — slug + endpoint chuẩn (PhimAPI/KKPhim + NguonC) */
type HomeCacheKey = 'phimMoi' | 'phimLe' | 'phimBo' | 'hoatHinh' | 'tvShows' | 'phimChieuRap' | 'phimSapChieu' | 'hanQuoc' | 'trungQuoc' | 'hanhDong' | 'tinhCam';
const HOME_CATEGORIES: { key: HomeCacheKey; slug: string; endpoint: 'danh-sach' | 'the-loai' | 'quoc-gia' }[] = [
    { key: 'phimMoi', slug: 'phim-moi-cap-nhat', endpoint: 'danh-sach' },
    { key: 'phimLe', slug: 'phim-le', endpoint: 'danh-sach' },
    { key: 'phimBo', slug: 'phim-bo', endpoint: 'danh-sach' },
    { key: 'hoatHinh', slug: 'hoat-hinh', endpoint: 'danh-sach' },
    { key: 'tvShows', slug: 'tv-shows', endpoint: 'danh-sach' },
    { key: 'phimChieuRap', slug: 'phim-chieu-rap', endpoint: 'the-loai' },
    { key: 'phimSapChieu', slug: 'phim-sap-chieu', endpoint: 'danh-sach' },
    { key: 'hanQuoc', slug: 'han-quoc', endpoint: 'quoc-gia' },
    { key: 'trungQuoc', slug: 'trung-quoc', endpoint: 'quoc-gia' },
    { key: 'hanhDong', slug: 'hanh-dong', endpoint: 'the-loai' },
    { key: 'tinhCam', slug: 'tinh-cam', endpoint: 'the-loai' },
];

/** Slug "Xem tất cả" cho từng đề mục — dùng chung cho trang chủ và link chính xác */
export const HOME_SECTION_SLUGS: Record<HomeCacheKey, string> = {
    phimMoi: "/danh-sach/phim-moi-cap-nhat",
    phimLe: "/danh-sach/phim-le",
    phimBo: "/danh-sach/phim-bo",
    hoatHinh: "/danh-sach/hoat-hinh",
    tvShows: "/danh-sach/tv-shows",
    phimChieuRap: "/the-loai/phim-chieu-rap",
    phimSapChieu: "/danh-sach/phim-sap-chieu",
    hanQuoc: "/quoc-gia/han-quoc",
    trungQuoc: "/quoc-gia/trung-quoc",
    hanhDong: "/the-loai/hanh-dong",
    tinhCam: "/the-loai/tinh-cam",
};

const FETCH_TIMEOUT_MS = 12000;

/** Fetch with tight timeout used for server components to guarantee fast loads */
export const fetchWithFastTimeout = async (url: string, timeoutMs: number = 3000, options: RequestInit = {}) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return await response.json();
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
};

/** Fetch with timeout and optional retry logic for external APIs (used by client caching) */
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 1): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error: any) {
        if (retries > 0 && error.name !== 'AbortError') {
            console.warn(`Retrying fetch for ${url} (${retries} left)`);
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

export const getHomeData = async () => {
    // Cache 20 phút trên VPS để giảm tải khi lượng xem lớn
    const CACHE_TTL_MS = 20 * 60 * 1000;
    if (homeCache && Date.now() - homeCacheTime < CACHE_TTL_MS) {
        return homeCache;
    }

    try {
        const fetchCategory = async (slug: string, endpoint: 'danh-sach' | 'the-loai' | 'quoc-gia' = 'danh-sach') => {
            let nguoncUrl = `${NGUONC_API}/api/films/${endpoint}/${slug}?page=1`;
            if (slug === 'phim-moi-cap-nhat') nguoncUrl = `${NGUONC_API}/api/films/phim-moi-cap-nhat?page=1`;

            const [kkRes, ophimRes, nguoncRes] = await Promise.allSettled([
                fetchWithRetry(`${API_URL}/v1/api/${endpoint}/${slug}?limit=12`, { next: { revalidate: 3600 } }),
                fetchWithRetry(`${OPHIM_API}/v1/api/${endpoint}/${slug}?limit=12`, { next: { revalidate: 3600 } }),
                fetchWithRetry(nguoncUrl, { next: { revalidate: 3600 } }),
            ]);

            let items: Movie[] = [];
            // Source 1: KKPhim
            if (kkRes.status === 'fulfilled' && kkRes.value?.data?.items) {
                const data = kkRes.value;
                const pathImage = data.pathImage || data.data?.pathImage || "";
                items = [...items, ...getItems(data).map(item => ({
                    ...item,
                    thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : combineUrl(pathImage, item.thumb_url),
                    poster_url: item.poster_url?.startsWith('http') ? item.poster_url : combineUrl(pathImage, item.poster_url)
                }))];
            }

            // Source 2: OPhim
            if (ophimRes.status === 'fulfilled' && ophimRes.value?.data?.items) {
                const data = ophimRes.value;
                let pathImage = data.pathImage || data.data?.APP_DOMAIN_CDN_IMAGE || "https://img.ophim.live/uploads/movies/";
                if (pathImage === "https://img.ophim.live" || pathImage === "https://img.ophim.live/") {
                    pathImage = "https://img.ophim.live/uploads/movies/";
                }
                const ophimItems = getItems(data).map(item => normalizeOphimItem(item, pathImage));
                items = [...items, ...ophimItems];
            }

            // Source 3: NguonC
            if (nguoncRes.status === 'fulfilled' && nguoncRes.value?.status === 'success') {
                const nguoncItems = ((nguoncRes.value.items || []) as Record<string, unknown>[]).map(normalizeNguoncItem);
                items = [...items, ...nguoncItems];
            }

            // Merge by slug: giữ thứ tự nguồn, lấy bổ sung poster/thumb từ nguồn sau nếu thiếu
            const bySlug = new Map<string, Movie>();
            for (const item of items) {
                if (!item?.slug) continue;
                const existing = bySlug.get(item.slug);
                if (!existing) {
                    bySlug.set(item.slug, item);
                } else {
                    bySlug.set(item.slug, mergeMovieImages(existing, item));
                }
            }
            return Array.from(bySlug.values()).map(normalizeMovieImageRoles);
        };

        const [
            phimMoi, phimLe, phimBo, hoatHinh, tvShows,
            phimChieuRap, phimSapChieu, hanQuoc, trungQuoc,
            hanhDong, tinhCam
        ] = await Promise.all(
            HOME_CATEGORIES.map(c => fetchCategory(c.slug, c.endpoint))
        );

        const data: Record<HomeCacheKey, Movie[]> = {
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
            fetchWithFastTimeout(`${API_URL}/phim/${slug}`, 3000, { next: { revalidate: 180 } }),
            fetchWithFastTimeout(`https://ophim1.com/phim/${slug}`, 2500, { next: { revalidate: 180 } }),
            fetchWithFastTimeout(`${NGUONC_API}/api/film/${slug}`, 2000, { next: { revalidate: 180 } })
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
                const taggedNguoncEpisodes = nguoncEpisodes.map((epGroup: { server_name?: string; items?: { name: string; slug: string; embed: string; m3u8: string }[] }) => ({
                    server_name: `NguonC #${epGroup.server_name || "1"}`,
                    // Convert NguonC format (items) to standard format (server_data)
                    server_data: (epGroup.items || []).map((ep) => ({
                        name: ep.name,
                        slug: ep.slug,
                        filename: ep.name,
                        link_embed: ep.embed || '',
                        link_m3u8: ep.m3u8 || '',
                    })),
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
                    year: toValidYear(data.category?.['3']?.list?.[0]?.name) || 0,
                    actor: data.casts?.split(',') || [],
                    director: data.director?.split(',') || [],
                    category: data.category?.['2']?.list || [],
                    country: data.category?.['4']?.list || [],
                    trailer_url: data.trailer_url || "",
                },
                episodes: (data.episodes || []).map((epGroup: { server_name?: string; items?: { name: string; slug: string; embed: string; m3u8: string }[] }) => ({
                    server_name: `NguonC #${epGroup.server_name || "1"}`,
                    server_data: (epGroup.items || []).map((ep) => ({
                        name: ep.name,
                        slug: ep.slug,
                        filename: ep.name,
                        link_embed: ep.embed || '',
                        link_m3u8: ep.m3u8 || '',
                    })),
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

export const searchMovies = async (keyword: string, options: { enrichTMDB?: boolean; limit?: number } = {}) => {
    try {
        const q = String(keyword || "").trim();
        if (q.length < 2) return [];
        const { enrichTMDB = true, limit = 12 } = options;

        const encoded = encodeURIComponent(q);
        const [kkRes, ophimRes, nguoncRes] = await Promise.allSettled([
            fetchWithFastTimeout(`${API_URL}/v1/api/tim-kiem?keyword=${encoded}&limit=${limit}`, 3000),
            fetchWithFastTimeout(`${OPHIM_API}/v1/api/tim-kiem?keyword=${encoded}&limit=${limit}`, 2500),
            fetchWithFastTimeout(`${NGUONC_API}/api/films/search?keyword=${encoded}`, 2000)
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
                poster_url: (item.poster_url as string) || "",
                year: toValidYear(item.year as string) || 0,
                quality: (item.quality as string) || 'FHD',
            })) as Movie[];
            results = [...results, ...items];
        }

        // Deduplicate + merge images across KKPhim, OPhim, NguonC (ưu tiên thứ tự fetch)
        const bySlug = new Map<string, Movie>();
        for (const item of results as Movie[]) {
            if (!item?.slug) continue;
            const existing = bySlug.get(item.slug);
            if (!existing) {
                bySlug.set(item.slug, item);
            } else {
                bySlug.set(item.slug, mergeMovieImages(existing, item));
            }
        }
        const normalized = Array.from(bySlug.values()).map(normalizeMovieImageRoles);
        if (!enrichTMDB) {
            return normalized;
        }
        return await enrichMoviesWithTMDB(normalized, 20);

    } catch (error) {
        console.error(`Error searching movies [${keyword}]:`, error);
        return [];
    }
};


// Helper to normalize OPhim data to match our Movie interface
const normalizeOphimItem = (item: any, pathImage: string): Movie => {
    const rawThumb = (typeof item.thumb_url === 'string' && item.thumb_url.startsWith('http'))
        ? item.thumb_url
        : combineUrl(pathImage, item.thumb_url as string);
    const rawPoster = (typeof item.poster_url === 'string' && item.poster_url.startsWith('http'))
        ? item.poster_url
        : combineUrl(pathImage, item.poster_url as string);

    // OPhim feed hiện tại: thumb thường là ảnh dọc, poster thường là ảnh ngang.
    // Chuẩn hóa về semantics nội bộ:
    // - poster_url => ảnh dọc cho card portrait
    // - thumb_url  => ảnh ngang cho overlay/backdrop
    const normalizedPoster = rawThumb || rawPoster;
    const normalizedThumb = rawPoster || rawThumb;

    return {
        ...item,
        _id: item._id as string,
        name: item.name as string,
        slug: item.slug as string,
        origin_name: item.origin_name as string,
        thumb_url: normalizedThumb,
        poster_url: normalizedPoster,
        type: (item.type as string) || 'unknown',
        sub_docquyen: !!item.sub_docquyen,
        chieurap: !!item.chieurap,
        time: (item.time as string) || '',
        episode_current: (item.episode_current as string) || '',
        quality: (item.quality as string) || '',
        lang: (item.lang as string) || '',
        year: toValidYear(item.year as number) || 0,
        category: (item.category as { id: string, name: string, slug: string }[]) || [],
        country: (item.country as { id: string, name: string, slug: string }[]) || [],
    } as Movie;
};

export const getMoviesList = async (type: string, params: { page?: number; year?: number; category?: string; country?: string; limit?: number; quality?: string } = {}) => {
    try {
        const { page = 1, year, category, country, limit = 24, quality } = params;
        let query = `?page=${page}&limit=${limit}`;
        if (year) query += `&year=${year}`;
        if (category) query += `&category=${category}`;
        if (country) query += `&country=${country}`;

        // Fetch from BOTH sources in parallel
        const [kkRes, ophimRes, nguoncRes] = await Promise.allSettled([
            fetchWithFastTimeout(`${API_URL}/v1/api/danh-sach/${type}${query}`, 3000, { next: { revalidate: 3600 } }),
            fetchWithFastTimeout(`${OPHIM_API}/v1/api/danh-sach/${type}${query}`, 2500, { next: { revalidate: 3600 } }),
            fetchWithFastTimeout(`${NGUONC_API}/api/films/${type === 'phim-moi-cap-nhat' ? '' : 'danh-sach/'}${type}?page=${page}`, 2000, { next: { revalidate: 3600 } })
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
                poster_url: (item.poster_url as string) || "",
                year: toValidYear(item.year as string) || 0,
                quality: (item.quality as string) || 'FHD',
            })) as Movie[];
            items = [...items, ...nguoncItems];
        }

        // Deduplicate by Slug + merge images theo thứ tự nguồn (KKPhim -> OPhim -> NguonC)
        const bySlug = new Map<string, Movie>();
        for (const item of items) {
            if (!item?.slug) continue;
            const existing = bySlug.get(item.slug);
            if (!existing) {
                bySlug.set(item.slug, item);
            } else {
                bySlug.set(item.slug, mergeMovieImages(existing, item));
            }
        }
        let uniqueItems = Array.from(bySlug.values()).map(normalizeMovieImageRoles);

        // Filter out trailer-only / unreleased movies (unless explicitly browsing that category)
        if (type !== 'phim-sap-chieu') {
            uniqueItems = uniqueItems.filter(item => {
                const ep = (item.episode_current || '').toLowerCase();
                const st = ((item as any).status || '').toLowerCase();
                return !ep.includes('trailer') && !st.includes('trailer');
            });
        }

        // Optional client-side quality filter (e.g. 4K only)
        if (quality) {
            const q = String(quality).toUpperCase();
            uniqueItems = uniqueItems.filter(item =>
                item.quality && String(item.quality).toUpperCase().includes(q)
            );
        }

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
                poster_url: (item.poster_url as string) || "",
                year: toValidYear(item.year as string) || 0,
                quality: (item.quality as string) || 'FHD',
            })) as Movie[];
            items = [...items, ...nguoncItems];
        }

        // Deduplicate + merge images
        const bySlug = new Map<string, Movie>();
        for (const item of items) {
            if (!item?.slug) continue;
            const existing = bySlug.get(item.slug);
            if (!existing) {
                bySlug.set(item.slug, item);
            } else {
                bySlug.set(item.slug, mergeMovieImages(existing, item));
            }
        }

        return {
            items: Array.from(bySlug.values()).map(normalizeMovieImageRoles),
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
                year: toValidYear(item.year as string) || 0,
                quality: (item.quality as string) || 'FHD',
            })) as Movie[];
            items = [...items, ...nguoncItems];
        }

        // Deduplicate + merge images theo thứ tự nguồn (KKPhim -> OPhim -> NguonC)
        const bySlug = new Map<string, Movie>();
        for (const item of items) {
            if (!item?.slug) continue;
            const existing = bySlug.get(item.slug);
            if (!existing) {
                bySlug.set(item.slug, item);
            } else {
                bySlug.set(item.slug, mergeMovieImages(existing, item));
            }
        }
        const uniqueItems = Array.from(bySlug.values()).map(normalizeMovieImageRoles);

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
import { getTMDBTrending, searchTMDBMovie } from "./tmdb";

// Kiểm tra năm TMDB vs phim nguồn có khớp (cùng phim) để dùng ảnh TMDB chất lượng cao
function isSameMovieByYear(tmdbItem: any, movie: Movie): boolean {
    const tmdbYear = tmdbItem.release_date
        ? parseInt(String(tmdbItem.release_date).substring(0, 4), 10)
        : tmdbItem.first_air_date
            ? parseInt(String(tmdbItem.first_air_date).substring(0, 4), 10)
            : null;
    const sourceYear = movie.year ? parseInt(String(movie.year).substring(0, 4), 10) : null;
    if (tmdbYear == null || sourceYear == null) return false;
    return Math.abs(tmdbYear - sourceYear) <= 2;
}

export const getTrendMovies = async (
    type: 'movie' | 'tv' | 'all' = 'all',
    timeWindow: 'day' | 'week' = 'day'
) => {
    try {
        const trendList = await getTMDBTrending(type, timeWindow);

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

        // Filter out nulls and movies that only have a trailer (not yet released)
        return movies.filter((m: any) => {
            if (!m) return false;

            // Lọc bỏ phim chưa ra mắt (chỉ có trailer)
            const status = String(m.status || "").toLowerCase();
            const epCurrent = String(m.episode_current || "").toLowerCase();
            if (status.includes("trailer") || epCurrent.includes("trailer")) return false;

            return true;
        });
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

        const kkCategories = await kkCatRes.json().catch((): any[] => []);
        const kkCountries = await kkCountRes.json().catch((): any[] => []);
        const ophimCountriesData = await ophimCountRes.json().catch((): any => null);
        const ophimCountries = ophimCountriesData?.data?.items || [];

        // Deduplicate functions
        const uniqueBySlug = (arr: { slug?: string, name?: string }[]): any[] => {
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
        const normalizeStr = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

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
                    .then(r => r.json()).catch((): any => null),
                fetch(`${OPHIM_API}/v1/api/tim-kiem?keyword=${keyword}&limit=100`, { next: { revalidate: 3600 } })
                    .then(r => r.json()).catch((): any => null),
            ];
        });

        // Phase 3: Also search KKPhim for top TMDB credit titles (limited batch)
        const creditSearchPromises = tmdbCreditTitles.slice(0, 10).map(title => {
            const keyword = encodeURIComponent(title);
            return fetch(`${API_URL}/v1/api/tim-kiem?keyword=${keyword}&limit=10`, { next: { revalidate: 3600 } })
                .then(r => r.json()).catch((): any => null);
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

        // Fallback: some API search responses omit actor lists, causing false "0 phim".
        // If strict matching finds nothing, verify candidates via movie detail actor credits.
        if (items.length === 0) {
            const fallbackSearches = await Promise.all(
                searchNames.slice(0, 3).map(name => searchMovies(name))
            );

            const fallbackCandidates = Array.from(
                new Map(
                    fallbackSearches
                        .flat()
                        .filter((m: any) => m?.slug)
                        .map((m: any) => [m.slug, m])
                ).values()
            ).slice(0, 40);

            const verified = await Promise.all(
                fallbackCandidates.map(async (candidate: any) => {
                    try {
                        const detail = await getMovieDetail(candidate.slug);
                        const movieDetail: any = detail?.movie;
                        if (!movieDetail) return null;

                        const detailActors: string[] = Array.isArray(movieDetail.actor) ? movieDetail.actor : [];
                        const hasActor = searchNames.some(name => {
                            const searchNorm = normalizeStr(name);
                            return detailActors.some((a: string) => {
                                const actorNorm = normalizeStr(a || "");
                                return actorNorm.includes(searchNorm) || searchNorm.includes(actorNorm);
                            });
                        });

                        if (!hasActor) return null;

                        return {
                            ...candidate,
                            actor: movieDetail.actor || candidate.actor || [],
                            director: movieDetail.director || candidate.director || [],
                            category: movieDetail.category || candidate.category || [],
                            country: movieDetail.country || candidate.country || [],
                            quality: movieDetail.quality || candidate.quality || 'HD',
                            episode_current: movieDetail.episode_current || candidate.episode_current || '',
                            episode_total: movieDetail.episode_total || candidate.episode_total || '',
                            year: movieDetail.year || candidate.year,
                        };
                    } catch {
                        return null;
                    }
                })
            );

            verified.filter(Boolean).forEach((movie: any) => {
                if (movie?.slug && !seen.has(movie.slug)) {
                    seen.add(movie.slug);
                    items.push(movie);
                }
            });
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
