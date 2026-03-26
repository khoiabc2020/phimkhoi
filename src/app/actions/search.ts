"use server";

import { getRealtimeSearchData } from "@/services/realtime-search";

export async function getRealtimeSearch(query: string, enrichTMDB: boolean = false) {
    void enrichTMDB;
    return getRealtimeSearchData(query);
}
