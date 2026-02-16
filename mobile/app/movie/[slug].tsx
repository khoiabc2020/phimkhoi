import { View, Text, ScrollView, ActivityIndicator, Pressable, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack, Link } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { getMovieDetail, getImageUrl, Movie } from '@/services/api';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function MovieDetailScreen() {
    const { slug } = useLocalSearchParams();
    const [movie, setMovie] = useState<Movie | null>(null);
    // Response from API wraps movie in a 'movie' field and episodes in 'episodes'
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!slug) return;
            setLoading(true);
            const data = await getMovieDetail(slug as string);
            if (data && data.movie) {
                setMovie(data.movie);
                setEpisodes(data.episodes || []);
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

    const backdropUrl = getImageUrl(movie.poster_url); // Fallback to poster if thumb not available for backdrop

    // Use first episode for "Play" button
    const firstEpisode = episodes?.[0]?.server_data?.[0];

    return (
        <View className="flex-1 bg-black">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Backdrop Header */}
                <View className="relative w-full aspect-video">
                    <Image
                        source={{ uri: backdropUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)', 'black']}
                        style={{ position: 'absolute', width: '100%', height: '100%' }}
                    />

                    {/* Back Button */}
                    <Link href=".." asChild>
                        <Pressable className="absolute top-12 left-4 bg-black/50 p-2 rounded-full">
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </Pressable>
                    </Link>
                </View>

                {/* Info Section */}
                <View className="px-4 -mt-12">
                    <Text className="text-white text-3xl font-bold mb-2 shadow-sm">{movie.name}</Text>
                    <Text className="text-gray-400 text-base mb-4">{movie.origin_name} ({movie.year})</Text>

                    <View className="flex-row gap-3 mb-6">
                        <View className="bg-gray-800 px-2 py-1 rounded">
                            <Text className="text-gray-300 text-xs">{movie.quality}</Text>
                        </View>
                        <View className="bg-gray-800 px-2 py-1 rounded">
                            <Text className="text-gray-300 text-xs">{movie.lang}</Text>
                        </View>
                        <View className="bg-gray-800 px-2 py-1 rounded">
                            <Text className="text-gray-300 text-xs">{movie.time}</Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <Link href={`/player/${movie.slug}`} asChild>
                        <Pressable className="bg-yellow-500 w-full py-3 rounded-lg flex-row justify-center items-center mb-4 active:opacity-90">
                            <Ionicons name="play" size={24} color="black" />
                            <Text className="text-black font-bold text-lg ml-2">Xem Phim</Text>
                        </Pressable>
                    </Link>

                    <View className="flex-row gap-4 mb-6">
                        <Pressable className="flex-1 bg-gray-800 py-3 rounded-lg flex-col items-center">
                            <Ionicons name="add" size={24} color="white" />
                            <Text className="text-gray-300 text-xs mt-1">Danh sách</Text>
                        </Pressable>
                        <Pressable className="flex-1 bg-gray-800 py-3 rounded-lg flex-col items-center">
                            <Ionicons name="download-outline" size={24} color="white" />
                            <Text className="text-gray-300 text-xs mt-1">Tải xuống</Text>
                        </Pressable>
                        <Pressable className="flex-1 bg-gray-800 py-3 rounded-lg flex-col items-center">
                            <Ionicons name="share-social-outline" size={24} color="white" />
                            <Text className="text-gray-300 text-xs mt-1">Chia sẻ</Text>
                        </Pressable>
                    </View>

                    {/* Description */}
                    <Text className="text-white font-bold text-lg mb-2">Nội dung</Text>
                    <Text className="text-gray-400 leading-6 mb-6">
                        {movie.content?.replace(/<[^>]*>/g, '') || 'Đang cập nhật...'}
                    </Text>

                    {/* Episodes List (Basic) */}
                    {episodes.length > 0 && (
                        <View>
                            <Text className="text-white font-bold text-lg mb-3">Tập phim</Text>
                            {episodes.map((server, idx) => (
                                <View key={idx} className="mb-4">
                                    <Text className="text-yellow-500 mb-2 font-medium">{server.server_name}</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {server.server_data.map((ep: any) => (
                                            <Link key={ep.slug} href={`/player/${movie.slug}?ep=${ep.slug}`} asChild>
                                                <Pressable className="bg-gray-800 w-12 h-12 rounded justify-center items-center active:bg-gray-700">
                                                    <Text className="text-white font-bold">{ep.name}</Text>
                                                </Pressable>
                                            </Link>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
