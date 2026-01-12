"use client";

import { motion } from 'framer-motion';
import { Users, Shield, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
    return (
        <div className="min-h-screen py-20 flex flex-col items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
                    Portal Selection
                </h1>
                <p className="text-muted-foreground text-lg">
                    Choose your role to access the appropriate dashboard
                </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
                {/* Team Portal */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Link href="/auth/team" className="group block h-full">
                        <div className="h-full p-8 rounded-2xl bg-card border border-card-border hover:border-accent transition-all hover:shadow-2xl hover:shadow-accent/5 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform">
                                <Users size={32} />
                            </div>
                            <h2 className="text-2xl font-bold mb-3">Team Portal</h2>
                            <p className="text-muted-foreground mb-8">
                                Access your team dashboard, track your matches, and view your scores in real-time.
                            </p>
                            <div className="mt-auto flex items-center gap-2 text-accent font-black uppercase tracking-widest text-sm">
                                Team Login <ArrowRight size={16} />
                            </div>
                        </div>
                    </Link>
                </motion.div>

                {/* Judge/Admin Portal */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Link href="/auth/jury" className="group block h-full">
                        <div className="h-full p-8 rounded-2xl bg-card border border-card-border hover:border-primary transition-all hover:shadow-2xl hover:shadow-primary/5 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                                <Shield size={32} />
                            </div>
                            <h2 className="text-2xl font-bold mb-3">Staff Portal</h2>
                            <p className="text-muted-foreground mb-8">
                                For Juries and Administrators. Manage competitions, input scores, and oversee the event.
                            </p>
                            <div className="mt-auto flex items-center gap-2 text-primary font-black uppercase tracking-widest text-sm">
                                Staff Login <ArrowRight size={16} />
                            </div>
                        </div>
                    </Link>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12"
            >
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                    <span className="text-xl">←</span> Back to home page
                </Link>
            </motion.div>
        </div>
    );
}
