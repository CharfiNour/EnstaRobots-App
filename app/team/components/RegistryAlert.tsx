"use client";

import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RegistryAlert() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 group p-5 bg-gradient-to-br from-amber-500/10 to-amber-500/[0.02] border border-amber-500/20 rounded-[2rem] flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden w-full"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>
            <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 text-center sm:text-left">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:rotate-12 transition-transform">
                    <AlertCircle size={28} />
                </div>
                <div>
                    <h3 className="font-black text-lg text-foreground uppercase tracking-tight mb-1">Registry Incomplete</h3>
                </div>
            </div>
            <Link
                href="/team/profile"
                className="px-8 py-3 bg-amber-500 text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl shadow-amber-500/20 hover:bg-amber-400 hover:scale-105 transition-all shrink-0 flex items-center gap-2 relative z-10 w-full sm:w-auto justify-center"
            >
                Complete Registry
                <ArrowRight size={16} />
            </Link>
        </motion.div>
    );
}
