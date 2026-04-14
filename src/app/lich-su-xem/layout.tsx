import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Lịch sử xem | KHOIPHIM",
    description: "Xem lại lịch sử những bộ phim bạn đã xem trên KHOIPHIM.",
    robots: { index: false, follow: false },
};

export default function LichSuXemLayout({ children }: { children: React.ReactNode }) {
    return children;
}
