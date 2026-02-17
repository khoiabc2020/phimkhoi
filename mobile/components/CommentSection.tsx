import { View, Text, TextInput, Pressable, FlatList, Image, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface Comment {
    _id: string;
    userId: {
        _id: string;
        name: string;
        image?: string;
    };
    content: string;
    createdAt: string;
}

interface CommentSectionProps {
    slug: string;
}

export default function CommentSection({ slug }: CommentSectionProps) {
    const { user, token } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchComments = async () => {
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/comments/${slug}`);
            const data = await res.json();
            if (data.success) {
                setComments(data.data);
            }
        } catch (error) {
            console.error("Fetch comments error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [slug]);

    const handlePostComment = async () => {
        if (!user || !token) {
            Alert.alert("Thông báo", "Vui lòng đăng nhập để bình luận");
            return;
        }
        if (!content.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ slug, content: content.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setContent('');
                fetchComments(); // Refresh
            } else {
                Alert.alert("Lỗi", data.message || "Không thể gửi bình luận");
            }
        } catch (error) {
            Alert.alert("Lỗi", "Có lỗi xảy ra");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View className="mt-6 px-4 pb-10">
            <Text className="text-white text-lg font-bold mb-4">Bình luận ({comments.length})</Text>

            {/* Input */}
            <View className="flex-row items-center mb-6">
                <View className="w-10 h-10 rounded-full bg-gray-700 justify-center items-center overflow-hidden mr-3">
                    {user?.image ? (
                        <Image source={{ uri: user.image }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <Ionicons name="person" size={20} color="#9ca3af" />
                    )}
                </View>
                <View className="flex-1 flex-row bg-gray-900 rounded-full px-4 py-2 border border-gray-800 focus:border-yellow-500 items-center">
                    <TextInput
                        value={content}
                        onChangeText={setContent}
                        placeholder={user ? "Viết bình luận..." : "Đăng nhập để bình luận"}
                        placeholderTextColor="#6b7280"
                        className="flex-1 text-white py-2"
                        editable={!!user}
                        multiline
                    />
                    {content.length > 0 && (
                        <Pressable onPress={handlePostComment} disabled={submitting}>
                            {submitting ? (
                                <ActivityIndicator size="small" color="#fbbf24" />
                            ) : (
                                <Ionicons name="send" size={20} color="#fbbf24" />
                            )}
                        </Pressable>
                    )}
                </View>
            </View>

            {/* List */}
            {loading ? (
                <ActivityIndicator color="#fbbf24" />
            ) : comments.length > 0 ? (
                <View>
                    {comments.map((item) => (
                        <View key={item._id} className="flex-row mb-4">
                            <View className="w-10 h-10 rounded-full bg-gray-800 justify-center items-center overflow-hidden mr-3 border border-gray-700">
                                {item.userId?.image ? (
                                    <Image source={{ uri: item.userId.image }} style={{ width: '100%', height: '100%' }} />
                                ) : (
                                    <Text className="text-gray-400 font-bold text-xs">
                                        {item.userId?.name?.charAt(0).toUpperCase() || '?'}
                                    </Text>
                                )}
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center mb-1">
                                    <Text className="text-gray-300 font-bold text-sm mr-2">{item.userId?.name || 'Vô danh'}</Text>
                                    <Text className="text-gray-500 text-xs">{format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm')}</Text>
                                </View>
                                <Text className="text-gray-400 text-sm leading-5">{item.content}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <Text className="text-gray-500 text-center italic">Chưa có bình luận nào. Hãy là người đầu tiên!</Text>
            )}
        </View>
    );
}
