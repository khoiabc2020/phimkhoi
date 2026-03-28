import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "KHOIPHIM <noreply@khoiphim.org>";

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
        user.resetPasswordExpires = new Date(resetTokenExpires);
        await user.save();

        const resetUrl = `${process.env.NEXTAUTH_URL || "https://khoiphim.org"}/reset-password/${resetToken}`;

        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: "Đặt lại mật khẩu - KHOIPHIM",
            html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111318;border-radius:16px;border:1px solid #1e2130;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d1117,#151c28);padding:32px 40px;border-bottom:1px solid #1e2130;">
            <h1 style="margin:0;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
              KHOIPHIM<span style="color:#8FA7C5;">.</span>
            </h1>
            <p style="margin:6px 0 0;color:#8FA7C5;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">
              Đặt lại mật khẩu
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;color:#c8cdd8;font-size:16px;line-height:1.6;">
              Xin chào <strong style="color:#ffffff;">${user.name || "bạn"}</strong>,
            </p>
            <p style="margin:0 0 28px;color:#9099a8;font-size:15px;line-height:1.7;">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tiếp tục:
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="border-radius:10px;background:#8FA7C5;">
                  <a href="${resetUrl}"
                     style="display:inline-block;padding:14px 32px;color:#0a0a0a;font-size:15px;font-weight:800;text-decoration:none;border-radius:10px;letter-spacing:0.02em;">
                    🔑 Đặt lại mật khẩu
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;color:#666d7a;font-size:13px;">Hoặc sao chép liên kết này vào trình duyệt:</p>
            <p style="margin:0 0 28px;word-break:break-all;">
              <a href="${resetUrl}" style="color:#8FA7C5;font-size:13px;">${resetUrl}</a>
            </p>

            <!-- Warning box -->
            <div style="background:#1a1f2e;border:1px solid #2a3040;border-radius:10px;padding:16px 20px;">
              <p style="margin:0;color:#8a919e;font-size:13px;line-height:1.6;">
                ⏱ Liên kết này sẽ <strong style="color:#e2a84b;">hết hạn sau 1 giờ</strong>.<br>
                🔒 Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid #1e2130;">
            <p style="margin:0;color:#4a515e;font-size:12px;text-align:center;">
              © ${new Date().getFullYear()} KHOIPHIM ·
              <a href="https://khoiphim.org" style="color:#8FA7C5;text-decoration:none;">khoiphim.org</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
            `,
        });

        return NextResponse.json({
            message: "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư đến của bạn."
        });

    } catch (error) {
        console.error("Forgot Password Error", error);
        return NextResponse.json({ error: "Gửi email thất bại. Vui lòng thử lại sau." }, { status: 500 });
    }
}
