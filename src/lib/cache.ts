import { unstable_cache } from "next/cache";

const API_URL = "https://phimapi.com";

// Generic fetch function
const fetchData = async (endpoint: string) => {
    const res = await fetch(`${API_URL}/${endpoint}`);
    if (!res.ok) {
        throw new Error(`Failed to fetch data from ${endpoint}`);
    }
    return res.json();
};

// Cached version
export const getCachedData = unstable_cache(
    async (endpoint: string) => fetchData(endpoint),
    ["phim-api-data"], // Base key
    { revalidate: 3600, tags: ["phim-api"] } // Default revalidate 1 hour
);
