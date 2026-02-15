"use client";

import { Settings, ArrowLeft, User, Bell, Globe, Palette, Save } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { updateSettings } from "@/app/actions/settings";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
    initialSettings: any;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [settings, setSettings] = useState(initialSettings);
    const [isPending, startTransition] = useTransition();
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const router = useRouter();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveStatus("saving");

        startTransition(async () => {
            const result = await updateSettings(settings);
            if (result.success) {
                setSaveStatus("saved");
                router.refresh();
                setTimeout(() => setSaveStatus("idle"), 2000);
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-12">
            <div className="container mx-auto px-4 md:px-12 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <Settings className="w-8 h-8 text-gray-400" />
                        <h1 className="text-3xl md:text-4xl font-bold text-white">Cài Đặt</h1>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Notifications Section */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <div className="flex items-center gap-3 mb-6">
                            <Bell className="w-6 h-6 text-yellow-400" />
                            <h2 className="text-xl font-bold text-white">Thông Báo</h2>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-gray-300 group-hover:text-white transition-colors">
                                    Nhận thông báo qua email
                                </span>
                                <input
                                    type="checkbox"
                                    checked={settings.notifications?.email}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            notifications: {
                                                ...settings.notifications,
                                                email: e.target.checked,
                                            },
                                        })
                                    }
                                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-red-500 focus:ring-2 focus:ring-red-500"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-gray-300 group-hover:text-white transition-colors">
                                    Thông báo phim mới
                                </span>
                                <input
                                    type="checkbox"
                                    checked={settings.notifications?.newMovies}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            notifications: {
                                                ...settings.notifications,
                                                newMovies: e.target.checked,
                                            },
                                        })
                                    }
                                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-red-500 focus:ring-2 focus:ring-red-500"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-gray-300 group-hover:text-white transition-colors">
                                    Thông báo tập phim mới
                                </span>
                                <input
                                    type="checkbox"
                                    checked={settings.notifications?.newEpisodes}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            notifications: {
                                                ...settings.notifications,
                                                newEpisodes: e.target.checked,
                                            },
                                        })
                                    }
                                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-red-500 focus:ring-2 focus:ring-red-500"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Language Section */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <div className="flex items-center gap-3 mb-6">
                            <Globe className="w-6 h-6 text-green-400" />
                            <h2 className="text-xl font-bold text-white">Ngôn Ngữ</h2>
                        </div>
                        <select
                            value={settings.preferences?.language || "vi"}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    preferences: {
                                        ...settings.preferences,
                                        language: e.target.value,
                                    },
                                })
                            }
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="vi">Tiếng Việt</option>
                            <option value="en">English</option>
                        </select>
                    </div>

                    {/* Theme Section */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <div className="flex items-center gap-3 mb-6">
                            <Palette className="w-6 h-6 text-purple-400" />
                            <h2 className="text-xl font-bold text-white">Giao Diện</h2>
                        </div>
                        <select
                            value={settings.preferences?.theme || "dark"}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    preferences: {
                                        ...settings.preferences,
                                        theme: e.target.value,
                                    },
                                })
                            }
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="dark">Tối</option>
                            <option value="light">Sáng</option>
                            <option value="auto">Tự động</option>
                        </select>
                    </div>

                    {/* Video Preferences */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <div className="flex items-center gap-3 mb-6">
                            <User className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-bold text-white">Video</h2>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-gray-300 group-hover:text-white transition-colors">
                                    Tự động phát tập tiếp theo
                                </span>
                                <input
                                    type="checkbox"
                                    checked={settings.preferences?.autoplay}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            preferences: {
                                                ...settings.preferences,
                                                autoplay: e.target.checked,
                                            },
                                        })
                                    }
                                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-red-500 focus:ring-2 focus:ring-red-500"
                                />
                            </label>
                            <div>
                                <label className="block text-gray-300 mb-2">Chất lượng mặc định</label>
                                <select
                                    value={settings.preferences?.quality || "auto"}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            preferences: {
                                                ...settings.preferences,
                                                quality: e.target.value,
                                            },
                                        })
                                    }
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="auto">Tự động</option>
                                    <option value="1080p">1080p</option>
                                    <option value="720p">720p</option>
                                    <option value="480p">480p</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5" />
                        {saveStatus === "saving"
                            ? "Đang lưu..."
                            : saveStatus === "saved"
                                ? "Đã lưu!"
                                : "Lưu cài đặt"}
                    </button>
                </form>
            </div>
        </div>
    );
}
