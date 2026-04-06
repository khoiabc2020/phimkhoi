import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Watchlist from "@/models/Watchlist";
import Movie from "@/models/Movie";

type SessionUserLike = {
    id?: string | null;
    email?: string | null;
};

type LeanUser = {
    _id: string;
    email?: string;
};

export type LibraryMovieCard = {
    slug: string;
    name: string;
    origin_name?: string;
    poster?: string;
    year?: number;
    quality?: string;
    movieId?: string;
    categories?: string[];
};

function uniqueStrings(values: Array<string | undefined | null>) {
    return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function toLibraryMovieCard(movie: any): LibraryMovieCard | null {
    const slug = String(movie?.movieSlug || movie?.slug || "").trim();
    if (!slug) return null;

    return {
        slug,
        movieId: String(movie?.movieId || movie?._id || slug),
        name: String(movie?.movieName || movie?.name || slug),
        origin_name: String(movie?.movieOriginName || movie?.origin_name || movie?.original_name || "").trim(),
        poster: String(movie?.moviePoster || movie?.poster_url || movie?.thumb_url || "").trim(),
        year: Number(movie?.movieYear || movie?.year || 0) || undefined,
        quality: String(movie?.movieQuality || movie?.quality || "").trim() || undefined,
        categories: Array.isArray(movie?.movieCategories)
            ? movie.movieCategories
            : Array.isArray(movie?.category)
                ? movie.category.map((item: any) => String(item?.slug || item?.name || "").trim()).filter(Boolean)
                : [],
    };
}

export async function resolveLibraryUser(sessionUser: SessionUserLike) {
    await dbConnect();

    const sessionId = String(sessionUser?.id || "").trim();
    const sessionEmail = String(sessionUser?.email || "").trim().toLowerCase();
    let user: LeanUser | null = null;

    if (sessionId && mongoose.isValidObjectId(sessionId)) {
        user = await User.findById(sessionId).select("_id email").lean<LeanUser | null>();
    }

    if (!user && sessionEmail) {
        user = await User.findOne({ email: sessionEmail }).select("_id email").lean<LeanUser | null>();
    }

    const userObjectId = user?._id ? String(user._id) : null;
    const userIdCandidates = uniqueStrings([sessionId, userObjectId]);

    return { user, userObjectId, userIdCandidates };
}

export async function getMergedWatchlist(sessionUser: SessionUserLike) {
    const { user, userObjectId, userIdCandidates } = await resolveLibraryUser(sessionUser);

    if (!userObjectId && !userIdCandidates.length) {
        return { user, userObjectId, userIdCandidates, slugs: [] as string[], movies: [] as LibraryMovieCard[] };
    }

    // Single source of truth: Watchlist collection
    const watchlistDocs = userObjectId && mongoose.isValidObjectId(userObjectId)
        ? await Watchlist.find({ userId: userObjectId }).sort({ addedAt: -1 }).lean()
        : [];

    const storedCards = watchlistDocs
        .map((doc) => toLibraryMovieCard(doc))
        .filter(Boolean) as LibraryMovieCard[];

    const slugOrder = uniqueStrings(storedCards.map((movie) => movie.slug));

    // Enrich any cards missing poster/name from Movie collection
    const missingSlugs = slugOrder.filter(
        (slug) => !storedCards.some((movie) => movie.slug === slug && movie.poster)
    );

    const movieDocs = missingSlugs.length
        ? await Movie.find({ slug: { $in: missingSlugs } })
            .select("_id slug name origin_name poster_url thumb_url year quality category")
            .lean()
        : [];

    const movieDocCards = movieDocs
        .map((doc) => toLibraryMovieCard(doc))
        .filter(Boolean) as LibraryMovieCard[];

    const cardBySlug = new Map<string, LibraryMovieCard>();
    for (const movie of [...storedCards, ...movieDocCards]) {
        if (!movie?.slug || cardBySlug.has(movie.slug)) continue;
        cardBySlug.set(movie.slug, movie);
    }

    const movies = slugOrder
        .map((slug) => cardBySlug.get(slug))
        .filter(Boolean) as LibraryMovieCard[];

    return { user, userObjectId, userIdCandidates, slugs: slugOrder, movies };
}

export async function setWatchlistMembership(
    sessionUser: SessionUserLike,
    slug: string,
    action: "add" | "remove",
    movieSeed?: Partial<LibraryMovieCard>
) {
    const normalizedSlug = String(slug || "").trim();
    if (!normalizedSlug) return { success: false, error: "Missing slug" };

    const { user, userObjectId } = await resolveLibraryUser(sessionUser);
    if (!userObjectId) return { success: false, error: "User not found" };

    if (action === "add") {
        const movieDoc = await Movie.findOne({ slug: normalizedSlug })
            .select("_id slug name origin_name poster_url thumb_url year quality category")
            .lean();

        const movie = toLibraryMovieCard(movieDoc) || null;
        const fallbackMovie = {
            slug: normalizedSlug,
            movieId: String(movieSeed?.movieId || normalizedSlug),
            name: String(movieSeed?.name || normalizedSlug),
            origin_name: String(movieSeed?.origin_name || ""),
            poster: String(movieSeed?.poster || ""),
            year: Number(movieSeed?.year || 0) || new Date().getFullYear(),
            quality: String(movieSeed?.quality || "HD"),
            categories: Array.isArray(movieSeed?.categories) ? movieSeed.categories : [],
        };

        const sourceMovie = movie || fallbackMovie;

        await Watchlist.updateOne(
            { userId: userObjectId, movieSlug: normalizedSlug },
            {
                $setOnInsert: {
                    userId: userObjectId,
                    movieId: sourceMovie.movieId || normalizedSlug,
                    movieSlug: normalizedSlug,
                    movieName: sourceMovie.name || normalizedSlug,
                    movieOriginName: sourceMovie.origin_name || "",
                    moviePoster: sourceMovie.poster || "",
                    movieYear: sourceMovie.year || new Date().getFullYear(),
                    movieQuality: sourceMovie.quality || "HD",
                    movieCategories: sourceMovie.categories || [],
                    addedAt: new Date(),
                },
            },
            { upsert: true }
        );
    } else {
        await Watchlist.deleteOne({ userId: userObjectId, movieSlug: normalizedSlug });
    }

    const merged = await getMergedWatchlist({ id: userObjectId, email: user?.email });
    return { success: true, slugs: merged.slugs, movies: merged.movies };
}

export function mapWatchlistMovieToApi(movie: LibraryMovieCard) {
    return {
        slug: movie.slug,
        movieSlug: movie.slug,
        movieId: movie.movieId || movie.slug,
        movieName: movie.name,
        movieOriginName: movie.origin_name || "",
        moviePoster: movie.poster || "",
        movieYear: movie.year || undefined,
        movieQuality: movie.quality || "",
        movieCategories: movie.categories || [],
        name: movie.name,
        origin_name: movie.origin_name || "",
        poster: movie.poster || "",
        year: movie.year || undefined,
        quality: movie.quality || "",
    };
}
