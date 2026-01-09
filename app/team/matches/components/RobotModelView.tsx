import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Box, Maximize2, X, Scan, Cpu } from 'lucide-react';
import { useState } from 'react';

interface RobotModelViewProps {
    imageUrl: string;
    competitionName: string;
}

export default function RobotModelView({ imageUrl, competitionName }: RobotModelViewProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="group relative bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-role-primary/10 via-transparent to-role-secondary/10 pointer-events-none" />

                {/* Viewport UI Decorator */}
                <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
                        <Box className="w-5 h-5 text-role-primary" />
                    </div>
                    <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/10">
                        <p className="text-[10px] font-black uppercase text-white/70 tracking-widest mb-0.5">Tactical Map</p>
                        <p className="text-sm font-black text-white uppercase italic tracking-tight">{competitionName}</p>
                    </div>
                </div>

                <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-12 h-12 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-role-primary/20 transition-all cursor-pointer group/btn shadow-xl"
                    >
                        <Maximize2 className="w-6 h-6 text-role-primary transition-transform group-hover/btn:scale-110" />
                    </button>
                </div>

                <div className="relative min-h-[400px] lg:h-[500px] overflow-hidden bg-white flex items-center justify-center p-6 lg:p-10 shadow-inner">
                    <div className="relative w-full h-full">
                        <Image
                            src={imageUrl}
                            alt={competitionName}
                            fill
                            className="object-contain transition-transform duration-700 group-hover:scale-105"
                            priority
                        />
                    </div>

                    {/* Technical Blueprint Overlay - Ultra Subtle */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{
                            backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                        }}
                    />
                </div>
            </motion.div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl p-4 md:p-12 lg:p-20 flex flex-col items-center justify-center"
                    >
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="fixed top-6 right-6 lg:top-10 lg:right-10 z-[10000] w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90 border border-white/20 shadow-2xl backdrop-blur-md"
                        >
                            <X size={20} />
                        </button>

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full h-full max-w-6xl bg-white rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="flex-1 relative p-6 md:p-16">
                                <Image
                                    src={imageUrl}
                                    alt={competitionName}
                                    fill
                                    className="object-contain"
                                    priority
                                />

                                {/* Full Scale Grid Overlay - Subtle */}
                                <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                                    style={{
                                        backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                                        backgroundSize: '100px 100px'
                                    }}
                                />
                                <div className="absolute inset-0 pointer-events-none opacity-[0.01]"
                                    style={{
                                        backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                                        backgroundSize: '20px 20px'
                                    }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
