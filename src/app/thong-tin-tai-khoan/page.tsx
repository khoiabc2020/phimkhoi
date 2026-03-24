
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
        getWatchHistory(50)
    ]);

    const favorites = favoritesResult.success ? favoritesResult.data : [];
    const history = historyResult.success ? historyResult.data : [];

    return (
        <main className="min-h-screen pt-24 pb-20">
            <div className="w-full max-w-[1920px] mx-auto px-4 lg:pl-24 lg:pr-12 relative z-10">
                <ProfileTabs
                    user={session.user}
                    favorites={favorites || []}
                    history={history || []}
                />
            </div>
        </main>
    );
}
