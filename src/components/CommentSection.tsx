"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Send, ThumbsUp, ThumbsDown, Reply, Flag, Trash2, Edit2, Star, Loader2, MessageCircle, Smile } from "lucide-react";
import { addComment, getComments, likeComment, dislikeComment, deleteComment, reportComment } from "@/app/actions/comments";
import Image from "next/image";

interface CommentData {
    _id: string;
    userId: string;
    userName: string;
    userImage?: string;
    content: string;
    episodeName?: string;
    userRole?: string;
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
    episodeName?: string;
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

export default function CommentSection({ movieId, movieSlug, episodeName }: CommentSectionProps) {
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
            episodeName,
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
        <div className="bg-[#0b0b0b] p-4 md:p-6 rounded-2xl border border-white/5 scroll-mt-24">
            <div className="flex items-center gap-2 mb-6">
                <MessageCircle className="w-6 h-6 text-[#1ce783] fill-[#1ce783]/20" />
                <h3 className="text-xl font-bold text-white tracking-wide">
                    Bình luận <span className="text-gray-500 text-sm font-normal">({total})</span>
                </h3>
            </div>

            {/* Comment Form */}
            {session ? (
                <form onSubmit={handleSubmit} className="mb-8">
                    <div className="bg-[#121212] rounded-xl border border-white/5 p-4 relative">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                                {session.user?.image ? (
                                    <Image src={session.user.image} alt="User" width={40} height={40} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold bg-[#1f1f1f]">
                                        {session.user?.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 relative">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Viết bình luận của bạn..."
                                    className="w-full bg-transparent border-none text-white focus:outline-none min-h-[60px] text-[15px] resize-none placeholder:text-gray-500"
                                    maxLength={1000}
                                />
                                <div className="absolute right-0 bottom-2 text-gray-500 hover:text-white cursor-pointer transition-colors">
                                    <Smile className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-2 pt-3">
                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="bg-[#16a34a] hover:bg-[#15803d] text-white px-5 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                                Gửi bình luận
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="bg-white/5 text-gray-400 p-4 rounded-xl mb-8 text-center border border-white/10 text-sm">
                    Vui lòng <a href="/login" className="text-[#1ce783] hover:underline font-bold">đăng nhập</a> để bình luận.
                </div>
            )}

            {/* Comments List */}
            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 text-[#fbbf24] animate-spin" />
                </div>
            ) : (
                <div className="space-y-8">
                    {comments.map((comment) => (
                        <div key={comment._id} className="flex gap-4 group">
                            <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 mt-1">
                                {comment.userImage ? (
                                    <img src={comment.userImage} alt={comment.userName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white text-[15px] font-bold bg-[#1f1f1f]">
                                        {comment.userName[0]?.toUpperCase() || "U"}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-col mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-white text-[15px]">{comment.userName}</h4>
                                        <span className="text-[13px] text-gray-500 font-medium">
                                            {formatTimeAgo(comment.createdAt)}
                                        </span>
                                        {/* Dynamic Episode Tag */}
                                        {comment.episodeName && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-[#1ce783] font-medium tracking-wide">
                                                {comment.episodeName.startsWith("Tập") ? comment.episodeName : `Tập ${comment.episodeName}`}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11px] text-[#1ce783] font-bold mt-0.5 tracking-wide">
                                        {comment.userRole || "Thành viên"}
                                    </div>
                                </div>
                                <p className="text-gray-200 text-[15px] leading-relaxed mb-3 whitespace-pre-wrap">{comment.content}</p>

                                {/* Actions */}
                                <div className="flex items-center gap-5 touch-manipulation">
                                    <button
                                        onClick={() => handleLike(comment._id)}
                                        disabled={!session}
                                        className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors ${session && comment.likedBy.includes(session.user?.id as string)
                                            ? "text-[#1ce783]"
                                            : "text-gray-400 hover:text-white"
                                            } disabled:opacity-50`}
                                    >
                                        <ThumbsUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDislike(comment._id)}
                                        disabled={!session}
                                        className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors ${session && comment.dislikedBy.includes(session.user?.id as string)
                                            ? "text-red-400"
                                            : "text-gray-400 hover:text-white"
                                            } disabled:opacity-50`}
                                    >
                                        <ThumbsDown className="w-4 h-4" />
                                    </button>

                                    <button className="flex items-center gap-1.5 text-[13px] text-gray-400 font-medium hover:text-white transition-colors">
                                        <Reply className="w-4 h-4" />
                                        <span>Trả lời</span>
                                    </button>

                                    {session && comment.userId === session.user?.id && (
                                        <button
                                            onClick={() => handleDelete(comment._id)}
                                            className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-red-400 transition-colors ml-2"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span className="hidden md:inline">Xóa</span>
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
