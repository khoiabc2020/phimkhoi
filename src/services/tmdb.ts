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

// Elite Title Mapping: Resolve common translation mismatches for top-tier content
const ELITE_TITLE_MAPPINGS: Record<string, string> = {
    "bong ma anh quoc": "Peaky Blinders",
    "bong ma anh quoc nguoi bat tu": "Peaky Blinders: The Immortal Man", // Specific movie title
    "thanh guomu": "Demon Slayer",
    "ke san mat trang": "Moon Knight",
};

export const getTMDBConfig = async () => {
    // Helper to get image base url if needed, though usually hardcoded is fine
    // https://image.tmdb.org/t/p/original
};

// Helper to clean query
const cleanQueryString = (query: string) => {
    return query
        .replace(/Vietsub|Thuyết Minh|Lồng Tiếng|Tập \d+/gi, "")
        .replace(/\d+D/gi, "") // Remove 3D, 4D etc
        .replace(/Phần \d+|Season \d+|SS\d+/gi, "") 
        .replace(/\(.*\)/g, "") // Remove parenthetical info
        .replace(/\s+/g, " ")
        .trim();
};

const calculateSimilarity = (str1: string, str2: string) => {
    if (!str1 || !str2) return 0;
    
    // Normalize string: lowercase, remove accents, remove symbols
    const normalize = (s: string) => 
        s.toLowerCase()
         .normalize("NFD")
         .replace(/[\u0300-\u036f]/g, "") // remove accents
         .replace(/[^a-z0-9]/g, "");    // remove non-alphanumeric

    const s1 = normalize(str1);
    const s2 = normalize(str2);
    
    if (s1 === s2) return 1.0;
    if (s1.length > 0 && s2.length > 0 && (s1.includes(s2) || s2.includes(s1))) return 0.8;
    return 0;
};

export const searchTMDBMovie = async (query: string, year?: number, type: 'movie' | 'tv' = 'movie', verification?: { originalName?: string; localName?: string; countrySlug?: string }): Promise<any> => {
    try {
        if (!TMDB_API_KEY) return null;

        // Detect English title from mapping
        const qLower = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
        const mappedTitle = ELITE_TITLE_MAPPINGS[qLower];
        
        // Force both originalName (English/Pinyin) and localName (Vietnamese) into the query queue.
        const queries = [mappedTitle, verification?.originalName, verification?.localName, query].filter(Boolean) as string[];
        // Deduplicate
        const uniqueQueries = [...new Set(queries)];

        for (const q of uniqueQueries) {
            const cleanQuery = cleanQueryString(q);
            // Search 'tv' primarily for Asian dramas (Thuyết Minh/Lồng Tiếng usually means series)
            const isLikelyTv = type === 'tv' || query.toLowerCase().includes("tập") || query.toLowerCase().includes("thuyết minh");
            const endpoints = isLikelyTv ? ['tv', 'movie'] : ['movie', 'tv'];

            for (const endpoint of endpoints) {
                // Try with zh-TW locale first for Asian dramas, then vi-VN
                // Chinese language helps TMDB return Chinese originals instead of English translations
                const isAsianSearch = verification?.countrySlug &&
                    ["trung-quoc", "han-quoc", "nhat-ban", "thai-lan"].includes(verification.countrySlug);
                const locales = isAsianSearch ? ['zh-TW', 'vi-VN'] : ['vi-VN'];

                for (const locale of locales) {
                let url = `${TMDB_API_URL}/search/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=${locale}&_v=11`;

                if (year) {
                    if (endpoint === 'movie') url += `&primary_release_year=${year}`;
                    // Special case: if movie is very new/future, also try the year before
                    if (endpoint === 'movie' && year > 2024) {
                        // We will let the second pass or fallback handle it
                    }
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3500);

                try {
                    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 300 } });
                    const data = await res.json();
                    clearTimeout(timeoutId);

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
                        const bestMatch = filteredResults.find((item: { 
                            title?: string; 
                            name?: string; 
                            release_date?: string; 
                            first_air_date?: string; 
                            original_title?: string; 
                            original_name?: string; 
                            origin_country?: string[];
                            original_language?: string;
                        }) => {
                            const itemYear = endpoint === 'movie'
                                ? (item.release_date ? parseInt(item.release_date.substring(0, 4)) : null)
                                : (item.first_air_date ? parseInt(item.first_air_date.substring(0, 4)) : null);

                            // Country Check: Prevent Western movies from matching Asian dramas
                            const isAsianDramaSource = ["trung-quoc", "han-quoc", "nhat-ban", "thai-lan"].includes(verification?.countrySlug || "");
                            const itemCountries = item.origin_country || [];
                            const itemOriginalLang = item.original_language || "";
                            
                            if (isAsianDramaSource) {
                                // If it's a known Asian drama source, it MUST be from an Asian country OR have an Asian original language
                                const hasAsianOrigin = itemCountries.some((c: string) => ["CN", "KR", "JP", "TH", "TW", "HK"].includes(c));
                                const hasAsianLang = ["zh", "ko", "ja", "th"].includes(itemOriginalLang);
                                
                                if (itemCountries.length > 0 && !hasAsianOrigin && !hasAsianLang) {
                                    return false; // Reject US/Western matches for Asian drama queries
                                }
                            }

                            // Title Check:
                            let isMatch = false;

                            // 1. Check original name from verification
                            if (verification?.originalName) {
                                const originalTitle = endpoint === 'movie' ? item.original_title : item.original_name;
                                const similarity = calculateSimilarity(verification.originalName, originalTitle || "");
                                if (similarity >= 0.7) {
                                    isMatch = true;
                                } else if (similarity >= 0.4 && itemYear === year) {
                                    isMatch = true;
                                }
                            }

                            // 1b. Check local name from verification
                            if (!isMatch && verification?.localName) {
                                const localTitle = endpoint === 'movie' ? item.title : item.name;
                                const originalTitleSearch = endpoint === 'movie' ? item.original_title : item.original_name;
                                
                                // High threshold for local titles to avoid "Anh yêu em" common phrases matching wrong movies
                                if (localTitle && calculateSimilarity(verification.localName, localTitle) >= 0.85) isMatch = true;
                                if (!isMatch && originalTitleSearch && calculateSimilarity(verification.localName, originalTitleSearch) >= 0.85) isMatch = true;
                                
                                // If year matches perfectly, we can be slightly more lenient
                                if (!isMatch && itemYear === year && localTitle && calculateSimilarity(verification.localName, localTitle) >= 0.6) isMatch = true;
                            }

                            // Year Check: Be strict if we have a year
                            if (year && itemYear && Math.abs(itemYear - year) > 1) {
                                // If title is EXACT, we can allow +/- 1 year (TMDB vs source discrepancy)
                                // But 5 years is too much for modern movies
                                if (isMatch) {
                                    // Keep it
                                } else {
                                    return false;
                                }
                            }

                            // 2. Check current query q against local title and original title
                            const localTitle = endpoint === 'movie' ? item.title : item.name;
                            const originalTitleSearch = endpoint === 'movie' ? item.original_title : item.original_name;

                            if (localTitle && calculateSimilarity(cleanQuery, localTitle) >= 0.5) isMatch = true;
                            if (!isMatch && originalTitleSearch && calculateSimilarity(cleanQuery, originalTitleSearch) >= 0.5) isMatch = true;

                            // 3. Fallback: If Chinese/Korean names fail to match TMDB's English names
                            if (!isMatch && itemYear === year) {
                                // If q matches originalName or localName exactly, and it's the #1 result, trust it
                                if ((q === verification?.originalName || q === verification?.localName) && filteredResults.indexOf(item) === 0) {
                                    isMatch = true;
                                }
                            }

                            return isMatch;
                        });

                        if (bestMatch) {
                            return { ...bestMatch, media_type: endpoint };
                        }
                    }
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    console.warn(`TMDB Fetch Exception for ${q} [${locale}]:`, fetchError);
                }
                } // end locale loop
            }
        }

        // SECONDARY FALLBACK: Broader search without year if first pass failed
        if (year) {
            return await searchTMDBMovie(query, undefined, type, verification);
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

/**
 * Elite Actor Resolver: Finds a person and retrieves their full bio/metadata.
 * Used by MovieCast for cinematic actor portraits and details.
 */
export const getActorDetailsFromTMDB = async (actorName: string) => {
    try {
        if (!TMDB_API_KEY) return null;
        
        // 1. Search for the person
        const results = await searchTMDBPerson(actorName);
        if (!results || results.length === 0) return null;
        
        // 2. Fetch full details for the best match
        return await getTMDBPersonDetails(results[0].id);
    } catch (error) {
        console.error("getActorDetailsFromTMDB error:", error);
        return null;
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

export const getTMDBPersonCredits = async (personId: number) => {
    try {
        if (!TMDB_API_KEY) return null;
        const url = `${TMDB_API_URL}/person/${personId}/combined_credits?api_key=${TMDB_API_KEY}&language=vi-VN`;
        const res = await fetch(url, { next: { revalidate: 86400 } });
        if (!res.ok) return null;
        const data = await res.json();
        // Sort by popularity or release date
        if (data.cast) {
            data.cast.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
        }
        return data;
    } catch (error) {
        console.error("TMDB Person Credits Error:", error);
        return null;
    }
};

export const getTMDBDetails = async (id: number, type: 'movie' | 'tv' = 'movie') => {
    try {
        if (!TMDB_API_KEY) return null;
        const url = `${TMDB_API_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits,external_ids,images&_v=11`;

        const res = await fetch(url, { next: { revalidate: 3600 } });
        const data = await res.json();

        return data;
    } catch (error) {
        console.error("TMDB Details Error:", error);
        return null;
    }
};

export const getTMDBSeasonDetails = async (tvId: number, seasonNumber: number) => {
    try {
        if (!TMDB_API_KEY) return null;
        const url = `${TMDB_API_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&_v=11`;
        const res = await fetch(url, { next: { revalidate: 86400 } });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("TMDB Season Details Error:", error);
        return null;
    }
};

// ... existing code ...
export const getTMDBImage = (path: string, size: "w342" | "w500" | "w780" | "w1280" | "h632" | "original" = "w500") => {
    if (!path) return "";
    return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const getTMDBTrending = async (
    type: 'movie' | 'tv' | 'all' = 'all',
    timeWindow: 'day' | 'week' = 'day'
) => {
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    if (isBuildPhase) return [];

    try {
        if (!TMDB_API_KEY) return [];

        const url = `${TMDB_API_URL}/trending/${type}/${timeWindow}?api_key=${TMDB_API_KEY}&language=vi-VN`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        const data = await res.json();

        return data.results || [];
    } catch (error) {
        console.error("TMDB Trending Error:", error);
        return [];
    }
};
