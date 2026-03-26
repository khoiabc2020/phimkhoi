import type { Movie } from "@/services/api";

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

const normalizeText = (value: unknown) =>
    String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

const extractYear = (movie: Partial<Movie>) => {
    const parsed = Number(String(movie?.year || "").slice(0, 4));
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

    for (const movie of movies) {
        if (!movie?.slug) continue;
        if (!allowAdult && isAdultMovie(movie)) continue;

        const duplicateIndex = sanitized.findIndex((existing) => isLikelyDuplicateMovie(existing, movie));
        if (duplicateIndex >= 0) {
            sanitized[duplicateIndex] = pickPreferredMovie(sanitized[duplicateIndex], movie);
            continue;
        }

        sanitized.push(movie);
        if (sanitized.length >= limit) break;
    }

    return sanitized.slice(0, limit);
}
