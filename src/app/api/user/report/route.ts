import { NextRequest, NextResponse } from "next/server";
import mongoose, { Schema, Model } from "mongoose";
import dbConnect from "@/lib/db";

// ── Rate limiting ──────────────────────────────────────────────────────────────
// Simple in-memory store: ip → { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return true;
    }

    entry.count += 1;
    return false;
}

// ── Mongoose schema for reports ────────────────────────────────────────────────
interface IReport {
    movieName: string;
    episodeName: string | null;
    url: string;
    description: string;
    ip?: string;
    createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
    {
        movieName: { type: String, required: true },
        episodeName: { type: String, default: null },
        url: { type: String, required: true },
        description: { type: String, required: true },
        ip: { type: String },
    },
    { timestamps: true, collection: "reports" }
);

const Report: Model<IReport> =
    (mongoose.models.Report as Model<IReport>) ||
    mongoose.model<IReport>("Report", ReportSchema);

// ── Route handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    // Determine client IP
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";

    if (isRateLimited(ip)) {
        return NextResponse.json(
            { success: false, error: "Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau." },
            { status: 429 }
        );
    }

    let body: {
        movieName?: string;
        episodeName?: string | null;
        url?: string;
        description?: string;
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON body." },
            { status: 400 }
        );
    }

    const { movieName, episodeName = null, url, description } = body;

    if (!movieName || !url || !description) {
        return NextResponse.json(
            { success: false, error: "Thiếu thông tin bắt buộc." },
            { status: 400 }
        );
    }

    try {
        await dbConnect();

        await Report.create({
            movieName,
            episodeName: episodeName ?? null,
            url,
            description,
            ip,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[report] DB error:", err);
        return NextResponse.json(
            { success: false, error: "Không thể lưu báo cáo. Vui lòng thử lại." },
            { status: 500 }
        );
    }
}
