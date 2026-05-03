"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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

export default function CommentSection({ movieId, movieSlug, episodeName }: CommentSectionProps) {
    const { data: session } = useSession();
    const [comments, setComments] = useState<CommentData[]>([]);
    const [newComment, setNewComment] = useState("");
    const [rating, setRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [showPicker, setShowPicker] = useState(false);
    const [reportedId, setReportedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [myAvatarError, setMyAvatarError] = useState(false);
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

    const fetchComments = async () => {
        setLoading(true);
        const result = await getComments(movieSlug, 20, 0);
        if (result.success) {
            setComments(result.data as any);
            setTotal(result.total);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchComments();
    }, [movieSlug]);

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
            parentId: replyingTo || undefined,
        });

        if (result.success) {
            setNewComment("");
            setRating(0);
            setReplyingTo(null);
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
        setReplyingTo(comment._id);
        setNewComment((prev) => (prev.trim() ? `${mention}${prev}` : mention));
        requestAnimationFrame(() => {
            textareaRef.current?.focus();
        });
    };

    const handleEmojiSelect = (emoji: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setNewComment((prev) => prev + emoji);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = newComment;
        const before = text.substring(0, start);
        const after = text.substring(end);

        setNewComment(before + emoji + after);
        
        // Restore focus and cursor position
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
            content: "[Sticker]", // Placeholder content for image comments
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
                {/* Compact sort dropdown */}
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
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                                {session.user?.image && !myAvatarError ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user?.name || ""}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                        onError={() => setMyAvatarError(true)}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold bg-[#1f1f1f]">
                                        {session.user?.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 relative">
                                <textarea
                                    ref={textareaRef}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Viết bình luận của bạn..."
                                    className="w-full bg-transparent border-none text-white focus:outline-none min-h-[60px] text-[15px] resize-none placeholder:text-gray-400"
                                    maxLength={1000}
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
                        <div className="flex items-center justify-between mt-2 pt-3">
                            <div className="text-xs text-gray-400">
                                {replyingTo ? "Đang trả lời bình luận" : ""}
                            </div>
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
                    {sortedComments.map((comment) => (
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
                                        <span className="text-[13px] text-gray-400 font-medium">
                                            {formatTimeAgo(comment.createdAt)}
                                        </span>
                                        {/* Dynamic Episode Tag */}
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
                                            alt="Meme" 
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
                                        className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors ${session && comment.likedBy.includes(session.user?.id as string)
                                            ? "text-[#8FA7C5]"
                                            : "text-gray-300 hover:text-white"
                                            } disabled:opacity-50`}
                                    >
                                        <ThumbsUp className="w-4 h-4" />
                                        {comment.likes > 0 && <span>{comment.likes}</span>}
                                    </button>
                                    <button
                                        onClick={() => handleDislike(comment._id)}
                                        disabled={!session}
                                        className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors ${session && comment.dislikedBy.includes(session.user?.id as string)
                                            ? "text-red-400"
                                            : "text-gray-300 hover:text-white"
                                            } disabled:opacity-50`}
                                    >
                                        <ThumbsDown className="w-4 h-4" />
                                        {comment.dislikes > 0 && <span>{comment.dislikes}</span>}
                                    </button>

                                    <button
                                        onClick={() => handleReply(comment)}
                                        className="flex items-center gap-1.5 text-[13px] text-gray-300 font-medium hover:text-white transition-colors"
                                    >
                                        <Reply className="w-4 h-4" />
                                        <span>Trả lời</span>
                                    </button>

                                    {session && comment.userId === session.user?.id && (
                                        <button
                                            onClick={() => handleDelete(comment._id)}
                                            disabled={deletingId === comment._id}
                                            className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-red-400 transition-colors ml-2 disabled:opacity-50"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span className="hidden md:inline">{deletingId === comment._id ? "Đang xóa..." : "Xóa"}</span>
                                        </button>
                                    )}
                                    {session && comment.userId !== session.user?.id && (
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
                    ))}
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
