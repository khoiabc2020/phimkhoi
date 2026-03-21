"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

/**
 * Upload ảnh đại diện lên server (public/uploads/avatars)
 */
export async function uploadAvatar(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "Không tìm thấy file." };
        }

        // Kiểm tra định dạng file
        if (!file.type.startsWith("image/")) {
            return { success: false, error: "Chỉ chấp nhận định dạng hình ảnh." };
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Tạo thư mục nếu chưa có
        const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Đặt tên file duy nhất
        const fileExt = file.name.split(".").pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = path.join(uploadDir, fileName);

        // Lưu file
        fs.writeFileSync(filePath, buffer);

        const publicUrl = `/uploads/avatars/${fileName}`;
        
        return { success: true, url: publicUrl };
    } catch (error) {
        console.error("Upload avatar error:", error);
        return { success: false, error: "Lỗi tải ảnh lên." };
    }
}

/**
 * Cập nhật thông tin cơ bản: Tên hiển thị và Ảnh đại diện
 */
export async function updateProfile(data: { name?: string; image?: string; email?: string }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Bạn cần đăng nhập để thực hiện thao tác này." };
        }

        await dbConnect();
        
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.image) updateData.image = data.image;
        if (data.email) updateData.email = data.email;

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedUser) {
            return { success: false, error: "Không tìm thấy người dùng." };
        }

        revalidatePath("/thong-tin-tai-khoan");
        return { success: true, data: { name: updatedUser.name, image: updatedUser.image, email: updatedUser.email } };
    } catch (error) {
        console.error("Update profile error:", error);
        return { success: false, error: "Đã có lỗi xảy ra khi cập nhật profile." };
    }
}

/**
 * Đổi mật khẩu cho người dùng sử dụng Credentials
 */
export async function changePassword(data: { oldPassword?: string; newPassword: string }) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) {
            return { success: false, error: "Bạn cần đăng nhập." };
        }

        await dbConnect();
        const user = await User.findById(session.user.id);
        
        if (!user) {
            return { success: false, error: "Người dùng không tồn tại." };
        }

        // Kiểm tra xem User này có mật khẩu không (OAuth users có thể không có pass)
        // Nếu user đăng nhập qua Social, có thể họ chưa bao giờ đặt pass
        const isSocialUser = (session.user as any).provider && (session.user as any).provider !== 'credentials';

        if (user.password) {
            if (!data.oldPassword) {
                return { success: false, error: "Vui lòng nhập mật khẩu cũ." };
            }
            const isMatch = await bcrypt.compare(data.oldPassword, user.password);
            if (!isMatch) {
                return { success: false, error: "Mật khẩu cũ không chính xác." };
            }
        } else if (isSocialUser && !user.password) {
            // Social account, allow setting password for the first time without oldPassword
        }

        // Hash mật khẩu mới
        const hashed = await bcrypt.hash(data.newPassword, 10);
        user.password = hashed;
        await user.save();

        return { success: true, message: "Đổi mật khẩu thành công." };
    } catch (error) {
        console.error("Change password error:", error);
        return { success: false, error: "Lỗi hệ thống khi đổi mật khẩu." };
    }
}
