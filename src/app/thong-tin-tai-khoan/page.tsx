
import { getServerSession } from "next-auth";
export const dynamic = "force-dynamic";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ProfileTabs from "@/components/ProfileTabs";
import { getFavorites } from "@/app/actions/favorites";
import { getWatchHistory } from "@/app/actions/watchHistory";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const [favoritesResult, historyResult] = await Promise.all([
        getFavorites(),
        getWatchHistory(1, 50)
    ]);

    const favorites = favoritesResult.success ? favoritesResult.data : [];
    const history = historyResult.success ? historyResult.data : [];
    const historyTotal = historyResult.success ? (historyResult.total ?? history?.length ?? 0) : 0;

    return (
        <main className="min-h-screen pt-24 pb-20 bg-[#0a0a0a] relative overflow-hidden">
            {/* Subtle gradient glow */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-[#8FA7C5]/7 blur-[160px] rounded-full" />
                <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-violet-500/4 blur-[120px] rounded-full" />
            </div>
            <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-8 lg:pl-24 lg:pr-12 relative z-10">
                <ProfileTabs
                    user={session.user}
                    favorites={favorites || []}
                    history={history || []}
                    historyTotal={historyTotal}
                />
            </div>
        </main>
    );
}
