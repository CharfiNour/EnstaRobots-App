"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, Plus, X, Trash2, Edit2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchCompetitionsFromSupabase } from '@/lib/supabaseData';

interface StaffCode {
    id: string;
    role: 'admin' | 'jury' | 'homologation_jury';
    name: string;
    code: string;
    competition?: string;
    competition_name?: string;
}

const COMPETITION_CATEGORIES = [
    { id: 'junior_line_follower', name: 'Junior Line Follower', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    { id: 'junior_all_terrain', name: 'Junior All Terrain', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { id: 'line_follower', name: 'Line Follower', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { id: 'all_terrain', name: 'All Terrain', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
];

const STORAGE_KEY = 'enstarobots_staff_codes';

const DEFAULT_CODES: StaffCode[] = [];


export default function StaffCodesTab() {
    const [codes, setCodes] = useState<StaffCode[]>([]);
    const [realCompetitions, setRealCompetitions] = useState<any[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'jury' | 'homologation_jury'>('jury');
    const [selectedComp, setSelectedComp] = useState('');
    const [dbMissing, setDbMissing] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        // Cleanup legacy storage
        if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);

        // Load real competitions first
        const comps = await fetchCompetitionsFromSupabase();
        setRealCompetitions(comps);
        if (comps.length > 0) {
            setSelectedComp(comps[0].id);
        }

        // Then load codes
        loadCodesFromSupabase();
    };

    const loadCodesFromSupabase = async () => {
        try {
            const { data, error } = await supabase
                .from('staff_codes')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error loading staff codes:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));

                // Check if it's a "table doesn't exist" error
                const errorMessage = error.message || '';
                const errorCode = (error as any).code || '';

                if (errorMessage.includes('relation') && errorMessage.includes('does not exist') || errorCode === '42P01') {
                    console.warn('⚠️ staff_codes table does not exist in Supabase!');
                    setDbMissing(true);
                }

                setCodes(DEFAULT_CODES);
                return;
            }

            if (data && data.length > 0) {
                const formattedCodes: StaffCode[] = data.map((item: any) => ({
                    id: item.id,
                    role: item.role as 'admin' | 'jury',
                    name: item.name,
                    code: item.code,
                    competition: item.competition_id || undefined,
                    competition_name: item.competition_name || undefined
                }));
                setCodes(formattedCodes);
            } else {
                setCodes(DEFAULT_CODES);
            }
        } catch (err) {
            console.error('Exception loading staff codes:', err);
            setCodes(DEFAULT_CODES);
        }
    };

    const saveCodes = (newCodes: StaffCode[]) => {
        setCodes(newCodes);
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;

        const generatedCode = `${newRole.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        try {
            // Find competition details for jury
            const comp = newRole === 'jury' ? realCompetitions.find(c => c.id === selectedComp) : null;

            const { data, error } = await supabase
                .from('staff_codes')
                .insert({
                    role: newRole,
                    name: newName.trim(),
                    code: generatedCode,
                    competition_id: newRole === 'jury' ? selectedComp : null, // This is now the real UUID
                    competition_name: comp?.name || undefined
                } as any)
                .select()
                .single();

            if (error) {
                console.error('Error creating staff code:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
                const errorMsg = error.message || 'Unknown error';
                const errorCode = (error as any).code || '';
                alert(`Failed to create staff code.\n\nError: ${errorMsg}\n${errorCode ? `Code: ${errorCode}` : ''}\n\nCheck browser console for details.`);
                return;
            }

            if (data) {
                const staffCodeData = data as any;
                const newCode: StaffCode = {
                    id: staffCodeData.id,
                    role: staffCodeData.role as 'admin' | 'jury' | 'homologation_jury',
                    name: staffCodeData.name,
                    code: staffCodeData.code,
                    competition: staffCodeData.competition_id || undefined,
                    competition_name: staffCodeData.competition_name || undefined
                };

                const updatedCodes = [...codes, newCode];
                saveCodes(updatedCodes);
                setNewName('');
                setShowAdd(false);
            }
        } catch (err) {
            console.error('Exception creating staff code:', err);
            alert('An error occurred while creating the staff code.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this access code?')) return;

        try {
            // Delete from Supabase
            const { error } = await supabase
                .from('staff_codes')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting staff code:', error);
                alert('Failed to delete staff code. Please try again.');
                return;
            }

            // Update local state
            const updatedCodes = codes.filter(c => c.id !== id);
            saveCodes(updatedCodes);
        } catch (err) {
            console.error('Exception deleting staff code:', err);
            alert('An error occurred while deleting the staff code.');
        }
    };

    const adminCodes = codes.filter(c => c.role === 'admin');
    const judgeCodes = codes.filter(c => c.role === 'jury' || c.role === 'homologation_jury');

    const StaffSection = ({ title, staffList, role }: { title: string; staffList: StaffCode[]; role: 'admin' | 'jury' }) => (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
                <div className={`w-1.5 h-5 rounded-full ${role === 'admin' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">{title}</h3>
                <div className="flex-1 h-px bg-card-border opacity-30" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffList.map((staff) => {
                    // 1. Find the actual competition row from state
                    const realComp = realCompetitions.find(rc => rc.id === staff.competition);
                    // 2. Map the comp type/category to our UI config for colors
                    const compType = realComp?.type || staff.competition;
                    const compConfig = COMPETITION_CATEGORIES.find(c => c.id === compType);

                    return (
                        <motion.div
                            key={staff.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-card/40 backdrop-blur-md border border-card-border p-4 rounded-2xl flex items-center justify-between group hover:border-accent/40 transition-all shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${staff.role === 'admin'
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                    : staff.role === 'homologation_jury'
                                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-500'
                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                    }`}>
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-sm tracking-tight uppercase text-foreground/90">{staff.name.split('(')[0].trim()}</div>
                                    {staff.role === 'admin' ? (
                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-40">Admin Privilege</div>
                                    ) : (staff.competition_name || compConfig) ? (
                                        <div className={`mt-1 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-lg border inline-block ${compConfig?.color || 'bg-muted text-muted-foreground border-card-border'}`}>
                                            {staff.competition_name || compConfig?.name || 'Assigned Sector'}
                                        </div>
                                    ) : (
                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-40">Jury Privilege</div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-muted/50 px-4 py-2 rounded-lg font-mono font-bold text-xs text-foreground/60 border border-card-border shadow-inner tracking-wider">
                                    {staff.code}
                                </div>
                                <button
                                    onClick={() => handleDelete(staff.id)}
                                    className="p-2 text-muted-foreground/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            {staffList.length === 0 && (
                <div className="text-center py-6 border border-dashed border-card-border rounded-2xl opacity-40">
                    <p className="text-[10px] font-bold uppercase tracking-widest">No terminal nodes assigned</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between border-b border-card-border pb-6">
                <div>
                    <h2 className="text-xl font-bold italic uppercase">Staff Access Authority</h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                        Manage Administrative and Judicial security protocols
                    </p>
                </div>

                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-accent text-background rounded-xl font-bold text-[10px] uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/20"
                >
                    <Plus size={14} />
                    New Staff Node
                </button>
            </div>

            {dbMissing && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-6 backdrop-blur-sm"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-black uppercase tracking-wide text-amber-500 mb-2">
                                Database Table Missing
                            </h3>
                            <p className="text-xs text-foreground/70 mb-3 leading-relaxed">
                                The <code className="px-2 py-0.5 bg-background/40 rounded border border-card-border font-mono text-[10px]">staff_codes</code> table doesn't exist in your Supabase database yet.
                                <br />
                                Staff codes are currently stored in localStorage only. To enable full functionality, you need to run the SQL migration.
                            </p>
                            <div className="flex items-center gap-3">
                                <a
                                    href="/STAFF_CODE_FIX_SUMMARY.md"
                                    target="_blank"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-background rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-amber-600 transition-colors"
                                >
                                    <span>📖</span>
                                    View Setup Instructions
                                </a>
                                <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                                    See: supabase/migrations/add_staff_codes_table.sql
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {showAdd && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col lg:flex-row items-center gap-4 mb-10"
                >
                    {/* Main Input Container */}
                    <div className="flex-1 w-full bg-muted/20 backdrop-blur-xl border border-card-border px-6 py-5 lg:px-8 lg:py-6 rounded-[2rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-6 items-end">
                            {/* Identity Section */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 ml-1">Designation node</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="ENTER OPERATOR NAME"
                                    className="w-full px-5 py-3 bg-background/40 border border-card-border rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:opacity-20 shadow-inner"
                                    autoFocus
                                />
                            </div>

                            {/* Protocol Section (Inlined Selectors) */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 ml-1">Security protocol & sector</label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value as any)}
                                        className="flex-1 px-5 py-3 bg-background/40 border border-card-border rounded-xl text-xs font-bold uppercase outline-none cursor-pointer hover:bg-background/60 transition-all appearance-none text-center"
                                    >
                                        <option value="jury">Jury</option>
                                        <option value="homologation_jury">Homologation Jury</option>
                                        <option value="admin">System Admin</option>
                                    </select>

                                    {newRole === 'jury' ? (
                                        <motion.select
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            value={selectedComp}
                                            onChange={(e) => setSelectedComp(e.target.value)}
                                            className="flex-[1.5] px-5 py-3 bg-background/40 border border-card-border rounded-xl text-xs font-bold uppercase outline-none cursor-pointer hover:bg-background/60 transition-all appearance-none text-center"
                                        >
                                            {realCompetitions.map(comp => (
                                                <option key={comp.id} value={comp.id}>{comp.name}</option>
                                            ))}
                                            {realCompetitions.length === 0 && (
                                                <option value="" disabled>No Units Found</option>
                                            )}
                                        </motion.select>
                                    ) : (
                                        <div className="flex-[1.5] px-5 py-3 bg-background/10 border border-dashed border-card-border rounded-xl text-[10px] font-bold uppercase text-muted-foreground/30 flex items-center justify-center italic tracking-widest">
                                            Clearance: Global
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* External Control Group */}
                    <div className="flex lg:flex-col gap-2 shrink-0">
                        <button
                            onClick={handleAdd}
                            className="w-10 h-10 flex items-center justify-center bg-accent text-background rounded-xl shadow-lg shadow-accent/20 hover:scale-110 active:scale-95 transition-all group"
                            title="Confirm Node"
                        >
                            <Check size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={() => setShowAdd(false)}
                            className="w-10 h-10 flex items-center justify-center bg-card-border/10 border border-card-border rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 active:scale-95 transition-all group"
                            title="Cancel Protocol"
                        >
                            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>
                </motion.div>
            )}

            <div className="space-y-12">
                <StaffSection title="Administrative Authority" staffList={adminCodes} role="admin" />
                <StaffSection title="Judicial Authority" staffList={judgeCodes} role="jury" />
            </div>
        </div>
    );
}
