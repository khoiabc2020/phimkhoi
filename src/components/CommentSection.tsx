"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Send, ThumbsUp, ThumbsDown, Reply, Flag, Trash2, Edit2, Star, Loader2 } from "lucide-react";
import { addComment, getComments, likeComment, dislikeComment, deleteComment, reportComment } from "@/app/actions/comments";
import Image from "next/image";

interface CommentData {
    _id: string;
    userId: string;
    userName: string;
    userImage?: string;
    content: string;
    rating?: number;
    likes: number;
    dislikes: number;
    likedBy: string[];
    dislikedBy: string[];
    replyCount?: number;
    createdAt: string;
    updatedAt: string;
}

interface CommentSectionProps {
    movieId: string;
    movieSlug: string;
}

// Simple time ago formatter
function formatTimeAgo(date: string): string {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return "vừa xong";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} tháng trước`;
    const years = Math.floor(months / 12);
    return `${years} năm trước`;
}

export default function CommentSection({ movieId, movieSlug }: CommentSectionProps) {
    const { data: session } = useSession();
    const [comments, setComments] = useState<CommentData[]>([]);
    const [newComment, setNewComment] = useState("");
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchComments();
    }, [movieSlug]);

    const fetchComments = async () => {
        setLoading(true);
        const result = await getComments(movieSlug, 20, 0);
        if (result.success) {
            setComments(result.data as any);
            setTotal(result.total);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !session) return;

        setSubmitting(true);
        const result = await addComment({
            movieId,
            movieSlug,
            content: newComment.trim(),
            rating: rating > 0 ? rating : undefined,
        });

        if (result.success) {
            setNewComment("");
            setRating(0);
            fetchComments();
        }
        setSubmitting(false);
    };

    const handleLike = async (commentId: string) => {
        if (!session) return;
        await likeComment(commentId);
        fetchComments();
    };

    const handleDislike = async (commentId: string) => {
        if (!session) return;
        await dislikeComment(commentId);
        fetchComments();
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
        await deleteComment(commentId);
        fetchComments();
    };

    const handleReport = async (commentId: string) => {
        const reason = prompt("Lý do báo cáo:");
        if (!reason) return;
        await reportComment(commentId, reason);
        alert("Đã báo cáo bình luận!");
    };

    return (
        <div className="bg-[#1a1a1a] p-4 pb-24 md:pb-6 rounded border border-white/10 scroll-mt-24">
            <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide">
                Bình luận ({total})
            </h3>

            {/* Comment Form */}
            {session ? (
                <form onSubmit={handleSubmit} className="mb-6">
                    <div className="flex gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                            {session.user?.image ? (
                                <Image src={session.user.image} alt="User" width={32} height={32} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                    {session.user?.name?.[0]?.toUpperCase() || "U"}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Viết bình luận của bạn..."
                                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white focus:border-[#fbbf24] focus:outline-none min-h-[80px] text-sm resize-none placeholder:text-gray-600"
                                maxLength={1000}
                                style={{ fontSize: '14px' }}
                            />
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Đánh giá:</span>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="transition-colors min-w-[20px] min-h-[20px] flex items-center justify-center"
                                            >
                                                <Star
                                                    className={`w-3.5 h-3.5 ${star <= (hoverRating || rating)
                                                        ? "fill-[#fbbf24] text-[#fbbf24]"
                                                        : "text-gray-700"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    {rating > 0 && (
                                        <span className="text-[10px] text-[#fbbf24] font-bold">{rating}/10</span>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting || !newComment.trim()}
                                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#fbbf24] text-black px-4 py-1.5 rounded hover:bg-[#f59e0b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-xs"
                                >
                                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                    Gửi
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="bg-blue-900/10 text-blue-200 p-3 rounded mb-6 text-center border border-blue-500/10 text-xs">
                    Vui lòng <a href="/login" className="text-[#fbbf24] hover:underline font-bold">đăng nhập</a> để bình luận.
                </div>
            )}

            {/* Comments List */}
            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 text-[#fbbf24] animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div key={comment._id} className="flex gap-3 group">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 mt-0.5">
                                {comment.userImage ? (
                                    <img src={comment.userImage} alt={comment.userName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                        {comment.userName[0]?.toUpperCase() || "U"}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="font-bold text-white text-xs">{comment.userName}</h4>
                                    <span className="text-[10px] text-gray-600">
                                        {formatTimeAgo(comment.createdAt)}
                                    </span>
                                    {comment.rating && (
                                        <div className="flex items-center gap-0.5 bg-[#fbbf24]/10 px-1.5 py-px rounded-[2px]">
                                            <Star className="w-2.5 h-2.5 fill-[#fbbf24] text-[#fbbf24]" />
                                            <span className="text-[10px] text-[#fbbf24] font-bold">{comment.rating}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-gray-300 text-[13px] leading-relaxed mb-1.5">{comment.content}</p>

                                {/* Actions */}
                                <div className="flex items-center gap-6 mt-2 touch-manipulation">
                                    <button
                                        onClick={() => handleLike(comment._id)}
                                        disabled={!session}
                                        className={`flex items-center gap-1.5 text-xs font-medium p-2 -ml-2 rounded-lg transition-colors ${session && comment.likedBy.includes(session.user?.id as string)
                                            ? "text-primary bg-primary/10"
                                            : "text-gray-400 hover:text-primary hover:bg-white/5"
                                            } disabled:opacity-50`}
                                    >
                                        <ThumbsUp className="w-4 h-4" />
                                        {comment.likes > 0 && <span>{comment.likes}</span>}
                                        <span className="sr-only">Like</span>
                                    </button>
                                    <button
                                        onClick={() => handleDislike(comment._id)}
                                        disabled={!session}
                                        className={`flex items-center gap-1.5 text-xs font-medium p-2 rounded-lg transition-colors ${session && comment.dislikedBy.includes(session.user?.id as string)
                                            ? "text-red-400 bg-red-500/10"
                                            : "text-gray-400 hover:text-red-400 hover:bg-white/5"
                                            } disabled:opacity-50`}
                                    >
                                        <ThumbsDown className="w-4 h-4" />
                                        {comment.dislikes > 0 && <span>{comment.dislikes}</span>}
                                        <span className="sr-only">Dislike</span>
                                    </button>

                                    {session && comment.userId === session.user?.id && (
                                        <button
                                            onClick={() => handleDelete(comment._id)}
                                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-white/5 transition-colors ml-auto md:ml-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="hidden md:inline">Xóa</span>
                                        </button>
                                    )}

                                    {session && comment.userId !== session.user?.id && (
                                        <button
                                            onClick={() => handleReport(comment._id)}
                                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-yellow-400 p-2 rounded-lg hover:bg-white/5 transition-colors ml-auto md:ml-0"
                                        >
                                            <Flag className="w-4 h-4" />
                                            <span className="hidden md:inline">Báo cáo</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {comments.length === 0 && (
                        <p className="text-gray-500 text-center py-8">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                    )}
                </div>
            )}
        </div>
    );
}
