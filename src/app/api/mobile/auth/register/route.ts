import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

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
        const { name, email, password } = await parseBody(req);

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Vui lòng nhập đầy đủ thông tin" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: "Email đã được sử dụng" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "user",
        });

        return NextResponse.json(
            { message: "Đăng ký thành công", userId: newUser._id },
            { status: 201 }
        );
    } catch (error) {
        console.error("Register Error:", error);
        return NextResponse.json(
            { message: "Lỗi Server" },
            { status: 500 }
        );
    }
}
