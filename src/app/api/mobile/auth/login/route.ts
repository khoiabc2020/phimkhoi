import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

async function parseBody(req: Request): Promise<Record<string, string>> {
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/x-www-form-urlencoded')) {
        const text = await req.text();
        const params = new URLSearchParams(text);
        return Object.fromEntries(params.entries());
    }
    return req.json();
}

export async function POST(req: Request) {
    try {
        const { username, password } = await parseBody(req);

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
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
            },
            process.env.NEXTAUTH_SECRET!,
            { expiresIn: "30d" }
        );

        return NextResponse.json({
            token,
            user: {
                id: user._id.toString(),
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
