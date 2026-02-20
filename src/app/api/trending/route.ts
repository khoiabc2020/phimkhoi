import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

// Read from TrendingCache collection populated by the daily-sync.mjs script
const trendingSchema = new mongoose.Schema({
    type: String,
    movies: Array,
    updatedAt: Date
}, { strict: false });

const TrendingCache = mongoose.models.TrendingCache ||
    mongoose.model('TrendingCache', trendingSchema, 'trendingcache');

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'phim-bo';

        await dbConnect();

        const cache = await TrendingCache.findOne({ type }).lean() as any;

        if (!cache) {
            // If cache doesn't exist yet, return empty (will be populated on first sync)
            return NextResponse.json({ movies: [], updatedAt: null });
        }

        return NextResponse.json({
            movies: cache.movies || [],
            updatedAt: cache.updatedAt,
        }, {
            headers: {
                // Cache in CDN/browser for 1 hour, revalidate in background
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            }
        });
    } catch (error) {
        console.error('Trending cache error:', error);
        return NextResponse.json({ movies: [], error: 'Server error' }, { status: 500 });
    }
}
