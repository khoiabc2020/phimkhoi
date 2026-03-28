import type { Movie } from "@/services/api";

const HAN_SCRIPT_RE = /[\u3400-\u9FFF\uF900-\uFAFF]/u;
const HANGUL_SCRIPT_RE = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/u;

const ASIAN_COUNTRY_RULES: Record<string, { langs: string[]; countries: string[]; script?: "han" | "hangul" }> = {
    "trung-quoc": { langs: ["zh", "cn"], countries: ["CN", "HK", "TW"], script: "han" },
    "han-quoc": { langs: ["ko"], countries: ["KR"], script: "hangul" },
    "nhat-ban": { langs: ["ja"], countries: ["JP"] },
    "thai-lan": { langs: ["th"], countries: ["TH"] },
    "viet-nam": { langs: ["vi"], countries: ["VN"] },
    "dai-loan": { langs: ["zh", "cn"], countries: ["TW"], script: "han" },
};

export const normalizeCountryToken = (value: unknown) =>
    String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

const getMovieTextSignature = (movie: Partial<Movie>) =>
    [
        movie?.name,
        movie?.origin_name,
        ...(Array.isArray(movie?.actor) ? movie.actor : []),
        ...(Array.isArray(movie?.director) ? movie.director : []),
    ]
        .filter(Boolean)
        .join(" ");

const hasCountryScriptSignature = (movie: Partial<Movie>, countrySlug: string) => {
    const signature = getMovieTextSignature(movie);
    const rule = ASIAN_COUNTRY_RULES[countrySlug];
    if (!signature || !rule?.script) return false;

    if (rule.script === "hangul") return HANGUL_SCRIPT_RE.test(signature);
    if (rule.script === "han") return HAN_SCRIPT_RE.test(signature);
    return false;
};

export const hasAuthoritativeCountryMetadata = (movie: Partial<Movie> | null | undefined) => {
    const tmdbData = (movie as Movie | null | undefined)?.tmdbData as any;
    const originalLanguage = normalizeCountryToken(tmdbData?.original_language || "");
    const originCountries = Array.isArray(tmdbData?.origin_country)
        ? tmdbData.origin_country.map((value: unknown) => String(value || "").toUpperCase()).filter(Boolean)
        : [];

    return Boolean(originalLanguage || originCountries.length > 0);
};

export const matchesCountryStrict = (movie: Partial<Movie> | null | undefined, countrySlug: string) => {
    if (!movie) return false;

    const wanted = normalizeCountryToken(countrySlug).replace(/\s+/g, " ");
    if (!wanted) return false;

    const sourceCountryMatch =
        Array.isArray(movie?.country) &&
        movie.country.some((country: any) => {
            const slug = normalizeCountryToken(country?.slug || "");
            const name = normalizeCountryToken(country?.name || "");
            return slug === wanted || name === wanted || slug.includes(wanted) || name.includes(wanted);
        });

    if (!sourceCountryMatch) return false;

    const tmdbData = (movie as Movie)?.tmdbData;
    const rule = ASIAN_COUNTRY_RULES[countrySlug];
    if (!rule) return true;

    const originalLanguage = normalizeCountryToken((tmdbData as any)?.original_language || "");
    const originCountries = Array.isArray((tmdbData as any)?.origin_country)
        ? (tmdbData as any).origin_country.map((value: unknown) => String(value || "").toUpperCase())
        : [];

    if (originalLanguage || originCountries.length > 0) {
        const hasExpectedLanguage = rule.langs.some((lang) => originalLanguage === normalizeCountryToken(lang));
        const hasExpectedCountry = rule.countries.some((country) => originCountries.includes(country));
        return hasExpectedLanguage || hasExpectedCountry;
    }

    return hasCountryScriptSignature(movie, countrySlug);
};

export const contradictsCountryMetadata = (movie: Partial<Movie> | null | undefined, countrySlug: string) => {
    if (!movie) return false;
    if (hasAuthoritativeCountryMetadata(movie)) {
        return !matchesCountryStrict(movie, countrySlug);
    }
    
    // NEGATIVE SCRIPT FILTER: Drop NguonC's lazy tag mismatches (e.g. Chinese movie tagged as Korean)
    const originalContent = `${movie.origin_name || ""} ${movie.name || ""}`;
    const hasChinese = /[\u4e00-\u9fa5]/.test(originalContent);
    const hasKorean = /[\uac00-\ud7a3]/.test(originalContent);
    const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(originalContent);

    // If we're looking for Korean, but the title has exclusively Chinese text and ZERO Korean text -> It contradicts
    if (countrySlug === 'han-quoc' && hasChinese && !hasKorean) return true;
    
    // If we're looking for Chinese, but it has exclusively Korean/Japanese text and ZERO Chinese -> It contradicts
    if (countrySlug === 'trung-quoc' && (hasKorean || hasJapanese) && !hasChinese) return true;

    return false;
};

export const matchesCountryForDisplay = (movie: Partial<Movie> | null | undefined, countrySlug: string) => {
    if (!movie) return false;
    if (matchesCountryStrict(movie, countrySlug)) return true;
    if (contradictsCountryMetadata(movie, countrySlug)) return false;

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
