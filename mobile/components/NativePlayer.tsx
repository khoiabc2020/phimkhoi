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
    Easing,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Audio, Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Brightness from 'expo-brightness';
import { LinearGradient } from 'expo-linear-gradient';
import { useKeepAwake } from 'expo-keep-awake';
import ExpoPip from 'expo-pip';

const { width, height } = Dimensions.get('window');

/** Icon PiP: khung lớn, khung nhỏ góc phải dưới, mũi tên thu nhỏ (giống ảnh bạn gửi) */
function PipIcon({ size = 24, color = 'white' }: { size?: number; color?: string }) {
    const s = size;
    const stroke = Math.max(1.2, s / 16);
    const small = s * 0.4;
    const r = s * 0.14;
    const arrowSize = s * 0.2;
    return (
        <View style={[pipIconStyles.outer, { width: s, height: s, borderColor: color, borderRadius: r, borderWidth: stroke }]}>
            <View style={[pipIconStyles.small, { width: small, height: small, right: stroke, bottom: stroke, borderColor: color, borderRadius: r * 0.7, borderWidth: stroke }]} />
            <View style={[pipIconStyles.arrowWrap, { left: s * 0.14, top: s * 0.18 }]}>
                <View style={[pipIconStyles.arrow, { borderTopWidth: arrowSize, borderRightWidth: arrowSize, borderTopColor: 'transparent', borderRightColor: color }]} />
            </View>
        </View>
    );
}
const pipIconStyles = StyleSheet.create({
    outer: { position: 'relative' },
    small: { position: 'absolute' },
    arrowWrap: { position: 'absolute', width: 0, height: 0 },
    arrow: { width: 0, height: 0, transform: [{ rotate: '-45deg' }] },
});

interface NativePlayerProps {
    url: string;
    title: string;
    episode?: string;
    onClose: () => void;
    onNext?: () => void;
    onPiP?: () => void;
    onPipSizeCycle?: () => void;
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
    initialTime = 0,
    onPiP,
    onPipSizeCycle,
}: NativePlayerProps) {
    useKeepAwake();
    const { isInPipMode } = ExpoPip.useIsInPip?.() ?? { isInPipMode: false };
    const video = useRef<Video>(null);
    const [videoSource, setVideoSource] = useState({ uri: url });

    // Update video source when prop changes
    useEffect(() => {
        setVideoSource({ uri: url });
        initialSeekDone.current = false;
    }, [url]);

    // Cho phép video tiếp tục phát khi app vào nền (cần cho PiP Android)
    useEffect(() => {
        (async () => {
            try {
                await Audio.setAudioModeAsync({
                    staysActiveInBackground: true,
                    playsInSilentModeIOS: true,
                });
            } catch {
                // ignore audio mode errors
            }
        })();
        return () => {
            (async () => {
                try {
                    await Audio.setAudioModeAsync({
                        staysActiveInBackground: false,
                        playsInSilentModeIOS: true,
                    });
                } catch {
                    // ignore
                }
            })();
        };
    }, []);
    const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
    const [showControls, setShowControls] = useState(true);
    const [resizeMode, setResizeMode] = useState(ResizeMode.CONTAIN);
    const [locked, setLocked] = useState(false);
    const lockedRef = useRef(false);
    const showEpisodesRef = useRef(false);
    const showServersRef = useRef(false);

    // Modals
    const [showEpisodes, setShowEpisodes] = useState(false);
    const [showServers, setShowServers] = useState(false);
    const [serverLangTab, setServerLangTab] = useState('');

    // Language group helpers for server modal
    const LANG_COLORS: Record<string, string> = { 'Phụ Đề': '#D1D5DB', 'Lồng Tiếng': '#00C853', 'Thuyết Minh': '#3B82F6' };
    const getLanguageGroup = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('lồng tiếng') || lower.includes('longtieng')) return 'Lồng Tiếng';
        if (lower.includes('thuyết minh') || lower.includes('thuyetminh')) return 'Thuyết Minh';
        return 'Phụ Đề';
    };
    // Group only non-empty servers by language
    const filteredServerList = serverList.filter((_, i) => (episodeList?.length ?? 0) > 0 || true); // kept for shape
    const groupedServers: Record<string, number[]> = { 'Phụ Đề': [], 'Lồng Tiếng': [], 'Thuyết Minh': [] };
    serverList.forEach((name, idx) => { if (name) groupedServers[getLanguageGroup(name)].push(idx); });
    const activeLangGroups = Object.keys(groupedServers).filter(k => groupedServers[k].length > 0);

    useEffect(() => { lockedRef.current = locked; }, [locked]);
    useEffect(() => { showEpisodesRef.current = showEpisodes; }, [showEpisodes]);
    useEffect(() => { showServersRef.current = showServers; }, [showServers]);

    const controlTimeout = useRef<any>(null);

    const [epRange, setEpRange] = useState(0); // for range picker in drawer
    const EP_CHUNK = 50;
    const DRAWER_WIDTH = 380;
    const EP_GRID_PAD = 12 * 2;
    const EP_GRID_GAP = 8;
    const EP_ITEM_WIDTH = (DRAWER_WIDTH - EP_GRID_PAD - EP_GRID_GAP * 4) / 5; // fixed size so last row (e.g. 31,32) doesn't stretch

    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const lastProgressUpdate = useRef(0);
    const initialSeekDone = useRef(false);

    // Brightness: system brightness while in player, restore on exit
    const brightnessValue = useRef(1.0);
    const brightnessStart = useRef(1.0);
    const savedSystemBrightness = useRef<number | null>(null);
    const brightnessOpacity = useRef(new Animated.Value(0)).current;
    const brightness = useRef(new Animated.Value(1)).current;
    const sliderOpacity = useRef(new Animated.Value(0)).current;

    // On mount: read current system/app brightness and request permission (Android)
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const { status } = await Brightness.requestPermissionsAsync();
                if (status !== 'granted' || !mounted) return;
                const current = await Brightness.getBrightnessAsync();
                if (mounted) savedSystemBrightness.current = current;
                brightnessValue.current = current;
                brightnessStart.current = current;
                brightness.setValue(current);
                const opacity = (1 - current) * 0.75;
                brightnessOpacity.setValue(opacity);
            } catch (_) { }
        })();
        return () => {
            mounted = false;
            (async () => {
                try {
                    if (Platform.OS === 'android') {
                        await Brightness.restoreSystemBrightnessAsync();
                    } else {
                        const saved = savedSystemBrightness.current;
                        if (saved != null) await Brightness.setBrightnessAsync(saved);
                    }
                } catch (_) { }
            })();
        };
    }, []);

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

    const finishedOnce = useRef(false);

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

            // Auto next episode when finished
            if (status.didJustFinish && onNext && !finishedOnce.current) {
                finishedOnce.current = true;
                onNext();
            }
        } else {
            finishedOnce.current = false;
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

    const handleVideoError = (err: any) => {
        const message = typeof err === 'string'
            ? err
            : err?.error || err?.nativeEvent?.error || 'Lỗi phát video';
        console.log("Video Error:", err);
        setError(message);
    };

    // --- BRIGHTNESS GESTURE (PanResponder) ---
    const updateBrightness = (totalDy: number) => {
        const delta = -totalDy / 300;
        let newVal = brightnessStart.current + delta;
        newVal = Math.max(0, Math.min(1, newVal));
        brightnessValue.current = newVal;

        const opacity = (1 - newVal) * 0.75;
        brightnessOpacity.setValue(opacity);
        brightness.setValue(newVal);

        Brightness.setBrightnessAsync(newVal).catch(() => { });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: (evt) => {
                return !lockedRef.current && !showEpisodesRef.current && !showServersRef.current && evt.nativeEvent.pageX < width / 3;
            },
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                return !lockedRef.current && !showEpisodesRef.current && !showServersRef.current && Math.abs(gestureState.dy) > 8 && evt.nativeEvent.pageX < width / 3;
            },
            onPanResponderGrant: () => {
                // Snapshot brightness at gesture start
                brightnessStart.current = brightnessValue.current;
                Animated.timing(sliderOpacity, {
                    toValue: 1, duration: 200, useNativeDriver: true
                }).start();
            },
            onPanResponderMove: (evt, gestureState) => {
                // Pass cumulative dy from gesture start
                updateBrightness(gestureState.dy);
            },
            onPanResponderRelease: () => {
                Animated.timing(sliderOpacity, {
                    toValue: 0, duration: 1000, delay: 500, useNativeDriver: true
                }).start();
            }
        })
    ).current;

    // Drawer Animation — when closed, translate fully off so no strip peeks (width + drawer width)
    const DRAWER_OFF_SCREEN = width + 400;
    const slideAnim = useRef(new Animated.Value(DRAWER_OFF_SCREEN)).current;

    useEffect(() => {
        if (showEpisodes) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.out(Easing.poly(4)),
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: DRAWER_OFF_SCREEN,
                duration: 250,
                useNativeDriver: true,
                easing: Easing.in(Easing.poly(4)),
            }).start();
        }
    }, [showEpisodes]);

    // TV Remote Support (D-Pad) - no-op when useTVEventHandler not available
    if (Platform.isTV) {
        try {
            const { useTVEventHandler } = require('react-native');
            (useTVEventHandler as (cb: (e: any) => void) => void)((evt: any) => {
                if (!evt) return;
                const { eventType } = evt;
                resetControlsTimer();
                switch (eventType) {
                    case 'right': handleSkip(10000); break;
                    case 'left': handleSkip(-10000); break;
                    case 'select':
                    case 'playPause':
                    case 'center':
                        handlePlayPause();
                        break;
                    case 'up':
                    case 'down':
                        toggleControls();
                        break;
                }
            });
        } catch (_) { }
    }

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <View style={styles.container} {...(!showEpisodes && !showServers ? panResponder.panHandlers : {})}>
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

                {/* Loading indicator – chỉ khi video chưa load lần đầu, không chớp khi tua 10s */}
                {(!('isLoaded' in status) || !status.isLoaded) && !error && (
                    <View style={styles.loadingOverlay} pointerEvents="none">
                        <ActivityIndicator size="large" color="#fbbf24" />
                    </View>
                )}

                {/* Error overlay */}
                {error && (
                    <View style={styles.errorOverlay}>
                        <Text style={styles.errorTitle}>Không phát được video</Text>
                        <Text style={styles.errorMessage} numberOfLines={3}>
                            {error}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                            <TouchableOpacity
                                style={styles.errorButtonSecondary}
                                onPress={onClose}
                            >
                                <Text style={styles.errorButtonSecondaryText}>Thoát</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.errorButtonPrimary}
                                onPress={() => {
                                    setError(null);
                                    setVideoSource({ uri: url });
                                    video.current?.replayAsync().catch(() => { });
                                }}
                            >
                                <Text style={styles.errorButtonPrimaryText}>Thử lại</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Brightness Overlay - ẩn trong PiP */}
                {!isInPipMode && (
                    <Animated.View
                        style={[
                            StyleSheet.absoluteFill,
                            { backgroundColor: 'black', opacity: brightnessOpacity, zIndex: 1 }
                        ]}
                        pointerEvents="none"
                    />
                )}

                {/* Touch Area for Controls Toggle - ẩn trong PiP */}
                {!isInPipMode && <Pressable style={[StyleSheet.absoluteFill, { zIndex: 2 }]} onPress={toggleControls} />}

                {/* VISUAL BRIGHTNESS SLIDER - ẩn trong PiP */}
                {!isInPipMode && (
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
                )}

                {/* CONTROLS - ẩn trong PiP để cửa sổ chỉ hiển thị video */}
                {showControls && !isInPipMode && (
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
                                        <Text style={styles.subTitle}>
                                            Server {serverList[currentServerIndex] || currentServerIndex + 1}
                                        </Text>
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
                                        {!!onPiP && (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setShowEpisodes(false);
                                                    setShowServers(false);
                                                    setTimeout(() => onPiP?.(), 250);
                                                }}
                                                onLongPress={() => onPipSizeCycle?.()}
                                                delayLongPress={400}
                                            >
                                                <PipIcon size={24} color="white" />
                                            </TouchableOpacity>
                                        )}
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

            {/* Episode Selector Overlay - không hiện trong PiP */}
            {!isInPipMode && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 100, elevation: 100, overflow: 'hidden' }]} pointerEvents={showEpisodes ? 'auto' : 'none'}>
                    {/* Dark Overlay */}
                    <Animated.View style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: 'black', opacity: slideAnim.interpolate({ inputRange: [0, width + 100], outputRange: [0.6, 0] }) }
                    ]}>
                        <Pressable style={{ flex: 1 }} onPress={() => setShowEpisodes(false)} />
                    </Animated.View>

                    {/* Animated Glass Drawer - translate fully off so no strip visible when closed */}
                    <Animated.View style={[
                        styles.drawerContent,
                        { position: 'absolute', right: 0, top: 0, bottom: 0 },
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
                        <View style={{ flex: 1 }}>

                            {/* Range Picker — chiều cao cố định, không kéo dài */}
                            {episodeList.length > EP_CHUNK && (
                                <View style={{ height: 44, marginBottom: 4 }}>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}
                                    >
                                        {Array.from({ length: Math.ceil(episodeList.length / EP_CHUNK) }).map((_, i) => {
                                            const from = i * EP_CHUNK + 1;
                                            const to = Math.min((i + 1) * EP_CHUNK, episodeList.length);
                                            const isActive = epRange === i;
                                            return (
                                                <TouchableOpacity
                                                    key={i}
                                                    onPress={() => setEpRange(i)}
                                                    style={[styles.rangeChip, isActive && styles.rangeChipActive]}
                                                >
                                                    <Text style={[styles.rangeChipText, isActive && styles.rangeChipTextActive]} numberOfLines={1}>
                                                        {from}–{to}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Optimized FlatList for episodes */}
                            <FlatList
                                style={{ flex: 1 }}
                                data={episodeList.slice(epRange * EP_CHUNK, (epRange + 1) * EP_CHUNK)}
                                keyExtractor={(item) => item.slug}
                                numColumns={5}
                                columnWrapperStyle={{ gap: 8, paddingHorizontal: 12, marginBottom: 8 }}
                                contentContainerStyle={{ paddingVertical: 18, paddingBottom: 100 }}
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                                scrollEnabled={true}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item }) => {
                                    const isActive = item.slug === currentEpisodeSlug;
                                    return (
                                        <TouchableOpacity
                                            style={[styles.epGridItem, { width: EP_ITEM_WIDTH }, isActive && styles.activeEpGridItem]}
                                            onPress={() => {
                                                onEpisodeChange?.(item.slug);
                                                setShowEpisodes(false);
                                            }}
                                        >
                                            <Text style={[styles.epGridText, isActive && styles.activeEpGridText]} numberOfLines={1}>
                                                {item.name.replace('Tập ', '')}
                                            </Text>
                                            {isActive && (
                                                <View style={{ position: 'absolute', bottom: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: '#fbbf24' }} />
                                            )}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    </Animated.View>
                </View>
            )}

            {/* Server Selector Overlay - không hiện trong PiP */}
            {!isInPipMode && showServers && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 100, elevation: 100 }]}>
                    <View style={styles.sheetOverlay}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowServers(false)} />
                        <View style={styles.sheetContent}>
                            <View style={styles.sheetHeader}>
                                <Text style={styles.sheetTitle}>Nguồn phát</Text>
                                <TouchableOpacity onPress={() => setShowServers(false)}>
                                    <Ionicons name="close-circle" size={28} color="#4b5563" />
                                </TouchableOpacity>
                            </View>

                            {/* Language tabs */}
                            {activeLangGroups.length > 1 && (
                                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                    {activeLangGroups.map(lang => {
                                        const isActive = serverLangTab === lang || (!serverLangTab && activeLangGroups[0] === lang);
                                        const dotColor = LANG_COLORS[lang] || '#9ca3af'; // dot keeps language color
                                        return (
                                            <TouchableOpacity
                                                key={lang}
                                                onPress={() => setServerLangTab(lang)}
                                                style={{
                                                    flexDirection: 'row', alignItems: 'center', gap: 6,
                                                    paddingHorizontal: 14, paddingVertical: 7,
                                                    borderRadius: 20,
                                                    backgroundColor: isActive ? 'rgba(244,200,74,0.15)' : 'rgba(255,255,255,0.06)',
                                                    borderWidth: 1,
                                                    borderColor: isActive ? '#F4C84A' : 'rgba(255,255,255,0.1)',
                                                }}
                                            >
                                                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: isActive ? dotColor : 'rgba(255,255,255,0.25)' }} />
                                                <Text style={{ color: isActive ? '#F4C84A' : 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: isActive ? '700' : '500' }}>
                                                    {lang}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Servers for the active lang tab */}
                            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                                {(groupedServers[serverLangTab || activeLangGroups[0]] || serverList.map((_, i) => i)).map((index) => (
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
                                                {serverList[index]}
                                            </Text>
                                        </View>
                                        {index === currentServerIndex && <Ionicons name="checkmark" size={20} color="#fbbf24" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </View>
            )}
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

    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    errorOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: 'rgba(0,0,0,0.75)',
        zIndex: 4,
    },
    errorTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
    },
    errorMessage: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        textAlign: 'center',
    },
    errorButtonPrimary: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#fbbf24',
    },
    errorButtonPrimaryText: {
        color: '#111827',
        fontWeight: '600',
        fontSize: 14,
    },
    errorButtonSecondary: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    errorButtonSecondaryText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14,
    },

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

    // --- EPISODE GRID (iOS 26, đồng bộ với trang phim) ---
    epGridItem: {
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 4,
    },
    activeEpGridItem: {
        backgroundColor: 'rgba(245,196,81,0.10)',
        borderColor: '#F5C451',
    },
    epGridText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 2, // nudge up slightly to make room for dot
    },
    activeEpGridText: {
        color: '#F5C451',
        fontWeight: '600',
    },

    // Range chip — cùng chiều cao, không cắt chữ
    rangeChip: {
        height: 36,
        minWidth: 72,
        paddingHorizontal: 14,
        paddingVertical: 0,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rangeChipActive: { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: '#fbbf24' },
    rangeChipText: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600' },
    rangeChipTextActive: { color: '#fbbf24', fontWeight: '700' },

    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheetContent: { width: '100%', backgroundColor: '#1c1c1c', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sheetTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    serverRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    activeServerRow: {},
    serverRowText: { color: 'white', fontSize: 16 },
    activeServerRowText: { color: '#fbbf24', fontWeight: 'bold' },
});
