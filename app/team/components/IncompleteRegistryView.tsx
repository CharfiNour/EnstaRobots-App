"use client";

import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function IncompleteRegistryView() {
    return (
        <div className="w-full py-10">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group p-8 bg-gradient-to-br from-amber-500/10 to-amber-500/[0.02] border border-amber-500/20 rounded-[2.5rem] flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden w-full shadow-2xl shadow-amber-500/5"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[100px] rounded-full -mr-48 -mt-48 transition-all group-hover:bg-amber-500/10"></div>

                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 text-center md:text-left">
                    <div className="w-20 h-20 shrink-0 rounded-3xl bg-amber-500 text-white flex items-center justify-center shadow-xl shadow-amber-500/30 group-hover:rotate-12 transition-transform duration-500 border-4 border-white/20">
                        <AlertCircle size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="font-black text-2xl text-foreground uppercase tracking-tighter mb-1 italic">Registry Incomplete</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Complete your tactical profile to unlock full console telemetry</p>
                    </div>
                </div>

                <Link
                    href="/team/profile"
                    className="px-10 py-4 bg-amber-500 text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-amber-500/30 hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-3 relative z-10 w-full lg:w-auto justify-center"
                >
                    Complete Registry
                    <ArrowRight size={18} strokeWidth={3} />
                </Link>
            </motion.div>
        </div>
    );
}
