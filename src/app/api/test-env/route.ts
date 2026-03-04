import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        nextAuthUrl: process.env.NEXTAUTH_URL || "MISSING",
        nextAuthSecret: process.env.NEXTAUTH_SECRET ? "EXISTS" : "MISSING",
        nodeEnv: process.env.NODE_ENV,
        mongoUri: process.env.MONGODB_URI ? "EXISTS" : "MISSING",
        googleId: process.env.GOOGLE_CLIENT_ID ? "EXISTS" : "MISSING"
    });
}
