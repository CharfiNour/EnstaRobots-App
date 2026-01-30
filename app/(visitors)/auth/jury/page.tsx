"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Loader2, Shield } from 'lucide-react';
import { loginWithStaffCode, getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JuryLoginPage() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const session = getSession();
        if (session) {
            router.push(session.role === 'admin' ? '/admin' : session.role === 'jury' ? '/jury' : '/team');
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await loginWithStaffCode(code);

        if (result.success && result.session) {
            router.push(result.session.role === 'admin' ? '/admin' : '/jury');
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
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 rounded-full mb-4">
                        <Shield className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Staff Access
                    </h1>
                    <p className="text-muted-foreground">
                        Enter your secure access code
                    </p>
                </motion.div>

                {/* Login Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-card-border rounded-xl p-8 shadow-md shadow-black/[0.03]"
                >
                    <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
                        <div>
                            <label htmlFor="staff-auth-token" className="block text-sm font-medium text-foreground/80 mb-2">
                                Access Code
                            </label>
                            <input
                                id="staff-auth-token"
                                name="staff-auth-token"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="e.g. JURY-1234"
                                className="w-full px-4 py-3 bg-muted/50 border border-card-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all uppercase tracking-widest font-mono"
                                required
                                disabled={loading}
                                autoComplete="new-password"
                                spellCheck={false}
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
                            disabled={loading || !code.trim()}
                            className="w-full px-6 py-3 bg-accent text-background rounded-lg font-bold text-lg shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Authenticate
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-card-border">
                        <div className="flex items-center justify-between text-sm">
                            <Link href="/auth/team" className="text-accent hover:underline">
                                Team Login
                            </Link>
                            <Link href="/" className="text-muted-foreground hover:text-foreground">
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
                    className="mt-6 p-4 bg-muted border border-card-border/50 rounded-lg shadow-sm"
                >
                    <p className="text-sm text-muted-foreground text-center">
                        <strong className="text-foreground">Note:</strong> Jury and Admin credentials are provided by event organizers.
                        Contact support if you need assistance.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
