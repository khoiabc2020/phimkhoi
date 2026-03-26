import { cache } from "react";
import type { Movie } from "@/services/api";
import { getMoviesByFilterFromCache, getMoviesFromCache } from "@/lib/movie-cache";

export interface CountryHomeSectionConfig {
    title: string;
    categorySlug: string;
    fallbackOffset?: number;
    priorityFirst?: boolean;
}

const EMPTY_ITEMS: Movie[] = [];

const dedupeMoviesBySlug = (movies: Movie[] = []): Movie[] => {
    const seen = new Set<string>();
    const merged: Movie[] = [];

    for (const movie of movies) {
        const slug = String(movie?.slug || "").trim();
        if (!slug || seen.has(slug)) continue;
        seen.add(slug);
        merged.push(movie);
    }

    return merged;
};

const filterByCategory = (movies: Movie[], categorySlug: string) => {
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

export const getCountryPagePool = cache(async (countrySlug: string) => {
    const [localCountry, cachedTrending, globalLatest] = await Promise.all([
        getMoviesByFilterFromCache("country", countrySlug, 1, 360).catch((): null => null),
        getMoviesFromCache(countrySlug, 1, 180).catch((): null => null),
        getMoviesFromCache("phim-moi-cap-nhat", 1, 120).catch((): null => null),
    ]);

    const countryItems = dedupeMoviesBySlug([
        ...(localCountry?.items || EMPTY_ITEMS),
        ...(cachedTrending?.items || EMPTY_ITEMS),
    ]);

    const globalItems = dedupeMoviesBySlug([
        ...(globalLatest?.items || EMPTY_ITEMS),
        ...(cachedTrending?.items || EMPTY_ITEMS),
    ]);
    const fallbackItems = dedupeMoviesBySlug([...countryItems, ...globalItems]);

    return {
        countryItems,
        globalItems,
        fallbackItems,
    };
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
    globalItems: Movie[],
    categorySlug: string,
    fallbackOffset: number = 0,
    size: number = 24
): Movie[] => {
    const countryCategory = filterByCategory(countryItems, categorySlug);
    if (countryCategory.length >= 6) {
        return countryCategory.slice(0, size);
    }

    const fallbackWindow = safeSliceWindow(countryItems, fallbackOffset, size);
    if (fallbackWindow.length >= 6) {
        return dedupeMoviesBySlug([...countryCategory, ...fallbackWindow]).slice(0, size);
    }

    const globalCategory = filterByCategory(globalItems, categorySlug);
    return dedupeMoviesBySlug([...countryCategory, ...fallbackWindow, ...globalCategory, ...globalItems]).slice(0, size);
};

export const buildCountryHomeSections = (
    countryItems: Movie[],
    globalItems: Movie[],
    sections: CountryHomeSectionConfig[]
) => {
    return sections
        .map((section) => ({
            ...section,
            movies: buildCountrySectionMovies(
                countryItems,
                globalItems,
                section.categorySlug,
                section.fallbackOffset || 0,
                24
            ),
        }))
        .filter((section) => section.movies.length > 0);
};
