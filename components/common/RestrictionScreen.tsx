"use client";

import { motion } from 'framer-motion';
import { Calendar, Shield } from 'lucide-react';

interface RestrictionScreenProps {
    title?: string;
    message?: string;
}

export default function RestrictionScreen({
    title = "ACCESS RESTRICTED",
    message = "PAGE WILL BE ACCESSIBLE THE EVENT DAY"
}: RestrictionScreenProps) {
    return (
        <div className="min-h-[80vh] py-12 px-6 flex flex-col items-center justify-center">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="w-24 h-24 bg-cyan-500/10 rounded-[2rem] flex items-center justify-center mx-auto ring-1 ring-cyan-500/20">
                    <motion.div
                        animate={{
                            rotateY: [0, 180, 360],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            rotateY: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                            scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                        }}
                    >
                        <Calendar className="w-12 h-12 text-cyan-500" />
                    </motion.div>
                </div>
                <div>
                    <h1 className="text-3xl font-black text-foreground uppercase tracking-tight mb-3 italic">{title}</h1>
                    <div className="inline-block px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-6">
                        <p className="text-cyan-500 font-black text-xs uppercase tracking-[0.2em]">{message}</p>
                    </div>
                    <p className="text-muted-foreground font-medium opacity-70">
                        Tactical modules and live telemetry remain offline until officially synchronized with the primary event sector.
                        Please complete your unit registry in the profile sector while waiting for deployment.
                    </p>
                </div>

                <div className="pt-4">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30">
                        <Shield size={12} />
                        <span>System Standby Mode</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
