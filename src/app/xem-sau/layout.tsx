import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Xem sau | KHOIPHIM",
    description: "Danh sách phim đã lưu để xem sau trên KHOIPHIM.",
    robots: { index: false, follow: false },
};

export default function XemSauLayout({ children }: { children: React.ReactNode }) {
    return children;
}
