import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function verifyToken(req: Request): { id: string } | null {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "").trim();
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    } catch {
        return null;
    }
}

// PATCH /api/mobile/user/update — update name, password, or image
export async function PATCH(req: Request) {
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { name, currentPassword, newPassword, image } = body;

        await dbConnect();
        const user = await User.findById(decoded.id);
        if (!user) return NextResponse.json({ message: "Không tìm thấy tài khoản" }, { status: 404 });

        const updates: Record<string, any> = {};

        if (name && name.trim()) {
            updates.name = name.trim();
        }

        if (image !== undefined) {
            updates.image = image;
        }

        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ message: "Vui lòng nhập mật khẩu hiện tại" }, { status: 400 });
            }
            // Google/OAuth users may not have a password
            if (user.password) {
                const valid = await bcrypt.compare(currentPassword, user.password);
                if (!valid) {
                    return NextResponse.json({ message: "Mật khẩu hiện tại không đúng" }, { status: 400 });
                }
            }
            if (newPassword.length < 6) {
                return NextResponse.json({ message: "Mật khẩu mới phải ít nhất 6 ký tự" }, { status: 400 });
            }
            updates.password = await bcrypt.hash(newPassword, 10);
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ message: "Không có thay đổi nào" }, { status: 400 });
        }

        Object.assign(user, updates);
        await user.save();

        return NextResponse.json({
            message: "Cập nhật thành công",
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
            }
        });
    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}
