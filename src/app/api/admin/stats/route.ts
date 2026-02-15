import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Comment from "@/models/Comment";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const [userCount, commentCount] = await Promise.all([
            User.countDocuments(),
            Comment.countDocuments(),
        ]);
        // Aggregate users by month (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const userStats = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Integrate with existing response
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const chartData = userStats.map(stat => ({
            name: months[stat._id - 1],
            users: stat.count,
            views: Math.floor(Math.random() * 5000) + 1000 // Mock views for now as we don't track them yet
        }));

        // Fill missing months if needed, or just return what we have

        return NextResponse.json({
            users: userCount,
            comments: commentCount,
            movies: movieCount,
            active: Math.floor(Math.random() * 100) + 800,
            chartData
        });
    } catch (error) {
        console.error("Admin Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
