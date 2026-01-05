"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Loader2, Shield } from 'lucide-react';
import { loginWithTeamCode } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TeamLoginPage() {
    const [teamCode, setTeamCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await loginWithTeamCode(teamCode);

        if (result.success) {
            router.push('/team');
        } else {
            setError(result.error || 'Login failed');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-accent)]/20 rounded-full mb-4">
                        <Shield className="w-8 h-8 text-[var(--color-accent)]" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Team Login
                    </h1>
                    <p className="text-gray-400">
                        Enter your team code provided by organizers
                    </p>
                </motion.div>

                {/* Login Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl p-8"
                >
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="teamCode" className="block text-sm font-medium text-gray-300 mb-2">
                                Team Code
                            </label>
                            <input
                                id="teamCode"
                                type="text"
                                value={teamCode}
                                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                                placeholder="TEAM-XXXX-XXXX"
                                className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all font-mono text-center text-lg tracking-wider"
                                required
                                disabled={loading}
                                autoComplete="off"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !teamCode.trim()}
                            className="w-full px-6 py-3 bg-[var(--color-accent)] text-[var(--background)] rounded-lg font-bold text-lg shadow-lg shadow-[var(--color-accent)]/50 hover:shadow-[var(--color-accent)]/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Login
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-[var(--color-card-border)]">
                        <p className="text-center text-sm text-gray-400">
                            Don't have a team code?{' '}
                            <Link href="/" className="text-[var(--color-accent)] hover:underline">
                                Back to Home
                            </Link>
                        </p>
                    </div>
                </motion.div>

                {/* Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg"
                >
                    <p className="text-sm text-gray-400 text-center">
                        <strong className="text-white">Note:</strong> Team codes are provided by event organizers.
                        Contact support if you haven't received yours.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
