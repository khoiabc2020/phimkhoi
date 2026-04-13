"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Smile, ImageIcon, X, Search, Loader2 } from "lucide-react";

interface CommentMemePickerProps {
    onEmojiSelect: (emoji: string) => void;
    onMemeSelect: (memeUrl: string) => void;
    onClose: () => void;
}

const EMOJI_CATEGORIES = {
    "Mặt": ["😀","😂","🤣","😍","🥰","😘","😎","🥳","🤩","😏","😒","🙄","😤","😡","🤬","😱","😨","😰","😭","😢","🥹","😮","🤔","🤨","😐","😑","😶","🙃","😇","🤗","😴","🤢","🤮","🤧","😷","🤒","🤡","👻","💀","🤖","👽","😈","🙈","🙉","🙊"],
    "Tay": ["👍","👎","👏","🙌","🤝","👊","✊","🤜","🤛","✌️","🤞","🤟","🤙","💪","🦾","🫶","❤️‍🔥","🤲","🙏","💅","✍️","🫵","☝️","👆","👇","👈","👉"],
    "Vật": ["🎬","🍿","🎮","📺","🎭","🎪","🎡","🎢","🎠","🏆","🥇","🎯","🎲","🃏","🀄","🎴","🎸","🎵","🎶","🎤","🎧","🎹","📻","📷","💻","📱","⌨️","🖥️","🖱️"],
    "Hot": ["🔥","✨","💥","⚡","🌟","⭐","💫","🌈","🎉","🎊","🎀","🎁","🏅","💎","💯","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","♥️","💔","💕","💖","💗","💘","💝"],
};

const MEME_SETS: Record<string, string[]> = {
    "QooBee": Array.from({ length: 16 }, (_, i) =>
        `https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/QooBee/${i + 1}.png`
    ),
    "Ami Cat": Array.from({ length: 16 }, (_, i) =>
        `https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/Ami-Fat-Cat/${i + 1}.png`
    ),
    "Cony Brown": [
        "https://stickershop.line-scdn.net/stickershop/v1/sticker/13/android/sticker.png",
        "https://stickershop.line-scdn.net/stickershop/v1/sticker/14/android/sticker.png",
        "https://stickershop.line-scdn.net/stickershop/v1/sticker/15/android/sticker.png",
        "https://stickershop.line-scdn.net/stickershop/v1/sticker/16/android/sticker.png",
        ...Array.from({ length: 8 }, (_, i) =>
            `https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/QooBee/${i + 1}.png`
        ),
    ],
    "Meme VN": [
        "https://i.imgur.com/sJMPN5S.png",
        "https://i.imgur.com/7KS4LZW.png",
        "https://i.imgur.com/DdBpJb1.png",
        "https://i.imgur.com/r1Vx7yk.png",
        "https://i.imgur.com/1rOAbRS.png",
        "https://i.imgur.com/mDQ0sSy.png",
        "https://i.imgur.com/aDfNT1W.png",
        "https://i.imgur.com/N7i3lnc.png",
    ],
    "Pepe": [
        "https://emoji.gg/assets/emoji/3508_pepe_cool.png",
        "https://emoji.gg/assets/emoji/7106_PepeLove.png",
        "https://emoji.gg/assets/emoji/3612_PepeSad.png",
        "https://emoji.gg/assets/emoji/2946_pepeLaugh.png",
        "https://emoji.gg/assets/emoji/6817_Hype.png",
        "https://emoji.gg/assets/emoji/5803_peepoRich.png",
        "https://emoji.gg/assets/emoji/9511_PepeHmm.png",
        "https://emoji.gg/assets/emoji/6201_monkaS.png",
    ],
};

interface GifResult {
    id?: string;
    url: string;
    preview?: string;
    title?: string;
}

const GIF_CATEGORIES = ["Reaction", "Phim", "Haha", "Sad", "Wow", "Cute"];

export default function CommentMemePicker({ onEmojiSelect, onMemeSelect, onClose }: CommentMemePickerProps) {
    const [activeTab, setActiveTab] = useState<"emoji" | "sticker" | "gif">("emoji");
    const [activeEmojiCat, setActiveEmojiCat] = useState<keyof typeof EMOJI_CATEGORIES>("Mặt");
    const [activeMemeSet, setActiveMemeSet] = useState<keyof typeof MEME_SETS>("QooBee");
    const [gifQuery, setGifQuery] = useState("");
    const [gifResults, setGifResults] = useState<GifResult[]>([]);
    const [gifLoading, setGifLoading] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // Load featured GIFs on tab open
    useEffect(() => {
        if (activeTab === "gif" && gifResults.length === 0) {
            fetchGifs("");
        }
    }, [activeTab]);

    const fetchGifs = useCallback(async (q: string) => {
        setGifLoading(true);
        try {
            const res = await fetch(`/api/gifs?q=${encodeURIComponent(q)}&limit=20`);
            const data = await res.json();
            setGifResults(data.results || []);
        } catch {
            setGifResults([]);
        } finally {
            setGifLoading(false);
        }
    }, []);

    const handleGifSearch = (val: string) => {
        setGifQuery(val);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => fetchGifs(val), 500);
    };

    return (
        <div
            ref={pickerRef}
            className="absolute bottom-full right-0 mb-2 w-[300px] md:w-[360px] bg-[#111116] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[50]"
            style={{ animation: "slideUp 0.15s ease-out" }}
        >
            <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }`}</style>

            {/* Tab bar */}
            <div className="flex items-center border-b border-white/[0.06] bg-white/[0.03]">
                {([
                    { id: "emoji", label: "Emoji", icon: <Smile className="w-4 h-4" /> },
                    { id: "sticker", label: "Sticker", icon: <ImageIcon className="w-4 h-4" /> },
                    { id: "gif", label: "GIF", icon: <span className="text-[11px] font-black tracking-tight">GIF</span> },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[12px] font-bold transition-all border-b-2 ${
                            activeTab === tab.id
                                ? "text-[#8FA7C5] border-[#8FA7C5]"
                                : "text-white/30 border-transparent hover:text-white/60"
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
                <button onClick={onClose} className="px-3 py-2.5 text-white/20 hover:text-white transition-colors border-b-2 border-transparent">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Emoji Tab */}
            {activeTab === "emoji" && (
                <div className="p-2">
                    {/* Category pills */}
                    <div className="flex gap-1 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                        {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveEmojiCat(cat)}
                                className={`px-3 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all shrink-0 ${
                                    activeEmojiCat === cat
                                        ? "bg-[#8FA7C5] text-[#0a0a0a]"
                                        : "bg-white/5 text-white/40 hover:text-white"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-8 gap-0.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                        {EMOJI_CATEGORIES[activeEmojiCat].map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => onEmojiSelect(emoji)}
                                className="w-9 h-9 flex items-center justify-center text-[18px] hover:bg-white/10 rounded-md transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Sticker Tab */}
            {activeTab === "sticker" && (
                <div className="p-2">
                    {/* Set pills */}
                    <div className="flex gap-1 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                        {(Object.keys(MEME_SETS) as Array<keyof typeof MEME_SETS>).map(set => (
                            <button
                                key={set}
                                onClick={() => setActiveMemeSet(set)}
                                className={`px-3 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all shrink-0 ${
                                    activeMemeSet === set
                                        ? "bg-[#8FA7C5] text-[#0a0a0a]"
                                        : "bg-white/5 text-white/40 hover:text-white"
                                }`}
                            >
                                {set}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                        {MEME_SETS[activeMemeSet].map((url, i) => (
                            <button
                                key={i}
                                onClick={() => onMemeSelect(url)}
                                className="aspect-square bg-white/5 hover:bg-white/10 rounded-lg overflow-hidden transition-all group p-1 hover:scale-105"
                            >
                                <img
                                    src={url}
                                    alt={`Sticker ${i + 1}`}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* GIF Tab */}
            {activeTab === "gif" && (
                <div className="p-2">
                    {/* Search */}
                    <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input
                            type="text"
                            value={gifQuery}
                            onChange={e => handleGifSearch(e.target.value)}
                            placeholder="Tìm GIF..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#8FA7C5]/50"
                        />
                    </div>

                    {/* Category shortcuts */}
                    {!gifQuery && (
                        <div className="flex gap-1 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                            {GIF_CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => { setGifQuery(cat); fetchGifs(cat); }}
                                    className="px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all shrink-0"
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* GIF grid */}
                    <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
                        {gifLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 text-[#8FA7C5] animate-spin" />
                            </div>
                        ) : gifResults.length === 0 ? (
                            <p className="text-center text-white/30 text-[12px] py-8">Không tìm thấy GIF</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-1.5">
                                {gifResults.map((gif, i) => (
                                    <button
                                        key={gif.id || i}
                                        onClick={() => onMemeSelect(gif.url)}
                                        className="relative aspect-video bg-white/5 rounded-lg overflow-hidden hover:ring-2 hover:ring-[#8FA7C5]/60 transition-all group"
                                    >
                                        <img
                                            src={gif.preview || gif.url}
                                            alt={gif.title || "GIF"}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-1">
                                            <span className="text-[9px] text-white/80 font-medium line-clamp-1">{gif.title}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tenor attribution */}
                    <div className="text-center mt-2">
                        <span className="text-[9px] text-white/20">Via Tenor</span>
                    </div>
                </div>
            )}
        </div>
    );
}
