export type ThemeColor = {
    primary: string;
    secondary: string;
    gradient: string;
    glow: string;
    text: string;
};

export const DEFAULT_THEME: ThemeColor = {
    primary: "#8FA7C5",
    secondary: "#1e293b",
    gradient: "from-[#0e1621] via-black to-black",
    glow: "bg-[#0e1621]",
    text: "text-white",
};

export const THEME_MAP: Record<string, ThemeColor> = {
    // Thể loại
    "hanh-dong": {
        primary: "#ff4d4d",
        secondary: "#3d0d0d",
        gradient: "from-[#3b0d0d] via-black to-black",
        glow: "bg-[#3d0d0d]",
        text: "text-white",
    },
    "tinh-cam": {
        primary: "#ff75a0",
        secondary: "#3d1b3b",
        gradient: "from-[#3d1b3b] via-black to-black",
        glow: "bg-[#3d1b3b]",
        text: "text-white",
    },
    "co-trang": {
        primary: "#f4c84a",
        secondary: "#3d2e0a",
        gradient: "from-[#3d2e0a] via-black to-black",
        glow: "bg-[#3d2e0a]",
        text: "text-white",
    },
    "kinh-di": {
        primary: "#a1a1a1",
        secondary: "#1a1a1a",
        gradient: "from-[#1a1a1a] via-black to-black",
        glow: "bg-[#1a1a1a]",
        text: "text-white",
    },
    "hoat-hinh": {
        primary: "#00d2ff",
        secondary: "#0d2a4a",
        gradient: "from-[#0d2a4a] via-black to-black",
        glow: "bg-[#0d2a4a]",
        text: "text-white",
    },
    "vien-tuong": {
        primary: "#b100ff",
        secondary: "#1a0d4a",
        gradient: "from-[#1a0d4a] via-black to-black",
        glow: "bg-[#1a0d4a]",
        text: "text-white",
    },
    
    // Quốc gia
    "trung-quoc": {
        primary: "#f4c84a",
        secondary: "#3d2e0a",
        gradient: "from-[#3d2e0a] via-black to-black",
        glow: "bg-[#3d2e0a]",
        text: "text-white",
    },
    "han-quoc": {
        primary: "#8FA7C5",
        secondary: "#0d1a3b",
        gradient: "from-[#0d1a3b] via-black to-black",
        glow: "bg-[#0d1a3b]",
        text: "text-white",
    },
    "au-my": {
        primary: "#ff4d4d",
        secondary: "#3b0d0d",
        gradient: "from-[#3b0d0d] via-black to-black",
        glow: "bg-[#3b0d0d]",
        text: "text-white",
    },
    "nhat-ban": {
        primary: "#00d2ff",
        secondary: "#0d2a4a",
        gradient: "from-[#0d2a4a] via-black to-black",
        glow: "bg-[#0d2a4a]",
        text: "text-white",
    }
};

export function getThemeBySlug(slug: string): ThemeColor {
    return THEME_MAP[slug] || DEFAULT_THEME;
}
