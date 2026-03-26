"use client";

import { useEffect, useState } from "react";
import { getTMDBEpisodeImages } from "@/app/actions/tmdb";

interface TMDBDataEnrichmentProps {
    movieName: string;
    movieYear?: number;
    originalName?: string;
    countrySlug?: string;
    onDataFetched: (data: any) => void;
}

export default function TMDBDataEnrichment({
    movieName,
    movieYear,
    originalName,
    countrySlug,
    onDataFetched
}: TMDBDataEnrichmentProps) {
    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getTMDBEpisodeImages(movieName, movieYear, {
                    originalName,
                    localName: movieName,
                    countrySlug
                });
                if (data && Object.keys(data).length > 0) {
                    onDataFetched(data);
                }
            } catch (error) {
                console.error("TMDB Enrichment Error:", error);
            }
        }
        fetchData();
    }, [movieName, movieYear, originalName, countrySlug, onDataFetched]);

    return null; // This is a logic-only component that feeds data back to the parent
}
