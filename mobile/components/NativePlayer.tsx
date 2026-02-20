import React, { useRef, useState, useEffect, useCallback } from 'react';
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
    PanResponder,
    Animated,
    Easing
} from 'react-native';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { LinearGradient } from 'expo-linear-gradient';
import { useKeepAwake } from 'expo-keep-awake';

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
    initialTime?: number;
}

export default function NativePlayer({
    url, title, episode, onClose, onNext, onProgress,
    episodeList = [], serverList = [], currentServerIndex = 0, currentEpisodeSlug, onEpisodeChange, onServerChange,
    initialTime = 0
}: NativePlayerProps) {
    useKeepAwake();
    const video = useRef<Video>(null);
    const [videoSource, setVideoSource] = useState({ uri: url });

    // Update video source when prop changes
    useEffect(() => {
        setVideoSource({ uri: url });
    }, [url]);
    const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
    const [showControls, setShowControls] = useState(true);
    const [resizeMode, setResizeMode] = useState(ResizeMode.CONTAIN);
    const [locked, setLocked] = useState(false);
    const controlTimeout = useRef<any>(null);

    // Modals
    const [showEpisodes, setShowEpisodes] = useState(false);
    const [showServers, setShowServers] = useState(false);

    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const lastProgressUpdate = useRef(0);
    const initialSeekDone = useRef(false);

    // Brightness with Standard Animated
    const brightness = useRef(new Animated.Value(0)).current; // 0 = normal (opacity 0), 1 = dark (opacity 1) - Wait, logic reversed?
    // Let's say brightnessValue 1.0 = full bright (overlay opacity 0)
    // brightnessValue 0.0 = dark (overlay opacity 0.8)
    const brightnessValue = useRef(1.0);
    const brightnessOpacity = useRef(new Animated.Value(0)).current;

    // Slider visibility
    const sliderOpacity = useRef(new Animated.Value(0)).current;

    // Error handling
    const [error, setError] = useState<string | null>(null);

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
                if (currentTime - lastProgressUpdate.current > 5000) {
                    lastProgressUpdate.current = currentTime;
                    if (onProgress) onProgress(currentTime, duration);
                }
            }
        }
    };

    const toggleControls = () => {
        if (locked) {
            setShowControls(true);
            resetControlsTimer();
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

    const handleSpeedChange = async (speed: number) => {
        if (video.current) {
            await video.current.setRateAsync(speed, true);
            setPlaybackSpeed(speed);
        }
    };

    const handleResizeMode = () => {
        setResizeMode(prev => prev === ResizeMode.CONTAIN ? ResizeMode.COVER : ResizeMode.CONTAIN);
    };

    // Seek State
    const isSeeking = useRef(false);
    const [sliderValue, setSliderValue] = useState(0);

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

    // --- BRIGHTNESS GESTURE (PanResponder) ---
    const updateBrightness = (dy: number) => {
        const delta = -dy / 250;
        let newVal = brightnessValue.current + delta;
        newVal = Math.max(0, Math.min(1, newVal));
        brightnessValue.current = newVal;

        // Update overlay opacity: 1.0 bright -> 0 opacity, 0.0 bright -> 0.8 opacity
        const opacity = (1 - newVal) * 0.8;
        brightnessOpacity.setValue(opacity);

        // Update slider height visual
        brightness.setValue(newVal);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => {
                // Only verify if touch starts on left side
                return !locked && evt.nativeEvent.pageX < width / 3;
            },
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                return !locked && Math.abs(gestureState.dy) > 10 && evt.nativeEvent.pageX < width / 3;
            },
            onPanResponderGrant: () => {
                // Show slider
                Animated.timing(sliderOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                }).start();
            },
            onPanResponderMove: (evt, gestureState) => {
                updateBrightness(gestureState.dy);
            },
            onPanResponderRelease: () => {
                // Hide slider
                Animated.timing(sliderOpacity, {
                    toValue: 0,
                    duration: 1000,
                    delay: 500,
                    useNativeDriver: true
                }).start();
            }
        })
    ).current;

    // Drawer Animation
    const slideAnim = useRef(new Animated.Value(width)).current; // Start off-screen (right)

    useEffect(() => {
        if (showEpisodes) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.out(Easing.poly(4)), // Spring-like easing
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: width, // Slide back out
                duration: 250,
                useNativeDriver: true,
                easing: Easing.in(Easing.poly(4)),
            }).start();
        }
    }, [showEpisodes]);

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <View style={styles.container} {...panResponder.panHandlers}>
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

                {/* Brightness Overlay (Standard Animated) */}
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: 'black', opacity: brightnessOpacity, zIndex: 1 } // zIndex 1 to sit above video
                    ]}
                    pointerEvents="none"
                />

                {/* Touch Area for Controls Toggle */}
                <Pressable style={[StyleSheet.absoluteFill, { zIndex: 2 }]} onPress={toggleControls} />

                {/* VISUAL BRIGHTNESS SLIDER */}
                <Animated.View style={[styles.brightnessBar, { opacity: sliderOpacity }]} pointerEvents="none">
                    <Ionicons name="sunny" size={14} color="rgba(255,255,255,0.9)" />
                    <View style={styles.brightnessTrack}>
                        <Animated.View
                            style={[
                                styles.brightnessFill,
                                {
                                    height: brightness.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%']
                                    })
                                }
                            ]}
                        />
                    </View>
                    <Ionicons name="moon" size={12} color="rgba(255,255,255,0.5)" />
                </Animated.View>

                {/* CONTROLS */}
                {showControls && (
                    <View style={styles.overlay} pointerEvents="box-none">

                        {/* Header */}
                        {!locked && (
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
                        )}

                        {/* Lock Button */}
                        <TouchableOpacity
                            style={[styles.lockBtn, locked ? { backgroundColor: '#fbbf24', borderColor: '#fbbf24' } : { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                            onPress={() => setLocked(!locked)}
                        >
                            <Ionicons name={locked ? "lock-closed" : "lock-open-outline"} size={22} color={locked ? "black" : "white"} />
                        </TouchableOpacity>

                        {/* Center Controls */}
                        {!locked && (
                            <View style={styles.centerControls} pointerEvents="box-none">
                                {/* Netflix Style Skip Buttons */}
                                <TouchableOpacity onPress={() => handleSkip(-10000)} style={styles.skipBtn}>
                                    <MaterialIcons name="replay-10" size={48} color="white" />
                                </TouchableOpacity>

                                {/* Play/Pause */}
                                <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseBtn}>
                                    <Ionicons
                                        name={status.isLoaded && status.isPlaying ? "pause" : "play"}
                                        size={36}
                                        color="white"
                                        style={{ marginLeft: status.isLoaded && status.isPlaying ? 0 : 4 }}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => handleSkip(10000)} style={styles.skipBtn}>
                                    <MaterialIcons name="forward-10" size={48} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Footer */}
                        {!locked && (
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
                                        maximumTrackTintColor="rgba(255,255,255,0.2)"
                                        thumbTintColor="#fbbf24"
                                    />
                                    <Text style={styles.timeText}>{formatTime(status.isLoaded ? status.durationMillis : 0)}</Text>
                                </View>

                                {/* Bottom Actions */}
                                <View style={styles.bottomActions}>
                                    <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
                                        <TouchableOpacity style={styles.actionItem} onPress={() => setShowEpisodes(true)}>
                                            <Ionicons name="list" size={24} color="white" />
                                            <Text style={styles.actionText}>Tập phim</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.actionItem} onPress={() => {
                                            const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
                                            const currentIdx = speeds.indexOf(playbackSpeed);
                                            const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
                                            handleSpeedChange(nextSpeed);
                                        }}>
                                            <Ionicons name="speedometer-outline" size={24} color="white" />
                                            <Text style={styles.actionText}>{playbackSpeed}x</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 20 }}>
                                        <TouchableOpacity onPress={handleResizeMode}>
                                            <Ionicons name={resizeMode === ResizeMode.COVER ? "scan" : "resize"} size={22} color="white" />
                                        </TouchableOpacity>

                                        {onNext && (
                                            <TouchableOpacity onPress={onNext} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Ionicons name="play-skip-forward" size={24} color="white" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </LinearGradient>
                        )}
                    </View>
                )}
            </View>

            {/* Episode Selector Modal (iOS 26 Style Drawer) */}
            <Modal animationType="none" transparent={true} visible={showEpisodes} onRequestClose={() => setShowEpisodes(false)}>
                <View style={styles.drawerOverlay}>
                    {/* Click outside to close */}
                    <Pressable style={{ flex: 1 }} onPress={() => setShowEpisodes(false)} />

                    {/* Animated Glass Drawer */}
                    <Animated.View style={[
                        styles.drawerContent,
                        { transform: [{ translateX: slideAnim }] }
                    ]}>
                        <View style={styles.drawerHeader}>
                            <Text style={styles.drawerTitle}>Danh sách tập</Text>
                            <TouchableOpacity
                                onPress={() => setShowEpisodes(false)}
                                style={styles.closeBtn}
                            >
                                <Ionicons name="close" size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={episodeList}
                            keyExtractor={(item) => item.slug}
                            contentContainerStyle={{ padding: 28, paddingBottom: 60, gap: 16 }}
                            columnWrapperStyle={{ gap: 16 }}
                            numColumns={4}
                            showsVerticalScrollIndicator={false}
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
                                        {/* Optional: Checkmark or progress bar could go here */}
                                        {isActive && (
                                            <View style={{ position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: '#fbbf24' }} />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </Animated.View>
                </View>
            </Modal>

            {/* Server Selector Modal */}
            <Modal animationType="slide" transparent={true} visible={showServers} onRequestClose={() => setShowServers(false)}>
                <View style={styles.sheetOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowServers(false)} />
                    <View style={styles.sheetContent}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Nguồn phát</Text>
                            <TouchableOpacity onPress={() => setShowServers(false)}>
                                <Ionicons name="close-circle" size={28} color="#4b5563" />
                            </TouchableOpacity>
                        </View>
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
        </View>
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
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', zIndex: 5 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 16 },
    backBtn: { padding: 8, marginRight: 6 },
    videoTitle: { color: 'white', fontSize: 15, fontWeight: '700' },
    subTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },

    lockBtn: {
        position: 'absolute',
        top: 20,
        right: 60,
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
        gap: 80, // Space between buttons
        zIndex: 2,
    },
    playPauseBtn: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)'
    },
    skipBtn: { alignItems: 'center', justifyContent: 'center', opacity: 0.9 },

    footer: { padding: 20, paddingBottom: 24 },
    sliderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    slider: { flex: 1, marginHorizontal: 12 },
    timeText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, width: 45, textAlign: 'center', fontWeight: '600', fontVariant: ['tabular-nums'] },

    bottomActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    actionItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
    actionText: { color: 'white', fontSize: 13, fontWeight: '600' },

    // Netflix-style persistent brightness bar
    brightnessBar: {
        position: 'absolute',
        left: 24,
        top: '25%',
        bottom: '25%',
        width: 36,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        zIndex: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    brightnessTrack: {
        flex: 1,
        width: 5,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 2.5,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        marginVertical: 8,
    },
    brightnessFill: {
        width: '100%',
        backgroundColor: '#fbbf24',
        borderRadius: 2.5,
    },

    // --- DRAWER STYLES (iOS 26) ---
    drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', justifyContent: 'flex-end' },
    drawerContent: {
        width: 380, // Fixed clear width
        maxWidth: '80%',
        height: '100%',
        backgroundColor: 'rgba(15,18,26,0.96)', // Deep glass
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.08)',
        shadowColor: "#000",
        shadowOffset: { width: -10, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    drawerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 32, // More top padding
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    drawerTitle: {
        color: 'white',
        fontSize: 20, // Larger title
        fontWeight: '700',
        letterSpacing: 0.5
    },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center'
    },

    // --- EPISODE GRID (Premium) ---
    epGridItem: {
        flex: 1,
        height: 56, // Fixed height 56px
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        // Shadow for depth
    },
    activeEpGridItem: {
        backgroundColor: 'rgba(251, 191, 36, 0.15)', // Subtle gold tint
        borderColor: '#fbbf24',
        shadowColor: "#fbbf24",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    epGridText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 15,
        fontWeight: '600'
    },
    activeEpGridText: {
        color: '#fbbf24',
        fontWeight: '800'
    },

    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheetContent: { width: '100%', backgroundColor: '#1c1c1c', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sheetTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    serverRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    activeServerRow: {},
    serverRowText: { color: 'white', fontSize: 16 },
    activeServerRowText: { color: '#fbbf24', fontWeight: 'bold' },
});
