import type { Movie } from "@/services/api";
import { normalizeMovieImages } from "@/lib/movie-media";

const ADULT_SLUGS = new Set([
    "phim-18",
    "phim 18",
    "phim18",
    "18",
    "18+",
    "18 plus",
    "adult",
    "ecchi",
    "sex",
]);

const ADULT_MARKERS = [
    "18+",
    "phim 18",
    "phim18",
    "adult",
    "ecchi",
    "jav",
    "uncensored",
];

const TRAILER_MARKERS = [
    "trailer",
    "teaser",
    "preview",
    "coming soon",
    "sap chieu",
    "nha hang",
];

const normalizeText = (value: unknown) =>
    String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

const ASIAN_COUNTRY_RULES: Record<string, { langs: string[]; countries: string[] }> = {
    "trung-quoc": { langs: ["zh", "cn"], countries: ["CN", "HK", "TW"] },
    "han-quoc": { langs: ["ko"], countries: ["KR"] },
    "nhat-ban": { langs: ["ja"], countries: ["JP"] },
    "thai-lan": { langs: ["th"], countries: ["TH"] },
    "viet-nam": { langs: ["vi"], countries: ["VN"] },
    "dai-loan": { langs: ["zh", "cn"], countries: ["TW"] },
};

const extractYear = (movie: Partial<Movie>) => {
    const parsed = Number(String(movie?.year || "").slice(0, 4));
    return Number.isFinite(parsed) && parsed > 1900 ? parsed : 0;
};

const extractTmdbYear = (tmdbData: Record<string, any>) => {
    const value = tmdbData?.release_date || tmdbData?.first_air_date || tmdbData?.year;
    const parsed = Number(String(value || "").slice(0, 4));
    return Number.isFinite(parsed) && parsed > 1900 ? parsed : 0;
};

const buildTitleKeys = (movie: Partial<Movie>) => {
    const values = [
        movie?.origin_name,
        movie?.name,
        String(movie?.slug || "").replace(/-/g, " "),
    ]
        .map(normalizeText)
        .filter((value, index, arr) => value.length >= 3 && arr.indexOf(value) === index);

    const year = extractYear(movie);
    const keys = new Set<string>();

    for (const value of values) {
        keys.add(value);
        if (year) keys.add(`${value}|${year}`);
    }

    return keys;
};

const buildTmdbTitleKeys = (tmdbData: Record<string, any>) => {
    return [
        tmdbData?.title,
        tmdbData?.name,
        tmdbData?.original_title,
        tmdbData?.original_name,
    ]
        .map(normalizeText)
        .filter((value, index, arr) => value.length >= 3 && arr.indexOf(value) === index);
};

const hasTitleAffinity = (movie: Partial<Movie>, tmdbData: Record<string, any>) => {
    const movieKeys = Array.from(buildTitleKeys(movie)).map((value) => String(value).split("|")[0]);
    const tmdbKeys = buildTmdbTitleKeys(tmdbData);

    if (movieKeys.length === 0 || tmdbKeys.length === 0) return false;

    return movieKeys.some((movieKey) =>
        tmdbKeys.some((tmdbKey) =>
            movieKey === tmdbKey ||
            movieKey.includes(tmdbKey) ||
            tmdbKey.includes(movieKey)
        )
    );
};

const getCountrySlugs = (movie: Partial<Movie>) =>
    Array.isArray(movie?.country)
        ? movie.country.map((country) => String(country?.slug || "").trim()).filter(Boolean)
        : [];

export const shouldUseTmdbMedia = (
    movie: Partial<Movie> | null | undefined,
    tmdbData: Record<string, any> | null | undefined
) => {
    if (!movie || !tmdbData || typeof tmdbData !== "object") return false;

    const hasMedia = Boolean(tmdbData.poster_path || tmdbData.backdrop_path);
    if (!hasMedia) return false;

    const movieYear = extractYear(movie);
    const tmdbYear = extractTmdbYear(tmdbData);
    if (movieYear && tmdbYear && Math.abs(movieYear - tmdbYear) > 2) {
        return false;
    }

    const hasTmdbTitles = buildTmdbTitleKeys(tmdbData).length > 0;
    if (hasTmdbTitles && !hasTitleAffinity(movie, tmdbData)) {
        return false;
    }

    const countrySlugs = getCountrySlugs(movie);
    const originalLanguage = normalizeText(tmdbData.original_language || "");
    const originCountries = Array.isArray(tmdbData.origin_country)
        ? tmdbData.origin_country.map((value: unknown) => String(value || "").toUpperCase())
        : [];

    for (const countrySlug of countrySlugs) {
        const rule = ASIAN_COUNTRY_RULES[countrySlug];
        if (!rule) continue;

        const hasExpectedLanguage = rule.langs.some((lang) => originalLanguage === lang);
        const hasExpectedCountry = rule.countries.some((country) => originCountries.includes(country));

        if (!hasExpectedLanguage && !hasExpectedCountry) {
            return false;
        }
    }

    return true;
};

export const sanitizeTmdbDataForMovie = <T extends Partial<Movie>>(movie: T): T => {
    if (!movie || !(movie as Movie).tmdbData) return movie;

    if (!shouldUseTmdbMedia(movie, (movie as Movie).tmdbData as Record<string, any>)) {
        return {
            ...movie,
            tmdbData: null,
        };
    }

    return movie;
};

const getMovieQualityScore = (movie: Partial<Movie>) => {
    let score = 0;

    if (String(movie.poster_url || "").trim()) score += 3;
    if (String(movie.thumb_url || "").trim()) score += 3;
    if (String(movie.content || "").trim()) score += 2;
    if (Array.isArray(movie.episodes) && movie.episodes.length > 0) score += 3;
    if (Array.isArray(movie.category) && movie.category.length > 0) score += 1;
    if (Array.isArray(movie.country) && movie.country.length > 0) score += 1;
    if (extractYear(movie)) score += 1;
    if (String(movie.episode_current || "").trim()) score += 1;
    if ((movie as Movie).tmdbData?.vote_average) score += 1;

    return score;
};

export const isAdultMovie = (movie: Partial<Movie> | null | undefined) => {
    if (!movie) return false;

    if ((movie as Movie).tmdbData && typeof (movie as Movie).tmdbData === "object") {
        const tmdbAdult = (movie as Movie).tmdbData && "adult" in (movie as any).tmdbData
            ? Boolean((movie as any).tmdbData.adult)
            : false;
        if (tmdbAdult) return true;
    }

    const categories = Array.isArray(movie.category) ? movie.category : [];
    if (
        categories.some((category) => {
            const slug = normalizeText(category?.slug || "");
            const name = normalizeText(category?.name || "");
            return ADULT_SLUGS.has(slug) || ADULT_SLUGS.has(name);
        })
    ) {
        return true;
    }

    const haystacks = [
        movie.name,
        movie.origin_name,
        movie.content,
        movie.notify,
    ].map(normalizeText);

    return ADULT_MARKERS.some((marker) => haystacks.some((text) => text.includes(normalizeText(marker))));
};

export const isTrailerMovie = (movie: Partial<Movie> | null | undefined) => {
    if (!movie) return false;

    const categories = Array.isArray(movie.category) ? movie.category : [];
    if (
        categories.some((category) => {
            const slug = normalizeText(category?.slug || "");
            const name = normalizeText(category?.name || "");
            return slug.includes("trailer") || name.includes("trailer");
        })
    ) {
        return true;
    }

    const haystacks = [
        movie.name,
        movie.origin_name,
        movie.notify,
        movie.quality,
        movie.status,
        movie.episode_current,
        movie.episode_total,
        (movie as any)?.current_episode,
        (movie as any)?.type,
    ].map(normalizeText);

    return TRAILER_MARKERS.some((marker) => haystacks.some((text) => text.includes(normalizeText(marker))));
};

export const isLikelyDuplicateMovie = (left: Partial<Movie>, right: Partial<Movie>) => {
    const leftSlug = String(left?.slug || "").trim();
    const rightSlug = String(right?.slug || "").trim();
    if (leftSlug && rightSlug && leftSlug === rightSlug) return true;

    const leftYear = extractYear(left);
    const rightYear = extractYear(right);
    if (leftYear && rightYear && Math.abs(leftYear - rightYear) > 1) return false;

    const leftKeys = buildTitleKeys(left);
    const rightKeys = buildTitleKeys(right);
    for (const key of leftKeys) {
        if (rightKeys.has(key)) return true;
    }

    return false;
};

export const pickPreferredMovie = (left: Movie, right: Movie) => {
    return getMovieQualityScore(right) > getMovieQualityScore(left) ? right : left;
};

export function sanitizeMovieList(
    movies: Movie[] = [],
    options: { limit?: number; allowAdult?: boolean } = {}
): Movie[] {
    const limit = Math.max(1, options.limit || movies.length || 1);
    const allowAdult = options.allowAdult === true;
    const sanitized: Movie[] = [];

    for (const rawMovie of movies) {
        if (!rawMovie?.slug) continue;
        const movie = sanitizeTmdbDataForMovie(normalizeMovieImages(rawMovie));
        if (isTrailerMovie(movie)) continue;
        if (!allowAdult && isAdultMovie(movie)) continue;

        const duplicateIndex = sanitized.findIndex((existing) => isLikelyDuplicateMovie(existing, movie));
        if (duplicateIndex >= 0) {
            sanitized[duplicateIndex] = pickPreferredMovie(sanitized[duplicateIndex], movie);
            continue;
        }

        sanitized.push(movie);
        if (sanitized.length >= limit) break;
    }

    const finalSanitized = sanitized.slice(0, limit);
    return finalSanitized.sort((a, b) => {
        const yearA = extractYear(a) || 0;
        const yearB = extractYear(b) || 0;
        return yearB - yearA; // Descending by year
    });
}
