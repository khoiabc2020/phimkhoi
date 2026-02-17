import { View, ActivityIndicator, TouchableOpacity, Text, Dimensions, StatusBar as RNStatusBar } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useState, useEffect } from 'react';
import { getMovieDetail } from '@/services/api';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';
import NativePlayer from '@/components/NativePlayer';

export default function PlayerScreen() {
    const { slug, ep } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isNative, setIsNative] = useState(false);
    const [movieTitle, setMovieTitle] = useState("");
    const [episodeTitle, setEpisodeTitle] = useState("");
    const [nextEpisodeSlug, setNextEpisodeSlug] = useState<string | null>(null);

    const { user, token, syncHistory } = useAuth();

    useEffect(() => {
        // Lock to Landscape
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        return () => {
            ScreenOrientation.unlockAsync();
        };
    }, []);

    useEffect(() => {
        const fetchVideo = async () => {
            if (!slug) return;
            setLoading(true);
            const data = await getMovieDetail(slug as string);
            if (data && data.episodes) {
                setMovieTitle(data.movie?.name || "");

                // Find episode
                let episode;
                let allEps: any[] = [];

                if (data.episodes.length > 0) {
                    allEps = data.episodes.flatMap((s: any) => s.server_data);
                }

                if (ep) {
                    episode = allEps.find((e: any) => e.slug === ep);
                } else {
                    episode = allEps[0];
                }

                if (episode) {
                    setEpisodeTitle(episode.name);

                    // Determine video source
                    if (episode.link_m3u8 && !episode.link_m3u8.includes('youtube')) {
                        // Use Native Player DIRECTLY (No Proxy)
                        // const proxyUrl = `${CONFIG.BACKEND_URL}/api/hls-proxy?url=${encodeURIComponent(episode.link_m3u8)}`;
                        setVideoUrl(episode.link_m3u8);
                        setIsNative(true);
                    } else {
                        // Fallback to Embed (WebView)
                        setVideoUrl(episode.link_embed);
                        setIsNative(false);
                    }

                    // Find next episode
                    const currentIndex = allEps.findIndex((e: any) => e.slug === episode.slug);
                    if (currentIndex !== -1 && currentIndex < allEps.length - 1) {
                        setNextEpisodeSlug(allEps[currentIndex + 1].slug);
                    } else {
                        setNextEpisodeSlug(null);
                    }
                }
            }
            setLoading(false);
        };
        fetchVideo();
    }, [slug, ep]);

    const handleProgress = async (currentTime: number, duration: number) => {
        if (!user || !token || !slug || !ep) return;

        try {
            // Convert to seconds for backend
            const progressSeconds = Math.floor(currentTime / 1000);
            const durationSeconds = Math.floor(duration / 1000);

            await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    slug,
                    episode: ep,
                    progress: progressSeconds, // Backend expects seconds or percentage? API Analysis needed.
                    duration: durationSeconds
                })
            });
            // Don't call syncHistory() every 5s, it might be too heavy. 
            // Maybe only on unmount or pause? For now, we rely on backend having truth.
        } catch (e) {
            console.error("Failed to sync history", e);
        }
    };

    const handleClose = () => {
        syncHistory(); // Sync when closing player
        router.back();
    };

    const handleNextEpisode = () => {
        syncHistory();
        if (nextEpisodeSlug) {
            router.replace(`/player/${slug}?ep=${nextEpisodeSlug}`);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <StatusBar hidden />
                <ActivityIndicator size="large" color="#fbbf24" />
            </View>
        );
    }

    if (!videoUrl) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <StatusBar hidden />
                <Text className="text-white">Không tìm thấy video</Text>
                <TouchableOpacity onPress={handleClose} className="mt-4 bg-gray-800 px-4 py-2 rounded">
                    <Text className="text-white">Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black relative">
            <StatusBar hidden />
            <Stack.Screen options={{ headerShown: false }} />

            {isNative ? (
                <NativePlayer
                    url={videoUrl}
                    title={movieTitle}
                    episode={episodeTitle}
                    onClose={handleClose}
                    onNext={nextEpisodeSlug ? handleNextEpisode : undefined}
                    onProgress={handleProgress}
                />
            ) : (
                <>
                    <WebView
                        source={{ uri: videoUrl }}
                        style={{ flex: 1, backgroundColor: 'black' }}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsFullscreenVideo={true}
                        userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    />
                    <TouchableOpacity
                        onPress={handleClose}
                        style={{ position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 }}
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}
