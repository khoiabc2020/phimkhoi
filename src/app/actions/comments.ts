"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Comment from "@/models/Comment";
import { revalidatePath } from "next/cache";

// Add a new comment or reply
export async function addComment(data: {
    movieId: string;
    movieSlug: string;
    episodeName?: string;
    content: string;
    rating?: number;
    parentId?: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        let roleDisplay = "Thành viên";
        if (session.user.role === "admin") roleDisplay = "Quản trị viên";
        // Mock a Fan cứng badge for some users for UI purposes (optional)
        if (session.user.email?.includes("fan")) roleDisplay = "Top 65 - Fan cứng";

        const comment = await Comment.create({
            userId: session.user.id,
            userName: session.user.name || "Anonymous",
            userImage: session.user.image || "",
            movieId: data.movieId,
            movieSlug: data.movieSlug,
            episodeName: data.episodeName,
            content: data.content.trim(),
            userRole: roleDisplay,
            rating: data.rating,
            parentId: data.parentId || undefined,
            likes: 0,
            dislikes: 0,
            likedBy: [],
            dislikedBy: [],
            isApproved: true,
            isReported: false,
        });

        revalidatePath(`/phim/${data.movieSlug}`);
        return { success: true, data: comment };
    } catch (error) {
        console.error("Add comment error:", error);
        return { success: false, error: "Failed to add comment" };
    }
}

// Get comments for a movie (with pagination)
export async function getComments(movieSlug: string, limit: number = 20, offset: number = 0) {
    try {
        await dbConnect();

        const comments = await Comment.find({
            movieSlug,
            parentId: null, // Only top-level comments
            isApproved: true,
        })
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean();

        // Get reply counts for each comment
        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replyCount = await Comment.countDocuments({
                    parentId: comment._id,
                    isApproved: true,
                });
                return { ...comment, replyCount };
            })
        );

        const total = await Comment.countDocuments({
            movieSlug,
            parentId: null,
            isApproved: true,
        });

        return { success: true, data: commentsWithReplies, total };
    } catch (error) {
        console.error("Get comments error:", error);
        return { success: false, error: "Failed to fetch comments", data: [], total: 0 };
    }
}

// Get replies for a comment
export async function getReplies(parentId: string) {
    try {
        await dbConnect();

        const replies = await Comment.find({
            parentId,
            isApproved: true,
        })
            .sort({ createdAt: 1 })
            .lean();

        return { success: true, data: replies };
    } catch (error) {
        console.error("Get replies error:", error);
        return { success: false, error: "Failed to fetch replies", data: [] };
    }
}

// Update own comment
export async function updateComment(commentId: string, content: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const comment = await Comment.findOneAndUpdate(
            {
                _id: commentId,
                userId: session.user.id,
            },
            {
                $set: { content: content.trim() },
            },
            { new: true }
        );

        if (!comment) {
            return { success: false, error: "Comment not found or unauthorized" };
        }

        revalidatePath(`/phim/${comment.movieSlug}`);
        return { success: true, data: comment };
    } catch (error) {
        console.error("Update comment error:", error);
        return { success: false, error: "Failed to update comment" };
    }
}

// Delete own comment
export async function deleteComment(commentId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const comment = await Comment.findOneAndDelete({
            _id: commentId,
            userId: session.user.id,
        });

        if (!comment) {
            return { success: false, error: "Comment not found or unauthorized" };
        }

        // Also delete all replies
        await Comment.deleteMany({ parentId: commentId });

        revalidatePath(`/phim/${comment.movieSlug}`);
        return { success: true };
    } catch (error) {
        console.error("Delete comment error:", error);
        return { success: false, error: "Failed to delete comment" };
    }
}

// Like a comment
export async function likeComment(commentId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        const userId = session.user.id;
        const hasLiked = comment.likedBy.some((id) => id.toString() === userId);
        const hasDisliked = comment.dislikedBy.some((id) => id.toString() === userId);

        if (hasLiked) {
            // Unlike
            comment.likedBy = comment.likedBy.filter((id) => id.toString() !== userId);
            comment.likes = Math.max(0, comment.likes - 1);
        } else {
            // Like
            comment.likedBy.push(userId as any);
            comment.likes += 1;

            // Remove dislike if exists
            if (hasDisliked) {
                comment.dislikedBy = comment.dislikedBy.filter((id) => id.toString() !== userId);
                comment.dislikes = Math.max(0, comment.dislikes - 1);
            }
        }

        await comment.save();

        revalidatePath(`/phim/${comment.movieSlug}`);
        return { success: true, data: { likes: comment.likes, dislikes: comment.dislikes, hasLiked: !hasLiked } };
    } catch (error) {
        console.error("Like comment error:", error);
        return { success: false, error: "Failed to like comment" };
    }
}

// Dislike a comment
export async function dislikeComment(commentId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        const userId = session.user.id;
        const hasLiked = comment.likedBy.some((id) => id.toString() === userId);
        const hasDisliked = comment.dislikedBy.some((id) => id.toString() === userId);

        if (hasDisliked) {
            // Un-dislike
            comment.dislikedBy = comment.dislikedBy.filter((id) => id.toString() !== userId);
            comment.dislikes = Math.max(0, comment.dislikes - 1);
        } else {
            // Dislike
            comment.dislikedBy.push(userId as any);
            comment.dislikes += 1;

            // Remove like if exists
            if (hasLiked) {
                comment.likedBy = comment.likedBy.filter((id) => id.toString() !== userId);
                comment.likes = Math.max(0, comment.likes - 1);
            }
        }

        await comment.save();

        revalidatePath(`/phim/${comment.movieSlug}`);
        return { success: true, data: { likes: comment.likes, dislikes: comment.dislikes, hasDisliked: !hasDisliked } };
    } catch (error) {
        console.error("Dislike comment error:", error);
        return { success: false, error: "Failed to dislike comment" };
    }
}

// Report a comment
export async function reportComment(commentId: string, reason: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        const comment = await Comment.findByIdAndUpdate(
            commentId,
            {
                $set: {
                    isReported: true,
                    reportReason: reason,
                },
            },
            { new: true }
        );

        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        return { success: true };
    } catch (error) {
        console.error("Report comment error:", error);
        return { success: false, error: "Failed to report comment" };
    }
}

// Get user's own comments
export async function getMyComments(limit: number = 50) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized", data: [] };
        }

        await dbConnect();

        const comments = await Comment.find({ userId: session.user.id })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return { success: true, data: comments };
    } catch (error) {
        console.error("Get my comments error:", error);
        return { success: false, error: "Failed to fetch comments", data: [] };
    }
}

// ADMIN: Get all comments with filters
export async function getAllComments(filter: {
    isReported?: boolean;
    isApproved?: boolean;
    limit?: number;
    offset?: number;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || session.user.email !== "admin@example.com") {
            return { success: false, error: "Unauthorized", data: [], total: 0 };
        }

        await dbConnect();

        const query: any = {};
        if (filter.isReported !== undefined) query.isReported = filter.isReported;
        if (filter.isApproved !== undefined) query.isApproved = filter.isApproved;

        const comments = await Comment.find(query)
            .sort({ createdAt: -1 })
            .skip(filter.offset || 0)
            .limit(filter.limit || 50)
            .lean();

        const total = await Comment.countDocuments(query);

        return { success: true, data: comments, total };
    } catch (error) {
        console.error("Get all comments error:", error);
        return { success: false, error: "Failed to fetch comments", data: [], total: 0 };
    }
}

// ADMIN: Approve comment
export async function approveComment(commentId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || session.user.email !== "admin@example.com") {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        await Comment.findByIdAndUpdate(commentId, {
            $set: { isApproved: true, isReported: false },
        });

        return { success: true };
    } catch (error) {
        console.error("Approve comment error:", error);
        return { success: false, error: "Failed to approve comment" };
    }
}

// ADMIN: Delete comment
export async function deleteCommentAdmin(commentId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || session.user.email !== "admin@example.com") {
            return { success: false, error: "Unauthorized" };
        }

        await dbConnect();

        await Comment.findByIdAndDelete(commentId);
        await Comment.deleteMany({ parentId: commentId });

        return { success: true };
    } catch (error) {
        console.error("Delete comment admin error:", error);
        return { success: false, error: "Failed to delete comment" };
    }
}
