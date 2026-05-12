"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ThumbsUp, ThumbsDown, Reply, Trash2, Loader2, MessageCircle, Smile, ChevronDown, Check } from "lucide-react";
import { addComment, getComments, likeComment, dislikeComment, deleteComment, reportComment } from "@/app/actions/comments";
import CommentMemePicker from "./CommentMemePicker";

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
    imageUrl?: string;
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

// Avatar nhỏ với fallback chữ cái
function UserAvatar({ image, name, size = 40 }: { image?: string; name: string; size?: number }) {
    const [imgError, setImgError] = useState(false);
    const cls = size === 40
        ? "w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0"
        : "w-11 h-11 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 mt-1";

    return (
        <div className={cls}>
            {image && !imgError ? (
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className={`w-full h-full flex items-center justify-center text-white font-bold bg-[#1f1f1f] ${size === 40 ? "text-sm" : "text-[15px]"}`}>
                    {name?.[0]?.toUpperCase() || "U"}
                </div>
            )}
        </div>
    );
}

export default function CommentSection({ movieId, movieSlug, episodeName }: CommentSectionProps) {
    const { data: session } = useSession();
    const [comments, setComments] = useState<CommentData[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ id: string; userName: string } | null>(null);
    const [total, setTotal] = useState(0);
    const [showPicker, setShowPicker] = useState(false);
    const [reportedId, setReportedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
    const [showSortMenu, setShowSortMenu] = useState(false);
    // Chặn spam like/dislike: lưu commentId đang chờ response
    const pendingVoteRef = useRef<Set<string>>(new Set());
    const sortRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Close sort menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
                setShowSortMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const sortedComments = useMemo(() => {
        if (sortBy === 'popular') {
            return [...comments].sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
        }
        return [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [comments, sortBy]);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        const result = await getComments(movieSlug, 20, 0);
        if (result.success) {
            setComments(result.data as any);
            setTotal(result.total);
        }
        setLoading(false);
    }, [movieSlug]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !session) return;

        setSubmitting(true);
        const result = await addComment({
            movieId,
            movieSlug,
            episodeName,
            content: newComment.trim(),
            parentId: replyingTo?.id || undefined,
        });

        if (result.success) {
            setNewComment("");
            setReplyingTo(null);
            fetchComments();
        }
        setSubmitting(false);
    };

    // Optimistic like — cập nhật UI tức thì, không refetch toàn bộ danh sách
    const handleLike = async (commentId: string) => {
        if (!session?.user?.id || pendingVoteRef.current.has(commentId)) return;
        const userId = session.user.id as string;
        pendingVoteRef.current.add(commentId);

        // Cập nhật optimistic ngay lập tức
        setComments(prev => prev.map(c => {
            if (c._id !== commentId) return c;
            const hasLiked = c.likedBy.includes(userId);
            const hasDisliked = c.dislikedBy.includes(userId);
            return {
                ...c,
                likes: hasLiked ? c.likes - 1 : c.likes + 1,
                likedBy: hasLiked
                    ? c.likedBy.filter(id => id !== userId)
                    : [...c.likedBy, userId],
                // Xóa dislike nếu đang chuyển sang like
                dislikes: !hasLiked && hasDisliked ? c.dislikes - 1 : c.dislikes,
                dislikedBy: !hasLiked ? c.dislikedBy.filter(id => id !== userId) : c.dislikedBy,
            };
        }));

        try {
            await likeComment(commentId);
        } catch {
            // Rollback nếu server lỗi
            fetchComments();
        } finally {
            pendingVoteRef.current.delete(commentId);
        }
    };

    // Optimistic dislike — tương tự handleLike
    const handleDislike = async (commentId: string) => {
        if (!session?.user?.id || pendingVoteRef.current.has(commentId)) return;
        const userId = session.user.id as string;
        pendingVoteRef.current.add(commentId);

        setComments(prev => prev.map(c => {
            if (c._id !== commentId) return c;
            const hasDisliked = c.dislikedBy.includes(userId);
            const hasLiked = c.likedBy.includes(userId);
            return {
                ...c,
                dislikes: hasDisliked ? c.dislikes - 1 : c.dislikes + 1,
                dislikedBy: hasDisliked
                    ? c.dislikedBy.filter(id => id !== userId)
                    : [...c.dislikedBy, userId],
                likes: !hasDisliked && hasLiked ? c.likes - 1 : c.likes,
                likedBy: !hasDisliked ? c.likedBy.filter(id => id !== userId) : c.likedBy,
            };
        }));

        try {
            await dislikeComment(commentId);
        } catch {
            fetchComments();
        } finally {
            pendingVoteRef.current.delete(commentId);
        }
    };

    const handleDelete = async (commentId: string) => {
        setDeletingId(commentId);
        await deleteComment(commentId);
        setDeletingId(null);
        fetchComments();
    };

    const handleReport = async (commentId: string) => {
        await reportComment(commentId, "Nội dung không phù hợp");
        setReportedId(commentId);
        setTimeout(() => setReportedId(null), 3000);
    };

    const handleReply = (comment: CommentData) => {
        if (!session) return;
        const mention = `@${comment.userName} `;
        setReplyingTo({ id: comment._id, userName: comment.userName });
        setNewComment((prev) => (prev.trim() ? `${mention}${prev}` : mention));
        requestAnimationFrame(() => {
            textareaRef.current?.focus();
        });
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
        const mention = replyingTo ? `@${replyingTo.userName} ` : "";
        setNewComment(prev => prev.startsWith(mention) ? prev.slice(mention.length) : prev);
    };

    const handleEmojiSelect = (emoji: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setNewComment((prev) => prev + emoji);
            return;
        }
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = newComment.substring(0, start);
        const after = newComment.substring(end);
        setNewComment(before + emoji + after);
        requestAnimationFrame(() => {
            textarea.focus();
            const newPos = start + emoji.length;
            textarea.setSelectionRange(newPos, newPos);
        });
    };

    const handleMemeSelect = async (memeUrl: string) => {
        if (!session) return;
        setShowPicker(false);
        setSubmitting(true);
        const result = await addComment({
            movieId,
            movieSlug,
            episodeName,
            content: "[Sticker]",
            imageUrl: memeUrl,
        });
        if (result.success) {
            fetchComments();
        }
        setSubmitting(false);
    };

    return (
        <div className="bg-[#07070b]/82 p-4 md:p-6 rounded-[10px] border border-white/[0.06] shadow-[0_12px_28px_#00000066] scroll-mt-24">
            <div className="flex items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-[#8FA7C5] fill-[#8FA7C5]/20" />
                    <h3 className="text-base font-bold text-white">
                        Bình luận <span className="text-white/30 text-[13px] font-normal">({total})</span>
                    </h3>
                </div>
                {/* Sort dropdown */}
                <div className="relative" ref={sortRef}>
                    <button
                        onClick={() => setShowSortMenu(v => !v)}
                        className="flex items-center gap-1.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/55 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                        {sortBy === 'newest' ? 'Mới nhất' : 'Phổ biến'}
                        <ChevronDown className={`w-3 h-3 text-white/35 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                    </button>
                    {showSortMenu && (
                        <div className="absolute right-0 top-full mt-1 w-[110px] bg-[#13131a] border border-white/[0.10] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.6)] overflow-hidden z-50">
                            {([['newest', 'Mới nhất'], ['popular', 'Phổ biến']] as const).map(([val, label]) => (
                                <button
                                    key={val}
                                    onClick={() => { setSortBy(val); setShowSortMenu(false); }}
                                    className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium hover:bg-white/[0.07] transition-colors text-left"
                                >
                                    <span className={sortBy === val ? 'text-[#8FA7C5]' : 'text-white/55'}>{label}</span>
                                    {sortBy === val && <Check className="w-3 h-3 text-[#8FA7C5]" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Comment Form */}
            {session ? (
                <form onSubmit={handleSubmit} className="mb-8">
                    <div className="bg-[#09090d] rounded-[10px] border border-white/[0.06] p-4 relative">
                        {/* Reply context banner */}
                        {replyingTo && (
                            <div className="flex items-center justify-between mb-3 px-2 py-1.5 bg-[#8FA7C5]/10 border border-[#8FA7C5]/20 rounded-lg">
                                <span className="text-[12px] text-[#8FA7C5]">
                                    Đang trả lời <span className="font-bold">@{replyingTo.userName}</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCancelReply}
                                    className="text-white/30 hover:text-white text-[11px] ml-3 transition-colors"
                                >
                                    ✕ Hủy
                                </button>
                            </div>
                        )}
                        <div className="flex gap-4">
                            <UserAvatar image={session.user?.image ?? undefined} name={session.user?.name || "U"} size={40} />
                            <div className="flex-1 relative">
                                <textarea
                                    ref={textareaRef}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={replyingTo ? `Trả lời @${replyingTo.userName}...` : "Viết bình luận của bạn..."}
                                    className="w-full bg-transparent border-none text-white focus:outline-none min-h-[60px] text-[15px] resize-none placeholder:text-gray-400"
                                    maxLength={2000}
                                />
                                <div className="absolute right-0 bottom-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPicker(!showPicker)}
                                        className="text-gray-400 hover:text-white cursor-pointer transition-colors p-1"
                                    >
                                        <Smile className="w-5 h-5" />
                                    </button>
                                    {showPicker && (
                                        <CommentMemePicker
                                            onEmojiSelect={handleEmojiSelect}
                                            onMemeSelect={handleMemeSelect}
                                            onClose={() => setShowPicker(false)}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end mt-2 pt-3">
                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="bg-[#8FA7C5] hover:bg-[#a8bdd8] text-[#0a0a0a] px-4 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-[13px] flex items-center gap-1.5"
                            >
                                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                Gửi
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="bg-[#09090d] text-gray-200 p-4 rounded-[10px] mb-8 text-center border border-white/[0.06] text-sm">
                    Vui lòng <a href="/login" className="text-[#8FA7C5] hover:underline font-bold">đăng nhập</a> để bình luận.
                </div>
            )}

            {/* Comments List */}
            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 text-[#8FA7C5] animate-spin" />
                </div>
            ) : (
                <div className="space-y-6">
                    {sortedComments.map((comment) => {
                        const userId = session?.user?.id as string | undefined;
                        const hasLiked = userId ? comment.likedBy.includes(userId) : false;
                        const hasDisliked = userId ? comment.dislikedBy.includes(userId) : false;
                        const isOwn = userId === comment.userId;

                        return (
                            <div key={comment._id} className="flex gap-4 group">
                                <UserAvatar image={comment.userImage} name={comment.userName} size={44} />
                                <div className="flex-1">
                                    <div className="flex flex-col mb-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-white text-[15px]">{comment.userName}</h4>
                                            <span className="text-[13px] text-gray-400 font-medium">
                                                {formatTimeAgo(comment.createdAt)}
                                            </span>
                                            {comment.episodeName && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8FA7C5]/20 text-[#8FA7C5] font-medium tracking-wide">
                                                    {comment.episodeName.startsWith("Tập") ? comment.episodeName : `Tập ${comment.episodeName}`}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-[#8FA7C5] font-bold mt-0.5 tracking-wide">
                                            {comment.userRole || "Thành viên"}
                                        </div>
                                    </div>

                                    {comment.imageUrl ? (
                                        <div className="mb-3 max-w-[160px] md:max-w-[200px] rounded-lg overflow-hidden bg-white/5 p-1 border border-white/5">
                                            <img
                                                src={comment.imageUrl}
                                                alt="Sticker"
                                                className="w-full h-auto object-contain hover:scale-105 transition-transform cursor-pointer"
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-gray-100 text-[15px] leading-relaxed mb-3 whitespace-pre-wrap">{comment.content}</p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-5 touch-manipulation">
                                        <button
                                            onClick={() => handleLike(comment._id)}
                                            disabled={!session}
                                            className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors disabled:opacity-50 ${hasLiked ? "text-[#8FA7C5]" : "text-gray-300 hover:text-white"}`}
                                        >
                                            <ThumbsUp className="w-4 h-4" />
                                            {comment.likes > 0 && <span>{comment.likes}</span>}
                                        </button>
                                        <button
                                            onClick={() => handleDislike(comment._id)}
                                            disabled={!session}
                                            className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors disabled:opacity-50 ${hasDisliked ? "text-red-400" : "text-gray-300 hover:text-white"}`}
                                        >
                                            <ThumbsDown className="w-4 h-4" />
                                            {comment.dislikes > 0 && <span>{comment.dislikes}</span>}
                                        </button>

                                        {session && (
                                            <button
                                                onClick={() => handleReply(comment)}
                                                className="flex items-center gap-1.5 text-[13px] text-gray-300 font-medium hover:text-white transition-colors"
                                            >
                                                <Reply className="w-4 h-4" />
                                                <span>Trả lời</span>
                                            </button>
                                        )}

                                        {isOwn && (
                                            <button
                                                onClick={() => handleDelete(comment._id)}
                                                disabled={deletingId === comment._id}
                                                className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-red-400 transition-colors ml-2 disabled:opacity-50"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span className="hidden md:inline">{deletingId === comment._id ? "Đang xóa..." : "Xóa"}</span>
                                            </button>
                                        )}
                                        {session && !isOwn && (
                                            <button
                                                onClick={() => handleReport(comment._id)}
                                                disabled={reportedId === comment._id}
                                                className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-orange-400 transition-colors ml-2 disabled:opacity-50"
                                            >
                                                <span className="hidden md:inline">{reportedId === comment._id ? "✓ Đã báo cáo" : "Báo cáo"}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {sortedComments.length === 0 && (
                        <div className="flex flex-col items-center py-10 gap-3 text-center">
                            <MessageCircle className="w-10 h-10 text-white/10" />
                            <p className="text-white/30 text-[13px]">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
