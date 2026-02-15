"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import UserSettings from "@/models/UserSettings";
import { revalidatePath } from "next/cache";

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

export async function getSettings() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        let settings = await UserSettings.findOne({ userId: session.user.id }).lean();

        // Create default settings if not exists
        if (!settings) {
            settings = await UserSettings.create({
                userId: session.user.id,
                ...DEFAULT_SETTINGS,
            });
        }

        return { success: true, data: settings };
    } catch (error) {
        console.error("Get settings error:", error);
        return { success: false, error: "Failed to fetch settings" };
    }
}

export async function updateSettings(settingsData: {
    notifications?: {
        email?: boolean;
        newMovies?: boolean;
        newEpisodes?: boolean;
    };
    preferences?: {
        language?: "vi" | "en";
        theme?: "dark" | "light" | "auto";
        autoplay?: boolean;
        quality?: "auto" | "1080p" | "720p" | "480p";
    };
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const settings = await UserSettings.findOneAndUpdate(
            { userId: session.user.id },
            {
                $set: {
                    ...(settingsData.notifications && {
                        notifications: settingsData.notifications,
                    }),
                    ...(settingsData.preferences && {
                        preferences: settingsData.preferences,
                    }),
                },
            },
            {
                upsert: true,
                new: true,
            }
        );

        revalidatePath("/cai-dat");
        return { success: true, data: settings };
    } catch (error) {
        console.error("Update settings error:", error);
        return { success: false, error: "Failed to update settings" };
    }
}

export async function resetSettings() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const settings = await UserSettings.findOneAndUpdate(
            { userId: session.user.id },
            { $set: DEFAULT_SETTINGS },
            { upsert: true, new: true }
        );

        revalidatePath("/cai-dat");
        return { success: true, data: settings };
    } catch (error) {
        console.error("Reset settings error:", error);
        return { success: false, error: "Failed to reset settings" };
    }
}
