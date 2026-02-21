import mongoose, { Document, Schema } from "mongoose";

export interface IMovieInPlaylist {
    movieId: string;
    movieSlug: string;
    movieName: string;
    movieOriginName?: string;
    moviePoster?: string;
    movieYear?: number;
    movieQuality?: string;
}

export interface IPlaylist extends Document {
    userId: string;
    name: string;
    movies: IMovieInPlaylist[];
    createdAt: Date;
    updatedAt: Date;
}

const MovieInPlaylistSchema = new Schema<IMovieInPlaylist>(
    {
        movieId: { type: String, required: true },
        movieSlug: { type: String, required: true },
        movieName: { type: String, required: true },
        movieOriginName: { type: String, default: "" },
        moviePoster: { type: String, default: "" },
        movieYear: { type: Number },
        movieQuality: { type: String, default: "HD" },
    },
    { _id: false } // Prevent creating separate ObjectIds for each subdocument
);

const PlaylistSchema = new Schema<IPlaylist>(
    {
        userId: { type: String, required: true, index: true },
        name: { type: String, required: true, trim: true },
        movies: [MovieInPlaylistSchema],
    },
    { timestamps: true }
);

// Prevent users from creating duplicate empty playlists (optional)
// Just index for performance
PlaylistSchema.index({ userId: 1, name: 1 });

export default mongoose.models.Playlist || mongoose.model<IPlaylist>("Playlist", PlaylistSchema);
