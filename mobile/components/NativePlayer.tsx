import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Pressable,
    Modal,
    FlatList,
    ScrollView,
} from 'react-native';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { LinearGradient } from 'expo-linear-gradient';
import { useKeepAwake } from 'expo-keep-awake';
import * as Brightness from 'expo-brightness';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

interface NativePlayerProps {
    url: string;
    title: string;
    episode?: string;
    onClose: () => void;
    onNext?: () => void;
    onProgress?: (position: number, duration: number) => void;
    episodeList?: any[];
    serverList?: string[];
    currentServerIndex?: number;
    currentEpisodeSlug?: string;
    onEpisodeChange?: (slug: string) => void;
    onServerChange?: (index: number) => void;
    initialTime?: number; // Add initialTime prop
}

export default function NativePlayer({
    url, title, episode, onClose, onNext, onProgress,
    episodeList = [], serverList = [], currentServerIndex = 0, currentEpisodeSlug, onEpisodeChange, onServerChange,
    initialTime = 0
}: NativePlayerProps) {
    useKeepAwake();
    const video = useRef<Video>(null);
    const [videoSource, setVideoSource] = useState({ uri: url });
    const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
    const [showControls, setShowControls] = useState(true);
    const [resizeMode, setResizeMode] = useState(ResizeMode.CONTAIN);
    const [locked, setLocked] = useState(false); // Lock Control
    const controlTimeout = useRef<any>(null);

    // Modals
    const [showEpisodes, setShowEpisodes] = useState(false);
    const [showServers, setShowServers] = useState(false);

    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const lastProgressUpdate = useRef(0);
    const initialSeekDone = useRef(false);

    // Gesture State
    const [brightness, setBrightness] = useState(0.5);
    const [showBrightnessSlider, setShowBrightnessSlider] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            // ... Brightness permission
            const { status } = await Brightness.requestPermissionsAsync();
            if (status === 'granted') {
                const cur = await Brightness.getBrightnessAsync();
                setBrightness(cur);
            }
        })();
    }, []);

    useEffect(() => {
        resetControlsTimer();
        return () => {
            if (controlTimeout.current) clearTimeout(controlTimeout.current);
        };
    }, [showControls]);

    const resetControlsTimer = () => {
        if (controlTimeout.current) clearTimeout(controlTimeout.current);
        if (showControls && !locked) {
            controlTimeout.current = setTimeout(() => {
                setShowControls(false);
            }, 4000);
        }
    };

    const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        setStatus(status);
        if (status.isLoaded) {
            // Auto-resume logic
            if (!initialSeekDone.current && initialTime > 0) {
                video.current?.setPositionAsync(initialTime);
                initialSeekDone.current = true;
            }

            if (!isSeeking.current) {
                setSliderValue(status.positionMillis);
            }

            if (status.isPlaying) {
                const currentTime = status.positionMillis;
                const duration = status.durationMillis || 0;

                // Save history every 5 seconds
                if (currentTime - lastProgressUpdate.current > 5000) {
                    lastProgressUpdate.current = currentTime;
                    if (onProgress) onProgress(currentTime, duration);
                }
            }
        }
    };

    const toggleControls = () => {
        if (locked) {
            setShowControls(true); // Briefly show controls to allow unlocking
            resetControlsTimer(); // Hide again quickly
            return;
        }
        setShowControls(!showControls);
        if (!showControls) resetControlsTimer();
    };

    const handlePlayPause = async () => {
        if (locked || !video.current) return;
        if (status.isLoaded) {
            if (status.isPlaying) {
                await video.current.pauseAsync();
            } else {
                await video.current.playAsync();
            }
            resetControlsTimer();
        }
    };

    // ... handleSeek, handleSpeedChange, handleResizeMode same as before ... 
    const handleSeek = async (value: number) => {
        if (video.current) {
            await video.current.setPositionAsync(value);
            resetControlsTimer();
        }
    };

    const handleSpeedChange = async (speed: number) => {
        if (video.current) {
            await video.current.setRateAsync(speed, true);
            setPlaybackSpeed(speed);
        }
    };

    const handleResizeMode = () => {
        setResizeMode(prev => prev === ResizeMode.CONTAIN ? ResizeMode.COVER : ResizeMode.CONTAIN);
    };

    // Optimized Gesture Handling
    const lastBrightnessUpdate = useRef(0);
    const isSeeking = useRef(false);
    const [sliderValue, setSliderValue] = useState(0);

    const onPanGestureEvent = async (event: any) => {
        if (locked) return; // No gesture when locked

        const { translationY, x, state } = event.nativeEvent;
        if (state !== State.ACTIVE) return;

        const now = Date.now();
        const delta = -translationY / 3000;

        // LEFT SIDE ONLY -> Brightness
        if (x < width / 2) {
            if (now - lastBrightnessUpdate.current > 20) {
                let newBrightness = brightness + delta;
                newBrightness = Math.max(0, Math.min(1, newBrightness));
                setBrightness(newBrightness);
                setShowBrightnessSlider(true);
                Brightness.setBrightnessAsync(newBrightness);
                lastBrightnessUpdate.current = now;
                setTimeout(() => setShowBrightnessSlider(false), 1500);
            }
        }
        // RIGHT SIDE -> Volume DISABLED per user request
    };

    const handleSlidingStart = () => {
        isSeeking.current = true;
    };

    const handleSlidingComplete = async (value: number) => {
        if (video.current) {
            await video.current.setPositionAsync(value);
            isSeeking.current = false;
            resetControlsTimer();
        }
    };

    const handleSkip = async (amount: number) => {
        if (locked || !video.current) return;
        const status = await video.current.getStatusAsync();
        if (status.isLoaded) {
            const newPos = Math.max(0, Math.min(status.durationMillis || 0, status.positionMillis + amount));
            await video.current.setPositionAsync(newPos);
            resetControlsTimer();
        }
    };

    const handleVideoError = (error: string) => {
        console.log("Video Error:", error);
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <Video
                    ref={video}
                    style={StyleSheet.absoluteFill}
                    source={videoSource}
                    useNativeControls={false}
                    resizeMode={resizeMode}
                    onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                    onError={handleVideoError}
                    shouldPlay={true}
                />

                <PanGestureHandler onGestureEvent={onPanGestureEvent} activeOffsetX={[-10, 10]} activeOffsetY={[-10, 10]}>
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 100 }}>
                        <Pressable style={StyleSheet.absoluteFill} onPress={toggleControls} />
                    </View>
                </PanGestureHandler>

                <Pressable style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }} onPress={toggleControls} />

                {/* VISUAL BRIGHTNESS SLIDER (LEFT) */}
                {showBrightnessSlider && (
                    <View style={styles.gestureFeedbackLeft}>
                        <Ionicons name="sunny" size={20} color="#fbbf24" style={{ marginBottom: 10 }} />
                        <View style={styles.gestureBarContainer}>
                            <View style={[styles.gestureBarFill, { height: `${brightness * 100}%` }]} />
                        </View>
                    </View>
                )}

                {/* LOCK BUTTON (Always visible if controls shown OR if locked) */}
                {showControls && (
                    <TouchableOpacity
                        style={[styles.lockBtn, locked ? { backgroundColor: '#fbbf24' } : { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                        onPress={() => setLocked(!locked)}
                    >
                        <Ionicons name={locked ? "lock-closed" : "lock-open-outline"} size={22} color={locked ? "black" : "white"} />
                    </TouchableOpacity>
                )}

                {showControls && !locked && (
                    <View style={styles.overlay} pointerEvents="box-none">

                        {/* Header */}
                        <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                                <Ionicons name="arrow-back" size={26} color="white" />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.videoTitle} numberOfLines={1}>{title}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    {episode && <Text style={styles.subTitle}>{episode}</Text>}
                                    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.5)' }} />
                                    <Text style={styles.subTitle}>Server {serverList[currentServerIndex]}</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => setShowServers(true)}>
                                    <Ionicons name="server-outline" size={22} color="white" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        {/* Center Controls */}
                        <View style={styles.centerControls} pointerEvents="box-none">
                            <TouchableOpacity onPress={() => handleSkip(-10000)} style={styles.skipBtn}>
                                <Ionicons name="play-back-outline" size={32} color="rgba(255,255,255,0.85)" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseBtn}>
                                <Ionicons
                                    name={status.isLoaded && status.isPlaying ? "pause" : "play"}
                                    size={36} // More elegant size
                                    color="white" // Apple style often uses white on clear blur, but stick to design
                                    style={{ marginLeft: status.isLoaded && status.isPlaying ? 0 : 3 }}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => handleSkip(10000)} style={styles.skipBtn}>
                                <Ionicons name="play-forward-outline" size={32} color="rgba(255,255,255,0.85)" />
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.footer}>
                            {/* Seek Bar */}
                            <View style={styles.sliderContainer}>
                                <Text style={styles.timeText}>{formatTime(status.isLoaded ? status.positionMillis : 0)}</Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={status.isLoaded ? status.durationMillis : 1}
                                    value={sliderValue}
                                    onSlidingStart={handleSlidingStart}
                                    onSlidingComplete={handleSlidingComplete}
                                    minimumTrackTintColor="#fbbf24"
                                    maximumTrackTintColor="rgba(255,255,255,0.15)"
                                    thumbTintColor="#fbbf24"
                                />
                                <Text style={styles.timeText}>{formatTime(status.isLoaded ? status.durationMillis : 0)}</Text>
                            </View>

                            {/* Bottom Actions */}
                            <View style={styles.bottomActions}>
                                <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>

                                    {/* Episode List Button */}
                                    <TouchableOpacity style={styles.actionItem} onPress={() => setShowEpisodes(true)}>
                                        <Ionicons name="list-outline" size={24} color="white" />
                                        <Text style={styles.actionText}>Tập phim</Text>
                                    </TouchableOpacity>

                                    {/* Speed Button */}
                                    <TouchableOpacity style={styles.actionItem} onPress={() => {
                                        const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
                                        const currentIdx = speeds.indexOf(playbackSpeed);
                                        const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
                                        handleSpeedChange(nextSpeed);
                                    }}>
                                        <Text style={[styles.actionText, { fontSize: 13, borderWidth: 1.5, borderColor: 'white', paddingHorizontal: 4, borderRadius: 4, textAlign: 'center', minWidth: 32 }]}>
                                            {playbackSpeed}x
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 20 }}>
                                    <TouchableOpacity onPress={handleResizeMode}>
                                        <Ionicons name={resizeMode === ResizeMode.COVER ? "scan-outline" : "resize-outline"} size={22} color="white" />
                                    </TouchableOpacity>

                                    {onNext && (
                                        <TouchableOpacity onPress={onNext} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Ionicons name="play-skip-forward-outline" size={24} color="white" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </LinearGradient>
                    </View>
                )}
            </View>

            {/* Episode Selector - Right Drawer (GRID LAYOUT) */}
            <Modal animationType="fade" transparent={true} visible={showEpisodes} onRequestClose={() => setShowEpisodes(false)}>
                <View style={styles.drawerOverlay}>
                    <Pressable style={{ flex: 1 }} onPress={() => setShowEpisodes(false)} />
                    <View style={styles.drawerContent}>
                        <View style={styles.drawerHeader}>
                            <Text style={styles.drawerTitle}>Tập phim</Text>
                            <TouchableOpacity onPress={() => setShowEpisodes(false)}>
                                <Ionicons name="close" size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={episodeList}
                            keyExtractor={(item) => item.slug}
                            contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
                            numColumns={4} // Grid Layout
                            renderItem={({ item }) => {
                                const isActive = item.slug === currentEpisodeSlug;
                                return (
                                    <TouchableOpacity
                                        style={[styles.epGridItem, isActive && styles.activeEpGridItem]}
                                        onPress={() => {
                                            onEpisodeChange?.(item.slug);
                                            setShowEpisodes(false);
                                        }}
                                    >
                                        <Text style={[styles.epGridText, isActive && styles.activeEpGridText]} numberOfLines={1}>
                                            {item.name.replace('Tập ', '')}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Server Selector - Bottom Sheet */}
            <Modal animationType="slide" transparent={true} visible={showServers} onRequestClose={() => setShowServers(false)}>
                <View style={styles.sheetOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowServers(false)} />
                    <View style={styles.sheetContent}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Chọn Server</Text>
                            <TouchableOpacity onPress={() => setShowServers(false)}>
                                <Ionicons name="close-circle" size={28} color="#4b5563" />
                            </TouchableOpacity>
                        </View>
                        {/* ... (Server list implementation same as before) ... */}
                        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                            {serverList.map((server, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.serverRow, index === currentServerIndex && styles.activeServerRow]}
                                    onPress={() => {
                                        onServerChange?.(index);
                                        setShowServers(false);
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Ionicons name="server-outline" size={20} color={index === currentServerIndex ? '#fbbf24' : 'gray'} />
                                        <Text style={[styles.serverRowText, index === currentServerIndex && styles.activeServerRowText]}>
                                            {server}
                                        </Text>
                                    </View>
                                    {index === currentServerIndex && <Ionicons name="checkmark" size={20} color="#fbbf24" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </GestureHandlerRootView>
    );
}

const formatTime = (millis: number = 0) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', zIndex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 16 },
    backBtn: { padding: 8, marginRight: 6 },
    videoTitle: { color: 'white', fontSize: 15, fontWeight: '700' },
    subTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },

    lockBtn: {
        position: 'absolute',
        top: 20,
        right: 60, // Left of Settings
        zIndex: 50,
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },

    centerControls: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 80,
        zIndex: 2,
    },
    playPauseBtn: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
    },
    skipBtn: { alignItems: 'center', justifyContent: 'center', opacity: 0.8 },
    skipText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 4, fontWeight: '600' },

    footer: { padding: 20, paddingBottom: 24 },
    sliderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    slider: { flex: 1, marginHorizontal: 12 },
    timeText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, width: 45, textAlign: 'center', fontWeight: '600', fontVariant: ['tabular-nums'] },

    bottomActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    actionItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
    actionText: { color: 'white', fontSize: 13, fontWeight: '600' },

    gestureFeedbackLeft: {
        position: 'absolute', left: 24, top: '25%', bottom: '25%',
        width: 36, backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 18, alignItems: 'center', justifyContent: 'center', zIndex: 10, paddingVertical: 16
    },
    gestureBarContainer: {
        flex: 1, width: 4, backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end'
    },
    gestureBarFill: { width: '100%', backgroundColor: 'white', borderRadius: 2 }, // Apply white initially, typically brightness bars are white

    drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row', justifyContent: 'flex-end' },
    drawerContent: { width: '45%', height: '100%', backgroundColor: '#111', paddingBottom: 20 },
    drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    drawerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },

    // GRID EPISODE STYLES
    epGridItem: {
        flex: 1,
        aspectRatio: 1.5,
        margin: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent'
    },
    activeEpGridItem: {
        backgroundColor: '#fbbf24',
    },
    epGridText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
    activeEpGridText: { color: 'black', fontWeight: 'bold' },

    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheetContent: { width: '100%', backgroundColor: '#1c1c1c', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sheetTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    serverRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    activeServerRow: {},
    serverRowText: { color: 'white', fontSize: 16 },
    activeServerRowText: { color: '#fbbf24', fontWeight: 'bold' },
});
