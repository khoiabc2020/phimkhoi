"use server";

import { getRealtimeSearchData } from "@/services/realtime-search";
import { searchMovies } from "@/services/api";
import { searchTMDBPerson } from "@/services/tmdb";

export async function getRealtimeSearch(query: string, enrichTMDB: boolean = false) {
    void enrichTMDB;
    return getRealtimeSearchData(query);
}

export async function searchMoviesAction(keyword: string, options?: any) {
    try {
        return await searchMovies(keyword, options);
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
