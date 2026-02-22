import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { getImageUrl } from '@/services/api';

const { width } = Dimensions.get('window');
// Make card responsive: for tablets (width > 700), show more items so cards aren't overly huge.
const isTablet = width > 700;
const CARD_WIDTH = isTablet ? width * 0.4 : width * 0.75;
const CARD_HEIGHT = CARD_WIDTH * (9 / 16);

interface HistoryItem {
    slug: string;
    episode?: string;
    progress?: number;
    currentTime?: number;
    duration?: number;
    movie?: {
        _id: string;
        name: string;
        thumb_url?: string;
        poster_url?: string;
    };
    movieName?: string;
    moviePoster?: string;
}

interface ContinueWatchingRowProps {
    title: string;
    items: HistoryItem[];
}

const ContinueWatchingRow = memo(({ title, items }: ContinueWatchingRowProps) => {
    if (!items || items.length === 0) return null;

    return (
        <View style={styles.container}>
            {/* Section Header */}
            <View style={styles.header}>
                <View style={styles.titleGroup}>
                    <View style={styles.accentBar} />
                    <Text style={styles.title}>{title}</Text>
                </View>
            </View>

            {/* Movie List */}
            <FlashList
                data={items}
                renderItem={({ item }) => {
                    const posterUrl = item.movie?.thumb_url || item.movie?.poster_url || item.moviePoster;
                    const name = item.movie?.name || item.movieName || item.slug;
                    const progress = item.progress || 0;
                    const linkLabel = item.episode ? `Tập ${item.episode}` : 'Tiếp tục';

                    return (
                        <Link href={`/player/${item.slug}?ep=${item.episode || ''}`} asChild>
                            <Pressable>
                                {/* Card ảnh — không có overlay che */}
                                <View style={styles.card}>
                                    <Image
                                        source={{ uri: getImageUrl(posterUrl) }}
                                        style={StyleSheet.absoluteFill}
                                        contentFit="cover"
                                        transition={300}
                                        cachePolicy="memory-disk"
                                    />

                                    {/* Progress Bar mỏng đáy ảnh */}
                                    <View style={styles.progressOverlay}>
                                        <View style={[styles.progressFill, { width: `${Math.max(2, Math.min(100, progress))}%` as any }]} />
                                    </View>
                                </View>

                                {/* Text xuống dưới card — không che mặt nhân vật */}
                                <View style={styles.cardInfo}>
                                    <Text style={styles.movieName} numberOfLines={1}>{name}</Text>
                                    <Text style={styles.episodeText}>{linkLabel}</Text>
                                </View>
                            </Pressable>
                        </Link>
                    );
                }}
                estimatedItemSize={CARD_WIDTH}
                keyExtractor={(item, index) => item.slug + index}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 32,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    accentBar: {
        width: 3,
        height: 18,
        borderRadius: 2,
        backgroundColor: '#ef4444', // Netflix Red!
    },
    title: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    listContent: {
        paddingHorizontal: 16,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#1f2937',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        position: 'relative',
    },
    playIconContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    glassInfoContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.2)',
        paddingBottom: 4, // Make room for progress bar
    },
    glassContent: {
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.25)', // slight darkening
    },
    progressOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#e50914',
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
    },
    cardInfo: {
        paddingTop: 8,
        paddingHorizontal: 2,
    },
    movieName: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.1,
    },
    episodeText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginTop: 2,
    },
});

export default ContinueWatchingRow;
