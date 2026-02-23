import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import WatchHistory from "@/models/WatchHistory";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const continueWatching = await WatchHistory.aggregate([
      {
        $match: {
          userId: session.user.id,
          progress: { $lt: 99 },
        },
      },
      { $sort: { lastWatched: -1 } },
      {
        $group: {
          _id: "$movieId",
          doc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { lastWatched: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json(
      { success: true, data: continueWatching },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Continue watching API error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}

