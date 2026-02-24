import { View, ActivityIndicator, TouchableOpacity, Text, Dimensions, StatusBar as RNStatusBar, Platform, Alert } from 'react-native';
import ExpoPip from 'expo-pip';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getMovieDetail, saveHistory } from '@/services/api';
import { getLocalPlayUri } from '@/lib/downloads';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';
import NativePlayer from '@/components/NativePlayer';
import { useMiniPlayer } from '@/context/miniplayer';

const PIP_SIZES = { small: { w: 200, h: 113 }, medium: { w: 240, h: 135 }, large: { w: 300, h: 169 } } as const;
const PIP_LABELS: Record<keyof typeof PIP_SIZES, string> = { small: 'Nhỏ', medium: 'Vừa', large: 'Lớn' };
type PipSizeKey = keyof typeof PIP_SIZES;

export default function PlayerScreen() {
    const { slug, ep, server, localUri: localUriParam } = useLocalSearchParams();
    const router = useRouter();
    const { openMini } = useMiniPlayer();
    const [loading, setLoading] = useState(true);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isNative, setIsNative] = useState(false);
    const [movieTitle, setMovieTitle] = useState("");
    const [episodeTitle, setEpisodeTitle] = useState("");
    const [nextEpisodeSlug, setNextEpisodeSlug] = useState<string | null>(null);
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [selectedServer, setSelectedServer] = useState(server ? Number(server) : 0);
    const [pipSize, setPipSize] = useState<PipSizeKey>('medium');

    const { user, token, syncHistory } = useAuth();

    const cyclePipSize = useCallback(() => {
        setPipSize((prev) => {
            const next: PipSizeKey = prev === 'small' ? 'medium' : prev === 'medium' ? 'large' : 'small';
            Alert.alert('Cỡ PiP', `Đã chọn: ${PIP_LABELS[next]}. Bấm nút PiP để áp dụng.`);
            return next;
        });
    }, []);

    // Create a stable ref to syncHistory so we can call it on unmount safely without recreating the effect
    const syncHistoryRef = useRef(syncHistory);
    useEffect(() => {
        syncHistoryRef.current = syncHistory;
    }, [syncHistory]);

    // Force sync when component unmounts (e.g. system back gesture)
    useEffect(() => {
        return () => {
            syncHistoryRef.current();
        };
    }, []);

    useEffect(() => {
        // Lock to Landscape
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        return () => {
            ScreenOrientation.unlockAsync();
        };
    }, []);

    const applyEpisode = useCallback((data: any, serverIndex: number, episodeSlug?: string | string[] | null) => {
        if (!data || !data.episodes) return;
        setEpisodes(data.episodes);

        const serverData = data.episodes[serverIndex]?.server_data || [];
        let epObj: { slug: string; name: string; link_m3u8?: string; link_embed?: string } | undefined;

        if (episodeSlug) {
            epObj = serverData.find((e: any) => e.slug === episodeSlug) || serverData[0];
        } else {
            epObj = serverData[0];
        }

        if (!epObj) return;

        setEpisodeTitle(epObj.name);

        if (epObj.link_m3u8 && !epObj.link_m3u8.includes('youtube')) {
            setVideoUrl(epObj.link_m3u8);
            setIsNative(true);
        } else {
            setVideoUrl(epObj.link_embed ?? '');
            setIsNative(false);
        }

        const idx = serverData.findIndex((e: any) => e.slug === epObj!.slug);
        if (idx !== -1 && idx < serverData.length - 1) {
            setNextEpisodeSlug(serverData[idx + 1].slug ?? null);
        } else {
            setNextEpisodeSlug(null);
        }
    }, []);

    useEffect(() => {
        const fetchVideo = async () => {
            if (!slug) return;
            setLoading(true);
            const localUriDecoded = typeof localUriParam === 'string' ? decodeURIComponent(localUriParam) : null;
            const localFromStore = ep && slug ? await getLocalPlayUri(slug as string, ep as string) : null;
            const useLocal = localUriDecoded || localFromStore;

            if (useLocal) {
                setVideoUrl(useLocal);
                setIsNative(true);
                setMovieTitle('');
                setEpisodeTitle(ep ? `Tập ${String(ep).replace(/^.*-/, '')}` : 'Offline');
                setNextEpisodeSlug(null);
                setEpisodes([]);
                setLoading(false);
                return;
            }

            const data = await getMovieDetail(slug as string);
            if (data && data.episodes) {
                setMovieTitle(data.movie?.name || "");
                applyEpisode(data, selectedServer, ep);
            }
            setLoading(false);
        };
        fetchVideo();
    }, [slug, ep, selectedServer, localUriParam, applyEpisode]);

    const handleProgress = async (currentTime: number, duration: number) => {
        if (!user || !token || !slug || !ep) return;

        try {
            const progressSeconds = Math.floor(currentTime / 1000);
            const durationSeconds = Math.floor(duration / 1000);
            await saveHistory(slug as string, ep as string, progressSeconds, durationSeconds, token);
        } catch (e) {
            console.error("Failed to sync history", e);
        }
    };

    const handleClose = () => {
        router.back();
    };

    const handleNextEpisode = () => {
        if (!nextEpisodeSlug || !episodes.length) return;
        applyEpisode({ episodes }, selectedServer, nextEpisodeSlug);
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

    const currentHistory = user?.history?.find((h: any) => h.slug === slug && h.episode === ep);
    const initialTime = currentHistory?.currentTime ? currentHistory.currentTime * 1000 : 0;

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
                    onPiP={async () => {
                        if (Platform.OS === 'android' && ExpoPip.isAvailable()) {
                            const { w, h } = PIP_SIZES[pipSize];
                            ExpoPip.setPictureInPictureParams({
                                title: movieTitle || 'Phim',
                                subtitle: episodeTitle || '',
                                width: w,
                                height: h,
                                seamlessResizeEnabled: true,
                            });
                            await new Promise((r) => setTimeout(r, 150));
                            await ExpoPip.enterPipMode({ width: w, height: h });
                        } else {
                            openMini({ url: videoUrl, title: movieTitle, episode: episodeTitle });
                            router.back();
                        }
                    }}
                    onPipSizeCycle={cyclePipSize}
                    onProgress={handleProgress}
                    initialTime={initialTime}
                    // New Props

                    episodeList={episodes[selectedServer]?.server_data || []}
                    serverList={episodes.map((s: any) => s.server_name)}
                    currentServerIndex={selectedServer}
                    currentEpisodeSlug={ep as string}
                    onEpisodeChange={(newSlug) => {
                        applyEpisode({ episodes }, selectedServer, newSlug);
                    }}
                    onServerChange={(newServerIndex) => {
                        setSelectedServer(newServerIndex);
                        applyEpisode({ episodes }, newServerIndex, ep);
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
