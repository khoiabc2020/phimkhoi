export type ThemeColor = {
    primary: string;
    secondary: string;
    gradient: string;
    glow: string;
    text: string;
    /** Onflix-style: full-width top banner — Tailwind from-[] color class */
    banner: string;
};

export const DEFAULT_THEME: ThemeColor = {
    primary: "#8FA7C5",
    secondary: "#1e293b",
    gradient: "from-[#0e1621] via-black to-black",
    glow: "bg-[#0e1621]",
    banner: "from-[#0e1621]/60",
    text: "text-white",
};

export const THEME_MAP: Record<string, ThemeColor> = {
    // Thể loại
    "hanh-dong": {
        primary: "#ff4d4d",
        secondary: "#3d0d0d",
        gradient: "from-[#3b0d0d] via-black to-black",
        glow: "bg-[#3d0d0d]",
        banner: "from-[#4a0808]/65",
        text: "text-white",
    },
    "gay-can": {
        primary: "#c0392b",
        secondary: "#3d0d0d",
        gradient: "from-[#3b0d0d] via-black to-black",
        glow: "bg-[#3d0d0d]",
        banner: "from-[#4a0808]/60",
        text: "text-white",
    },
    "tinh-cam": {
        primary: "#ff75a0",
        secondary: "#3d1b3b",
        gradient: "from-[#3d1b3b] via-black to-black",
        glow: "bg-[#3d1b3b]",
        banner: "from-[#3d1040]/60",
        text: "text-white",
    },
    "co-trang": {
        primary: "#f4c84a",
        secondary: "#3d2e0a",
        gradient: "from-[#3d2e0a] via-black to-black",
        glow: "bg-[#3d2e0a]",
        banner: "from-[#3d2800]/55",
        text: "text-white",
    },
    "kinh-di": {
        primary: "#a1a1a1",
        secondary: "#1a1a1a",
        gradient: "from-[#1a1a1a] via-black to-black",
        glow: "bg-[#1a1a1a]",
        banner: "from-[#1a0a1a]/60",
        text: "text-white",
    },
    "hoat-hinh": {
        primary: "#00d2ff",
        secondary: "#0d2a4a",
        gradient: "from-[#0d2a4a] via-black to-black",
        glow: "bg-[#0d2a4a]",
        banner: "from-[#062040]/60",
        text: "text-white",
    },
    "phim-hoat-hinh": {
        primary: "#00d2ff",
        secondary: "#0d2a4a",
        gradient: "from-[#0d2a4a] via-black to-black",
        glow: "bg-[#0d2a4a]",
        banner: "from-[#062040]/60",
        text: "text-white",
    },
    "vien-tuong": {
        primary: "#3b82f6",
        secondary: "#0d1a3b",
        gradient: "from-[#0d1a3b] via-black to-black",
        glow: "bg-[#0d1a3b]",
        banner: "from-[#0a1535]/65",
        text: "text-white",
    },
    "bi-an": {
        primary: "#8b5cf6",
        secondary: "#1a0d3b",
        gradient: "from-[#1a0d3b] via-black to-black",
        glow: "bg-[#1a0d3b]",
        banner: "from-[#180b38]/65",
        text: "text-white",
    },
    "tam-ly": {
        primary: "#6366f1",
        secondary: "#130d3b",
        gradient: "from-[#130d3b] via-black to-black",
        glow: "bg-[#130d3b]",
        banner: "from-[#110b35]/60",
        text: "text-white",
    },
    "hinh-su": {
        primary: "#f59e0b",
        secondary: "#2b1a00",
        gradient: "from-[#2b1a00] via-black to-black",
        glow: "bg-[#2b1a00]",
        banner: "from-[#2a1500]/58",
        text: "text-white",
    },
    "chien-tranh": {
        primary: "#84cc16",
        secondary: "#1a2b0a",
        gradient: "from-[#1a2b0a] via-black to-black",
        glow: "bg-[#1a2b0a]",
        banner: "from-[#142008]/55",
        text: "text-white",
    },
    "tai-lieu": {
        primary: "#f97316",
        secondary: "#2b1200",
        gradient: "from-[#2b1200] via-black to-black",
        glow: "bg-[#2b1200]",
        banner: "from-[#281000]/55",
        text: "text-white",
    },
    "hoc-duong": {
        primary: "#34d399",
        secondary: "#0a2b1a",
        gradient: "from-[#0a2b1a] via-black to-black",
        glow: "bg-[#0a2b1a]",
        banner: "from-[#082016]/55",
        text: "text-white",
    },
    "hai-huoc": {
        primary: "#fbbf24",
        secondary: "#2b2000",
        gradient: "from-[#2b2000] via-black to-black",
        glow: "bg-[#2b2000]",
        banner: "from-[#2a1c00]/55",
        text: "text-white",
    },
    "vo-thuat": {
        primary: "#ef4444",
        secondary: "#2b0a0a",
        gradient: "from-[#2b0a0a] via-black to-black",
        glow: "bg-[#2b0a0a]",
        banner: "from-[#280808]/58",
        text: "text-white",
    },
    "gia-dinh": {
        primary: "#f472b6",
        secondary: "#2b0a1a",
        gradient: "from-[#2b0a1a] via-black to-black",
        glow: "bg-[#2b0a1a]",
        banner: "from-[#280818]/55",
        text: "text-white",
    },

    // Quốc gia
    "trung-quoc": {
        primary: "#f4c84a",
        secondary: "#3d2e0a",
        gradient: "from-[#3d2e0a] via-black to-black",
        glow: "bg-[#3d2e0a]",
        banner: "from-[#3a2800]/58",
        text: "text-white",
    },
    "han-quoc": {
        primary: "#8FA7C5",
        secondary: "#0d1a3b",
        gradient: "from-[#0d1a3b] via-black to-black",
        glow: "bg-[#0d1a3b]",
        banner: "from-[#0a1530]/60",
        text: "text-white",
    },
    "au-my": {
        primary: "#ff4d4d",
        secondary: "#3b0d0d",
        gradient: "from-[#3b0d0d] via-black to-black",
        glow: "bg-[#3b0d0d]",
        banner: "from-[#3a0808]/60",
        text: "text-white",
    },
    "nhat-ban": {
        primary: "#00d2ff",
        secondary: "#0d2a4a",
        gradient: "from-[#0d2a4a] via-black to-black",
        glow: "bg-[#0d2a4a]",
        banner: "from-[#082040]/60",
        text: "text-white",
    },
    "thai-lan": {
        primary: "#f59e0b",
        secondary: "#2b1a00",
        gradient: "from-[#2b1a00] via-black to-black",
        glow: "bg-[#2b1a00]",
        banner: "from-[#281500]/55",
        text: "text-white",
    },
    "an-do": {
        primary: "#f97316",
        secondary: "#2b1200",
        gradient: "from-[#2b1200] via-black to-black",
        glow: "bg-[#2b1200]",
        banner: "from-[#2a1000]/55",
        text: "text-white",
    },
    "viet-nam": {
        primary: "#ef4444",
        secondary: "#2b0a0a",
        gradient: "from-[#2b0a0a] via-black to-black",
        glow: "bg-[#2b0a0a]",
        banner: "from-[#280808]/58",
        text: "text-white",
    },

    // Danh sách
    "phim-le": {
        primary: "#ff4747",
        secondary: "#2b0a0a",
        gradient: "from-[#2b0a0a] via-black to-black",
        glow: "bg-[#2b0a0a]",
        banner: "from-[#280808]/60",
        text: "text-white",
    },
    "phim-bo": {
        primary: "#478cff",
        secondary: "#0a1a2b",
        gradient: "from-[#0a1a2b] via-black to-black",
        glow: "bg-[#0a1a2b]",
        banner: "from-[#081428]/60",
        text: "text-white",
    },
    "phim-moi": {
        primary: "#ffc107",
        secondary: "#2b210a",
        gradient: "from-[#2b210a] via-black to-black",
        glow: "bg-[#2b210a]",
        banner: "from-[#281c00]/58",
        text: "text-white",
    },
    "phim-moi-cap-nhat": {
        primary: "#00feba",
        secondary: "#0a2b21",
        gradient: "from-[#0a2b21] via-black to-black",
        glow: "bg-[#0a2b21]",
        banner: "from-[#08241a]/58",
        text: "text-white",
    },
    "tv-shows": {
        primary: "#a78bfa",
        secondary: "#1a0d3b",
        gradient: "from-[#1a0d3b] via-black to-black",
        glow: "bg-[#1a0d3b]",
        banner: "from-[#150b30]/60",
        text: "text-white",
    },
    "hoat-hinh-type": {
        primary: "#00d2ff",
        secondary: "#0d2a4a",
        gradient: "from-[#0d2a4a] via-black to-black",
        glow: "bg-[#0d2a4a]",
        banner: "from-[#062040]/60",
        text: "text-white",
    },

    // Chức năng
    "tim-kiem": {
        primary: "#00d2ff",
        secondary: "#051a2e",
        gradient: "from-[#051a2e] via-black to-black",
        glow: "bg-[#051a2e]",
        banner: "from-[#041525]/60",
        text: "text-white",
    },
    "loc-phim": {
        primary: "#b100ff",
        secondary: "#1a0d4a",
        gradient: "from-[#1a0d4a] via-black to-black",
        glow: "bg-[#1a0d4a]",
        banner: "from-[#160840]/62",
        text: "text-white",
    },
};

export function getThemeBySlug(slug: string): ThemeColor {
    return THEME_MAP[slug] || DEFAULT_THEME;
}
