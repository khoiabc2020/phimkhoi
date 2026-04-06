"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
    const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const selectedOption = options.find(opt => (opt.slug || opt.value) === value) || options[0];

    const updateRect = useCallback(() => {
        if (buttonRef.current) {
            const r = buttonRef.current.getBoundingClientRect();
            setDropdownRect({ top: r.bottom + 6, left: r.left, width: r.width });
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        updateRect();

        const handleClose = (e: MouseEvent | TouchEvent) => {
            if (
                containerRef.current && !containerRef.current.contains(e.target as Node) &&
                !(e.target as Element)?.closest?.('[data-elite-dropdown]')
            ) {
                setIsOpen(false);
            }
        };
        const handleScroll = () => updateRect();

        document.addEventListener("mousedown", handleClose);
        document.addEventListener("touchstart", handleClose);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleScroll);

        return () => {
            document.removeEventListener("mousedown", handleClose);
            document.removeEventListener("touchstart", handleClose);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleScroll);
        };
    }, [isOpen, updateRect]);

    const dropdown = mounted && isOpen && dropdownRect && (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    data-elite-dropdown
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.13, ease: "easeOut" }}
                    style={{
                        position: "fixed",
                        top: dropdownRect.top,
                        left: dropdownRect.left,
                        width: dropdownRect.width,
                        zIndex: 99999,
                    }}
                    className="bg-[#0c0c14]/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                >
                    <div className="max-h-[260px] overflow-y-auto custom-scrollbar p-1">
                        {options.map((option) => {
                            const optVal = option.slug || option.value || "";
                            const isSelected = optVal === value;
                            return (
                                <button
                                    key={optVal}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onChange(optVal);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[13px] transition-all",
                                        isSelected
                                            ? "bg-primary/20 text-primary font-bold"
                                            : "text-white/60 hover:text-white hover:bg-white/5 font-semibold"
                                    )}
                                >
                                    <span className="truncate">{option.name}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div
            ref={containerRef}
            className={cn("relative flex-1 min-w-[100px] sm:min-w-[140px]", className)}
        >
            <button
                ref={buttonRef}
                type="button"
                onClick={() => {
                    if (disabled) return;
                    if (!isOpen) updateRect();
                    setIsOpen(v => !v);
                }}
                className={cn(
                    "w-full flex items-center justify-between gap-2 bg-white/[0.05] border border-white/10 hover:border-white/20 px-3 py-2.5 rounded-[12px] transition-all group",
                    isOpen ? "ring-2 ring-primary/40 border-primary/50" : "",
                    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                )}
            >
                <span className="text-[12px] sm:text-[14px] font-bold text-white/90 truncate">
                    {value === "all" ? placeholder : selectedOption?.name ?? placeholder}
                </span>
                <ChevronDown className={cn(
                    "w-3.5 h-3.5 text-white/40 transition-transform duration-300 shrink-0",
                    isOpen ? "rotate-180 text-primary" : "group-hover:text-white/60"
                )} />
            </button>

            {mounted && typeof document !== "undefined" && createPortal(dropdown, document.body)}
        </div>
    );
}
