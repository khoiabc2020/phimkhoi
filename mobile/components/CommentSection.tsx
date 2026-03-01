import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getComments, postComment } from '@/services/api';
import { useAuth } from '@/context/auth';
import { COLORS } from '@/constants/theme';
import { useRouter } from 'expo-router';

interface Comment {
    _id: string;
    userId: string;
    userName: string;
    userImage?: string;
    content: string;
    createdAt: string;
}

export default function CommentSection({ movieSlug }: { movieSlug: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [content, setContent] = useState('');
    const { user, token } = useAuth();
    const router = useRouter();

    const fetchComments = async () => {
        setLoading(true);
        const data = await getComments(movieSlug);
        setComments(data);
        setLoading(false);
    };

    useEffect(() => {
        if (movieSlug) fetchComments();
    }, [movieSlug]);

    const handlePost = async () => {
        if (!content.trim()) return;
        // Guard: require login before posting
        if (!user || !token) {
            Alert.alert(
                'Yêu cầu đăng nhập',
                'Bạn cần đăng nhập để bình luận.',
                [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login' as any) },
                ]
            );
            return;
        }
        setPosting(true);
        const res = await postComment(movieSlug, content, token);
        if (res.error) {
            Alert.alert('Lỗi', res.error);
        } else if (res.comment) {
            setComments([res.comment, ...comments]);
            setContent('');
        }
        setPosting(false);
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={COLORS.accent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {user ? (
                <View style={styles.inputContainer}>
                    <Image
                        source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username || 'U')}` }}
                        style={styles.avatar}
                    />
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Thêm bình luận..."
                            placeholderTextColor="#9CA3AF"
                            value={content}
                            onChangeText={setContent}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.postButton, (!content.trim() || posting) && styles.postButtonDisabled]}
                            onPress={handlePost}
                            disabled={!content.trim() || posting}
                        >
                            {posting ? <ActivityIndicator size="small" color="#000" /> : <Ionicons name="send" size={16} color="#000" />}
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.loginPrompt}>
                    <Text style={styles.loginText}>Vui lòng đăng nhập để bình luận</Text>
                    <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
                        <Text style={styles.loginButtonText}>Đăng nhập</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.commentList}>
                <Text style={styles.commentCount}>{comments.length} bình luận</Text>
                {comments.length === 0 ? (
                    <Text style={styles.noComments}>Chưa có bình luận nào. Hãy là người đầu tiên!</Text>
                ) : (
                    comments.map(comment => (
                        <View key={comment._id} style={styles.commentItem}>
                            <Image
                                source={{ uri: comment.userImage || 'https://ui-avatars.com/api/?name=' + comment.userName }}
                                style={styles.commentAvatar}
                            />
                            <View style={styles.commentContent}>
                                <View style={styles.commentHeader}>
                                    <Text style={styles.commentName}>{comment.userName}</Text>
                                    <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                                </View>
                                <Text style={styles.commentText}>{comment.content}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        color: 'white',
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    postButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    postButtonDisabled: {
        backgroundColor: '#4B5563',
    },
    loginPrompt: {
        backgroundColor: '#1C1C1E',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    loginText: {
        color: '#D1D5DB',
        marginBottom: 12,
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    loginButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    commentList: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 16,
    },
    commentCount: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 16,
    },
    noComments: {
        color: '#9CA3AF',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 20,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 12,
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#333',
    },
    commentContent: {
        flex: 1,
        backgroundColor: '#1C1C1E',
        padding: 12,
        borderRadius: 12,
        borderTopLeftRadius: 0,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 6,
    },
    commentName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    commentDate: {
        color: '#6B7280',
        fontSize: 11,
    },
    commentText: {
        color: '#D1D5DB',
        fontSize: 14,
        lineHeight: 20,
    },
});
