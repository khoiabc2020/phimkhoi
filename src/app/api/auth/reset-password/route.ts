import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return NextResponse.json({ error: "Token không hợp lệ hoặc đã hết hạn" }, { status: 400 });
        }

        // Update password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return NextResponse.json({ message: "Mật khẩu đã được đặt lại thành công" });

    } catch (error) {
        console.error("Reset Password Error", error);
        return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
    }
}
