import { getSettings } from "@/app/actions/settings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/SettingsForm";

const DEFAULT_SETTINGS = {
    notifications: {
        email: true,
        newMovies: true,
        newEpisodes: true,
    },
    preferences: {
        language: "vi" as const,
        theme: "dark" as const,
        autoplay: true,
        quality: "auto" as const,
    },
};

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    const settingsResult = await getSettings();
    const settings = settingsResult.success && settingsResult.data
        ? settingsResult.data
        : DEFAULT_SETTINGS;

    return <SettingsForm initialSettings={settings} />;
}
