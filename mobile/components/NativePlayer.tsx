import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions, Modal, TouchableOpacity, StatusBar } from 'react-native';
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
}

export default function NativePlayer({ url, title, episode, onClose, onNext, onProgress }: NativePlayerProps) {
    useKeepAwake();
    const video = useRef<Video>(null);
    const [videoSource, setVideoSource] = useState({ uri: url });
    // If using proxy, we might want to try direct link on error
    const [useDirectSource, setUseDirectSource] = useState(false);
    const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
    const [showControls, setShowControls] = useState(true);
    const [resizeMode, setResizeMode] = useState(ResizeMode.CONTAIN);
    const controlTimeout = useRef<any>(null);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const lastProgressUpdate = useRef(0);

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
        if (showControls && !settingsVisible) {
            controlTimeout.current = setTimeout(() => {
                setShowControls(false);
            }, 4000);
        }
    };

    const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        setStatus(status);
        if (status.isLoaded) {
            // Only update slider if NOT seeking
            if (!isSeeking.current) {
                setSliderValue(status.positionMillis);
            }

            if (status.isLoaded && status.isPlaying) {
                const currentTime = status.positionMillis;
                const duration = status.durationMillis || 0;
                // Emit progress every 5 seconds (5000ms) - Consistent check
                if (onProgress && currentTime - lastProgressUpdate.current > 5000) {
                    lastProgressUpdate.current = currentTime;
                    onProgress(currentTime, duration);
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
        if (state !== State.ACTIVE) return;

        const now = Date.now();
        const delta = -translationY / 5000; // Reduced sensitivity

        if (x < width / 2) {
            // Brightness (Throttle: 50ms)
            if (now - lastBrightnessUpdate.current > 50) {
                let newBrightness = brightness + delta;
                newBrightness = Math.max(0, Math.min(1, newBrightness));
                setBrightness(newBrightness);
                setShowBrightnessSlider(true);
                Brightness.setBrightnessAsync(newBrightness); // Fire and forget
                lastBrightnessUpdate.current = now;
                setTimeout(() => setShowBrightnessSlider(false), 1500);
            }
        } else {
            // Volume (Throttle: 50ms)
            if (now - lastVolumeUpdate.current > 50) {
                let newVolume = volume + delta;
                newVolume = Math.max(0, Math.min(1, newVolume));
                setVolume(newVolume);
                setShowVolumeSlider(true);
                // Video ref volume update if needed, but 'volume' prop handles it generally
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
            isSeeking.current = false; // Resume updates
            resetControlsTimer();
        }
    };



    // ... (Render parts similar, updating Slider props)

    const handleSkipForward = async () => {
        if (video.current) {
            const status = await video.current.getStatusAsync();
            if (status.isLoaded) {
                const newPos = Math.min(status.durationMillis || 0, status.positionMillis + 10000);
                await video.current.setPositionAsync(newPos);
                resetControlsTimer();
            }
        }
    };

    const handleSkipBackward = async () => {
        if (video.current) {
            const status = await video.current.getStatusAsync();
            if (status.isLoaded) {
                const newPos = Math.max(0, status.positionMillis - 10000);
                await video.current.setPositionAsync(newPos);
                resetControlsTimer();
            }
        }
    };

    // ... (Render parts similar, updating Slider props)

    const handleVideoError = (error: string) => {
        console.log("Video Error:", error);
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PanGestureHandler onGestureEvent={onPanGestureEvent}>
                <View style={styles.container}>
                    <Video
                        ref={video}
                        style={styles.video}
                        source={videoSource}
                        useNativeControls={false}
                        resizeMode={resizeMode}
                        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                        onError={handleVideoError}
                        shouldPlay={true}
                    />

                    {/* Controls Overlay */}
                    {showControls && (
                        <View style={styles.overlay}>
                            {/* Header */}
                            <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.header}>
                                <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                                    <Ionicons name="arrow-back" size={28} color="white" />
                                </TouchableOpacity>
                                <View>
                                    <Text style={styles.videoTitle} numberOfLines={1}>{title}</Text>
                                    {episode && <Text style={styles.subTitle}>{episode}</Text>}
                                </View>
                                <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.settingsBtn}>
                                    <Ionicons name="settings-outline" size={24} color="white" />
                                </TouchableOpacity>
                            </LinearGradient>

                            {/* Center Controls (Play/Pause + Skip) */}
                            <View style={styles.centerControls}>
                                <TouchableOpacity onPress={handleSkipBackward} style={styles.skipBtn}>
                                    <Ionicons name="play-back-circle-outline" size={45} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.skipText}>-10s</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseBtn}>
                                    <Ionicons
                                        name={status.isLoaded && status.isPlaying ? "pause" : "play"}
                                        size={40}
                                        color="black"
                                        style={{ marginLeft: status.isLoaded && status.isPlaying ? 0 : 4 }}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleSkipForward} style={styles.skipBtn}>
                                    <Ionicons name="play-forward-circle-outline" size={45} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.skipText}>+10s</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Footer (Slider + Actions) */}
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.footer}>
                                <View style={styles.sliderContainer}>
                                    <Text style={styles.timeText}>{formatTime(status.isLoaded ? status.positionMillis : 0)}</Text>
                                    <Slider
                                        style={styles.slider}
                                        minimumValue={0}
                                        maximumValue={status.isLoaded ? status.durationMillis : 1}
                                        value={sliderValue} // Use local state
                                        onSlidingStart={handleSlidingStart}
                                        onSlidingComplete={handleSlidingComplete}
                                        minimumTrackTintColor="#e50914" // Netflix Red
                                        maximumTrackTintColor="rgba(255,255,255,0.3)"
                                        thumbTintColor="#e50914"
                                    />
                                    <Text style={styles.timeText}>{formatTime(status.isLoaded ? status.durationMillis : 0)}</Text>
                                </View>

                                <View style={styles.bottomActions}>
                                    <TouchableOpacity style={styles.bottomActionBtn} onPress={handleResizeMode}>
                                        <Ionicons name={resizeMode === ResizeMode.COVER ? "contract" : "expand"} size={20} color="white" />
                                        <Text style={styles.bottomActionText}>{resizeMode === ResizeMode.COVER ? "Thu nhỏ" : "Phóng to"}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.bottomActionBtn}>
                                        <Ionicons name="layers-outline" size={20} color="white" />
                                        <Text style={styles.bottomActionText}>Các tập</Text>
                                    </TouchableOpacity>

                                    {onNext && (
                                        <TouchableOpacity onPress={onNext} style={styles.nextBtn}>
                                            <Text style={styles.nextBtnText}>Tập tiếp theo</Text>
                                            <Ionicons name="play-skip-forward" size={20} color="black" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </LinearGradient>
                        </View>
                    )}
                </View>
            </PanGestureHandler>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    video: { width: '100%', height: '100%' },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', zIndex: 1 },
    nextEpOverlay: { position: 'absolute', bottom: 100, right: 20, zIndex: 10 },
    autoNextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fbbf24', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    autoNextText: { color: 'black', fontWeight: 'bold', fontSize: 16, marginRight: 8 },
    skipIntroOverlay: { position: 'absolute', bottom: 100, left: 20, zIndex: 10 },
    skipIntroBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25 },
    skipIntroText: { color: 'black', fontWeight: 'bold', marginRight: 6 },
    controlsContainer: { flex: 1, justifyContent: 'space-between' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40 },
    backBtn: { padding: 8, marginRight: 16 },
    videoTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    subTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
    settingsBtn: { marginLeft: 'auto', padding: 8 },
    centerControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 60 },
    playPauseBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
    skipBtn: { alignItems: 'center', opacity: 0.9 },
    skipText: { color: 'white', fontSize: 12, marginTop: 4, fontWeight: 'bold' },
    footer: { padding: 20, paddingBottom: 30 },
    sliderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    slider: { flex: 1, marginHorizontal: 10 },
    timeText: { color: 'white', fontSize: 12, width: 45, textAlign: 'center', fontWeight: 'bold' },
    bottomActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bottomActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    bottomActionText: { color: 'white', marginLeft: 8, fontWeight: 'bold', fontSize: 13 },
    nextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    nextBtnText: { color: 'black', marginRight: 8, fontWeight: 'bold', fontSize: 13 },

    // Gesture Feedback
    gestureFeedbackLeft: { position: 'absolute', left: 40, top: '30%', height: 150, width: 40, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', zIndex: 20, paddingVertical: 10 },
    gestureFeedbackRight: { position: 'absolute', right: 40, top: '30%', height: 150, width: 40, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', zIndex: 20, paddingVertical: 10 },
    gestureBarContainer: { flex: 1, width: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginTop: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
    gestureBarFill: { width: '100%', backgroundColor: '#fbbf24', borderRadius: 3 },

    // Settings Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', flexDirection: 'row' },
    settingsContainer: { width: 300, backgroundColor: '#1a1a1a', height: '100%', padding: 20 },
    settingsTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 24, marginTop: 20 },
    settingRow: { marginBottom: 24 },
    settingLabel: { color: '#9ca3af', marginBottom: 12, fontSize: 14, textTransform: 'uppercase' },
    speedOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    speedBtn: { backgroundColor: '#333', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, minWidth: 50, alignItems: 'center' },
    activeSpeedBtn: { backgroundColor: '#fbbf24' },
    speedText: { color: 'white', fontWeight: 'bold' },
    activeSpeedText: { color: 'black' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', padding: 12, borderRadius: 12 },
    actionBtnText: { color: 'white', marginLeft: 10, fontWeight: '600' }
});
