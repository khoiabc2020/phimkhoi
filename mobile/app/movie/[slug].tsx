import { View, Text, ScrollView, ActivityIndicator, Pressable, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, Stack, Link, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { getMovieDetail, getImageUrl, getRelatedMovies, Movie } from '@/services/api';
import { addFavorite, removeFavorite, isFavorite } from '@/lib/favorites';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';

const { width } = Dimensions.get('window');

export default function MovieDetailScreen() {
    const { slug } = useLocalSearchParams();
    const router = useRouter();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fav, setFav] = useState(false);
    const [selectedServer, setSelectedServer] = useState(0);
    const [selectedTab, setSelectedTab] = useState<'episodes' | 'gallery' | 'actors' | 'soundtrack' | 'related'>('episodes');
    const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);

    const { user, token, syncFavorites } = useAuth();

    // Check Favorite Status
    useEffect(() => {
        if (!movie) return;
        const checkFav = async () => {
            if (user && token) {
                if (user.favorites) {
                    const isF = user.favorites.some((f: any) => typeof f === 'string' ? f === movie.slug : f.slug === movie.slug);
                    setFav(isF);
                }
            } else {
                const isF = await isFavorite(movie._id);
                setFav(isF);
            }
        };
        checkFav();
    }, [movie, user]);

    const toggleFavorite = useCallback(async () => {
        if (!movie) return;
        if (user && token) {
            try {
                if (fav) {
                    await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/favorites`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ slug: movie.slug })
                    });
                } else {
                    await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/favorites`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ slug: movie.slug })
                    });
                }
                await syncFavorites();
                setFav(!fav);
            } catch (e) {
                Alert.alert("Lỗi", "Không thể đồng bộ yêu thích");
            }
        } else {
            if (fav) {
                await removeFavorite(movie._id);
                setFav(false);
            } else {
                await addFavorite({ _id: movie._id, slug: movie.slug, name: movie.name, poster_url: movie.poster_url, thumb_url: movie.thumb_url });
                setFav(true);
            }
        }
    }, [movie, fav, user, token]);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!slug) return;
            setLoading(true);
            const data = await getMovieDetail(slug as string);
            if (data && data.movie) {
                setMovie(data.movie);
                setEpisodes(data.episodes || []);
                if (data.movie.category && data.movie.category.length > 0) {
                    getRelatedMovies(data.movie.category[0].slug).then((related: Movie[]) => {
                        setRelatedMovies(related.filter((m: Movie) => m.slug !== data.movie.slug));
                    });
                }
            }
            setLoading(false);
        };
        fetchDetail();
    }, [slug]);

    if (loading) {
        return (
            <View className="flex-1 bg-[#0a0a0a] justify-center items-center">
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#fbbf24" />
            </View>
        );
    }

    if (!movie) {
        return (
            <View className="flex-1 bg-[#0a0a0a] justify-center items-center">
                <Stack.Screen options={{ headerShown: false }} />
                <Text className="text-white">Không tìm thấy phim</Text>
            </View>
        );
    }

    const posterUrl = getImageUrl(movie.thumb_url || movie.poster_url);
    const firstEpisode = episodes[0]?.server_data?.[0];

    return (
        <View className="flex-1 bg-[#0a0a0a]">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Compact Header with Poster */}
                <View className="relative pt-12 pb-4">
                    {/* Back Button */}
                    <Pressable onPress={() => router.back()} className="absolute top-12 left-4 z-10 bg-black/50 p-2 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </Pressable>

                    {/* Centered Compact Poster */}
                    <View className="items-center mb-4">
                        <Image
                            source={{ uri: posterUrl }}
                            style={{ width: width * 0.5, aspectRatio: 2 / 3, borderRadius: 12 }}
                            contentFit="cover"
                            transition={500}
                        />
                    </View>

                    {/* Title Stack (Centered) */}
                    <View className="items-center px-6 mb-3">
                        <Text className="text-white text-2xl font-bold text-center leading-tight mb-1">
                            {movie.name}
                        </Text>
                        {movie.origin_name && (
                            <Text className="text-gray-400 text-sm text-center">
                                {movie.origin_name}
                            </Text>
                        )}
                    </View>

                    {/* Info Pills */}
                    <View className="flex-row justify-center items-center gap-2 mb-4">
                        <View className="bg-gray-800 px-2 py-1 rounded">
                            <Text className="text-gray-300 text-xs font-semibold">{movie.quality || "HD"}</Text>
                        </View>
                        <Text className="text-gray-400 text-xs">{movie.year}</Text>
                        {movie.episode_current && (
                            <Text className="text-gray-400 text-xs">{movie.episode_current}</Text>
                        )}
                    </View>
                </View>

                {/* Main Content */}
                <View className="px-4">
                    {/* Yellow "Xem Ngay" Button */}
                    <Link href={firstEpisode ? `/player/${movie.slug}?ep=${firstEpisode.slug}` : '/'} asChild>
                        <Pressable className="w-full bg-[#fbbf24] py-4 rounded-lg mb-3 active:opacity-90" disabled={!firstEpisode}>
                            <View className="flex-row justify-center items-center">
                                <Ionicons name="play" size={24} color="black" />
                                <Text className="text-black font-bold text-lg ml-2">Xem Ngay</Text>
                            </View>
                        </Pressable>
                    </Link>

                    {/* Icon Row */}
                    <View className="flex-row justify-around items-center mb-6 px-4">
                        <Pressable onPress={toggleFavorite} className="items-center">
                            <Ionicons name={fav ? "heart" : "heart-outline"} size={26} color={fav ? "#fbbf24" : "white"} />
                            <Text className="text-gray-400 text-xs mt-1">Yêu thích</Text>
                        </Pressable>
                        <Pressable className="items-center">
                            <Ionicons name="add-circle-outline" size={26} color="white" />
                            <Text className="text-gray-400 text-xs mt-1">Thêm vào</Text>
                        </Pressable>
                        <Pressable className="items-center">
                            <Ionicons name="paper-plane-outline" size={26} color="white" />
                            <Text className="text-gray-400 text-xs mt-1">Chia sẻ</Text>
                        </Pressable>
                        <View className="items-center">
                            <View className="bg-blue-600 px-3 py-1 rounded-full">
                                <Text className="text-white text-xs font-bold">0</Text>
                            </View>
                            <Text className="text-gray-400 text-xs mt-1">Đánh giá</Text>
                        </View>
                    </View>

                    {/* Tab System */}
                    <View className="flex-row border-b border-gray-800 mb-4">
                        <Pressable onPress={() => setSelectedTab('episodes')} className={`mr-4 pb-2 ${selectedTab === 'episodes' ? 'border-b-2 border-[#fbbf24]' : ''}`}>
                            <Text className={`font-semibold text-sm ${selectedTab === 'episodes' ? 'text-[#fbbf24]' : 'text-gray-400'}`}>Tập phim</Text>
                        </Pressable>
                        <Pressable onPress={() => setSelectedTab('gallery')} className={`mr-4 pb-2 ${selectedTab === 'gallery' ? 'border-b-2 border-[#fbbf24]' : ''}`}>
                            <Text className={`font-semibold text-sm ${selectedTab === 'gallery' ? 'text-[#fbbf24]' : 'text-gray-400'}`}>Gallery</Text>
                        </Pressable>
                        <Pressable onPress={() => setSelectedTab('actors')} className={`mr-4 pb-2 ${selectedTab === 'actors' ? 'border-b-2 border-[#fbbf24]' : ''}`}>
                            <Text className={`font-semibold text-sm ${selectedTab === 'actors' ? 'text-[#fbbf24]' : 'text-gray-400'}`}>Diễn viên</Text>
                        </Pressable>
                        <Pressable onPress={() => setSelectedTab('soundtrack')} className={`mr-4 pb-2 ${selectedTab === 'soundtrack' ? 'border-b-2 border-[#fbbf24]' : ''}`}>
                            <Text className={`font-semibold text-sm ${selectedTab === 'soundtrack' ? 'text-[#fbbf24]' : 'text-gray-400'}`}>Soundtrack</Text>
                        </Pressable>
                        <Pressable onPress={() => setSelectedTab('related')} className={`pb-2 ${selectedTab === 'related' ? 'border-b-2 border-[#fbbf24]' : ''}`}>
                            <Text className={`font-semibold text-sm ${selectedTab === 'related' ? 'text-[#fbbf24]' : 'text-gray-400'}`}>Đề xuất</Text>
                        </Pressable>
                    </View>

                    {/* Tab Content */}
                    {selectedTab === 'episodes' && episodes.length > 0 && (
                        <View>
                            {/* Server Selector */}
                            <Pressable className="flex-row items-center justify-between bg-gray-800/50 p-3 rounded-lg mb-3">
                                <Text className="text-white font-semibold">Phần 1</Text>
                                <View className="flex-row items-center gap-2">
                                    <View className="bg-blue-600 px-2 py-1 rounded">
                                        <Text className="text-white text-xs font-bold">Vietsub #1</Text>
                                    </View>
                                    <Ionicons name="chevron-down" size={20} color="white" />
                                </View>
                            </Pressable>

                            {/* 3-Column Episode Grid */}
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {episodes.flatMap((server: any) => server.server_data).map((ep: any, index: number) => (
                                    <Link key={`${ep.slug}-${index}`} href={`/player/${movie.slug}?ep=${ep.slug}`} asChild>
                                        <Pressable style={{
                                            width: '31%',
                                            backgroundColor: 'rgba(55,65,81,0.7)',
                                            paddingVertical: 10,
                                            borderRadius: 8,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 4,
                                        }}>
                                            <Ionicons name="play" size={12} color="white" />
                                            <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
                                                {ep.name || `Tập ${index + 1}`}
                                            </Text>
                                        </Pressable>
                                    </Link>
                                ))}
                            </View>
                        </View>
                    )}

                    {selectedTab === 'gallery' && (
                        <View className="py-8 items-center">
                            <Text className="text-gray-500">Gallery đang cập nhật</Text>
                        </View>
                    )}

                    {selectedTab === 'actors' && (
                        <View className="py-4">
                            <Text className="text-gray-400 text-sm mb-2">
                                <Text className="text-gray-500 font-semibold">Diễn viên: </Text>
                                {movie.actor && movie.actor.length > 0 ? movie.actor.join(", ") : "Đang cập nhật"}
                            </Text>
                            <Text className="text-gray-400 text-sm">
                                <Text className="text-gray-500 font-semibold">Đạo diễn: </Text>
                                {movie.director && movie.director.length > 0 ? movie.director.join(", ") : "Đang cập nhật"}
                            </Text>
                        </View>
                    )}

                    {selectedTab === 'soundtrack' && (
                        <View className="py-8 items-center">
                            <Text className="text-gray-500">Soundtrack đang cập nhật</Text>
                        </View>
                    )}

                    {selectedTab === 'related' && (
                        <View className="py-2">
                            {relatedMovies.length > 0 ? (
                                <View className="flex-row flex-wrap gap-3">
                                    {relatedMovies.map((item) => (
                                        <Link key={item.slug} href={`/movie/${item.slug}`} asChild>
                                            <Pressable className="w-[31%] active:scale-95">
                                                <Image
                                                    source={{ uri: getImageUrl(item.poster_url || item.thumb_url) }}
                                                    style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: 8 }}
                                                    contentFit="cover"
                                                />
                                                <Text numberOfLines={2} className="text-white text-xs mt-2 font-medium">
                                                    {item.name}
                                                </Text>
                                            </Pressable>
                                        </Link>
                                    ))}
                                </View>
                            ) : (
                                <View className="py-8 items-center">
                                    <Text className="text-gray-500">Chưa có đề xuất liên quan</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
