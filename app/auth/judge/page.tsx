"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Loader2, Shield } from 'lucide-react';
import { loginWithEmail } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JudgeLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await loginWithEmail(email, password);

        if (result.success && result.session?.role === 'judge') {
            router.push('/judge');
        } else if (result.success && result.session?.role === 'admin') {
            router.push('/admin');
        } else {
            setError(result.error || 'Invalid credentials or insufficient permissions');
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
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
                        <Shield className="w-8 h-8 text-purple-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Judge & Admin Login
                    </h1>
                    <p className="text-gray-400">
                        Sign in with your credentials
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
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="judge@enstarobots.com"
                                className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                required
                                disabled={loading}
                                autoComplete="email"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                required
                                disabled={loading}
                                autoComplete="current-password"
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
                            disabled={loading || !email.trim() || !password.trim()}
                            className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg font-bold text-lg shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-[var(--color-card-border)]">
                        <div className="flex items-center justify-between text-sm">
                            <Link href="/auth/team" className="text-[var(--color-accent)] hover:underline">
                                Team Login
                            </Link>
                            <Link href="/" className="text-gray-400 hover:text-gray-300">
                                Back to Home
                            </Link>
                        </div>
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
                        <strong className="text-white">Note:</strong> Judge and Admin credentials are provided by event organizers.
                        Contact support if you need assistance.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
