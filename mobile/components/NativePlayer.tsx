import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions, Modal, TouchableOpacity, StatusBar } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ScreenOrientation from 'expo-screen-orientation';
import { LinearGradient } from 'expo-linear-gradient';
import { useKeepAwake } from 'expo-keep-awake';
import * as Brightness from 'expo-brightness';

const { width, height } = Dimensions.get('window');

interface NativePlayerProps {
    url: string;
    title: string;
    episode?: string;
    onClose: () => void;
    onNext?: () => void;
}

export default function NativePlayer({ url, title, episode, onClose, onNext }: NativePlayerProps) {
    useKeepAwake();
    const video = useRef<Video>(null);
    const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
    const [showControls, setShowControls] = useState(true);
    const [resizeMode, setResizeMode] = useState(ResizeMode.CONTAIN);
    const controlTimeout = useRef<any>(null);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

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

    const toggleControls = () => {
        setShowControls(!showControls);
        if (!showControls) resetControlsTimer();
    };

    const handlePlayPause = async () => {
        if (!video.current) return;
        if (status.isLoaded && status.isPlaying) {
            await video.current.pauseAsync();
        } else {
            await video.current.playAsync();
        }
        resetControlsTimer();
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

    const formatTime = (millis: number) => {
        if (!millis) return "00:00";
        const minutes = Math.floor(millis / 60000);
        const seconds = Math.floor((millis % 60000) / 1000);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Render Settings Modal
    const renderSettings = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={settingsVisible}
            onRequestClose={() => setSettingsVisible(false)}
        >
            <Pressable style={styles.modalOverlay} onPress={() => setSettingsVisible(false)}>
                <View style={styles.settingsContainer}>
                    <Text style={styles.settingsTitle}>Cài đặt</Text>

                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Tốc độ phát</Text>
                        <View style={styles.speedOptions}>
                            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                                <TouchableOpacity
                                    key={speed}
                                    style={[styles.speedBtn, playbackSpeed === speed && styles.activeSpeedBtn]}
                                    onPress={() => handleSpeedChange(speed)}
                                >
                                    <Text style={[styles.speedText, playbackSpeed === speed && styles.activeSpeedText]}>
                                        {speed}x
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Tỷ lệ khung hình</Text>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleResizeMode}>
                            <Ionicons name="resize" size={20} color="white" />
                            <Text style={styles.actionBtnText}>
                                {resizeMode === ResizeMode.CONTAIN ? 'Vừa màn hình' : 'Lấp đầy'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <Video
                ref={video}
                style={styles.video}
                source={{
                    uri: url,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Referer': 'https://phimkhoi.com'
                    }
                }}
                useNativeControls={false}
                resizeMode={resizeMode}
                onPlaybackStatusUpdate={status => setStatus(status)}
                shouldPlay
            />

            {/* Clickable Overlay to Toggle Controls */}
            <Pressable style={styles.overlay} onPress={toggleControls}>
                {showControls && (
                    <View style={styles.controlsContainer}>
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

                        {/* Center Play/Pause */}
                        <View style={styles.centerControls}>
                            {/* Rewind */}
                            <TouchableOpacity onPress={async () => video.current?.setPositionAsync((status as any).positionMillis - 10000)} style={styles.skipBtn}>
                                <Ionicons name="play-back" size={30} color="white" />
                                <Text style={styles.skipText}>-10s</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseBtn}>
                                {status.isLoaded && status.isPlaying ? (
                                    <Ionicons name="pause" size={40} color="black" />
                                ) : (
                                    <Ionicons name="play" size={40} color="black" />
                                )}
                            </TouchableOpacity>

                            {/* Forward */}
                            <TouchableOpacity onPress={async () => video.current?.setPositionAsync((status as any).positionMillis + 10000)} style={styles.skipBtn}>
                                <Ionicons name="play-forward" size={30} color="white" />
                                <Text style={styles.skipText}>+10s</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.footer}>
                            <View style={styles.sliderContainer}>
                                <Text style={styles.timeText}>
                                    {status.isLoaded ? formatTime(status.positionMillis) : "00:00"}
                                </Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={status.isLoaded ? status.durationMillis : 1}
                                    value={status.isLoaded ? status.positionMillis : 0}
                                    onSlidingComplete={handleSeek}
                                    minimumTrackTintColor="#fbbf24"
                                    maximumTrackTintColor="#9ca3af"
                                    thumbTintColor="#fbbf24"
                                />
                                <Text style={styles.timeText}>
                                    {status.isLoaded ? formatTime(status.durationMillis || 0) : "00:00"}
                                </Text>
                            </View>

                            <View style={styles.bottomActions}>
                                <TouchableOpacity style={styles.bottomActionBtn}>
                                    <Ionicons name="albums-outline" size={20} color="white" />
                                    <Text style={styles.bottomActionText}>Danh sách</Text>
                                </TouchableOpacity>
                                {onNext && (
                                    <TouchableOpacity onPress={onNext} style={styles.nextBtn}>
                                        <Text style={styles.nextBtnText}>Tập tiếp theo</Text>
                                        <Ionicons name="play-skip-forward" size={16} color="black" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </LinearGradient>
                    </View>
                )}
            </Pressable>
            {renderSettings()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    video: { width: '100%', height: '100%' },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
    controlsContainer: { flex: 1, justifyContent: 'space-between' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40 },
    backBtn: { padding: 8, marginRight: 16 },
    videoTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    subTitle: { color: '#fbbf24', fontSize: 14, fontWeight: '600' },
    settingsBtn: { marginLeft: 'auto', padding: 8 },
    centerControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 },
    playPauseBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fbbf24', justifyContent: 'center', alignItems: 'center' },
    skipBtn: { alignItems: 'center' },
    skipText: { color: 'white', fontSize: 10, marginTop: 4 },
    footer: { padding: 20, paddingBottom: 30 },
    sliderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    slider: { flex: 1, marginHorizontal: 10 },
    timeText: { color: 'white', fontSize: 12, width: 45, textAlign: 'center' },
    bottomActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bottomActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    bottomActionText: { color: 'white', marginLeft: 8, fontWeight: '600' },
    nextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    nextBtnText: { color: 'black', marginRight: 8, fontWeight: 'bold' },

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
