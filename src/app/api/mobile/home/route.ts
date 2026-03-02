import { NextResponse } from 'next/server';
import { getHomeData } from '@/services/api';

export async function GET() {
    try {
        const data = await getHomeData();

        return NextResponse.json(
            {
                data,
                generatedAt: new Date().toISOString()
            },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
                }
            }
        );
    } catch (error) {
        console.error('Mobile Home API error:', error);
        return NextResponse.json({ error: 'Server error', data: null }, { status: 500 });
    }
}
