import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Comment from "@/models/Comment";
import Movie from "@/models/Movie";
import WatchHistory from "@/models/WatchHistory";
import AuditLog from "@/models/AuditLog";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            userCount,
            commentCount,
            movieCount,
            activeUsersCount,
            totalWatches,
            userStats,
            watchStats,
            recentAuditLogs,
        ] = await Promise.all([
            User.countDocuments(),
            Comment.countDocuments(),
            Movie.countDocuments(),
            // Active = users who watched something in last 30 days
            WatchHistory.distinct("userId", { lastWatched: { $gte: thirtyDaysAgo } }).then(ids => ids.length),
            WatchHistory.countDocuments(),
            // User growth by month (last 6 months)
            User.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
            ]),
            // Watch activity by month (last 6 months)
            WatchHistory.aggregate([
                { $match: { lastWatched: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { year: { $year: "$lastWatched" }, month: { $month: "$lastWatched" } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
            ]),
            // Last 5 audit log entries for activity feed
            AuditLog.find({}).sort({ createdAt: -1 }).limit(5).lean(),
        ]);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Build a map for the last 6 months
        const monthKeys: string[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            monthKeys.push(`${d.getFullYear()}-${d.getMonth() + 1}`);
        }

        const userMap = new Map(userStats.map((s: any) => [`${s._id.year}-${s._id.month}`, s.count]));
        const watchMap = new Map(watchStats.map((s: any) => [`${s._id.year}-${s._id.month}`, s.count]));

        const chartData = monthKeys.map((key) => {
            const [year, month] = key.split("-").map(Number);
            return {
                name: months[month - 1],
                users: userMap.get(key) ?? 0,
                views: watchMap.get(key) ?? 0,
            };
        });

        return NextResponse.json({
            users: userCount,
            comments: commentCount,
            movies: movieCount,
            active: activeUsersCount,
            totalWatches,
            chartData,
            recentActivity: recentAuditLogs,
        });
    } catch (error) {
        console.error("Admin Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
