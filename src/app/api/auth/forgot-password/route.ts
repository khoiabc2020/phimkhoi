import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Vui lòng nhập email" }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: "Email không tồn tại trong hệ thống" }, { status: 404 });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpires = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        await user.save();

        // Create Transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

        const mailOptions = {
            from: `"MovieBox Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Đặt lại mật khẩu - MovieBox",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #EAB308;">Đặt lại mật khẩu MovieBox</h2>
                    <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản MovieBox của mình.</p>
                    <p>Vui lòng nhấp vào nút bên dưới để tiếp tục:</p>
                    <a href="${resetUrl}" style="background-color: #EAB308; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin: 10px 0;">
                        Đặt lại mật khẩu
                    </a>
                    <p>Hoặc sao chép liên kết này vào trình duyệt của bạn:</p>
                    <p><a href="${resetUrl}">${resetUrl}</a></p>
                    <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
                    <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">MovieBox Team</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({
            message: "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư đến của bạn."
        });

    } catch (error) {
        console.error("Forgot Password Error", error);
        return NextResponse.json({ error: "Gửi email thất bại. Vui lòng thử lại sau." }, { status: 500 });
    }
}
