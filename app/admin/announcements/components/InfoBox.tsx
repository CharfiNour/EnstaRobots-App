"use client";

import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';

export default function InfoBox() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-4 items-start backdrop-blur-sm"
        >
            <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                <Radio size={20} className="text-blue-500" />
            </div>
            <div>
                <h4 className="text-sm font-black uppercase tracking-wide text-blue-500 mb-1">Live Broadcast System</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Announcements are pushed in real-time to all connected users matching your visibility criteria.
                    Users will immediately see a notification banner at the top of their dashboard.
                </p>
            </div>
        </motion.div>
    );
}
