"use client";

import { motion } from 'framer-motion';

export function LiveBadge({ size = "sm" }: { size?: "sm" | "lg" }) {
    const dotSize = size === "lg" ? "h-2 w-2" : "h-1.5 w-1.5";
    const padding = size === "lg" ? "px-4 py-2" : "px-3 py-1";
    const textSize = size === "lg" ? "text-[10px]" : "text-[10px]";

    return (
        <div className={`flex items-center gap-2 ${padding} bg-red-500/10 border border-red-500/20 rounded-full shrink-0`}>
            <span className={`relative flex ${dotSize}`}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className={`relative inline-flex rounded-full ${dotSize} bg-red-500`}></span>
            </span>
            <span className={`text-red-400 font-semibold ${textSize} uppercase tracking-wider`}>Live</span>
        </div>
    );
}
