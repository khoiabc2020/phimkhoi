import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
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
    // New Props for Selection
    episodeList?: any[];
    serverList?: string[];
    currentServerIndex?: number;
    currentEpisodeSlug?: string;
    onEpisodeChange?: (slug: string) => void;
    onServerChange?: (index: number) => void;
}

export default function NativePlayer({
    url, title, episode, onClose, onNext, onProgress,
    episodeList = [], serverList = [], currentServerIndex = 0, currentEpisodeSlug, onEpisodeChange, onServerChange
}: NativePlayerProps) {
    useKeepAwake();
    const video = useRef<Video>(null);
    const [videoSource, setVideoSource] = useState({ uri: url });
    const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
    const [showControls, setShowControls] = useState(true);
    const [resizeMode, setResizeMode] = useState(ResizeMode.CONTAIN);
    const controlTimeout = useRef<any>(null);

    // Modals
    const [showEpisodes, setShowEpisodes] = useState(false);
    const [showServers, setShowServers] = useState(false);

    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const lastProgressUpdate = useRef(0);
    const initialSeekDone = useRef(false);

    // Gesture State
    const [volume, setVolume] = useState(1.0);
    const [brightness, setBrightness] = useState(0.5);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [showBrightnessSlider, setShowBrightnessSlider] = useState(false);

    useEffect(() => {
        (async () => {
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
        if (showControls) {
            controlTimeout.current = setTimeout(() => {
                setShowControls(false);
            }, 4000);
        }
    };

    const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        setStatus(status);
        if (status.isLoaded) {
            // Auto-resume logic (if history data provided, seek once)
            // Implementation note: Ideally, history time is passed in as a prop 'startTime'
            // For now, assuming basic playback.

            if (!isSeeking.current) {
                setSliderValue(status.positionMillis);
            }

            if (status.isPlaying) {
                const currentTime = status.positionMillis;
                const duration = status.durationMillis || 0;

                // Save history every 10 seconds
                if (currentTime - lastProgressUpdate.current > 10000) {
                    lastProgressUpdate.current = currentTime;
                    if (onProgress) onProgress(currentTime, duration);
                    // Also call saveHistory internally if props provided
                    // Logic handled in parent component via onProgress usually, or here if we import api
                }
            }
        }
    };

    const toggleControls = () => {
        setShowControls(!showControls);
        if (!showControls) resetControlsTimer();
    };

    const handlePlayPause = async () => {
        if (!video.current) return;
        if (status.isLoaded) {
            if (status.isPlaying) {
                await video.current.pauseAsync();
            } else {
                await video.current.playAsync();
            }
            resetControlsTimer();
        }
    };

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
    const lastVolumeUpdate = useRef(0);
    const lastBrightnessUpdate = useRef(0);
    const isSeeking = useRef(false);
    const [sliderValue, setSliderValue] = useState(0);

    const onPanGestureEvent = async (event: any) => {
        const { translationY, x, state, velocityY } = event.nativeEvent;
        // ... (Gesture logic remains same)
        if (state !== State.ACTIVE) return;

        const now = Date.now();
        const delta = -translationY / 3000;

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
        } else {
            if (now - lastVolumeUpdate.current > 20) {
                let newVolume = volume + delta;
                newVolume = Math.max(0, Math.min(1, newVolume));
                setVolume(newVolume);
                setShowVolumeSlider(true);
                lastVolumeUpdate.current = now;
                setTimeout(() => setShowVolumeSlider(false), 1500);
            }
        }
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
        if (video.current) {
            const status = await video.current.getStatusAsync();
            if (status.isLoaded) {
                const newPos = Math.max(0, Math.min(status.durationMillis || 0, status.positionMillis + amount));
                await video.current.setPositionAsync(newPos);
                resetControlsTimer();
            }
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

                {/* Gesture Handler Layer - Exclude bottom area to prevent slider conflict */}
                <PanGestureHandler onGestureEvent={onPanGestureEvent} activeOffsetX={[-10, 10]} activeOffsetY={[-10, 10]}>
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 100 }}>
                        <Pressable style={StyleSheet.absoluteFill} onPress={toggleControls} />
                    </View>
                </PanGestureHandler>

                {/* Full screen pressable for bottom area to toggle controls without gesture actions */}
                <Pressable style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }} onPress={toggleControls} />

                {/* Controls Overlay - Sits on top of Gesture Handler */}
                {showControls && (
                    <View style={styles.overlay} pointerEvents="box-none">

                        {/* Volume/Brightness Sliders (Visual Feedback) */}
                        {showBrightnessSlider && (
                            <View style={styles.gestureFeedbackLeft}>
                                <Ionicons name="sunny" size={24} color="white" />
                                <View style={styles.gestureBarContainer}>
                                    <View style={[styles.gestureBarFill, { height: `${brightness * 100}%` }]} />
                                </View>
                            </View>
                        )}

                        {showVolumeSlider && (
                            <View style={styles.gestureFeedbackRight}>
                                <Ionicons name="volume-high" size={24} color="white" />
                                <View style={styles.gestureBarContainer}>
                                    <View style={[styles.gestureBarFill, { height: `${volume * 100}%` }]} />
                                </View>
                            </View>
                        )}

                        {/* Header */}
                        <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                                <Ionicons name="arrow-back" size={28} color="white" />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.videoTitle} numberOfLines={1}>{title}</Text>
                                {episode && <Text style={styles.subTitle}>{episode}</Text>}
                            </View>
                            {/* Top Right Actions */}
                            <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                                <TouchableOpacity>
                                    <Ionicons name="flag-outline" size={24} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity>
                                    <Ionicons name="settings-outline" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        {/* Center Controls (Netflix Style: Minimal Circle) */}
                        <View style={styles.centerControls} pointerEvents="box-none">
                            <TouchableOpacity onPress={() => handleSkip(-10000)} style={styles.skipBtn}>
                                <View style={styles.skipIconBg}>
                                    <Ionicons name="refresh-outline" size={24} color="white" style={{ transform: [{ scaleX: -1 }] }} />
                                    <Text style={styles.skipTextInside}>10</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseBtn}>
                                <Ionicons
                                    name={status.isLoaded && status.isPlaying ? "pause" : "play"}
                                    size={45} // Slightly larger
                                    color="black" // Black icon on white circle
                                    style={{ marginLeft: status.isLoaded && status.isPlaying ? 0 : 4 }}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => handleSkip(10000)} style={styles.skipBtn}>
                                <View style={styles.skipIconBg}>
                                    <Ionicons name="refresh-outline" size={24} color="white" />
                                    <Text style={styles.skipTextInside}>10</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Footer (Slider + Bottom Actions) */}
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.footer}>
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
                                    minimumTrackTintColor="#e50914"
                                    maximumTrackTintColor="rgba(255,255,255,0.4)"
                                    thumbTintColor="#e50914"

                                />
                                <Text style={styles.timeText}>{formatTime(status.isLoaded ? status.durationMillis : 0)}</Text>
                            </View>

                            {/* Bottom Action Bar */}
                            <View style={styles.bottomActions}>
                                <TouchableOpacity onPress={() => setShowEpisodes(true)} style={styles.actionItem}>
                                    <Ionicons name="albums-outline" size={24} color="white" />
                                    <Text style={styles.actionText}>DS Tập</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionItem} onPress={() => setShowServers(true)}>
                                    <Ionicons name="server-outline" size={24} color="white" />
                                    <Text style={styles.actionText}>Server</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionItem} onPress={() => {
                                    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
                                    const currentIdx = speeds.indexOf(playbackSpeed);
                                    const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
                                    handleSpeedChange(nextSpeed);
                                }}>
                                    <Ionicons name="speedometer-outline" size={24} color="white" />
                                    <Text style={styles.actionText}>Tốc độ ({playbackSpeed}x)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionItem} onPress={handleResizeMode}>
                                    <Ionicons name={resizeMode === ResizeMode.COVER ? "contract-outline" : "expand-outline"} size={24} color="white" />
                                    <Text style={styles.actionText}>{resizeMode === ResizeMode.COVER ? "Vừa màn" : "Tràn màn"}</Text>
                                </TouchableOpacity>

                                {onNext && (
                                    <TouchableOpacity onPress={onNext} style={styles.nextEpBtn}>
                                        <Text style={styles.nextEpText}>Tập tiếp</Text>
                                        <Ionicons name="play-skip-forward-outline" size={20} color="black" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </LinearGradient>
                    </View>
                )}
            </View>

            {/* Episode Selector Modal */}
            <Modal animationType="slide" transparent={true} visible={showEpisodes} onRequestClose={() => setShowEpisodes(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn Tập</Text>
                            <TouchableOpacity onPress={() => setShowEpisodes(false)}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={episodeList}
                            keyExtractor={(item) => item.slug}
                            numColumns={4}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.epBtn, item.slug === currentEpisodeSlug && styles.activeEpBtn]}
                                    onPress={() => {
                                        onEpisodeChange?.(item.slug);
                                        setShowEpisodes(false);
                                    }}
                                >
                                    <Text style={[styles.epText, item.slug === currentEpisodeSlug && styles.activeEpText]}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={{ padding: 10 }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Server Selector Modal */}
            <Modal animationType="fade" transparent={true} visible={showServers} onRequestClose={() => setShowServers(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { width: '50%', alignSelf: 'center' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn Server</Text>
                            <TouchableOpacity onPress={() => setShowServers(false)}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ padding: 10 }}>
                            {serverList.map((server, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.serverBtn, index === currentServerIndex && styles.activeServerBtn]}
                                    onPress={() => {
                                        onServerChange?.(index);
                                        setShowServers(false);
                                    }}
                                >
                                    <Text style={[styles.serverText, index === currentServerIndex && styles.activeServerText]}>
                                        {server}
                                    </Text>
                                    {index === currentServerIndex && <Ionicons name="checkmark" size={20} color="black" />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </GestureHandlerRootView>
    );
}

// Helper
const formatTime = (millis: number = 0) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};


// ... Helper functions ...

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    video: { width: '100%', height: '100%' },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', zIndex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 30 }, // Reduced padding as requested
    backBtn: { padding: 8, marginRight: 10 },
    videoTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    subTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
    settingsBtn: { marginLeft: 'auto', padding: 8 },

    // Center Controls (Netflix Style)
    centerControls: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 60,
        zIndex: 2,
    },
    playPauseBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    skipBtn: { alignItems: 'center', justifyContent: 'center', width: 60, height: 60 },
    skipIconBg: { alignItems: 'center', justifyContent: 'center' },
    skipTextInside: { color: 'white', fontSize: 10, fontWeight: 'bold', position: 'absolute', top: 8 }, // Inside the circle

    // Footer
    footer: { padding: 20, paddingBottom: 40, paddingTop: 40 },
    sliderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    slider: { flex: 1, marginHorizontal: 10 },
    timeText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, width: 45, textAlign: 'center', fontWeight: 'bold' },

    // Bottom Actions
    bottomActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 },
    actionItem: { alignItems: 'center', gap: 4 },
    actionText: { color: 'white', fontSize: 10, fontWeight: '600' },
    nextEpBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 },
    nextEpText: { color: 'black', marginRight: 6, fontWeight: 'bold', fontSize: 12 },

    // ... Other styles for volume/brightness ...
    gestureFeedbackLeft: { position: 'absolute', left: 40, top: '30%', height: 150, width: 40, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', zIndex: 20, paddingVertical: 10 },
    gestureFeedbackRight: { position: 'absolute', right: 40, top: '30%', height: 150, width: 40, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', zIndex: 20, paddingVertical: 10 },
    gestureBarContainer: { flex: 1, width: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginTop: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
    gestureBarFill: { width: '100%', backgroundColor: '#fbbf24', borderRadius: 3 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '80%', maxHeight: '80%', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 12 },
    modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    epBtn: { width: '23%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#333', borderRadius: 8, margin: '1%' },
    activeEpBtn: { backgroundColor: '#fbbf24' },
    epText: { color: 'white', fontWeight: 'bold' },
    activeEpText: { color: 'black' },
    serverBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#333', borderRadius: 8, marginBottom: 10 },
    activeServerBtn: { backgroundColor: '#fbbf24' },
    serverText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    activeServerText: { color: 'black' },
});

