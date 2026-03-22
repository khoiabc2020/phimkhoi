"use client";

import Image from "next/image";
import { memo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Actor {
    name: string;
    image: string;
    slug?: string;
}

interface ActorRowProps {
    title: string;
    actors: Actor[];
}

const ActorRow = ({ title, actors }: ActorRowProps) => {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === "left"
                ? scrollLeft - clientWidth / 2
                : scrollLeft + clientWidth / 2;

            rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    if (!actors || actors.length === 0) return null;

    return (
        <section className="py-8 actor-row-section">
            <div className="w-full max-w-[1920px] mx-auto">
                <div className="flex items-center justify-between px-4 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
                        <span className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_12px_rgba(255,215,0,0.5)]" />
                        <span>{title}</span>
                    </h2>
                </div>

                <div className="relative group/row">
                    {/* Navigation Arrows */}
                    <button
                        onClick={() => scroll("left")}
                        className="absolute left-0 top-0 bottom-0 z-40 bg-gradient-to-r from-black via-black/40 to-transparent w-16 md:w-24 flex items-center justify-start pl-4 opacity-0 group-hover/row:opacity-100 transition-all duration-300 pointer-events-none group-hover/row:pointer-events-auto"
                    >
                        <ChevronLeft className="w-10 h-10 text-white drop-shadow-2xl" />
                    </button>

                    <div
                        ref={rowRef}
                        className="flex gap-6 md:gap-8 overflow-x-auto overflow-y-hidden px-4 sm:px-6 md:px-12 lg:pl-24 lg:pr-12 pb-6 no-scrollbar snap-x scroll-smooth"
                    >
                        {actors.map((actor, idx) => (
                            <div 
                                key={idx} 
                                className="flex flex-col items-center gap-3 min-w-[100px] md:min-w-[140px] snap-start group/actor cursor-pointer"
                            >
                                <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-white/10 group-hover/actor:border-primary transition-all duration-300 shadow-xl group-hover/actor:scale-105 group-hover/actor:shadow-primary/20">
                                    <Image
                                        src={actor.image}
                                        alt={actor.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <span className="text-sm md:text-base font-semibold text-white/70 group-hover/actor:text-primary transition-colors text-center truncate w-full">
                                    {actor.name}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => scroll("right")}
                        className="absolute right-0 top-0 bottom-0 z-40 bg-gradient-to-l from-black via-black/40 to-transparent w-16 md:w-24 flex items-center justify-end pr-4 opacity-0 group-hover/row:opacity-100 transition-all duration-300 pointer-events-none group-hover/row:pointer-events-auto"
                    >
                        <ChevronRight className="w-10 h-10 text-white drop-shadow-2xl" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default memo(ActorRow);
