
import { getServerSession } from "next-auth";
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
        <main className="min-h-screen bg-black pt-24 pb-20">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <ProfileTabs
                    user={session.user}
                    favorites={favorites || []}
                    history={history || []}
                />
            </div>
        </main>
    );
}
