import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Movie } from "@/services/api";
import { getMoviesByCountry } from "@/services/api";
import { getMoviesByFilterFromCache } from "@/lib/movie-cache";
import { sanitizeMovieList } from "@/lib/movie-list";
import { matchesCountryForDisplay, normalizeCountryToken } from "@/lib/movie-country";

export interface CountryHomeSectionConfig {
    title: string;
    categorySlug: string;
    fallbackOffset?: number;
    priorityFirst?: boolean;
}

const EMPTY_ITEMS: Movie[] = [];
const COUNTRY_POOL_LOCAL_LIMIT = 480;
const COUNTRY_POOL_LIVE_LIMIT = 240;
const COUNTRY_LOCAL_TIMEOUT_MS = 1500;
const COUNTRY_LIVE_TIMEOUT_MS = 4200;

const dedupeMoviesBySlug = (movies: Movie[] = []): Movie[] => {
    return sanitizeMovieList(movies, { limit: movies.length || 1 });
};

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

export const filterByCategory = (movies: Movie[], categorySlug: string) => {
    if (categorySlug === "all") return movies;
    return movies.filter((movie) =>
        Array.isArray(movie?.category) && movie.category.some((item: any) => item?.slug === categorySlug)
    );
};

const safeSliceWindow = (movies: Movie[], offset: number, size: number): Movie[] => {
    if (!movies.length) return [];
    const maxStart = Math.max(0, movies.length - Math.min(size, movies.length));
    const start = Math.min(Math.max(0, offset), maxStart);
    return movies.slice(start, start + size);
};

const appendUniqueMovies = (
    target: Movie[],
    incoming: Movie[],
    usedSlugs: Set<string>,
    limit: number
) => {
    for (const movie of incoming) {
        const slug = String(movie?.slug || "").trim();
        if (!slug || usedSlugs.has(slug)) continue;
        target.push(movie);
        usedSlugs.add(slug);
        if (target.length >= limit) break;
    }
};

async function loadCountryPagePool(countrySlug: string) {
    const matchesCountryLoose = (movie: Movie | null | undefined) => {
        if (!movie) return false;
        const wanted = normalizeCountryToken(countrySlug).replace(/\s+/g, " ");
        if (!wanted) return false;

        return (
            Array.isArray(movie?.country) &&
            movie.country.some((country: any) => {
                const slug = normalizeCountryToken(country?.slug || "");
                const name = normalizeCountryToken(country?.name || "");
                return slug === wanted || name === wanted || slug.includes(wanted) || name.includes(wanted);
            })
        );
    };

    const filterCountryMovies = (items: Movie[] = []) =>
        dedupeMoviesBySlug(items.filter((movie) => matchesCountryForDisplay(movie, countrySlug)));

    const localCountry = await withTimeout(
        getMoviesByFilterFromCache("country", countrySlug, 1, COUNTRY_POOL_LOCAL_LIMIT).catch((): null => null),
        COUNTRY_LOCAL_TIMEOUT_MS,
        null
    );
    const rawLocalItems = localCountry?.items || EMPTY_ITEMS;
    let countryItems = filterCountryMovies(rawLocalItems);
    let rawCombined = rawLocalItems;

    if (countryItems.length < 96) {
        const liveCountryPages = await withTimeout<
            [({ items?: Movie[] } | null), ({ items?: Movie[] } | null), ({ items?: Movie[] } | null)]
        >(
            Promise.all([
                getMoviesByCountry(countrySlug, 1, COUNTRY_POOL_LIVE_LIMIT).catch((): null => null),
                getMoviesByCountry(countrySlug, 2, COUNTRY_POOL_LIVE_LIMIT).catch((): null => null),
                getMoviesByCountry(countrySlug, 3, COUNTRY_POOL_LIVE_LIMIT).catch((): null => null),
            ]),
            COUNTRY_LIVE_TIMEOUT_MS,
            [null, null, null]
        );

        const liveItems = liveCountryPages.flatMap((page) => page?.items || EMPTY_ITEMS);
        rawCombined = [...rawCombined, ...liveItems];
        countryItems = filterCountryMovies([...countryItems, ...liveItems]);
    }

    if (countryItems.length < 120 && rawCombined.length > 0) {
        const looseItems = dedupeMoviesBySlug(rawCombined.filter((movie) => matchesCountryLoose(movie)));
        countryItems = dedupeMoviesBySlug([...countryItems, ...looseItems]);
    }

    const fallbackItems = dedupeMoviesBySlug([
        ...countryItems,
        ...rawCombined.filter((movie) => matchesCountryLoose(movie)),
    ]);

    return {
        countryItems,
        fallbackItems,
    };
}

export const getCountryPagePool = cache(async (countrySlug: string) => {
    const loadCachedPool = unstable_cache(
        async () => loadCountryPagePool(countrySlug),
        [`country-page-pool:${countrySlug}`],
        {
            revalidate: 900,
            tags: [`country-page-pool:${countrySlug}`],
        }
    );

    return loadCachedPool();
});

export const buildCountryHeroMovies = (
    fallbackItems: Movie[],
    preferredSlugs: string[],
    limit: number
): Movie[] => {
    const bySlug = new Map(fallbackItems.map((movie) => [movie.slug, movie]));
    const picked: Movie[] = [];
    const seen = new Set<string>();

    for (const slug of preferredSlugs) {
        const movie = bySlug.get(slug);
        if (!movie || seen.has(movie.slug)) continue;
        picked.push(movie);
        seen.add(movie.slug);
    }

    for (const movie of fallbackItems) {
        if (picked.length >= limit) break;
        if (!movie?.slug || seen.has(movie.slug)) continue;
        picked.push(movie);
        seen.add(movie.slug);
    }

    return picked.slice(0, limit);
};

export const buildCountrySectionMovies = (
    countryItems: Movie[],
    categorySlug: string,
    fallbackOffset: number = 0,
    size: number = 24,
    usedSlugs: Set<string> = new Set()
): Movie[] => {
    const picked: Movie[] = [];
    const localUsed = new Set<string>(usedSlugs);
    const countryCategory = filterByCategory(countryItems, categorySlug);

    appendUniqueMovies(picked, countryCategory, localUsed, size);
    if (picked.length >= size) {
        return picked;
    }

    const paddedWindow = safeSliceWindow(countryItems, fallbackOffset, size * 3);
    appendUniqueMovies(picked, paddedWindow, localUsed, size);

    if (picked.length < size) {
        appendUniqueMovies(picked, countryItems, localUsed, size);
    }

    return picked;
};

export const buildCountryHomeSections = (
    countryItems: Movie[],
    sections: CountryHomeSectionConfig[]
) => {
    const usedSlugs = new Set<string>();
    const fullPool = dedupeMoviesBySlug(countryItems);

    return sections
        .map((section) => {
            let movies = buildCountrySectionMovies(
                fullPool,
                section.categorySlug,
                section.fallbackOffset || 0,
                24,
                usedSlugs
            );

            if (movies.length < 8) {
                movies = buildCountrySectionMovies(
                    fullPool,
                    section.categorySlug,
                    section.fallbackOffset || 0,
                    24,
                    new Set<string>()
                );
            }

            if (movies.length < 12) {
                const existing = new Set(
                    movies.map((movie) => String(movie?.slug || "").trim()).filter(Boolean)
                );
                const topUp = safeSliceWindow(fullPool, section.fallbackOffset || 0, 48).filter((movie) => {
                    const slug = String(movie?.slug || "").trim();
                    return slug && !existing.has(slug);
                });
                movies = dedupeMoviesBySlug([...movies, ...topUp]).slice(0, 24);
            }

            for (const movie of movies) {
                const slug = String(movie?.slug || "").trim();
                if (slug) usedSlugs.add(slug);
            }

            return {
                ...section,
                movies,
            };
        })
        .filter((section) => section.movies.length > 0);
};
