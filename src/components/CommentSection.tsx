"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Send, ThumbsUp, ThumbsDown, Reply, Trash2, Loader2, MessageCircle, Smile, ChevronDown, SlidersHorizontal } from "lucide-react";
import { addComment, getComments, likeComment, dislikeComment, deleteComment, reportComment } from "@/app/actions/comments";
import Image from "next/image";
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
    return `${Math.floor(months / 12)} năm trước`;
}

// DiceBear preset avatars — variety of styles and seeds
const PRESET_AVATARS = [
    { url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4", label: "Felix" },
    { url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf", label: "Aneka" },
    { url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=c0aede", label: "Mia" },
    { url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel1&backgroundColor=1a1a2e", label: "Pixel" },
    { url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel2&backgroundColor=16213e", label: "Pixel 2" },
    { url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Hero&backgroundColor=0d1b2a", label: "Hero" },
    { url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Dragon&backgroundColor=1b1b2f", label: "Dragon" },
    { url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Moon&backgroundColor=1f1f3a", label: "Moon" },
    { url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Star&backgroundColor=2c003e", label: "Star" },
    { url: "https://api.dicebear.com/7.x/bottts/svg?seed=Bot1&backgroundColor=101820", label: "Bot" },
    { url: "https://api.dicebear.com/7.x/bottts/svg?seed=Bot2&backgroundColor=162447", label: "Bot 2" },
    { url: "https://api.dicebear.com/7.x/croodles/svg?seed=Doodle&backgroundColor=1a0533", label: "Doodle" },
    { url: "https://api.dicebear.com/7.x/croodles/svg?seed=Cloud&backgroundColor=0f3460", label: "Cloud" },
    { url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ninja&backgroundColor=1a1a1a", label: "Ninja" },
    { url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Shadow&backgroundColor=0a0a0a", label: "Shadow" },
    { url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Fire&backgroundColor=1a0a0a", label: "Fire" },
    { url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Ghost&backgroundColor=0a0a1a", label: "Ghost" },
    { url: "https://api.dicebear.com/7.x/bottts/svg?seed=Cyber&backgroundColor=001a0a", label: "Cyber" },
];

const MAX_CHARS = 1000;
const PAGE_SIZE = 15;

export default function CommentSection({ movieId, movieSlug, episodeName }: CommentSectionProps) {
    const { data: session } = useSession();
    const [comments, setComments] = useState<CommentData[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyingToName, setReplyingToName] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
    const [showPicker, setShowPicker] = useState(false);
    const [reportedId, setReportedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [customAvatar, setCustomAvatar] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const avatarPickerRef = useRef<HTMLDivElement>(null);

    // Load saved avatar from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("kp_avatar");
        if (saved) setCustomAvatar(saved);
    }, []);

    // Close avatar picker on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (avatarPickerRef.current && !avatarPickerRef.current.contains(e.target as Node)) {
                setShowAvatarPicker(false);
            }
        }
        if (showAvatarPicker) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showAvatarPicker]);

    const fetchComments = useCallback(async (reset = false) => {
        if (reset) {
            setLoading(true);
            setOffset(0);
        }
        const result = await getComments(movieSlug, PAGE_SIZE, reset ? 0 : offset);
        if (result.success) {
            if (reset) {
                setComments(result.data as any);
            } else {
                setComments(prev => [...prev, ...(result.data as any)]);
            }
            setTotal(result.total);
        }
        setLoading(false);
        setLoadingMore(false);
    }, [movieSlug, offset]);

    useEffect(() => {
        fetchComments(true);
    }, [movieSlug, sortBy]);

    const handleLoadMore = async () => {
        setLoadingMore(true);
        const newOffset = offset + PAGE_SIZE;
        setOffset(newOffset);
        const result = await getComments(movieSlug, PAGE_SIZE, newOffset);
        if (result.success) {
            setComments(prev => [...prev, ...(result.data as any)]);
        }
        setLoadingMore(false);
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
            parentId: replyingTo || undefined,
        });

        if (result.success) {
            setNewComment("");
            setReplyingTo(null);
            setReplyingToName(null);
            fetchComments(true);
        }
        setSubmitting(false);
    };

    const handleLike = async (commentId: string) => {
        if (!session) return;
        await likeComment(commentId);
        fetchComments(true);
    };

    const handleDislike = async (commentId: string) => {
        if (!session) return;
        await dislikeComment(commentId);
        fetchComments(true);
    };

    const handleDelete = async (commentId: string) => {
        setDeletingId(commentId);
        await deleteComment(commentId);
        setDeletingId(null);
        fetchComments(true);
    };

    const handleReport = async (commentId: string) => {
        await reportComment(commentId, "Nội dung không phù hợp");
        setReportedId(commentId);
        setTimeout(() => setReportedId(null), 3000);
    };

    const handleReply = (comment: CommentData) => {
        if (!session) return;
        setReplyingTo(comment._id);
        setReplyingToName(comment.userName);
        setNewComment(`@${comment.userName} `);
        requestAnimationFrame(() => textareaRef.current?.focus());
    };

    const handleEmojiSelect = (emoji: string) => {
        const textarea = textareaRef.current;
        if (!textarea) { setNewComment(prev => prev + emoji); return; }
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = newComment.substring(0, start);
        const after = newComment.substring(end);
        setNewComment(before + emoji + after);
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        });
    };

    const handleMemeSelect = async (memeUrl: string) => {
        if (!session) return;
        setShowPicker(false);
        setSubmitting(true);
        const result = await addComment({
            movieId, movieSlug, episodeName,
            content: "[Sticker]",
            imageUrl: memeUrl,
        });
        if (result.success) fetchComments(true);
        setSubmitting(false);
    };

    const handleAvatarSelect = (url: string) => {
        setCustomAvatar(url);
        localStorage.setItem("kp_avatar", url);
        setShowAvatarPicker(false);
    };

    const displayAvatar = session?.user?.image || customAvatar;

    // Sort comments client-side
    const sortedComments = sortBy === "popular"
        ? [...comments].sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes))
        : comments;

    const remaining = MAX_CHARS - newComment.length;

    return (
        <div className="bg-[#07070b]/82 p-4 md:p-6 rounded-[10px] border border-white/[0.06] shadow-[0_12px_28px_#00000066] scroll-mt-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-[#8FA7C5] fill-[#8FA7C5]/20" />
                    <h3 className="text-lg font-bold text-white">
                        Bình luận <span className="text-white/30 text-sm font-normal">({total})</span>
                    </h3>
                </div>
                {/* Sort */}
                <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1 border border-white/[0.06]">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-white/30 ml-1" />
                    {(["newest", "popular"] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setSortBy(s)}
                            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                                sortBy === s ? "bg-[#8FA7C5] text-[#0a0a0a]" : "text-white/40 hover:text-white"
                            }`}
                        >
                            {s === "newest" ? "Mới nhất" : "Phổ biến"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Comment Form */}
            {session ? (
                <form onSubmit={handleSubmit} className="mb-8">
                    <div className="bg-[#09090d] rounded-[10px] border border-white/[0.06] p-4">
                        {/* Reply banner */}
                        {replyingToName && (
                            <div className="flex items-center justify-between mb-3 px-2 py-1.5 bg-[#8FA7C5]/10 rounded-md border border-[#8FA7C5]/20">
                                <span className="text-[12px] text-[#8FA7C5]">
                                    Đang trả lời <strong>{replyingToName}</strong>
                                </span>
                                <button type="button" onClick={() => { setReplyingTo(null); setReplyingToName(null); setNewComment(""); }}
                                    className="text-white/30 hover:text-white transition-colors text-[11px]">✕ Hủy</button>
                            </div>
                        )}

                        <div className="flex gap-3">
                            {/* Avatar with picker */}
                            <div className="relative shrink-0" ref={avatarPickerRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowAvatarPicker(v => !v)}
                                    className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-[#8FA7C5]/50 transition-all group"
                                    title="Đổi avatar"
                                >
                                    {displayAvatar ? (
                                        <img src={displayAvatar} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#1f1f2e] text-white text-sm font-bold group-hover:bg-[#8FA7C5]/20 transition-colors">
                                            {session.user?.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                    )}
                                </button>
                                {/* Avatar picker popup */}
                                {showAvatarPicker && (
                                    <div className="absolute left-0 top-12 z-50 bg-[#111116] border border-white/10 rounded-xl p-3 shadow-2xl w-[260px]">
                                        <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest mb-2">Chọn avatar</p>
                                        <div className="grid grid-cols-6 gap-1.5 max-h-[180px] overflow-y-auto custom-scrollbar">
                                            {PRESET_AVATARS.map(av => (
                                                <button
                                                    key={av.url}
                                                    type="button"
                                                    onClick={() => handleAvatarSelect(av.url)}
                                                    className={`w-9 h-9 rounded-full overflow-hidden transition-all hover:scale-110 ${customAvatar === av.url ? "ring-2 ring-[#8FA7C5]" : ""}`}
                                                    title={av.label}
                                                >
                                                    <img src={av.url} alt={av.label} className="w-full h-full object-cover" loading="lazy" />
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-white/20 mt-2 text-center">Click avatar để chọn · Click lại để đổi</p>
                                    </div>
                                )}
                            </div>

                            {/* Textarea */}
                            <div className="flex-1 relative">
                                <textarea
                                    ref={textareaRef}
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value.slice(0, MAX_CHARS))}
                                    placeholder="Viết bình luận của bạn..."
                                    className="w-full bg-transparent border-none text-white focus:outline-none min-h-[60px] text-[14px] resize-none placeholder:text-white/25 leading-relaxed"
                                    maxLength={MAX_CHARS}
                                />
                                {/* Emoji/picker button */}
                                <div className="absolute right-0 bottom-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowPicker(v => !v)}
                                        className={`p-1.5 rounded-md transition-colors ${showPicker ? "text-[#8FA7C5]" : "text-white/25 hover:text-white/60"}`}
                                    >
                                        <Smile className="w-4 h-4" />
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

                        {/* Bottom bar */}
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.04]">
                            <span className={`text-[11px] font-medium ${remaining < 100 ? "text-orange-400" : "text-white/20"}`}>
                                {remaining < MAX_CHARS ? `${remaining} ký tự còn lại` : ""}
                            </span>
                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="flex items-center gap-2 bg-[#8FA7C5] hover:bg-[#a8bdd8] text-[#0a0a0a] px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-[13px] active:scale-95"
                            >
                                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                Gửi
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="bg-[#09090d] p-4 rounded-[10px] mb-8 text-center border border-white/[0.06] text-sm">
                    <span className="text-white/40">Vui lòng </span>
                    <a href="/login" className="text-[#8FA7C5] hover:underline font-bold">đăng nhập</a>
                    <span className="text-white/40"> để bình luận</span>
                </div>
            )}

            {/* Comments List */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 text-[#8FA7C5] animate-spin" />
                </div>
            ) : (
                <>
                    <div className="space-y-6">
                        {sortedComments.map(comment => {
                            const isLiked = session && comment.likedBy.includes(session.user?.id as string);
                            const isDisliked = session && comment.dislikedBy.includes(session.user?.id as string);

                            return (
                                <div key={comment._id} className="flex gap-3 group">
                                    {/* Avatar */}
                                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 mt-0.5 ring-1 ring-white/[0.06]">
                                        {comment.userImage ? (
                                            <img src={comment.userImage} alt={comment.userName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[#1f1f2e] text-white text-[13px] font-bold">
                                                {comment.userName[0]?.toUpperCase() || "U"}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Name + meta */}
                                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                            <span className="font-bold text-white text-[14px]">{comment.userName}</span>
                                            {comment.userRole && comment.userRole !== "Thành viên" && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#8FA7C5]/20 text-[#8FA7C5] font-bold tracking-wide uppercase">
                                                    {comment.userRole}
                                                </span>
                                            )}
                                            {comment.episodeName && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40 font-medium">
                                                    {comment.episodeName.startsWith("Tập") ? comment.episodeName : `Tập ${comment.episodeName}`}
                                                </span>
                                            )}
                                            <span className="text-[12px] text-white/25">{formatTimeAgo(comment.createdAt)}</span>
                                        </div>

                                        {/* Content */}
                                        {comment.imageUrl ? (
                                            <div className="mb-2 max-w-[160px] rounded-lg overflow-hidden bg-white/5 p-1 border border-white/[0.06]">
                                                <img
                                                    src={comment.imageUrl}
                                                    alt="Sticker/GIF"
                                                    className="w-full h-auto object-contain hover:scale-105 transition-transform cursor-pointer"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-white/80 text-[14px] leading-relaxed mb-2 whitespace-pre-wrap break-words">
                                                {comment.content.split(/(@\w+)/g).map((part, i) =>
                                                    part.startsWith("@") ? (
                                                        <span key={i} className="text-[#8FA7C5] font-semibold">{part}</span>
                                                    ) : part
                                                )}
                                            </p>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleLike(comment._id)}
                                                disabled={!session}
                                                className={`flex items-center gap-1 text-[12px] font-medium transition-colors disabled:opacity-40 ${
                                                    isLiked ? "text-[#8FA7C5]" : "text-white/30 hover:text-white"
                                                }`}
                                            >
                                                <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? "fill-[#8FA7C5]" : ""}`} />
                                                {comment.likes > 0 && comment.likes}
                                            </button>
                                            <button
                                                onClick={() => handleDislike(comment._id)}
                                                disabled={!session}
                                                className={`flex items-center gap-1 text-[12px] font-medium transition-colors disabled:opacity-40 ${
                                                    isDisliked ? "text-red-400" : "text-white/30 hover:text-white"
                                                }`}
                                            >
                                                <ThumbsDown className={`w-3.5 h-3.5 ${isDisliked ? "fill-red-400" : ""}`} />
                                                {comment.dislikes > 0 && comment.dislikes}
                                            </button>
                                            <button
                                                onClick={() => handleReply(comment)}
                                                className="flex items-center gap-1 text-[12px] text-white/30 font-medium hover:text-[#8FA7C5] transition-colors"
                                            >
                                                <Reply className="w-3.5 h-3.5" />
                                                Trả lời
                                            </button>
                                            {session && comment.userId === session.user?.id ? (
                                                <button
                                                    onClick={() => handleDelete(comment._id)}
                                                    disabled={deletingId === comment._id}
                                                    className="flex items-center gap-1 text-[12px] text-white/20 hover:text-red-400 transition-colors disabled:opacity-40 ml-auto opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    <span className="hidden sm:inline">{deletingId === comment._id ? "Đang xóa..." : "Xóa"}</span>
                                                </button>
                                            ) : session && (
                                                <button
                                                    onClick={() => handleReport(comment._id)}
                                                    disabled={reportedId === comment._id}
                                                    className="ml-auto text-[11px] text-white/20 hover:text-orange-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40"
                                                >
                                                    {reportedId === comment._id ? "✓ Đã báo cáo" : "Báo cáo"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {sortedComments.length === 0 && (
                            <div className="text-center py-12">
                                <MessageCircle className="w-10 h-10 text-white/10 mx-auto mb-3" />
                                <p className="text-white/25 text-[14px]">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                            </div>
                        )}
                    </div>

                    {/* Load More */}
                    {comments.length < total && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg text-white/50 hover:text-white text-[13px] font-medium transition-all disabled:opacity-40"
                            >
                                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                                Xem thêm {Math.min(PAGE_SIZE, total - comments.length)} bình luận
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
