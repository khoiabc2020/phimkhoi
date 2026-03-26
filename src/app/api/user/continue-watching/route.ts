import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import WatchHistory from "@/models/WatchHistory";
import { authOptions } from "../../auth/[...nextauth]/route";
import { resolveLibraryUser } from "@/lib/user-library";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userIdCandidates } = await resolveLibraryUser(session.user);
    if (!userIdCandidates.length) {
      return NextResponse.json({ success: true, data: [] });
    }

    const continueWatching = await WatchHistory.aggregate([
      {
        $match: {
          userId: { $in: userIdCandidates },
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
      {
        headers: {
          // 20s cache giảm tải VPS; đồng bộ vẫn nhanh khi user xem tiếp
          "Cache-Control": "private, max-age=20, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Continue watching API error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}

