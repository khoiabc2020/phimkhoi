import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

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
            favorites: [],
            history: [],
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
