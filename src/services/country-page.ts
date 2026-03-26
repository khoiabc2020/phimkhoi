import { cache } from "react";
import type { Movie } from "@/services/api";
import { getMoviesByCountry } from "@/services/api";
import { getMoviesByFilterFromCache } from "@/lib/movie-cache";
import { sanitizeMovieList } from "@/lib/movie-list";

export interface CountryHomeSectionConfig {
    title: string;
    categorySlug: string;
    fallbackOffset?: number;
    priorityFirst?: boolean;
}

const EMPTY_ITEMS: Movie[] = [];
const COUNTRY_POOL_PAGE_LIMIT = 120;
const COUNTRY_POOL_PAGES = [1, 2, 3];

const dedupeMoviesBySlug = (movies: Movie[] = []): Movie[] => {
    return sanitizeMovieList(movies, { limit: movies.length || 1 });
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
    const [localPages, livePages] = await Promise.all([
        Promise.all(
            COUNTRY_POOL_PAGES.map((page) =>
                getMoviesByFilterFromCache("country", countrySlug, page, COUNTRY_POOL_PAGE_LIMIT).catch((): null => null)
            )
        ),
        Promise.all(
            COUNTRY_POOL_PAGES.map((page) =>
                getMoviesByCountry(countrySlug, page, COUNTRY_POOL_PAGE_LIMIT).catch((): null => null)
            )
        ),
    ]);

    const countryItems = dedupeMoviesBySlug([
        ...localPages.flatMap((entry) => entry?.items || EMPTY_ITEMS),
        ...livePages.flatMap((entry) => entry?.items || EMPTY_ITEMS),
    ]);

    return {
        countryItems,
        fallbackItems: countryItems,
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

    return dedupeMoviesBySlug([...countryCategory, ...fallbackWindow, ...countryItems]).slice(0, size);
};

export const buildCountryHomeSections = (
    countryItems: Movie[],
    sections: CountryHomeSectionConfig[]
) => {
    return sections
        .map((section) => ({
            ...section,
            movies: buildCountrySectionMovies(
                countryItems,
                section.categorySlug,
                section.fallbackOffset || 0,
                24
            ),
        }))
        .filter((section) => section.movies.length > 0);
};
