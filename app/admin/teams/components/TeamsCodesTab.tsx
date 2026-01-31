"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Check, X, Trash2, Shield, LayoutGrid, Lock, Hash
} from 'lucide-react';
import { Team } from '@/lib/teams';
import { deleteTeamFromSupabase, fetchTeamsFromSupabase } from '@/lib/supabaseData';
import { supabase } from '@/lib/supabase';

interface TeamsCodesTabProps {
    teams: Team[];
    setTeams: (teams: Team[]) => void;
}

export default function TeamsCodesTab({ teams, setTeams }: TeamsCodesTabProps) {
    const [newClubName, setNewClubName] = useState('');
    const [showRegisterInput, setShowRegisterInput] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clubCodes, setClubCodes] = useState<Record<string, string>>({});

    const refreshData = async () => {
        const { data: staffCodes } = await supabase
            .from('staff_codes')
            .select('name, code')
            .eq('role', 'team');

        const updatedTeams = await fetchTeamsFromSupabase();
        setTeams(updatedTeams || []);

        if (staffCodes) {
            const codeMap: Record<string, string> = {};
            staffCodes.forEach((sc: any) => {
                if (sc.name) codeMap[sc.name] = sc.code;
            });
            setClubCodes(codeMap);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleConfirmRegistration = async () => {
        if (!newClubName.trim()) return;
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data: existing } = await supabase
                .from('staff_codes')
                .select('code')
                .eq('name', newClubName.trim())
                .eq('role', 'team')
                .maybeSingle();

            if (existing) {
                setErrorMessage('CLUB ALREADY REGISTERED');
                setIsSubmitting(false);
                return;
            }

            const newCode = `CLUB-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            const { error } = await supabase
                .from('staff_codes')
                .insert([{
                    code: newCode,
                    role: 'team',
                    name: newClubName.trim()
                }] as any);

            if (error) throw error;

            setNewClubName('');
            setShowRegisterInput(false);
            setErrorMessage('');
            await refreshData();
        } catch (error: any) {
            alert('REGISTRATION FAILED. DATABASE CONSTRAINT VIOLATION.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCluster = async (clubName: string) => {
        if (confirm(`CRITICAL: PURGE ENTIRE "${clubName.toUpperCase()}" CLUSTER? This erases all tactical nodes and resets the gateway code.`)) {
            try {
                await supabase.from('staff_codes').delete().eq('name', clubName).eq('role', 'team');
                const clubTeams = teams.filter(t => t.club === clubName);
                await Promise.all(clubTeams.map(t => deleteTeamFromSupabase(t.id)));
                await refreshData();
            } catch (error) {
                alert('PURGE PROTOCOL FAILED');
            }
        }
    };

    const allClusters = Array.from(new Set([...Object.keys(clubCodes), ...teams.map(t => t.club)]))
        .filter(name => name && name !== 'Individual / Unassigned')
        .map(name => ({
            name,
            code: clubCodes[name] || 'LEGACY-SYSTEM',
            units: teams.filter(t => t.club === name)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="space-y-6 pb-12">
            {/* COMPACT CONTROL PANEL */}
            <div className="flex items-center justify-between border-b border-card-border pb-6 gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl border border-accent/20 flex items-center justify-center">
                        <LayoutGrid className="text-accent" size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black italic tracking-tight uppercase leading-none">REGISTRY GATES</h2>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">Universal Security Protocol</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!showRegisterInput ? (
                        <button
                            onClick={() => setShowRegisterInput(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-accent text-background rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/20"
                        >
                            <Plus size={16} />
                            REGISTER CLUSTER
                        </button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-muted/10 backdrop-blur-xl border border-card-border p-1.5 rounded-xl flex items-center gap-2 shadow-2xl"
                        >
                            <input
                                type="text"
                                placeholder="CLUSTER NAME..."
                                value={newClubName}
                                onChange={(e) => { setNewClubName(e.target.value); setErrorMessage(''); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirmRegistration()}
                                className="px-3 py-2 bg-background/40 border border-card-border rounded-lg text-[10px] font-bold uppercase outline-none focus:ring-1 focus:ring-accent/50 transition-all placeholder:opacity-20 w-48"
                                autoFocus
                            />
                            <button onClick={handleConfirmRegistration} className="p-2 bg-accent text-background rounded-lg">
                                <Check size={16} />
                            </button>
                            <button onClick={() => { setShowRegisterInput(false); setNewClubName(''); }} className="p-2 bg-card-border/10 rounded-lg text-muted-foreground">
                                <X size={16} />
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* SLEEK ROW-BASED CLUSTERS */}
            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence>
                    {allClusters.map((cluster) => (
                        <motion.div
                            key={cluster.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card/30 backdrop-blur-sm border border-card-border rounded-2xl p-4 flex items-center justify-between gap-6 hover:border-accent/30 transition-all group shadow-sm"
                        >
                            {/* CLUSTER IDENTITY */}
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="w-12 h-12 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center text-accent/40 group-hover:text-accent group-hover:bg-accent/10 transition-all shadow-inner">
                                    <Shield size={22} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-black text-base uppercase italic tracking-tight truncate">{cluster.name}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-muted/30 rounded-md border border-card-border">
                                            <Hash size={10} className="text-muted-foreground/40" />
                                            <span className="text-[9px] font-black text-muted-foreground uppercase">{cluster.units.length} NODES</span>
                                        </div>
                                        <span className="w-1 h-1 bg-muted-foreground/20 rounded-full" />
                                        <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">GATEWAY ACTIVE</span>
                                    </div>
                                </div>
                            </div>

                            {/* ACCESS SECURITY */}
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end gap-1">
                                    <div className="text-[8px] font-black text-accent/40 uppercase tracking-[0.2em] flex items-center gap-1">
                                        <Lock size={10} /> SECURITY KEY
                                    </div>
                                    <div className="px-6 py-2.5 bg-background/40 border border-accent/10 rounded-xl font-mono font-black text-lg text-accent shadow-inner tracking-[0.2em] group-hover:border-accent/30 transition-all">
                                        {cluster.code}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeleteCluster(cluster.name)}
                                    className="p-3 bg-rose-500/5 text-rose-500/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/10 shadow-sm"
                                    title="Purge Cluster"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {allClusters.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-20 italic">
                        <Lock size={40} className="mb-4" />
                        <p className="text-sm font-black uppercase tracking-[0.2em]">No Active Clusters Found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
