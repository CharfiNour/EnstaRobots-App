"use client";

import { motion } from 'framer-motion';
import { FileText, ExternalLink } from 'lucide-react';

interface PdfViewerProps {
    pdfUrl: string;
    title: string;
}

export default function PdfViewer({ pdfUrl, title }: PdfViewerProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col h-[80px] bg-card border border-card-border rounded-[2rem] overflow-hidden shadow-2xl relative"
        >
            <div className="p-5 border-b border-card-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-role-primary/10 flex items-center justify-center text-role-primary">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{title}</h3>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Technical Specification</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-muted/50 rounded-lg text-muted-foreground transition-all"
                        title="Open in new tab"
                    >
                        <ExternalLink size={18} />
                    </a>
                </div>
            </div>

            <div className="flex-1 bg-[#2a2a2e] relative">
                <iframe
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full border-none"
                    title={title}
                />

                {/* HUD Decorator */}
                <div className="absolute top-4 right-4 pointer-events-none opacity-40">
                    <div className="w-16 h-1 bg-role-primary/30 rounded-full mb-1" />
                    <div className="w-10 h-1 bg-role-primary/20 rounded-full mb-1" />
                </div>
            </div>

            <div className="p-3 text-center bg-muted/10 border-t border-card-border">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">End of Visual Fragment</p>
            </div>
        </motion.div>
    );
}
