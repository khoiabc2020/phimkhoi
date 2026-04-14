import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Phim yêu thích | KHOIPHIM",
    description: "Danh sách phim yêu thích của bạn trên KHOIPHIM.",
    robots: { index: false, follow: false },
};

export default function PhimYeuThichLayout({ children }: { children: React.ReactNode }) {
    return children;
}
