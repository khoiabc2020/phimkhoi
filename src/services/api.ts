export const API_URL = "https://phimapi.com";

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
    actor: string[];
    director: string[];
    category: { id: string; name: string; slug: string }[];
    country: { id: string; name: string; slug: string }[];
    episodes: { server_name: string; server_data: { name: string; slug: string; filename: string; link_embed: string; link_m3u8: string }[] }[];
}

interface ListResponse {
    status: boolean;
    items: Movie[];
    pathImage: string;
    pagination: {
        totalItems: number;
        totalItemsPerPage: number;
        currentPage: number;
        totalPages: number;
    };
    data?: {
        items: Movie[];
        params: any;
    }
}

// Helper to normalize response because API structure varies slightly between endpoints
const getItems = (data: any): Movie[] => {
    if (data.items) return data.items;
    if (data.data && data.data.items) return data.data.items;
    return [];
};

export const getHomeData = async () => {
    try {
        console.log("Fetching Home Data...");
        const [phimLe, phimBo, hoatHinh, tvShows] = await Promise.all([
            fetch(`${API_URL}/v1/api/danh-sach/phim-le?limit=12`, { next: { revalidate: 60 } }).then((res) => res.json()),
            fetch(`${API_URL}/v1/api/danh-sach/phim-bo?limit=12`, { next: { revalidate: 60 } }).then((res) => res.json()),
            fetch(`${API_URL}/v1/api/danh-sach/hoat-hinh?limit=12`, { next: { revalidate: 60 } }).then((res) => res.json()),
            fetch(`${API_URL}/v1/api/danh-sach/tv-shows?limit=12`, { next: { revalidate: 60 } }).then((res) => res.json()),
        ]);

        console.log("Home Data Fetched:", {
            phimLe: getItems(phimLe).length,
            phimBo: getItems(phimBo).length,
            hoatHinh: getItems(hoatHinh).length,
            tvShows: getItems(tvShows).length,
        });

        return {
            phimLe: getItems(phimLe),
            phimBo: getItems(phimBo),
            hoatHinh: getItems(hoatHinh),
            tvShows: getItems(tvShows),
        };
    } catch (error) {
        console.error("Error fetching home data:", error);
        return { phimLe: [], phimBo: [], hoatHinh: [], tvShows: [] };
    }
};

export const getMovieDetail = async (slug: string) => {
    try {
        const res = await fetch(`${API_URL}/phim/${slug}`, { next: { revalidate: 60 } });
        const data = await res.json();
        // Return the full response which includes both movie and episodes
        return data;
    } catch (error) {
        console.error(`Error fetching movie detail [${slug}]:`, error);
        return null;
    }
};

export const searchMovies = async (keyword: string) => {
    try {
        const res = await fetch(`${API_URL}/v1/api/tim-kiem?keyword=${keyword}&limit=20`);
        const data = await res.json();
        return data.data?.items || [];
    } catch (error) {
        console.error(`Error searching movies [${keyword}]:`, error);
        return [];
    }
};

export const getMoviesList = async (type: string, params: { page?: number; year?: number; category?: string; country?: string; limit?: number } = {}) => {
    try {
        const { page = 1, year, category, country, limit = 24 } = params;

        // Build query string
        let query = `?page=${page}&limit=${limit}`;
        if (year) query += `&year=${year}`;
        if (category) query += `&category=${category}`;
        if (country) query += `&country=${country}`;

        // Handle specific endpoints logic if needed, but V1/API is generic list
        // Note: PhimApi structure: /v1/api/danh-sach/{type}
        const res = await fetch(`${API_URL}/v1/api/danh-sach/${type}${query}`, { next: { revalidate: 60 } }); // Lower revalidate for faster updates
        const data = await res.json();

        return {
            items: getItems(data),
            pagination: data.data?.params?.pagination || { currentPage: 1, totalPages: 1 }
        };
    } catch (error) {
        console.error(`Error fetching movies list [${type}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }
};

export const getMoviesByCategory = async (slug: string, page: number = 1, limit: number = 24) => {
    try {
        const res = await fetch(`${API_URL}/v1/api/the-loai/${slug}?page=${page}&limit=${limit}`, { next: { revalidate: 3600 } });
        const data = await res.json();

        // Normalize response structure matches list response
        return {
            items: getItems(data),
            pagination: data.data?.params?.pagination || { currentPage: 1, totalPages: 1 }
        };
    } catch (error) {
        console.error(`Error fetching category [${slug}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }
};

export const getMoviesByCountry = async (slug: string, page: number = 1, limit: number = 24) => {
    try {
        const res = await fetch(`${API_URL}/v1/api/quoc-gia/${slug}?page=${page}&limit=${limit}`, { next: { revalidate: 3600 } });
        const data = await res.json();

        return {
            items: getItems(data),
            pagination: data.data?.params?.pagination || { currentPage: 1, totalPages: 1 }
        };
    } catch (error) {
        console.error(`Error fetching country [${slug}]:`, error);
        return { items: [], pagination: { currentPage: 1, totalPages: 1 } };
    }
};


// ... existing code ...
import { getTMDBTrending } from "./tmdb";

export const getTrendMovies = async (type: 'movie' | 'tv' | 'all' = 'all') => {
    try {
        // 1. Get Top Trending from TMDB
        const trendList = await getTMDBTrending(type);

        // 2. Map to PhimApi
        // Use Promise.all to search in parallel
        const movies = await Promise.all(trendList.slice(0, 15).map(async (tmdbItem: any) => {
            // Search by Original Name first (most accurate)
            const query = tmdbItem.original_name || tmdbItem.original_title || tmdbItem.name || tmdbItem.title;
            const searchResults = await searchMovies(query);

            // Find best match in PhimApi results
            // We can trust the searchMovies result order mostly, but let's check title similarity if possible
            if (searchResults && searchResults.length > 0) {
                const movie = searchResults[0]; // Take first result

                // Enrich with TMDB metadata immediately for the UI
                // We can manually attach the TMDB poster/backdrop here if we want to force it
                return {
                    ...movie,
                    // Override with TMDB high-res images if available
                    poster_url: tmdbItem.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbItem.poster_path}` : movie.poster_url,
                    thumb_url: tmdbItem.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbItem.backdrop_path}` : movie.thumb_url,
                    // Add extra metadata for UI
                    vote_average: tmdbItem.vote_average,
                };
            }
            return null;
        }));

        // 3. Filter nulls and return valid movies
        return movies.filter((m: any) => m !== null); // Return all valid matches (max 20 from 1 TMDB page)

    } catch (error) {
        console.error("Error fetching trend movies:", error);
        return [];
    }
};

export const getMenuData = async () => {
    // ... existing code ...
    try {
        const [categoriesRes, countriesRes] = await Promise.all([
            fetch(`${API_URL}/the-loai`, { next: { revalidate: 86400 } }), // Cache for 24h
            fetch(`${API_URL}/quoc-gia`, { next: { revalidate: 86400 } })
        ]);

        const categories = await categoriesRes.json();
        const countries = await countriesRes.json();

        return {
            categories: Array.isArray(categories) ? categories : [],
            countries: Array.isArray(countries) ? countries : []
        };
    } catch (error) {
        console.error("Error fetching menu data:", error);
        return { categories: [], countries: [] };
    }
};
