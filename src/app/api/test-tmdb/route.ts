import { NextResponse } from 'next/server';
import { searchTMDBMovie } from '@/services/tmdb';

export async function GET() {
    const r1 = await searchTMDBMovie('Pursuit Of Jade', 2026, 'tv', { originalName: 'Pursuit Of Jade', localName: 'Trực Ngọc', countrySlug: 'trung-quoc' });
    const r2 = await searchTMDBMovie('Pursuit Of Jade', 2025, 'tv', { originalName: 'Pursuit Of Jade', localName: 'Trực Ngọc', countrySlug: 'trung-quoc' });
    return NextResponse.json({ test2026: r1, test2025: r2 });
}
