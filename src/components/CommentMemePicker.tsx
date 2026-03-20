"use client";

import { useState, useEffect, useRef } from "react";
import { Smile, Image as ImageIcon, X } from "lucide-react";

interface CommentMemePickerProps {
    onEmojiSelect: (emoji: string) => void;
    onMemeSelect: (memeUrl: string) => void;
    onClose: () => void;
}

const EMOJIS = [
    "😀", "😂", "🤣", "😍", "😘", "🥰", "🤔", "🙄", "😭", "😱", "😡", "🤡", "💩", "👻",
    "👍", "👎", "❤️", "🔥", "✨", "🎉", "🎬", "🍿", "🎮", "📱", "💻", "🚀", "🌈", "☀️"
];

const MEME_SETS = {
    "QooBee": [
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/QooBee/1.png",
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/QooBee/2.png",
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/QooBee/3.png",
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/QooBee/4.png",
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/QooBee/5.png",
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/QooBee/6.png",
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/QooBee/7.png",
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/QooBee/8.png",
    ],
    "Ami Cat": [
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/Ami-Fat-Cat/1.png",
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/Ami-Fat-Cat/2.png",
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/Ami-Fat-Cat/3.png",
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/Ami-Fat-Cat/4.png",
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/Ami-Fat-Cat/5.png",
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/Ami-Fat-Cat/6.png",
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/Ami-Fat-Cat/7.png",
        "https://raw.githubusercontent.com/TienSInh/Sticker-Set/master/Ami-Fat-Cat/8.png",
    ]
};

export default function CommentMemePicker({ onEmojiSelect, onMemeSelect, onClose }: CommentMemePickerProps) {
    const [activeTab, setActiveTab] = useState<"emoji" | "meme">("emoji");
    const [activeMemeSet, setActiveMemeSet] = useState<keyof typeof MEME_SETS>("QooBee");
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div 
            ref={pickerRef}
            className="absolute bottom-full right-0 mb-2 w-[280px] md:w-[320px] bg-[#121218] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[50] animate-in slide-in-from-bottom-2 duration-200"
        >
            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-white/5">
                <button 
                    onClick={() => setActiveTab("emoji")}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${activeTab === "emoji" ? "text-[#8FA7C5] bg-white/5 border-b-2 border-[#8FA7C5]" : "text-gray-400 hover:text-white"}`}
                >
                    <Smile className="w-4 h-4" />
                    Biểu tượng
                </button>
                <button 
                    onClick={() => setActiveTab("meme")}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${activeTab === "meme" ? "text-[#8FA7C5] bg-white/5 border-b-2 border-[#8FA7C5]" : "text-gray-400 hover:text-white"}`}
                >
                    <ImageIcon className="w-4 h-4" />
                    Stickers
                </button>
                <button onClick={onClose} className="px-3 text-gray-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {activeTab === "emoji" ? (
                    <div className="grid grid-cols-7 gap-1">
                        {EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => onEmojiSelect(emoji)}
                                className="w-9 h-9 flex items-center justify-center text-xl hover:bg-white/10 rounded-lg transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex gap-2 mb-3">
                            {Object.keys(MEME_SETS).map((set) => (
                                <button
                                    key={set}
                                    onClick={() => setActiveMemeSet(set as any)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${activeMemeSet === set ? "bg-[#8FA7C5] text-[#0a0a0a]" : "bg-white/5 text-gray-400 hover:text-white"}`}
                                >
                                    {set}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {MEME_SETS[activeMemeSet].map((url, i) => (
                                <button
                                    key={i}
                                    onClick={() => onMemeSelect(url)}
                                    className="aspect-square bg-white/5 hover:bg-white/10 rounded-lg overflow-hidden transition-all group p-1"
                                >
                                    <img 
                                        src={url} 
                                        alt={`Meme ${i}`} 
                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform" 
                                        loading="lazy"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
