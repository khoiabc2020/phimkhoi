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
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [selectedServer, setSelectedServer] = useState(0);

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

                // Store full episodes data
                setEpisodes(data.episodes);

                let episode;
                // Get episodes from SELECTED server
                const currentServerData = data.episodes[selectedServer]?.server_data || [];

                if (ep) {
                    episode = currentServerData.find((e: any) => e.slug === ep);
                    // If not found in current server (e.g. switched from link), maybe try searching all? 
                    // But for now assume consistent navigation.
                    if (!episode) {
                        // Fallback: search in all servers and switch server index?
                        // This logic is complex. Simplified: just use first if not found.
                        episode = currentServerData[0];
                    }
                } else {
                    episode = currentServerData[0];
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
                    // Find next episode in CURRENT server
                    const currentIndex = currentServerData.findIndex((e: any) => e.slug === episode.slug);
                    if (currentIndex !== -1 && currentIndex < currentServerData.length - 1) {
                        setNextEpisodeSlug(currentServerData[currentIndex + 1].slug);
                    } else {
                        setNextEpisodeSlug(null);
                    }
                }
            }
            setLoading(false);
        };
        fetchVideo();
    }, [slug, ep, selectedServer]);

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
                    // New Props
                    episodeList={episodes[selectedServer]?.server_data || []}
                    serverList={episodes.map((s: any) => s.server_name)}
                    currentServerIndex={selectedServer}
                    currentEpisodeSlug={ep as string}
                    onEpisodeChange={(newSlug) => {
                        router.replace(`/player/${slug}?ep=${newSlug}`);
                    }}
                    onServerChange={(newServerIndex) => {
                        setSelectedServer(newServerIndex);
                        // Try to find same episode in new server, else first
                        const currentEpName = episodeTitle; // Heuristic using name or index
                        const newServerData = episodes[newServerIndex]?.server_data || [];
                        // Simple matching by index or slug if possible, but slug might differ.
                        // For now, default to first episode of new server if slug mismatch, 
                        // OR try to match index.
                        // Better: Find episode with same 'name'
                        const sameEp = newServerData.find((e: any) => e.name === currentEpName);
                        const targetEp = sameEp || newServerData[0];

                        if (targetEp) {
                            router.replace(`/player/${slug}?ep=${targetEp.slug}`);
                        }
                    }}
                />
            ) : (
                <>
                    <WebView
                        key={videoUrl} // Force reload on url change
                        source={{ uri: videoUrl }}
                        style={{ flex: 1, backgroundColor: 'black' }}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsFullscreenVideo={true}
                        userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                        onError={(e) => console.log('WebView Error:', e.nativeEvent)}
                        renderError={() => (
                            <View className="flex-1 justify-center items-center bg-black">
                                <Text className="text-white mb-4">Lỗi tải video. Vui lòng thử lại.</Text>
                                <TouchableOpacity onPress={() => setVideoUrl(videoUrl + '?retry=1')} className="bg-[#fbbf24] px-4 py-2 rounded">
                                    <Text className="font-bold">Tải lại</Text>
                                </TouchableOpacity>
                            </View>
                        )}
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
