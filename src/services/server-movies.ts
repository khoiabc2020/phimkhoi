import "server-only";

import dbConnect from "@/lib/db";
import MovieModel from "@/models/Movie";
import { getMoviesByCategory, getMoviesByCountry, getMoviesList, type Movie } from "@/services/api";
import { isAdultMovie, sanitizeMovieList } from "@/lib/movie-list";
import { matchesCountryForDisplay } from "@/lib/movie-country";

const CATEGORY_SLUGS = new Set([
    "hanh-dong", "tinh-cam", "hai-huoc", "co-trang", "tam-ly", "hinh-su",
    "kinh-di", "hoat-hinh", "vo-thuat", "than-thoai", "lich-su", "phieu-luu",
    "vien-tuong", "bi-an", "gia-dinh", "am-nhac", "hoc-duong", "chien-tranh",
]);

const COUNTRY_SLUGS = new Set([
    "han-quoc", "trung-quoc", "nhat-ban", "thai-lan", "au-my", "viet-nam", "dai-loan",
]);

const isTrailerLike = (movie: Partial<Movie> | null | undefined) => {
    if (!movie) return true;
    const markers = ["trailer", "teaser", "preview", "nhá hàng", "sắp chiếu", "coming soon"];
    const haystacks = [
        String(movie.name || "").toLowerCase(),
        String(movie.status || "").toLowerCase(),
        String(movie.episode_current || "").toLowerCase(),
        String(movie.notify || "").toLowerCase(),
        String(movie.quality || "").toLowerCase(),
    ];
    return markers.some((marker) => haystacks.some((text) => text.includes(marker)));
};

const dedupeMovies = (movies: Movie[], limit: number) => {
    return sanitizeMovieList(
        movies.filter((movie) => !isTrailerLike(movie) && !isAdultMovie(movie)),
        { limit }
    );
};

const filterDisplayCountryMovies = (movies: Movie[], countrySlug?: string) =>
    countrySlug ? movies.filter((movie) => matchesCountryForDisplay(movie, countrySlug)) : movies;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
    let timer: NodeJS.Timeout | null = null;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((resolve) => {
                timer = setTimeout(() => resolve(fallback), timeoutMs);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
};

async function getRecentMoviesFromDb(query: Record<string, unknown>, limit: number) {
    try {
        await dbConnect();
        const movies = await MovieModel.find(query)
            .sort({ updatedAt: -1, lastSynced: -1 })
            .limit(limit)
            .lean();
        return movies as unknown as Movie[];
    } catch (error) {
        console.warn("[MovieFallback] Local DB fallback failed:", error);
        return [];
    }
}

export async function getLocalFallbackDisplayMovies({
    type,
    limit = 12,
    options = {},
}: {
    type: string;
    limit?: number;
    options?: { category?: string; country?: string; year?: string | number };
}): Promise<Movie[]> {
    const safeLimit = Math.max(1, Math.min(limit, 24));
    const pools: Movie[][] = [];
    const exactCategory = options.category && options.category !== "all" ? options.category : undefined;
    const exactCountry = options.country && options.country !== "all" ? options.country : undefined;
    const inferredCategory = !exactCategory && CATEGORY_SLUGS.has(type) ? type : undefined;
    const inferredCountry = !exactCountry && COUNTRY_SLUGS.has(type) ? type : undefined;
    const activeCategory = exactCategory || inferredCategory;
    const activeCountry = exactCountry || inferredCountry;
    const isCinemaList = type === "phim-chieu-rap";

    if (activeCategory || activeCountry) {
        const dbQuery: Record<string, unknown> = {};
        if (activeCategory) dbQuery["category.slug"] = activeCategory;
        if (activeCountry) dbQuery["country.slug"] = activeCountry;

        const exactDb = await getRecentMoviesFromDb(dbQuery, safeLimit * 3);
        if (exactDb.length > 0) pools.push(exactDb);
    }

    if (isCinemaList) {
        const cinemaDb = await getRecentMoviesFromDb({ chieurap: true }, safeLimit * 4);
        if (cinemaDb.length > 0) pools.push(cinemaDb);
    }

    if (activeCountry && pools.flat().length < safeLimit) {
        const broadCountryDb = await getRecentMoviesFromDb({ "country.slug": activeCountry }, safeLimit * 3);
        if (broadCountryDb.length > 0) pools.push(broadCountryDb);
    }

    if (activeCategory && pools.flat().length < safeLimit) {
        const broadCategoryDb = await getRecentMoviesFromDb({ "category.slug": activeCategory }, safeLimit * 3);
        if (broadCategoryDb.length > 0) pools.push(broadCategoryDb);
    }

    return dedupeMovies(filterDisplayCountryMovies(pools.flat(), activeCountry), safeLimit);
}

export async function syncMoviesToLocalCache(movies: Movie[]) {
    if (!Array.isArray(movies) || movies.length === 0) return;

    try {
        await dbConnect();

        const ops = movies
            .filter((movie) => movie?.slug)
            .slice(0, 120)
            .map((movie) => ({
                updateOne: {
                    filter: { slug: movie.slug },
                    update: {
                        $set: {
                            name: movie.name || "",
                            origin_name: movie.origin_name || "",
                            slug: movie.slug,
                            type: movie.type || "",
                            status: movie.status || "",
                            content: movie.content || "",
                            thumb_url: movie.thumb_url || "",
                            poster_url: movie.poster_url || "",
                            chieurap: Boolean(movie.chieurap),
                            quality: movie.quality || "",
                            lang: movie.lang || "",
                            year: Number(movie.year) || 0,
                            episode_current: movie.episode_current || "",
                            episode_total: movie.episode_total || "",
                            category: Array.isArray(movie.category) ? movie.category : [],
                            country: Array.isArray(movie.country) ? movie.country : [],
                            tmdbData: movie.tmdbData || null,
                            updatedAt: new Date(),
                        },
                        $setOnInsert: {
                            _id: String(movie._id || movie.slug),
                            episodes: [] as Movie["episodes"],
                        },
                    },
                    upsert: true,
                },
            }));

        if (ops.length === 0) return;
        await MovieModel.bulkWrite(ops, { ordered: false });
    } catch (error) {
        console.warn("[MovieSync] Failed to sync list movies into local cache:", error);
    }
}

export async function getRelatedMoviesForMovie({
    categorySlug,
    currentMovieSlug,
    countrySlug,
    limit = 10,
}: {
    categorySlug?: string;
    currentMovieSlug: string;
    countrySlug?: string;
    limit?: number;
}): Promise<Movie[]> {
    const safeLimit = Math.max(1, Math.min(limit, 24));
    const merged = new Map<string, Movie>();

    const pushMovies = (movies: Movie[]) => {
        movies.forEach((movie) => {
            if (!movie?.slug || movie.slug === currentMovieSlug || merged.has(movie.slug)) return;
            merged.set(movie.slug, movie);
        });
    };

    try {
        if (categorySlug || countrySlug) {
            await dbConnect();

            const dbQuery: Record<string, unknown> = {
                slug: { $ne: currentMovieSlug },
            };

            if (categorySlug) dbQuery["category.slug"] = categorySlug;
            if (countrySlug) dbQuery["country.slug"] = countrySlug;

            const dbMovies = await MovieModel.find(dbQuery)
                .sort({ updatedAt: -1, lastSynced: -1 })
                .limit(safeLimit * 2)
                .lean();

            pushMovies(dbMovies as unknown as Movie[]);
        }
    } catch (error) {
        console.warn("[RelatedMovies] Local cache lookup failed:", error);
    }

    if (merged.size < safeLimit && categorySlug) {
        const categoryData = await getMoviesByCategory(categorySlug, 1, Math.max(24, safeLimit * 2)).catch(() => ({ items: [] as Movie[] }));
        const categoryMovies = (categoryData.items || []).filter((movie: Movie) => movie.slug !== currentMovieSlug);
        pushMovies(categoryMovies);
        syncMoviesToLocalCache(categoryMovies).catch(() => {});
    }

    if (merged.size < safeLimit && countrySlug) {
        const countryData = await getMoviesByCountry(countrySlug, 1, Math.max(24, safeLimit * 2), categorySlug ? { category: categorySlug } : undefined)
            .catch(() => ({ items: [] as Movie[] }));
        const countryMovies = (countryData.items || []).filter((movie: Movie) => movie.slug !== currentMovieSlug);
        pushMovies(countryMovies);
        syncMoviesToLocalCache(countryMovies).catch(() => {});
    }

    return Array.from(merged.values()).slice(0, safeLimit);
}

export async function getFallbackDisplayMovies({
    type,
    limit = 12,
    options = {},
}: {
    type: string;
    limit?: number;
    options?: { category?: string; country?: string; year?: string | number };
}): Promise<Movie[]> {
    const safeLimit = Math.max(1, Math.min(limit, 24));
    const localItems = await getLocalFallbackDisplayMovies({ type, limit: safeLimit, options });
    if (localItems.length >= safeLimit) {
        return localItems;
    }

    const pools: Movie[][] = localItems.length > 0 ? [localItems] : [];
    const exactCategory = options.category && options.category !== "all" ? options.category : undefined;
    const exactCountry = options.country && options.country !== "all" ? options.country : undefined;
    const inferredCategory = !exactCategory && CATEGORY_SLUGS.has(type) ? type : undefined;
    const inferredCountry = !exactCountry && COUNTRY_SLUGS.has(type) ? type : undefined;
    const activeCategory = exactCategory || inferredCategory;
    const activeCountry = exactCountry || inferredCountry;
    const isCinemaList = type === "phim-chieu-rap";

    const externalRequests: Array<Promise<Movie[]>> = [];
    const pushRequest = (request: Promise<{ items?: Movie[] } | null | undefined>) => {
        externalRequests.push(
            withTimeout(request, 2200, { items: [] as Movie[] } as { items?: Movie[] })
                .then((res) => res?.items || [])
                .catch((): Movie[] => [])
        );
    };

    if (activeCountry) {
        pushRequest(getMoviesByCountry(activeCountry, 1, Math.max(24, safeLimit * 2), activeCategory ? { category: activeCategory } : undefined));
    }

    if (activeCategory) {
        pushRequest(getMoviesByCategory(activeCategory, 1, Math.max(24, safeLimit * 2), activeCountry ? { country: activeCountry } : undefined));
    }

    const backupListTypes = isCinemaList
        ? ["phim-chieu-rap", "phim-moi-cap-nhat"]
        : ["phim-moi-cap-nhat", "phim-bo", "phim-le"];

    for (const backupType of backupListTypes) {
        if (backupType === type && !activeCategory && !activeCountry) continue;
        pushRequest(getMoviesList(backupType, { limit: Math.max(24, safeLimit * 2) }));
    }

    if (externalRequests.length > 0) {
        const externalPools = await Promise.all(externalRequests);
        externalPools.forEach((pool) => {
            if (pool.length > 0) {
                pools.push(pool);
                syncMoviesToLocalCache(pool).catch(() => {});
            }
        });
    }

    return dedupeMovies(filterDisplayCountryMovies(pools.flat(), activeCountry), safeLimit);
}
