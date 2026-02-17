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
                {/* Vertical Backdrop Header (Netflix Style) */}
                <View className="relative w-full aspect-[2/3] -mb-40">
                    <Image
                        source={{ uri: backdropUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={500}
                    />
                    {/* Gradient Overlay for Text Visibility */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)', '#000000']}
                        locations={[0.4, 0.7, 1]}
                        style={{ position: 'absolute', inset: 0 }}
                    />

                    {/* Navbar (Absolute Top) */}
                    <View className="absolute top-12 left-0 right-0 px-4 flex-row justify-between items-center z-10">
                        <Pressable onPress={() => router.back()} className="bg-black/30 p-2 rounded-full backdrop-blur-md">
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </Pressable>
                        <View className="flex-row gap-4">
                            <Pressable className="bg-black/30 p-2 rounded-full backdrop-blur-md">
                                <Ionicons name="search-outline" size={24} color="white" />
                            </Pressable>
                            <Pressable className="bg-black/30 p-2 rounded-full backdrop-blur-md">
                                <Ionicons name="share-outline" size={24} color="white" />
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Main Content */}
                <View className="px-4 pt-4">
                    {/* Title (Overlapping Image) */}
                    <Animated.View entering={FadeInDown.duration(600).delay(100)} className="items-center mb-6">
                        {/* Network / Type Badge */}
                        {movie.category && movie.category[0] && (
                            <Text className="text-[#fbbf24] font-bold text-xs tracking-widest uppercase mb-2">
                                {movie.category[0].name} • SERIES
                            </Text>
                        )}
                        <Text className="text-white text-4xl font-extrabold text-center mb-2 shadow-sm leading-tight tracking-tight">
                            {movie.name}
                        </Text>
                        {/* Stats Row */}
                        <View className="flex-row items-center gap-3">
                            <Text className="text-green-400 font-bold text-sm">98% Match</Text>
                            <Text className="text-gray-400 text-sm">{movie.year}</Text>
                            <View className="bg-gray-800 px-1.5 py-0.5 rounded">
                                <Text className="text-gray-300 text-[10px] font-bold">{movie.quality}</Text>
                            </View>
                            <View className="bg-gray-800 px-1.5 py-0.5 rounded">
                                <Text className="text-gray-300 text-[10px] font-bold">HD</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Primary Buttons (Netflix Style) */}
                    <View className="flex-col gap-3 mb-8">
                        <Link href={firstEpisode ? `/player/${movie.slug}?ep=${firstEpisode.slug}` as any : '/'} asChild>
                            <Pressable className="w-full bg-white py-3.5 rounded-lg flex-row justify-center items-center active:opacity-90 transition-opacity" disabled={!firstEpisode}>
                                <Ionicons name="play" size={26} color="black" />
                                <Text className="text-black font-bold text-lg ml-2">Phát</Text>
                            </Pressable>
                        </Link>

                        <Pressable className="w-full bg-[#333] py-3.5 rounded-lg flex-row justify-center items-center active:bg-[#444] transition-colors">
                            <Ionicons name="download-outline" size={24} color="white" />
                            <Text className="text-white font-bold text-base ml-2">Tải xuống</Text>
                        </Pressable>
                    </View>

                    {/* Description & Cast Preview */}
                    <View className="mb-6">
                        <Text className="text-white text-sm leading-5 mb-2" numberOfLines={3}>
                            {movie.content?.replace(/<[^>]*>/g, '').trim()}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                            <Text className="text-gray-500">Diễn viên: </Text>
                            {movie.actor && movie.actor.length > 0 ? movie.actor.join(", ") : "Đang cập nhật"}
                        </Text>
                        <Text className="text-gray-400 text-xs mt-1">
                            <Text className="text-gray-500">Đạo diễn: </Text>
                            {movie.director && movie.director.length > 0 ? movie.director.join(", ") : "Đang cập nhật"}
                        </Text>
                    </View>

                    {/* Action Icons Row */}
                    <View className="flex-row justify-start gap-8 mb-8 px-2">
                        <Pressable onPress={toggleFavorite} className="items-center">
                            <Ionicons name={fav ? "checkmark-circle" : "add-outline"} size={26} color="white" />
                            <Text className="text-gray-400 text-[10px] mt-1">Danh sách</Text>
                        </Pressable>
                        <Pressable className="items-center">
                            <Ionicons name="thumbs-up-outline" size={24} color="white" />
                            <Text className="text-gray-400 text-[10px] mt-1">Xếp hạng</Text>
                        </Pressable>
                        <Pressable className="items-center">
                            <Ionicons name="paper-plane-outline" size={24} color="white" />
                            <Text className="text-gray-400 text-[10px] mt-1">Chia sẻ</Text>
                        </Pressable>
                    </View>

                    {/* Tabs / Segmented Control */}
                    <View className="flex-row border-t border-gray-800 pt-4 mb-4">
                        <Pressable onPress={() => setSelectedTab('episodes')} className={`mr-6 pb-2 border-b-4 ${selectedTab === 'episodes' ? 'border-[#e50914]' : 'border-transparent'}`}>
                            <Text className={`font-bold text-base ${selectedTab === 'episodes' ? 'text-white' : 'text-gray-400'}`}>TẬP PHIM</Text>
                        </Pressable>
                        <Pressable onPress={() => setSelectedTab('related')} className={`mr-6 pb-2 border-b-4 ${selectedTab === 'related' ? 'border-[#e50914]' : 'border-transparent'}`}>
                            <Text className={`font-bold text-base ${selectedTab === 'related' ? 'text-white' : 'text-gray-400'}`}>ĐỀ XUẤT</Text>
                        </Pressable>
                    </View>

                    {/* Tab Content */}
                    {selectedTab === 'episodes' && episodes.length > 0 && (
                        <View>
                            {/* Server/Season Selector (Simple Text) */}
                            {episodes.length > 0 && (
                                <View className="mb-4">
                                    <Text className="text-white font-bold text-lg">Phần 1</Text>
                                    {episodes.length > 1 && (
                                        <Text className="text-gray-500 text-xs mt-1">Nguồn: {episodes.map((s: any) => s.server_name).join(', ')}</Text>
                                    )}
                                </View>
                            )}

                            {/* Vertical Episode List */}
                            <View className="space-y-4">
                                {episodes.flatMap((server: any) => server.server_data).map((ep: any, index: number) => {
                                    // Generate a fake duration for UI feel if not present
                                    const duration = "24m";
                                    const isNext = index === 0; // Hypothetical 'next to watch' logic could go here

                                    return (
                                        <Link key={`${ep.slug}-${index}`} href={`/player/${movie.slug}?ep=${ep.slug}`} asChild>
                                            <Pressable className="flex-row items-center active:bg-gray-800/50 rounded-lg p-2 -mx-2">
                                                {/* Thumbnail Placeholder */}
                                                <View className="relative w-32 h-20 bg-gray-800 rounded-md overflow-hidden mr-3 justify-center items-center">
                                                    <Image
                                                        source={{ uri: backdropUrl }}
                                                        style={{ width: '100%', height: '100%', opacity: 0.6 }}
                                                        contentFit="cover"
                                                    />
                                                    <View className="absolute inset-0 bg-black/20 flex justify-center items-center">
                                                        <Ionicons name="play-circle-outline" size={30} color="white" />
                                                    </View>
                                                    {/* Progress Bar (Fake) */}
                                                    {index === 0 && (
                                                        <View className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                                                            <View className="w-[40%] h-full bg-[#e50914]" />
                                                        </View>
                                                    )}
                                                </View>

                                                {/* Info */}
                                                <View className="flex-1 justify-center">
                                                    <View className="flex-row justify-between items-center mb-1">
                                                        <Text className="text-white font-bold text-base">{index + 1}. {ep.name}</Text>
                                                        <Text className="text-gray-500 text-xs">{duration}</Text>
                                                    </View>
                                                    <Text className="text-gray-400 text-xs line-clamp-2" numberOfLines={2}>
                                                        {movie.content?.substring(0, 60).replace(/<[^>]*>/g, '')}...
                                                    </Text>
                                                </View>

                                                <View className="ml-2">
                                                    <Ionicons name="download-outline" size={24} color="gray" />
                                                </View>
                                            </Pressable>
                                        </Link>
                                    );
                                })}
                            </View>
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
