"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, Plus, X, Trash2, Edit2, Check } from 'lucide-react';

interface StaffCode {
    id: string;
    role: 'admin' | 'jury';
    name: string;
    code: string;
    competition?: string;
}

const COMPETITION_CATEGORIES = [
    { id: 'junior_line_follower', name: 'Junior Line Follower', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { id: 'junior_all_terrain', name: 'Junior All Terrain', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    { id: 'line_follower', name: 'Line Follower', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 'all_terrain', name: 'All Terrain', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { id: 'fight', name: 'Fight', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

const STORAGE_KEY = 'enstarobots_staff_codes';

const DEFAULT_CODES: StaffCode[] = [
    { id: '1', role: 'admin', name: 'Master Admin', code: 'ADMIN-2024' },
    { id: '2', role: 'jury', name: 'Main Jury', code: 'JURY-2024' },
];

export default function StaffCodesTab() {
    const [codes, setCodes] = useState<StaffCode[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'jury'>('jury');
    const [selectedComp, setSelectedComp] = useState(COMPETITION_CATEGORIES[0].id);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setCodes(JSON.parse(stored));
            } catch {
                setCodes(DEFAULT_CODES);
            }
        } else {
            setCodes(DEFAULT_CODES);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CODES));
        }
    }, []);

    const saveCodes = (newCodes: StaffCode[]) => {
        setCodes(newCodes);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newCodes));
    };

    const handleAdd = () => {
        if (!newName.trim()) return;
        const newCode: StaffCode = {
            id: Math.random().toString(36).substring(2, 9),
            role: newRole,
            name: newName.trim(),
            code: `${newRole.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            competition: newRole === 'jury' ? selectedComp : undefined
        };
        saveCodes([...codes, newCode]);
        setNewName('');
        setShowAdd(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to revoke this access code?')) {
            saveCodes(codes.filter(c => c.id !== id));
        }
    };

    const adminCodes = codes.filter(c => c.role === 'admin');
    const judgeCodes = codes.filter(c => c.role === 'jury');

    const StaffSection = ({ title, staffList, role }: { title: string; staffList: StaffCode[]; role: 'admin' | 'jury' }) => (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
                <div className={`w-1.5 h-5 rounded-full ${role === 'admin' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">{title}</h3>
                <div className="flex-1 h-px bg-card-border opacity-30" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffList.map((staff) => {
                    const compConfig = COMPETITION_CATEGORIES.find(c => c.id === staff.competition);
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
                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                    }`}>
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-sm tracking-tight uppercase text-foreground/90">{staff.name}</div>
                                    {staff.role === 'admin' ? (
                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-40">Admin Privilege</div>
                                    ) : compConfig ? (
                                        <div className={`mt-1 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-lg border inline-block ${compConfig.color}`}>
                                            {compConfig.name}
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
                                            {COMPETITION_CATEGORIES.map(comp => (
                                                <option key={comp.id} value={comp.id}>{comp.name}</option>
                                            ))}
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
