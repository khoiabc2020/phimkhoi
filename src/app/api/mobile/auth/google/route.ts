import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "khoiphim-secret-key-123";

export async function POST(req: NextRequest) {
    try {
        const { idToken, accessToken } = await req.json();

        if (!idToken && !accessToken) {
            return NextResponse.json({ error: "Token bắt buộc" }, { status: 400 });
        }

        // Verify Google token via Google's tokeninfo API
        const tokenToVerify = idToken || accessToken;
        const verifyUrl = idToken
            ? `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenToVerify}`
            : `https://www.googleapis.com/oauth2/v3/userinfo`;

        const headers: Record<string, string> = {};
        if (accessToken && !idToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const googleRes = await fetch(
            idToken ? verifyUrl : "https://www.googleapis.com/oauth2/v3/userinfo",
            { headers }
        );

        if (!googleRes.ok) {
            return NextResponse.json({ error: "Token Google không hợp lệ" }, { status: 401 });
        }

        const googleData = await googleRes.json();

        const email = googleData.email;
        const name = googleData.name || googleData.email?.split("@")[0];
        const image = googleData.picture;

        if (!email) {
            return NextResponse.json({ error: "Không lấy được email từ Google" }, { status: 400 });
        }

        await connectDB();

        // Find or create user
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                name,
                email,
                image,
                provider: "google",
                role: "user",
            });
        } else if (!user.provider) {
            // Existing user, link to Google
            user.provider = "google";
            if (image && !user.image) user.image = image;
            await user.save();
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id.toString(), email: user.email, role: user.role },
            JWT_SECRET,
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
        console.error("Google mobile auth error:", error);
        return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
    }
}
