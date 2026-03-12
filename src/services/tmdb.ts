export const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY;

export interface TMDBMovie {
    id: number;
    title: string;
    original_title: string;
    poster_path: string;
    backdrop_path: string;
    vote_average: number;
    release_date: string;
    overview: string;
}

export interface TMDBCredit {
    id: number;
    name: string;
    original_name: string;
    character?: string;
    job?: string;
    profile_path: string;
}

export const getTMDBConfig = async () => {
    // Helper to get image base url if needed, though usually hardcoded is fine
    // https://image.tmdb.org/t/p/original
};

// Helper to clean query
const cleanQueryString = (query: string) => {
    return query
        .replace(/Vietsub|Thuyết Minh|Lồng Tiếng|Tập \d+/gi, "")
        .replace(/\s+/g, " ")
        .trim();
};

const calculateSimilarity = (str1: string, str2: string) => {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    return 0;
};

export const searchTMDBMovie = async (query: string, year?: number, type: 'movie' | 'tv' = 'movie', verification?: { originalName?: string; countrySlug?: string }) => {
    try {
        if (!TMDB_API_KEY) return null;

        // Force originalName (English/Pinyin) as the primary search query, then fallback to Vietnamese name
        const queries = [verification?.originalName, query].filter(Boolean) as string[];
        // Deduplicate
        const uniqueQueries = [...new Set(queries)];

        for (const q of uniqueQueries) {
            const cleanQuery = cleanQueryString(q);
            // Search 'tv' primarily for Asian dramas (Thuyết Minh/Lồng Tiếng usually means series)
            const isLikelyTv = type === 'tv' || query.toLowerCase().includes("tập") || query.toLowerCase().includes("thuyết minh");
            const endpoints = isLikelyTv ? ['tv', 'movie'] : ['movie', 'tv'];

            for (const endpoint of endpoints) {
                // Thêm &_v=1 để phá cache vì NextJS lưu cache fetch API quá lâu (1 tiếng)
                let url = `${TMDB_API_URL}/search/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQuery)}&language=vi-VN&_v=4`;

                if (year) {
                    if (endpoint === 'movie') url += `&primary_release_year=${year}`;
                    // Do NOT add first_air_date_year for tv because it's too strict — some Chinese dramas air over 2 years
                    // Instead, we filter by year in the result
                }

                const res = await fetch(url, { next: { revalidate: 300 } });
                const data = await res.json();

                // Quick pre-filter: if searching for a modern movie/show, reject ancient results 
                const filteredResults = data.results?.filter((item: any) => {
                    if (!year || year < 2010) return true; // Don't filter old searches
                    const itemDate = endpoint === 'movie' ? item.release_date : item.first_air_date;
                    const itemYear = itemDate ? parseInt(itemDate.substring(0, 4)) : null;
                    // Reject if the result is more than 10 years older than what we're searching for
                    if (itemYear && itemYear < year - 10) return false;
                    return true;
                }) || [];

                if (filteredResults.length > 0) {
                    // Filter best match
                    const bestMatch = filteredResults.find((item: { title?: string; name?: string; release_date?: string; first_air_date?: string; original_title?: string; original_name?: string }) => {
                        const itemYear = endpoint === 'movie'
                            ? (item.release_date ? parseInt(item.release_date.substring(0, 4)) : null)
                            : (item.first_air_date ? parseInt(item.first_air_date.substring(0, 4)) : null);

                        // Year Check: Allow +/- 1 year tolerance for release date discrepancies
                        if (year && itemYear && Math.abs(itemYear - year) > 1) return false;

                        // Title Check:
                        let isMatch = false;

                        // 1. Check original name from verification
                        if (verification?.originalName) {
                            const originalTitle = endpoint === 'movie' ? item.original_title : item.original_name;
                            if (originalTitle && calculateSimilarity(verification.originalName, originalTitle) >= 0.35) {
                                isMatch = true;
                            }
                        }

                        // 2. Check query against local title and original title
                        const localTitle = endpoint === 'movie' ? item.title : item.name;
                        const originalTitleSearch = endpoint === 'movie' ? item.original_title : item.original_name;

                        if (localTitle && calculateSimilarity(cleanQuery, localTitle) >= 0.5) isMatch = true;
                        if (originalTitleSearch && calculateSimilarity(cleanQuery, originalTitleSearch) >= 0.5) isMatch = true;

                        // 3. Fallback: If Chinese/Korean names fail to match TMDB's English names, we rely strictly on the similarity check above.
                        // We DO NOT force a match just because the year matches, as that leads to hilarious false positives (like Western movies for Chinese dramas).
                        if (!isMatch && itemYear === year) {
                            // Only force match if the query was EXACTLY the original name, meaning TMDB returned this as the #1 result for the original name
                            if (q === verification?.originalName) isMatch = true;
                        }

                        return isMatch;
                    });

                    if (bestMatch) {
                        return { ...bestMatch, media_type: endpoint };
                    }
                }
            }
        }

        return null;

    } catch (error) {
        console.error("TMDB Search Error:", error);
        return null;
    }
};

export const searchTMDBPerson = async (query: string) => {
    try {
        if (!TMDB_API_KEY) return [];

        const cleanQuery = cleanQueryString(query);
        const url = `${TMDB_API_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQuery)}&language=vi-VN`;

        const res = await fetch(url, { next: { revalidate: 3600 } });
        const data = await res.json();

        return data.results?.slice(0, 5) || [];
    } catch (error) {
        console.error("TMDB Person Search Error:", error);
        return [];
    }
};

export const getTMDBPersonDetails = async (personId: number) => {
    try {
        if (!TMDB_API_KEY) return null;

        const url = `${TMDB_API_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=vi-VN`;
        const res = await fetch(url, { next: { revalidate: 86400 } });
        if (!res.ok) return null;
        const data = await res.json();

        // Sometimes vi-VN biography is empty, fallback to en-US if needed
        if (!data.biography) {
            const enRes = await fetch(`${TMDB_API_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=en-US`, { next: { revalidate: 86400 } });
            if (enRes.ok) {
                const enData = await enRes.json();
                data.biography = enData.biography;
            }
        }
        return data;
    } catch (error) {
        console.error("TMDB Person Details Error:", error);
        return null;
    }
};

export const getTMDBDetails = async (tmdbId: number, type: 'movie' | 'tv' = 'movie') => {
    try {
        if (!TMDB_API_KEY) return null;

        const url = `${TMDB_API_URL}/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=vi-VN&append_to_response=credits,images,videos`;

        const res = await fetch(url, { next: { revalidate: 3600 } });
        const data = await res.json();

        return data;
    } catch (error) {
        console.error("TMDB Details Error:", error);
        return null;
    }
};

export const getTMDBSeasonDetails = async (tmdbId: number, seasonNumber: number) => {
    try {
        if (!TMDB_API_KEY) return null;
        const url = `${TMDB_API_URL}/tv/${tmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=vi-VN`;
        const res = await fetch(url, { next: { revalidate: 86400 } });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("TMDB Season Details Error:", error);
        return null;
    }
};

// ... existing code ...
export const getTMDBImage = (path: string, size: "w342" | "w500" | "w780" | "w1280" | "original" = "w500") => {
    if (!path) return "";
    return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const getTMDBTrending = async (type: 'movie' | 'tv' | 'all' = 'all') => {
    try {
        if (!TMDB_API_KEY) return [];

        // Fetch day trending
        const url = `${TMDB_API_URL}/trending/${type}/day?api_key=${TMDB_API_KEY}&language=vi-VN`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        const data = await res.json();

        return data.results || [];
    } catch (error) {
        console.error("TMDB Trending Error:", error);
        return [];
    }
};
