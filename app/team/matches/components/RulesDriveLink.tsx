"use client";

import { motion } from 'framer-motion';
import { Database, ExternalLink, HardDrive } from 'lucide-react';

interface RulesDriveLinkProps {
    driveUrl: string;
    title: string;
    subtitle?: string;
}

export default function RulesDriveLink({ driveUrl, title, subtitle = "Official Documentation Repository" }: RulesDriveLinkProps) {
    return (
        <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
        >
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="bg-card hover:bg-muted/40 border border-card-border hover:border-role-primary/30 rounded-[2rem] p-4 shadow-sm transition-all relative overflow-hidden group/card"
            >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Database size={100} className="transform rotate-12 -mr-10 -mt-10" />
                </div>

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-role-primary/20 to-role-primary/5 border border-role-primary/20 flex items-center justify-center text-role-primary shadow-lg shadow-role-primary/5 group-hover/card:scale-110 transition-transform duration-300">
                            <HardDrive className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight group-hover/card:text-role-primary transition-colors">
                                {title}
                            </h3>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {subtitle}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pr-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/0 group-hover/card:text-muted-foreground transition-all translate-x-4 group-hover/card:translate-x-0 hidden sm:block">
                            Access Drive
                        </span>
                        <div className="w-9 h-9 rounded-full bg-muted/50 border border-card-border flex items-center justify-center group-hover/card:bg-role-primary group-hover/card:text-white group-hover/card:border-role-primary transition-all shadow-sm">
                            <ExternalLink size={16} />
                        </div>
                    </div>
                </div>

                {/* Loading Bar Decoration */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-muted/30">
                    <div className="h-full bg-role-primary/50 w-[30%] group-hover/card:w-full transition-all duration-700 ease-in-out" />
                </div>
            </motion.div>
        </a>
    );
}
