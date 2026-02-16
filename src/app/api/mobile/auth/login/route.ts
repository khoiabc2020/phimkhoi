import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json(
                { message: "Vui lòng nhập đầy đủ thông tin" },
                { status: 400 }
            );
        }

        await dbConnect();

        // 1. Find user
        const user = await User.findOne({
            $or: [{ email: username }, { name: username }],
        });

        // 2. Mock Admin check
        if (!user && username === "admin" && password === "admin123") {
            const token = jwt.sign(
                {
                    id: "admin_mock_id",
                    name: "Admin User",
                    email: "admin@khoiphim.com",
                    role: "admin",
                },
                process.env.NEXTAUTH_SECRET || "fallback_secret",
                { expiresIn: "30d" }
            );

            return NextResponse.json({
                token,
                user: {
                    id: "admin_mock_id",
                    name: "Admin User",
                    email: "admin@khoiphim.com",
                    role: "admin",
                    image: "",
                },
            });
        }

        if (!user) {
            return NextResponse.json(
                { message: "Tài khoản không tồn tại" },
                { status: 401 }
            );
        }

        // 3. Verify password
        const isValid = await bcrypt.compare(password, user.password || "");
        if (!isValid) {
            return NextResponse.json(
                { message: "Mật khẩu không chính xác" },
                { status: 401 }
            );
        }

        // 4. Create JWT
        const token = jwt.sign(
            {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            process.env.NEXTAUTH_SECRET || "fallback_secret",
            { expiresIn: "30d" }
        );

        return NextResponse.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json(
            { message: "Lỗi Server" },
            { status: 500 }
        );
    }
}
