"use client";

import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RegistryAlert() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 group p-6 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>
            <div className="flex items-center gap-6 relative z-10 text-center md:text-left">
                <div className="w-16 h-16 rounded-[1.2rem] bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                    <AlertCircle size={32} />
                </div>
                <div>
                    <h3 className="font-black text-xl text-foreground uppercase tracking-tight mb-1">Registry Incomplete</h3>
                    <p className="text-muted-foreground text-sm font-medium">Your node visual data and roster are missing. Complete the registry to sync with global rankings.</p>
                </div>
            </div>
            <Link
                href="/team/profile"
                className="px-10 py-4 bg-amber-500 text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-amber-500/20 hover:bg-amber-400 hover:scale-105 transition-all shrink-0 flex items-center gap-3 relative z-10"
            >
                Complete Registry
                <ArrowRight size={18} />
            </Link>
        </motion.div>
    );
}
