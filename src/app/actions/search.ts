"use server";

import { getRealtimeSearchData, searchMoviesFromDB } from "@/services/realtime-search";
import { searchTMDBPerson } from "@/services/tmdb";

export async function getRealtimeSearch(query: string, enrichTMDB: boolean = false) {
    void enrichTMDB;
    return getRealtimeSearchData(query);
}

export async function searchMoviesAction(keyword: string, options?: { limit?: number }) {
    try {
        const limit = options?.limit ?? 48;
        return await searchMoviesFromDB(keyword, limit);
    } catch (e) {
        console.error("error in searchMoviesAction", e);
        return [];
    }
}

export async function searchTMDBPersonAction(keyword: string) {
    try {
        return await searchTMDBPerson(keyword);
    } catch (e) {
        console.error("error in searchTMDBPersonAction", e);
        return [];
    }
}
