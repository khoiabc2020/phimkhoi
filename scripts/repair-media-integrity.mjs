#!/usr/bin/env node

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeMovieImages } from "./shared/movie-media.mjs";
import { ASIAN_COUNTRY_RULES, contradictsCountryMetadata, matchesCountryStrict, normalizeCountryToken } from "./shared/movie-country.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI not found in .env.local");
    process.exit(1);
}

const normalizeText = (value) =>
    String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

const TRAILER_MARKERS = ["trailer", "teaser", "preview", "coming soon", "sap chieu", "nha hang"];
const COUNTRY_CACHE_TYPES = new Set(["han-quoc", "trung-quoc", "nhat-ban", "thai-lan", "viet-nam", "dai-loan"]);

const isTrailerMovie = (movie) => {
    if (!movie) return false;
    const haystacks = [
        movie.name,
        movie.origin_name,
        movie.status,
        movie.notify,
        movie.quality,
        movie.episode_current,
        movie.episode_total,
        movie.current_episode,
        movie.type,
    ].map(normalizeText);

    const categoryMatch = Array.isArray(movie.category)
        ? movie.category.some((category) => {
            const slug = normalizeText(category?.slug || "");
            const name = normalizeText(category?.name || "");
            return slug.includes("trailer") || name.includes("trailer");
        })
        : false;

    return categoryMatch || TRAILER_MARKERS.some((marker) => haystacks.some((text) => text.includes(marker)));
};

const movieSchema = new mongoose.Schema({}, { strict: false, collection: "movies" });
const trendingSchema = new mongoose.Schema({}, { strict: false, collection: "trendingcaches" });

const Movie = mongoose.models.MovieRepair || mongoose.model("MovieRepair", movieSchema);
const TrendingCache = mongoose.models.TrendingCacheRepair || mongoose.model("TrendingCacheRepair", trendingSchema);

async function repairMovies({ purgeTrailers = true } = {}) {
    let checked = 0;
    let updated = 0;
    let deleted = 0;
    let repairedCountries = 0;

    const cursor = Movie.find({}).cursor();
    for await (const doc of cursor) {
        checked += 1;
        const plain = doc.toObject();

        if (purgeTrailers && isTrailerMovie(plain)) {
            await Movie.deleteOne({ _id: plain._id });
            deleted += 1;
            continue;
        }

        const normalized = normalizeMovieImages({
            poster_url: plain.poster_url,
            thumb_url: plain.thumb_url,
        });

        let nextCountries = Array.isArray(plain.country) ? [...plain.country] : [];
        if (nextCountries.length > 0) {
            const beforeLength = nextCountries.length;
            nextCountries = nextCountries.filter((country) => {
                const slug = normalizeCountryToken(country?.slug || "").replace(/\s+/g, "-");
                if (!slug || !ASIAN_COUNTRY_RULES[slug]) return true;
                return !contradictsCountryMetadata(plain, slug);
            });
            if (nextCountries.length !== beforeLength) {
                repairedCountries += 1;
            }
        }

        if (
            normalized.poster_url !== (plain.poster_url || "") ||
            normalized.thumb_url !== (plain.thumb_url || "") ||
            JSON.stringify(nextCountries) !== JSON.stringify(Array.isArray(plain.country) ? plain.country : [])
        ) {
            await Movie.updateOne(
                { _id: plain._id },
                {
                    $set: {
                        poster_url: normalized.poster_url,
                        thumb_url: normalized.thumb_url,
                        country: nextCountries,
                        updatedAt: new Date(),
                    },
                }
            );
            updated += 1;
        }
    }

    return { checked, updated, deleted, repairedCountries };
}

async function repairTrendingCaches() {
    let caches = 0;
    let rewritten = 0;

    const docs = await TrendingCache.find({});
    for (const doc of docs) {
        caches += 1;
        const movies = Array.isArray(doc.movies) ? doc.movies : [];
        const nextMovies = movies
            .filter((movie) => !isTrailerMovie(movie))
            .filter((movie) => !COUNTRY_CACHE_TYPES.has(String(doc.type || "")) || matchesCountryStrict(movie, String(doc.type || "")))
            .map((movie) => normalizeMovieImages(movie));

        const changed = JSON.stringify(movies) !== JSON.stringify(nextMovies);
        if (!changed) continue;

        doc.movies = nextMovies;
        doc.updatedAt = new Date();
        await doc.save();
        rewritten += 1;
    }

    return { caches, rewritten };
}

async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const movieStats = await repairMovies({ purgeTrailers: true });
    const cacheStats = await repairTrendingCaches();

    console.log("Repair completed");
    console.log(JSON.stringify({ movieStats, cacheStats }, null, 2));

    await mongoose.disconnect();
}

main().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
