import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Thông báo | KHOIPHIM",
    description: "Xem thông báo cập nhật phim và thông báo hệ thống từ KHOIPHIM.",
    robots: { index: false, follow: false },
};

export default function ThongBaoLayout({ children }: { children: React.ReactNode }) {
    return children;
}
