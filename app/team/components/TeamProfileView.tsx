"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Camera, Plus, Trash2, Crown, CheckCircle,
    Image as ImageIcon, Upload, ShieldCheck, Lock,
    Cpu, Info, Users, Settings, Zap, Globe, Box, Target, ChevronRight
} from 'lucide-react';
import { updateTeam, updateClubLogo, Team } from '@/lib/teams';

const COMPETITION_CONFIG: Record<string, { name: string, color: string, icon: any }> = {
    junior_line_follower: { name: 'Junior Line Follower', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: Zap },
    junior_all_terrain: { name: 'Junior All Terrain', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', icon: Globe },
    line_follower: { name: 'Line Follower', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Box },
    all_terrain: { name: 'All Terrain', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', icon: Globe },
    fight: { name: 'Fight', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: Target },
};

interface TeamProfileViewProps {
    team: Team | null;
    onUpdate: (updatedTeam: Team) => void;
    isAdmin: boolean;
}

export default function TeamProfileView({ team, onUpdate, isAdmin }: TeamProfileViewProps) {
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'crew'>('info');
    const [visualsLocked, setVisualsLocked] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const robotInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        robotName: '',
        club: '',
        university: '',
        competition: '',
        logo: '',
        photo: '',
        members: [{ name: '', role: 'Member', isLeader: false }]
    });

    useEffect(() => {
        if (team) {
            setFormData({
                robotName: team.robotName || team.name || '',
                club: team.club || '',
                university: team.university || '',
                competition: team.competition || '',
                logo: team.logo || '',
                photo: team.photo || '',
                members: team.members.length > 0
                    ? team.members.map(m => ({ ...m, isLeader: !!m.isLeader }))
                    : [{ name: '', role: 'Member', isLeader: false }]
            });
            setVisualsLocked(!!team.visualsLocked);
        }
    }, [team]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'robot') => {
        if (visualsLocked && !isAdmin) return;
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setFormData(prev => ({ ...prev, [type === 'logo' ? 'logo' : 'photo']: base64String }));

            if (type === 'logo') {
                updateClubLogo(formData.club, base64String);
            } else {
                updateTeam(team!.id, { photo: base64String });
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        };
        reader.readAsDataURL(file);
    };

    const handleLockVisuals = () => {
        if (!formData.photo || !formData.logo) {
            alert("Please upload both a robot photo and club logo before confirming.");
            return;
        }
        if (confirm("Are you sure? Once confirmed, you will no longer be able to modify your robot photo or club logo.")) {
            updateTeam(team!.id, { visualsLocked: true });
            setVisualsLocked(true);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };

    const handleSaveProfile = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!team) return;
        setLoading(true);

        try {
            updateTeam(team.id, {
                robotName: formData.robotName,
                club: formData.club,
                university: formData.university,
                competition: formData.competition,
                members: formData.members,
                name: formData.robotName || `Team ${team.id}`,
                isPlaceholder: false
            });
            setIsEditing(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);

            // Trigger refresh in parent
            onUpdate({
                ...team,
                robotName: formData.robotName,
                club: formData.club,
                university: formData.university,
                competition: formData.competition,
                members: formData.members,
                name: formData.robotName || `Team ${team.id}`,
                isPlaceholder: false
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addMember = () => {
        setFormData({
            ...formData,
            members: [...formData.members, { name: '', role: 'Member', isLeader: false }]
        });
    };

    const removeMember = (index: number) => {
        const newMembers = formData.members.filter((_, i) => i !== index);
        setFormData({ ...formData, members: newMembers });
    };

    const updateMember = (index: number, field: string, value: any) => {
        const newMembers = formData.members.map((m, i) => {
            if (i === index) {
                return { ...m, [field]: value };
            }
            if (field === 'isLeader' && value === true) return { ...m, isLeader: false };
            return m;
        });
        setFormData({ ...formData, members: newMembers });
    };

    if (!team) {
        return (
            <div className="flex items-center justify-center p-20 opacity-40">
                <div className="text-center">
                    <User size={64} className="mx-auto mb-4" />
                    <p className="font-bold uppercase tracking-widest text-sm">Select a team to view profile</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2.5rem] bg-gradient-to-br from-role-primary to-role-secondary p-[2px] shadow-2xl">
                            <div className="w-full h-full bg-card rounded-[calc(1.5rem-2px)] md:rounded-[calc(2.5rem-2px)] flex items-center justify-center">
                                <User className="text-role-primary w-6 h-6 md:w-8 md:h-8" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter uppercase leading-none mb-1 md:mb-2">Team Profile</h1>
                        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Identity & Hardware Specs</p>
                    </div>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => {
                            if (isEditing) handleSaveProfile();
                            else setIsEditing(true);
                        }}
                        className={`min-h-[44px] flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${isEditing
                            ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                            : 'bg-role-primary text-white shadow-role-primary/20 hover:scale-105 active:scale-95'}`}
                    >
                        {isEditing ? <CheckCircle size={14} /> : <Settings size={14} />}
                        {isEditing ? 'Save Changes' : 'Edit Specs'}
                    </button>
                )}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-card border border-card-border rounded-[2rem] overflow-hidden shadow-2xl group relative">
                        <div className="aspect-[4/5] relative bg-muted flex items-center justify-center overflow-hidden">
                            {formData.photo ? (
                                <img
                                    src={formData.photo}
                                    alt="Robot"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="text-center p-8 opacity-40">
                                    <Cpu size={60} className="mx-auto mb-4 text-muted-foreground" />
                                    <p className="font-bold uppercase tracking-tighter text-xs">Photo Missing</p>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                            {(!visualsLocked || isAdmin) && isEditing && (
                                <button
                                    onClick={() => robotInputRef.current?.click()}
                                    className="absolute bottom-6 right-6 p-4 bg-role-primary text-white rounded-2xl shadow-xl hover:scale-110 transition-all"
                                >
                                    <Camera size={18} />
                                </button>
                            )}

                            <div className="absolute bottom-6 left-8 right-16">
                                <h2 className="text-2xl font-black text-white tracking-tighter leading-none pr-4">
                                    {formData.robotName || 'Unnamed Unit'}
                                </h2>
                                <p className="text-role-primary font-black text-[10px] uppercase tracking-widest mt-2 px-2 py-0.5 bg-role-primary/20 backdrop-blur-md rounded-full w-fit">
                                    Active Chassis
                                </p>
                            </div>

                            {visualsLocked && (
                                <div className="absolute top-6 right-6 p-2 bg-emerald-500/80 backdrop-blur-md text-white rounded-xl shadow-lg flex items-center gap-2">
                                    <Lock size={14} />
                                    <span className="text-[10px] font-black uppercase">Visuals Locked</span>
                                </div>
                            )}
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-card-border relative overflow-hidden group/logo">
                                    {formData.logo ? (
                                        <img src={formData.logo} alt="Club" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="text-muted-foreground" size={20} />
                                    )}
                                    {(!visualsLocked || isAdmin) && isEditing && (
                                        <button
                                            onClick={() => logoInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center text-white"
                                        >
                                            <Upload size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Affiliated Club</p>
                                    <p className="font-bold text-sm text-foreground leading-none truncate">{formData.club || 'No Club'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Specs */}
                <div className="space-y-6">
                    <div className="flex p-1 bg-card/60 backdrop-blur-md border border-card-border rounded-2xl gap-1 shadow-lg">
                        {[
                            { id: 'info', label: 'Info', icon: Info },
                            { id: 'crew', label: 'Crew', icon: Users }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-role-primary to-role-secondary text-white shadow-lg'
                                    : 'text-muted-foreground hover:bg-muted/50'}`}
                            >
                                <tab.icon size={14} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-3xl p-8 min-h-[400px] shadow-2xl">
                        {activeTab === 'info' && (
                            <div className="space-y-8">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-role-primary flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-role-primary rounded-full"></div>
                                    Technical Specs
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground opacity-60 ml-1">Robot Model</label>
                                        <input
                                            type="text"
                                            readOnly={!isEditing}
                                            value={formData.robotName}
                                            onChange={(e) => setFormData({ ...formData, robotName: e.target.value })}
                                            className={`w-full px-5 py-3 rounded-xl text-lg font-bold transition-all border ${isEditing ? 'bg-muted/30 border-role-primary/30' : 'bg-muted/10 border-muted-foreground/10 cursor-default'}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground opacity-60 ml-1">Club Name</label>
                                        <input
                                            type="text"
                                            readOnly={!isEditing}
                                            value={formData.club}
                                            onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                                            className={`w-full px-5 py-3 rounded-xl text-sm font-bold transition-all border ${isEditing ? 'bg-muted/30 border-role-primary/30' : 'bg-muted/10 border-muted-foreground/10 cursor-default'}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground opacity-60 ml-1">University</label>
                                        <input
                                            type="text"
                                            readOnly={!isEditing}
                                            value={formData.university}
                                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                            className={`w-full px-5 py-3 rounded-xl text-sm font-bold transition-all border ${isEditing ? 'bg-muted/30 border-role-primary/30' : 'bg-muted/10 border-muted-foreground/10 cursor-default'}`}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground opacity-60 ml-1">Mission Protocol</label>
                                        {isEditing ? (
                                            <select
                                                value={formData.competition}
                                                onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                                                className="w-full px-5 py-3 bg-muted/30 border border-role-primary/30 rounded-xl text-sm font-bold text-foreground"
                                            >
                                                <option value="" disabled>Select Protocol</option>
                                                {Object.entries(COMPETITION_CONFIG).map(([val, cfg]) => (
                                                    <option key={val} value={val}>{cfg.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className={`w-fit px-4 py-2 rounded-xl font-black uppercase text-xs tracking-widest border ${formData.competition ? COMPETITION_CONFIG[formData.competition].color : 'bg-muted/20 border-muted-foreground/10 text-muted-foreground opacity-40'}`}>
                                                {formData.competition ? COMPETITION_CONFIG[formData.competition].name : 'NOT DEPLOYED'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'crew' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-role-primary flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-role-primary rounded-full"></div>
                                        Unit Crew
                                    </h3>
                                    {isEditing && (
                                        <button
                                            onClick={addMember}
                                            className="px-4 py-2 bg-role-primary text-white rounded-lg shadow-lg text-[10px] font-black uppercase tracking-widest"
                                        >
                                            <Plus size={14} /> Add Unit
                                        </button>
                                    )}
                                </div>

                                <div className="grid gap-4">
                                    {formData.members.map((member, index) => (
                                        <div key={index} className="px-4 py-3 rounded-2xl bg-muted/20 border border-card-border flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${member.isLeader ? 'bg-yellow-400 text-slate-900' : 'bg-card text-muted-foreground'}`}>
                                                {member.isLeader ? <Crown size={15} /> : <span className="text-xs font-bold uppercase">{member.name.charAt(0) || '?'}</span>}
                                            </div>
                                            <div className="flex-1 flex items-center gap-4">
                                                <input
                                                    className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-foreground"
                                                    value={member.name}
                                                    placeholder="Member Name"
                                                    readOnly={!isEditing}
                                                    onChange={(e) => updateMember(index, 'name', e.target.value)}
                                                />
                                                <input
                                                    className="bg-transparent border-none outline-none text-[10px] uppercase font-bold tracking-widest text-muted-foreground"
                                                    value={member.isLeader ? 'LEADER' : member.role}
                                                    placeholder="Role"
                                                    readOnly={!isEditing}
                                                    onChange={(e) => updateMember(index, 'role', e.target.value)}
                                                />
                                            </div>
                                            {isEditing && (
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => updateMember(index, 'isLeader', !member.isLeader)} className="p-1.5 rounded-lg hover:bg-yellow-400/20 text-yellow-400">
                                                        <Crown size={14} />
                                                    </button>
                                                    <button onClick={() => removeMember(index)} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden System Inputs */}
            <input type="file" ref={robotInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'robot')} />
            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />

            {saved && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 p-2 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl z-[100] pr-8 pl-2 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                        <CheckCircle size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">System Updated</p>
                    </div>
                </div>
            )}
        </div>
    );
}
