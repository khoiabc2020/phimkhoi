export const API_URL = "https://phimapi.com";

export interface Category {
    id?: string;
    name: string;
    slug: string;
}

export interface Country {
    id?: string;
    name: string;
    slug: string;
}

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

/** Decode HTML entities like &#039; => ' that come from the upstream API */
const decodeHtmlEntities = (str: string): string => {
    if (!str || !str.includes('&')) return str;
    return str
        .replace(/&#039;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
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
        origin_name: decodeHtmlEntities((item.original_name as string) || name),
        content: "",
        type: (item.type as string) || "single",
        status: "",
        // NguonC: thumb_url is vertical (portrait), poster_url is horizontal (landscape/backdrop).
        // Align with our internal semantics:
        poster_url: (item.thumb_url as string) || "", 
        thumb_url: (item.poster_url as string) || "",
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
        view: undefined as any,
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

/** 
 * Elite Content Purity Engine: Detects if a movie is just a trailer/teaser 
 * based on episode labels and status.
 */
export const isTrailer = (movie: Movie): boolean => {
    if (!movie) return true;
    const current = String(movie.episode_current || "").toLowerCase();
    const name = String(movie.name || "").toLowerCase();
    const originName = String(movie.origin_name || "").toLowerCase();
    const notify = String(movie.notify || "").toLowerCase();
    const quality = String(movie.quality || "").toLowerCase();
    const status = String(movie.status || "").toLowerCase();

    // 1. Common trailer markers in major fields
    const trailerMarkers = ["trailer", "teaser", "preview", "nhá hàng", "sắp chiếu", "coming soon"];
    
    if (trailerMarkers.some(m => current.includes(m))) return true;
    if (trailerMarkers.some(m => name.includes(m))) return true;
    if (trailerMarkers.some(m => originName.includes(m))) return true;
    if (trailerMarkers.some(m => notify.includes(m))) return true;
    if (trailerMarkers.some(m => quality.includes(m))) return true;
    if (trailerMarkers.some(m => status.includes(m))) return true;

    // 2. Check category array — highly reliable
    if (Array.isArray(movie.category)) {
        for (const cat of movie.category) {
            const catSlug = String(cat?.slug || "").toLowerCase();
            const catName = String(cat?.name || "").toLowerCase();
            if (catSlug.includes("trailer") || catName.includes("trailer")) return true;
        }
    }

    // 3. Special case: if episode_current is just a number but status is specifically "trailer"
    if (status === "trailer") return true;

    return false;
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
        
        const isNguonc = u.includes("nguonc.com") || u.includes("streamc.xyz") || u.includes("phimmoi.net") || u.includes("1080.com.vn") || u.includes("nguonc.top");
        const isOphim = u.includes("img.ophim.live") || u.includes("phimimg.com") || u.includes("img.ophim1.com");
        const isStandard = u.includes("tmdb.org") || u.includes("phimapi.com") || u.includes("cloudinary") || u.includes("img.phimapi.com");

        if (isOphim || isNguonc) {
            // OPhim/NguonC "thumb" is portrait, "poster" is landscape.
            if (u.includes("-thumb.") || u.includes("/thumb-") || u.endsWith("/thumb.jpg") || u.endsWith("/thumb.png")) return "portrait";
            if (u.includes("-poster.") || u.includes("/poster-") || u.endsWith("/poster.jpg") || u.endsWith("/poster.png")) return "landscape";
            // NguonC specific horizontal suffixes
            if (isNguonc && (u.includes("-1.") || u.includes("-2.") || u.includes("-backdrop") || u.includes("-banner"))) return "landscape";
        } else if (isStandard) {
            // Standard (TMDB/KKPhim): poster is portrait, backdrop/thumb is landscape
            if (u.includes("poster") || u.includes("w500") || u.includes("w780") || u.includes("w300")) return "portrait";
            if (u.includes("backdrop") || u.includes("thumb") || u.includes("w1280") || u.includes("original")) return "landscape";
        }

        // Generic patterns
        if (u.includes("backdrop") || u.includes("banner") || u.includes("landscape") || u.includes("horizontal") || u.includes("/thumb/")) return "landscape";
        if (u.includes("poster-vertical") || u.includes("portrait") || u.includes("vertical") || u.includes("/poster/")) return "portrait";
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

    // Enforce semantics strictly:
    // - poster_url: MUST be portrait if possible
    // - thumb_url: MUST be landscape if possible

    let portrait = pickPortrait([merged.poster_url, candidate.poster_url, merged.thumb_url, candidate.thumb_url]);
    let landscape = pickLandscape([merged.thumb_url, candidate.thumb_url, merged.poster_url, candidate.poster_url]);

    // If we have a portrait image but it's empty, or vice versa, fallback to first non-empty
    if (!portrait) portrait = pickFirstNonEmpty([merged.poster_url, candidate.poster_url, merged.thumb_url, candidate.thumb_url]);
    if (!landscape) landscape = pickFirstNonEmpty([merged.thumb_url, candidate.thumb_url, merged.poster_url, candidate.poster_url]);

    // Final Force-Swap: If poster looks like landscape and thumb looks like portrait, SWAP THEM.
    if (looksLandscape(portrait) && looksPortrait(landscape)) {
        const tmp = portrait;
        portrait = landscape;
        landscape = tmp;
    }

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
    
    const detectOrientation = (v?: string): "portrait" | "landscape" | "unknown" => {
        const u = toLower(v);
        if (!u) return "unknown";
        
        // 1. Check for explicit vertical/horizontal tokens
        if (u.includes("poster-vertical") || u.includes("portrait") || u.includes("vertical") || u.includes("/poster/")) return "portrait";
        if (u.includes("backdrop") || u.includes("banner") || u.includes("landscape") || u.includes("horizontal") || u.includes("/thumb/")) return "landscape";
        
        // 2. Ophim/NguonC/PhimImg specific logic (very common in this project)
        // - "thumb" in Ophim/NguonC is usually vertical (portrait)
        // - "poster" in Ophim/NguonC is usually horizontal (landscape)
        const isCommonSource = u.includes("img.ophim") || u.includes("phimimg.com") || u.includes("nguonc.com") || u.includes("streamc.xyz");
        if (isCommonSource) {
            if (u.includes("-thumb.") || u.includes("/thumb-") || u.endsWith("/thumb.jpg") || u.endsWith("/thumb.png")) return "portrait";
            if (u.includes("-poster.") || u.includes("/poster-") || u.endsWith("/poster.jpg") || u.endsWith("/poster.png")) return "landscape";
            // NguonC numbered backdrop patterns
            if (u.includes("-1.") || u.includes("-2.") || u.includes("-backdrop") || u.includes("-banner")) return "landscape";
        }

        // 3. TMDB patterns
        if (u.includes("tmdb.org")) {
            if (u.includes("/p/original/") || u.includes("backdrop")) return "landscape";
            return "portrait"; // default TMDB images are posters
        }

        // 4. Dimension check from URL (e.g., ..._300x450.jpg)
        const m = u.match(/(\d{2,4})x(\d{2,4})/);
        if (m) {
            const w = parseInt(m[1], 10);
            const h = parseInt(m[2], 10);
            if (h > w * 1.2) return "portrait";
            if (w > h * 1.2) return "landscape";
        }

        return "unknown";
    };

    const p = movie.poster_url;
    const t = movie.thumb_url;
    
    const pOrient = detectOrientation(p);
    const tOrient = detectOrientation(t);

    // DANGEROUS CASE: Poster is landscape and Thumb is portrait -> MUST SWAP
    if (pOrient === "landscape" && tOrient === "portrait") {
        return { ...movie, poster_url: t, thumb_url: p };
    }
    
    // CASE: Poster is landscape but Thumb is unknown -> Swap if Thumb exists
    if (pOrient === "landscape" && !isEmpty(t) && tOrient === "unknown") {
        return { ...movie, poster_url: t, thumb_url: p };
    }

    return movie;
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

    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    if (isBuildPhase) return movies; // Skip heavy enrichment during static generation to avoid build timeouts

    const limit = Math.max(0, Math.min(maxItems, movies.length));
    const head = movies.slice(0, limit);
    const tail = movies.slice(limit);

    const enrichedResults: Movie[] = [];
    
    // Split into batches of 5 to avoid connection saturation
    const BATCH_SIZE = 5;
    for (let i = 0; i < head.length; i += BATCH_SIZE) {
        const batch = head.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(async (movie) => {
            const controller = new AbortController();
            const sid = setTimeout(() => controller.abort(), 2500); // Strict 2.5s per item
            
            try {
                const query = movie.origin_name || movie.name;
                if (!query) return movie;
                const tmdb = await searchTMDBMovie(
                    query,
                    toValidYear(movie.year),
                    inferTmdbType(movie),
                    { originalName: movie.origin_name, localName: movie.name, countrySlug: movie.country?.[0]?.slug }
                );
                clearTimeout(sid);
                if (!tmdb) return movie;

                const tmdbYear = toValidYear((tmdb as any).release_date || (tmdb as any).first_air_date);
                const tmdbPoster = (tmdb as any).poster_path ? `https://image.tmdb.org/t/p/w780${(tmdb as any).poster_path}` : "";
                const tmdbBackdrop = (tmdb as any).backdrop_path ? `https://image.tmdb.org/t/p/original${(tmdb as any).backdrop_path}` : "";

                return normalizeMovieImageRoles({
                    ...movie,
                    year: tmdbYear || movie.year || 0,
                    poster_url: tmdbPoster || movie.poster_url,
                    thumb_url: tmdbBackdrop || movie.thumb_url,
                    tmdbData: {
                        vote_average: (tmdb as any).vote_average,
                        poster_path: (tmdb as any).poster_path,
                        backdrop_path: (tmdb as any).backdrop_path,
                    },
                } as Movie);
            } catch {
                clearTimeout(sid);
                return movie;
            }
        }));
        enrichedResults.push(...batchResults);
    }

    return [...enrichedResults, ...tail];
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
    { key: 'hoatHinh', slug: 'hoat-hinh', endpoint: 'the-loai' }, // specific category
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
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    console.log(`[getHomeData] NEXT_PHASE: ${process.env.NEXT_PHASE}, isBuildPhase: ${isBuildPhase}`);
    if (isBuildPhase) {
        return {
            phimMoi: [], phimLe: [], phimBo: [], hoatHinh: [],
            tvShows: [], phimChieuRap: [], phimSapChieu: [],
            hanQuoc: [], trungQuoc: [], hanhDong: [], tinhCam: [],
        };
    }
    // Cache tạm thời ngắn để USER thấy rõ thay đổi
    const CACHE_TTL_MS = 10 * 1000; 
    if (homeCache && Date.now() - homeCacheTime < CACHE_TTL_MS) {
        return homeCache;
    }

    try {
        const fetchCategory = async (slug: string, endpoint: 'danh-sach' | 'the-loai' | 'quoc-gia' = 'danh-sach') => {
            console.log(`[BuildDiag] fetchCategory start: ${slug} (${endpoint})`);
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
            const normalized = Array.from(bySlug.values()).map(normalizeMovieImageRoles).filter(m => !isTrailer(m));
            // Enrich with TMDB images for "Elite" home page quality (Tăng giới hạn lên 24 phim)
            return await enrichMoviesWithTMDB(normalized, 24);
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
                    server_name: epGroup.server_name ? (epGroup.server_name.includes("NguonC") ? epGroup.server_name : `NguonC ${epGroup.server_name.startsWith('#') ? epGroup.server_name : `#${epGroup.server_name}`}`) : "NguonC",
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
            if (combinedData.movie) {
                combinedData.movie = normalizeMovieImageRoles(combinedData.movie as Movie);
            }
            return combinedData;
        }

        // What if KK and Ophim failed but NguonC succeeded?
        if (nguoncRes.status === 'fulfilled' && nguoncRes.value?.status === 'success') {
            const data = nguoncRes.value.movie;
            return {
                status: true,
                movie: normalizeMovieImageRoles({
                    _id: data.id || data.slug,
                    name: decodeHtmlEntities(data.name || ""),
                    slug: data.slug,
                    origin_name: decodeHtmlEntities(data.original_name || ""),
                    content: data.description,
                    type: data.type === 'single' ? 'single' : 'series',
                    status: data.current_episode,
                    // NguonC: thumb is vertical, poster is horizontal
                    poster_url: data.thumb_url,
                    thumb_url: data.poster_url,
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
                } as Movie),
                episodes: (data.episodes || []).map((epGroup: { server_name?: string; items?: { name: string; slug: string; embed: string; m3u8: string }[] }) => ({
                    server_name: epGroup.server_name ? (epGroup.server_name.includes("NguonC") ? epGroup.server_name : `NguonC ${epGroup.server_name.startsWith('#') ? epGroup.server_name : `#${epGroup.server_name}`}`) : "NguonC",
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
    console.log(`[BuildDiag] searchMovies start: ${keyword}`);
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
                // NguonC: thumb is vertical, poster is horizontal
                poster_url: item.thumb_url as string,
                thumb_url: (item.poster_url as string) || "",
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
        const normalized = Array.from(bySlug.values()).map(normalizeMovieImageRoles).filter(m => !isTrailer(m));
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
        name: decodeHtmlEntities(item.name as string || ""),
        slug: item.slug as string,
        origin_name: decodeHtmlEntities(item.origin_name as string || ""),
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
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    if (isBuildPhase) return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    try {
        const { page = 1, year, category, country, limit = 49, quality } = params;
        let query = `?page=${page}&limit=${limit}`;
        if (year) query += `&year=${year}`;
        if (category) query += `&category=${category}`;
        if (country) query += `&country=${country}`;

        // Determine the correct endpoint based on params or type
        let baseEndpoint = 'danh-sach';
        if (params.category || [
            'phim-chieu-rap', 'hanh-dong', 'tinh-cam', 'hai-huoc', 'co-trang', 'tam-ly', 
            'hinh-su', 'chien-tranh', 'vien-tuong', 'kinh-di', 'tai-lieu', 'bi-an', 
            'hoc-duong', 'khoa-hoc', 'than-thoai', 'vo-thuat', 'gia-dinh', 'phim-18'
        ].includes(type) || type.startsWith('phim-')) {
            baseEndpoint = 'the-loai';
        }
        
        if (params.country || ['han-quoc', 'trung-quoc', 'au-my', 'nhat-ban', 'thai-lan', 'dai-loan', 'viet-nam'].includes(type)) {
            if (!params.category) baseEndpoint = 'quoc-gia';
        }

        // --- SOURCE-SPECIFIC SLUG TRANSLATION ---
        // 'phim-moi-cap-nhat' is a special case. NguonC uses it as is, but KK/OPhim use 'phim-moi'
        const kkType = type === 'phim-moi-cap-nhat' ? 'phim-moi' : type;
        const ophimType = type === 'phim-moi-cap-nhat' ? 'phim-moi' : type;
        
        const kkEndpoint = baseEndpoint;
        const nguoncEndpoint = baseEndpoint + '/';

        // 1. [Elite Choice] Try local Database-First API
        try {
            const localUrl = `/api/movies/list?type=list&slug=${kkType}&${query}`;
            const localRes = await fetch(localUrl, { next: { revalidate: 300 } });
            if (localRes.ok) {
                const localData = await localRes.json();
                if (localData.items?.length > 0 && !localData.fallback) {
                    return localData;
                }
            }
        } catch (e) { /* Fallback to external */ }

        // 2. Fallback: Fetch from sources in parallel
        const [kkRes, ophimRes, nguoncRes] = await Promise.allSettled([
            fetchWithFastTimeout(`${API_URL}/v1/api/${kkEndpoint}/${kkType}${query}`, 3000, { next: { revalidate: 3600 } }),
            fetchWithFastTimeout(`${OPHIM_API}/v1/api/${kkEndpoint}/${ophimType}${query}`, 2500, { next: { revalidate: 3600 } }),
            fetchWithFastTimeout(`${NGUONC_API}/api/films/${type === 'phim-moi-cap-nhat' ? '' : nguoncEndpoint}${type}?page=${page}`, 2500, { next: { revalidate: 3600 } })
        ]);

        let items: Movie[] = [];
        let kkPagination = { currentPage: 1, totalPages: 1 };
        let hasData = false;

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
            hasData = true;
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
            hasData = true;
        }

        if (nguoncRes.status === 'fulfilled' && nguoncRes.value?.status === 'success') {
            const nguoncItems = (nguoncRes.value.items || []).map((item: Record<string, unknown>) => ({
                _id: (item.id || item.slug) as string,
                name: decodeHtmlEntities(item.name as string || ""),
                slug: item.slug as string,
                origin_name: decodeHtmlEntities((item.original_name || item.name) as string || ""),
                thumb_url: item.thumb_url as string,
                poster_url: (item.poster_url as string) || "",
                year: toValidYear(item.year as string) || 0,
                quality: (item.quality as string) || 'FHD',
            })) as Movie[];
            items = [...items, ...nguoncItems];
            
            // If KKPhim is empty, use NguonC pagination
            if (!hasData && nguoncRes.value.paginate) {
                kkPagination = {
                    currentPage: nguoncRes.value.paginate.current_page || page,
                    totalPages: nguoncRes.value.paginate.total_page || 1
                };
            }
            hasData = true;
        }

        // Deduplicate and filter...
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

        if (type !== 'phim-sap-chieu') {
            uniqueItems = uniqueItems.filter(item => !isTrailer(item));
        }

        if (quality) {
            const q = String(quality).toUpperCase();
            uniqueItems = uniqueItems.filter(item =>
                item.quality && String(item.quality).toUpperCase().includes(q)
            );
        }

        // Lift limit to support full list view breadth
        const enrichedItems = await enrichMoviesWithTMDB(uniqueItems, limit);

        return {
            items: enrichedItems,
            pagination: kkPagination
        };
    } catch (error) {
        console.error(`Error fetching movies list [${type}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }
};

export const getMoviesByCategory = async (slug: string, page: number = 1, limit: number = 49, options?: { country?: string; year?: string | number }) => {
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    if (isBuildPhase) return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    try {
        const country = options?.country && options.country !== 'all' ? options.country : '';
        const year = options?.year && options.year !== 'all' ? options.year : '';

        // Construct query params
        let queryStr = `page=${page}&limit=${limit}`;
        if (country) queryStr += `&country=${country}`;
        if (year) queryStr += `&year=${year}`;

        // 1. [Elite Choice] Try local Database-First API
        try {
            const localUrl = `/api/movies/list?type=category&slug=${slug}&${queryStr}`;
            const localRes = await fetch(localUrl, { next: { revalidate: 300 } });
            if (localRes.ok) {
                const localData = await localRes.json();
                if (localData.items?.length > 0 && !localData.fallback) {
                    return localData;
                }
            }
        } catch (e) { /* Fallback to external */ }

        // 2. Fallback: Hybrid fetch for categories
        const [kkRes, ophimRes, nguoncRes] = await Promise.allSettled([
            fetch(`${API_URL}/v1/api/the-loai/${slug}?${queryStr}`, { next: { revalidate: 3600 } }).then(r => r.json()),
            fetch(`${OPHIM_API}/v1/api/the-loai/${slug}?${queryStr}`, { next: { revalidate: 3600 } }).then(r => r.json()),
            fetch(`${NGUONC_API}/api/films/the-loai/${slug}?page=${page}${country ? `&country=${country}` : ''}`, { next: { revalidate: 3600 } }).then(r => r.json())
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

        let uniqueItems = Array.from(bySlug.values()).map(normalizeMovieImageRoles);
        // Enrich with TMDB images (Tăng lên 24 phim để đảm bảo cả Hero và Row đều nét)
        const enrichedItems = await enrichMoviesWithTMDB(uniqueItems, 24);

        // Global Trailer Cleanse for categories
        const playable = enrichedItems.filter(item => !isTrailer(item));

        return {
            items: playable,
            pagination: kkPagination
        };
    } catch (error) {
        console.error(`Error fetching category [${slug}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }
};

export const getMoviesByCountry = async (slug: string, page: number = 1, limit: number = 49, options?: { category?: string; year?: string | number }) => {
    try {
        const category = options?.category && options.category !== 'all' ? options.category : '';
        const year = options?.year && options.year !== 'all' ? options.year : '';

        // Construct query params
        let queryStr = `page=${page}&limit=${limit}`;
        if (category) queryStr += `&category=${category}`;
        if (year) queryStr += `&year=${year}`;

        // 1. [Elite Choice] Try local Database-First API
        try {
            const localUrl = `/api/movies/list?type=country&slug=${slug}&${queryStr}`;
            const localRes = await fetch(localUrl, { next: { revalidate: 300 } });
            if (localRes.ok) {
                const localData = await localRes.json();
                if (localData.items?.length > 0 && !localData.fallback) {
                    return localData;
                }
            }
        } catch (e) { /* Fallback to external */ }

        // 2. Fallback: External APIs
        const [kkRes, ophimRes, nguoncRes] = await Promise.allSettled([
            fetch(`${API_URL}/v1/api/quoc-gia/${slug}?${queryStr}`, { next: { revalidate: 3600 } }).then(r => r.json()),
            fetch(`${OPHIM_API}/v1/api/quoc-gia/${slug}?${queryStr}`, { next: { revalidate: 3600 } }).then(r => r.json()),
            fetch(`${NGUONC_API}/api/films/quoc-gia/${slug}?page=${page}${category ? `&category=${category}` : ''}`, { next: { revalidate: 3600 } }).then(r => r.json())
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
            const nguoncItems = (nguoncRes.value.items || []).map((item: Record<string, unknown>) => normalizeNguoncItem(item));
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
        // Enrich with TMDB images (Tăng lên 24 phim để đảm bảo cả Hero và Row đều nét)
        const enrichedItems = await enrichMoviesWithTMDB(uniqueItems, 24);

        // Global Trailer Cleanse for countries
        const playable = enrichedItems.filter(item => !isTrailer(item));

        return {
            items: playable,
            pagination: kkPagination
        };
    } catch (error) {
        console.error(`Error fetching country [${slug}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }
};


export const getMoviesByCountryAndCategory = async (countrySlug: string, categorySlug: string, limit: number = 24) => {
    try {
        const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
        if (isBuildPhase) return { items: [], pagination: { currentPage: 1, totalPages: 1 } };

        // 1. Expand slugs for broad matching
        const categorySlugs = categorySlug === "co-trang"
            ? ["co-trang", "co-dai", "than-thoai", "vo-thuat", "lich-su", "kiem-hiep"]
            : [categorySlug];

        // 2. [FAST SCAN] Check the first 100 movies in this country
        const countryData = await getMoviesByCountry(countrySlug, 1, 100).catch(() => ({ items: [] }));
        const allMovies = countryData?.items || [];

        let matched = allMovies.filter((m: Movie) =>
            categorySlug === 'all' ||
            m.category?.some((cat: any) => categorySlugs.includes(cat.slug))
        );

        // 3. [DEEP FETCH] If scan is shallow, fetch directly from category API and filter by country
        if (matched.length < 8 && categorySlug !== 'all') {
            const catFetch = await getMoviesByCategory(categorySlug, 1, 100).catch(() => ({ items: [] }));
            
            const countryIdentifier = countrySlug.toLowerCase().replace(/-/g, ' ');

            const fromCat = (catFetch?.items || []).filter((m: Movie) => {
                const isAlreadyInMatched = matched.find((x: Movie) => x.slug === m.slug);
                if (isAlreadyInMatched) return false;

                const matchesCountry = !m.country || m.country.length === 0 || 
                    m.country.some((c: any) => 
                        String(c.slug || "").toLowerCase() === countrySlug || 
                        String(c.name || "").toLowerCase().includes(countryIdentifier)
                    );
                return matchesCountry;
            });
            matched = [...matched, ...fromCat];
        }

        // 4. [FINAL FALLBACK] If still empty, JUST TAKE ANY MOVIES from that country
        // This prevents "OPS!" or black sections when the specific category is sparse
        if (matched.length === 0) {
            matched = allMovies.slice(0, 16);
        }

        // If STILL empty, try a broad fetch from the country list
        if (matched.length === 0) {
            const broad = await getMoviesByCountry(countrySlug, 1, 24).catch(() => ({ items: [] }));
            matched = broad.items || [];
        }

        const filtered = matched.filter((m: Movie) => m && !isTrailer(m)).slice(0, limit);
        const normalized = filtered.map(normalizeMovieImageRoles);

        return { items: normalized, pagination: { currentPage: 1, totalPages: 1 } };
    } catch (error) {
        console.error(`Error filtering country [${countrySlug}] by category [${categorySlug}]:`, error);
        // ABSOLUTE FALLBACK to prevent "OPS!"
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
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    if (isBuildPhase) return [];

    try {
        const trendList = await getTMDBTrending(type, timeWindow);

        if (!trendList || trendList.length === 0) {
            return [];
        }

        const movies = await Promise.all(trendList.slice(0, 15).map(async (tmdbItem: any) => {
            const query = tmdbItem.original_name || tmdbItem.original_title || tmdbItem.name || tmdbItem.title;
            const searchResults = await searchMovies(query, { enrichTMDB: false }); 

            if (searchResults && searchResults.length > 0 && searchResults[0]) {
                const movie = searchResults[0];
                const useTmdbImages = isSameMovieByYear(tmdbItem, movie);

                return {
                    ...movie,
                    vote_average: tmdbItem.vote_average,
                    tmdb_id: tmdbItem.id,
                    poster_url: useTmdbImages && tmdbItem.poster_path
                        ? `https://image.tmdb.org/t/p/w500${tmdbItem.poster_path}`
                        : (movie.poster_url || movie.thumb_url || ""),
                    thumb_url: useTmdbImages && tmdbItem.backdrop_path
                        ? `https://image.tmdb.org/t/p/original${tmdbItem.backdrop_path}`
                        : (movie.thumb_url || movie.poster_url || ""),
                    tmdbData: {
                        vote_average: tmdbItem.vote_average,
                        poster_path: tmdbItem.poster_path,
                        backdrop_path: tmdbItem.backdrop_path
                    }
                };
            }
            return null;
        }));

        return movies.filter((m: any) => {
            if (!m) return false;
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

export const getMenuData = async (): Promise<{ categories: Category[], countries: Country[] }> => {
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    if (isBuildPhase) {
        return {
            categories: [
                { name: "Hành Động", slug: "hanh-dong" },
                { name: "Tình Cảm", slug: "tinh-cam" }
            ],
            countries: [
                { name: "Trung Quốc", slug: "trung-quoc" },
                { name: "Hàn Quốc", slug: "han-quoc" }
            ]
        };
    }
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
            categories: (Array.isArray(kkCategories) ? kkCategories : [])
                .filter(c => c.slug !== 'phim-18')
                .map(c => ({ ...c, name: cleanName(c.name) })),
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
