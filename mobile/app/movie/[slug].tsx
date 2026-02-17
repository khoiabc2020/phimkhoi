import { View, Text, ScrollView, ActivityIndicator, Pressable, Dimensions, Alert, Modal } from 'react-native';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import CommentSection from '@/components/CommentSection';

const { width } = Dimensions.get('window');

export default function MovieDetailScreen() {
    const { slug } = useLocalSearchParams();
    const router = useRouter();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [episodes, setEpisodes] = useState<any[]>([]); // Array of server objects
    const [loading, setLoading] = useState(true);
    const [fav, setFav] = useState(false);
    const [expandDesc, setExpandDesc] = useState(false);
    const [selectedServer, setSelectedServer] = useState(0);
    const [selectedTab, setSelectedTab] = useState<'episodes' | 'actors' | 'related'>('episodes');
    const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);

    const { user, token, syncFavorites } = useAuth();

    // Check Status
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
                    // Remove
                    await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/favorites`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ slug: movie.slug })
                    });
                } else {
                    // Add
                    await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/favorites`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
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
                await addFavorite({
                    _id: movie._id,
                    slug: movie.slug,
                    name: movie.name,
                    poster_url: movie.poster_url,
                    thumb_url: movie.thumb_url,
                });
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

                // Fetch Related Movies if category exists
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
            <View className="flex-1 bg-black justify-center items-center">
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#fbbf24" />
            </View>
        );
    }

    if (!movie) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <Stack.Screen options={{ headerShown: false }} />
                <Text className="text-white">Không tìm thấy phim</Text>
            </View>
        );
    }

    const backdropUrl = getImageUrl(movie.poster_url || movie.thumb_url);
    const posterUrl = getImageUrl(movie.thumb_url);

    // Helper to get first episode link for "Xem Phim" button
    const firstEpisode = episodes[0]?.server_data?.[0];

    return (
        <View className="flex-1 bg-black">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Backdrop Header with Gradient */}
                <View className="relative w-full aspect-[4/5] -mb-32">
                    <Image
                        source={{ uri: backdropUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={500}
                    />
                    {/* Top Gradient */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent']}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120 }}
                    />
                    {/* Bottom Gradient for smooth transition */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.4)', '#000000']}
                        locations={[0, 0.5, 1]}
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 300 }}
                    />

                    {/* Navbar */}
                    <View className="absolute top-12 left-0 right-0 px-4 flex-row justify-between items-center z-10">
                        <Pressable onPress={() => router.back()} className="bg-black/40 p-2 rounded-full backdrop-blur-md">
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </Pressable>
                        <View className="flex-row gap-4">
                            <Pressable className="bg-black/40 p-2 rounded-full backdrop-blur-md">
                                <Ionicons name="search" size={24} color="white" />
                            </Pressable>
                            <Pressable className="bg-black/40 p-2 rounded-full backdrop-blur-md">
                                <Ionicons name="share-social" size={24} color="white" />
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Main Content */}
                <View className="px-4 pt-10">
                    {/* Title */}
                    <Animated.View entering={FadeInDown.duration(600).delay(100)}>
                        <Text className="text-white text-3xl font-extrabold text-center mb-1 shadow-sm leading-8">
                            {movie.name}
                        </Text>
                        <Text className="text-gray-400 text-sm font-medium text-center mb-4">
                            {movie.origin_name} ({movie.year})
                        </Text>
                    </Animated.View>

                    {/* Metadata Badges */}
                    <Animated.View entering={FadeInDown.duration(600).delay(200)} className="flex-row justify-center items-center flex-wrap gap-2 mb-6">
                        <View className="bg-yellow-500/20 px-2 py-0.5 rounded border border-yellow-500/50">
                            <Text className="text-yellow-500 font-bold text-xs">IMDb 8.5</Text>
                        </View>
                        <View className="bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                            <Text className="text-gray-300 font-bold text-xs">T18</Text>
                        </View>
                        <View className="bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                            <Text className="text-gray-300 font-bold text-xs">{movie.year}</Text>
                        </View>
                        <View className="bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                            <Text className="text-gray-300 font-bold text-xs">{movie.quality}</Text>
                        </View>
                        <View className="bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                            <Text className="text-gray-300 font-bold text-xs">{movie.lang}</Text>
                        </View>
                    </Animated.View>

                    {/* Completion Status */}
                    <View className="flex-row justify-center mb-6">
                        <View className="bg-green-500/20 px-3 py-1 rounded-full flex-row items-center border border-green-500/30">
                            <Ionicons name="checkmark-circle" size={14} color="#4ade80" />
                            <Text className="text-green-400 text-xs font-bold ml-1">
                                {movie.status === 'completed' ? 'Đã hoàn thành' : 'Đang cập nhật'}: {movie.episode_current}
                            </Text>
                        </View>
                    </View>

                    {/* Primary Buttons */}
                    <View className="flex-row gap-4 mb-8">
                        <Link href={firstEpisode ? `/player/${movie.slug}?ep=${firstEpisode.slug}` as any : '/'} asChild>
                            <Pressable className="flex-1 bg-yellow-500 py-3.5 rounded-xl flex-row justify-center items-center shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform" disabled={!firstEpisode}>
                                <Ionicons name="play" size={22} color="black" />
                                <Text className="text-black font-extrabold text-lg ml-2">Xem phim</Text>
                            </Pressable>
                        </Link>
                        <Pressable
                            onPress={() => setSelectedTab('episodes')}
                            className="flex-1 bg-white py-3.5 rounded-xl flex-row justify-center items-center shadow-lg active:scale-95 transition-transform"
                        >
                            <Ionicons name="list" size={22} color="black" />
                            <Text className="text-black font-extrabold text-lg ml-2">Tập Phim</Text>
                        </Pressable>
                    </View>

                    {/* Description (Collapsible) */}
                    <View className="mb-6">
                        <Text
                            className="text-gray-300 text-sm leading-6"
                            numberOfLines={expandDesc ? undefined : 3}
                        >
                            {movie.content?.replace(/<[^>]*>/g, '').trim()}
                        </Text>
                        <Pressable onPress={() => setExpandDesc(!expandDesc)} className="flex-row items-center mt-1">
                            <Text className="text-white font-bold text-sm mr-1">
                                {expandDesc ? 'Thu gọn' : 'Chi tiết'}
                            </Text>
                            <Ionicons name={expandDesc ? "chevron-up" : "chevron-down"} size={14} color="white" />
                        </Pressable>
                    </View>

                    {/* Content Categories */}
                    <View className="flex-row flex-wrap gap-2 mb-6">
                        {movie.category?.map((cat: any) => (
                            <View key={cat.id} className="bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">
                                <Text className="text-gray-400 text-xs">{cat.name}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Action Row */}
                    <View className="flex-row justify-between mb-8 px-2">
                        <Pressable onPress={toggleFavorite} className="items-center">
                            <Ionicons name={fav ? "heart" : "heart-outline"} size={24} color={fav ? "#ef4444" : "white"} />
                            <Text className="text-gray-400 text-xs mt-1 font-medium">Yêu thích</Text>
                        </Pressable>
                        <Pressable className="items-center">
                            <Ionicons name="add" size={28} color="white" />
                            <Text className="text-gray-400 text-xs mt-1 font-medium">Thêm vào</Text>
                        </Pressable>
                        <Pressable className="items-center">
                            <Ionicons name="happy-outline" size={24} color="white" />
                            <Text className="text-gray-400 text-xs mt-1 font-medium">Đánh giá</Text>
                        </Pressable>
                        <Pressable className="items-center">
                            <Ionicons name="chatbubble-outline" size={24} color="white" />
                            <Text className="text-gray-400 text-xs mt-1 font-medium">Bình luận</Text>
                        </Pressable>
                        <Pressable className="items-center">
                            <Ionicons name="share-social-outline" size={24} color="white" />
                            <Text className="text-gray-400 text-xs mt-1 font-medium">Chia sẻ</Text>
                        </Pressable>
                    </View>

                    {/* Tabs */}
                    <View className="flex-row border-b border-gray-800 mb-6 px-2">
                        {['episodes', 'actors', 'related'].map((tab) => {
                            const isSelected = selectedTab === tab;
                            return (
                                <Pressable
                                    key={tab}
                                    onPress={() => setSelectedTab(tab as any)}
                                    className={`mr-6 pb-2 border-b-2 items-center flex-row ${isSelected ? 'border-yellow-500' : 'border-transparent'}`}
                                >
                                    <Ionicons
                                        name={tab === 'episodes' ? 'list' : tab === 'actors' ? 'people' : 'grid'}
                                        size={18}
                                        color={isSelected ? '#fbbf24' : '#6b7280'}
                                        style={{ marginBottom: -2, marginRight: 6 }}
                                    />
                                    <Text className={`${isSelected ? 'text-white font-bold' : 'text-gray-400 font-medium'} capitalize text-base`}>
                                        {tab === 'episodes' ? 'Tập phim' : tab === 'actors' ? 'Diễn viên' : 'Đề xuất'}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Tab Content */}
                    {selectedTab === 'episodes' && episodes.length > 0 && (
                        <View>
                            {/* Server/Season Selector */}
                            <View className="flex-row justify-between items-center mb-4">
                                <Pressable className="flex-row items-center">
                                    <Text className="text-white font-bold text-lg mr-2">Phần 1</Text>
                                    <Ionicons name="chevron-down" size={16} color="white" />
                                </Pressable>
                                <Pressable className="flex-row items-center">
                                    <Ionicons name="language" size={16} color="white" style={{ marginRight: 4 }} />
                                    <Text className="text-white font-medium">Tiếng gốc</Text>
                                    <Ionicons name="chevron-down" size={14} color="white" style={{ marginLeft: 2 }} />
                                </Pressable>
                            </View>

                            {/* Episode Grid */}
                            {episodes.map((server, idx) => (
                                <View key={idx} className="mb-4">
                                    {episodes.length > 1 && (
                                        <Text className="text-yellow-500 mb-3 font-medium text-sm border-l-2 border-yellow-500 pl-2">
                                            {server.server_name}
                                        </Text>
                                    )}
                                    <View className="flex-row flex-wrap gap-3">
                                        {server.server_data.map((ep: any) => (
                                            <Link key={ep.slug} href={`/player/${movie.slug}?ep=${ep.slug}`} asChild>
                                                <Pressable className="bg-gray-800 w-[30%] aspect-[2/1] rounded-lg justify-center items-center border border-gray-700 active:bg-gray-700 active:border-yellow-500/50">
                                                    <Text className="text-white font-bold text-sm">{ep.name}</Text>
                                                </Pressable>
                                            </Link>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {selectedTab === 'actors' && (
                        <View className="py-8 items-center">
                            <Text className="text-gray-500">Thông tin diễn viên đang cập nhật</Text>
                        </View>
                    )}


                    {selectedTab === 'related' && (
                        <View className="py-2">
                            {relatedMovies.length > 0 ? (
                                <View className="flex-row flex-wrap gap-3 px-2">
                                    {relatedMovies.map((item) => (
                                        <Link key={item.slug} href={`/movie/${item.slug}`} asChild>
                                            <Pressable className="w-[30%] mb-4 active:scale-95 transition-transform">
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

                    <CommentSection slug={movie.slug} />

                </View>
            </ScrollView>
        </View>
    );
}
