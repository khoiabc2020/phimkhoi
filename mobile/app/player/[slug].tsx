import { View, ActivityIndicator, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useState, useEffect } from 'react';
import { getMovieDetail, Movie } from '@/services/api';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';

export default function PlayerScreen() {
    const { slug, ep } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const { user, token, syncHistory } = useAuth();

    useEffect(() => {
        // Lock to Landscape
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

        return () => {
            // Unlock on exit
            ScreenOrientation.unlockAsync();
        };
    }, []);

    useEffect(() => {
        const fetchVideo = async () => {
            if (!slug) return;
            const data = await getMovieDetail(slug as string);
            if (data && data.episodes) {
                // Find episode
                let episode;
                if (ep) {
                    // Flatten episodes to find by slug
                    const allEps = data.episodes.flatMap((s: any) => s.server_data);
                    episode = allEps.find((e: any) => e.slug === ep);
                } else {
                    // Default to first episode
                    episode = data.episodes[0]?.server_data?.[0];
                }

                if (episode) {
                    setVideoUrl(episode.link_embed);

                    // Add to history if logged in
                    if (user && token) {
                        try {
                            // Delay slightly to ensure valid view
                            setTimeout(() => {
                                fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/history`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                        slug,
                                        episode: episode.slug,
                                        progress: 0
                                    })
                                }).then(() => syncHistory());
                            }, 5000); // Record after 5 seconds
                        } catch (e) {
                            console.error("Failed to sync history", e);
                        }
                    }
                }
            }
            setLoading(false);
        };
        fetchVideo();
    }, [slug, ep]);

    const handleClose = () => {
        router.back();
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

            <WebView
                source={{ uri: videoUrl }}
                style={{ flex: 1, backgroundColor: 'black' }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsFullscreenVideo={true}
                userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            />

            {/* Close Button (Overlay) */}
            <TouchableOpacity
                onPress={handleClose}
                style={{ position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 }}
            >
                <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}
