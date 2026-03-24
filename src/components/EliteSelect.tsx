"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Option {
    name: string;
    slug: string;
    value?: string;
}

interface EliteSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
    disabled?: boolean;
}

export default function EliteSelect({
    options,
    value,
    onChange,
    placeholder,
    className,
    disabled = false
}: EliteSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => (opt.slug || opt.value) === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div 
            ref={containerRef}
            className={cn("relative flex-1 min-w-[100px] sm:min-w-[140px]", className)}
        >
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between gap-2 bg-white/[0.05] border border-white/10 hover:border-white/20 px-3 py-2.5 rounded-[12px] transition-all group",
                    isOpen ? "ring-2 ring-primary/40 border-primary/50" : "",
                    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                )}
            >
                <span className="text-[12px] sm:text-[14px] font-bold text-white/90 truncate">
                    {value === "all" ? placeholder : selectedOption.name}
                </span>
                <ChevronDown className={cn(
                    "w-3.5 h-3.5 text-white/40 transition-transform duration-300",
                    isOpen ? "rotate-180 text-primary" : "group-hover:text-white/60"
                )} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-2 z-[100] bg-[#0c0c14]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                            {options.map((option) => {
                                const optVal = option.slug || option.value || "";
                                const isSelected = optVal === value;
                                return (
                                    <button
                                        key={optVal}
                                        type="button"
                                        onClick={() => {
                                            onChange(optVal);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-[13px] transition-all",
                                            isSelected 
                                                ? "bg-primary/20 text-primary font-bold" 
                                                : "text-white/60 hover:text-white hover:bg-white/5 font-semibold"
                                        )}
                                    >
                                        <span className="truncate">{option.name}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
