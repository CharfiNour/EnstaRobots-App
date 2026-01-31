"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Camera, Plus, Trash2, Crown, CheckCircle,
    Image as ImageIcon, Upload, ShieldCheck, Lock,
    Cpu, Info, Users, Settings, Zap, Globe, Box, Target, ChevronRight
} from 'lucide-react';
import { upsertTeamToSupabase, updateClubLogoInSupabase } from '@/lib/supabaseData';
import { Team } from '@/lib/teams';
import { getCompetitionState } from '@/lib/competitionState';
import CustomSelector from '@/components/common/CustomSelector';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

const COMPETITION_CONFIG: Record<string, { name: string, color: string, icon: any }> = {
    junior_line_follower: { name: 'Junior Line Follower', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', icon: Zap },
    junior_all_terrain: { name: 'Junior All Terrain', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: Globe },
    line_follower: { name: 'Line Follower', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', icon: Box },
    all_terrain: { name: 'All Terrain', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: Globe },
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
    const [profilesLocked, setProfilesLocked] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const robotInputRef = useRef<HTMLInputElement>(null);

    const [availableCompetitions, setAvailableCompetitions] = useState<{ id: string, name: string, profiles_locked?: boolean }[]>([]);

    const loadComps = async () => {
        const { fetchCompetitionsFromSupabase } = await import('@/lib/supabaseData');
        const { updateCompetitionState } = await import('@/lib/competitionState');
        const data = await fetchCompetitionsFromSupabase('full', true);
        if (data && data.length > 0) {
            setAvailableCompetitions(data);
            // If any competition has profiles_locked, or we check the specific one
            // To match the current "global" expectation:
            const isLocked = data.some((c: any) => c.profiles_locked);
            setProfilesLocked(isLocked);
            updateCompetitionState({ profilesLocked: isLocked }, { syncRemote: false });
        }
    };

    useEffect(() => {
        loadComps();

        const checkLock = () => {
            setProfilesLocked(getCompetitionState().profilesLocked);
        };
        checkLock();
        window.addEventListener('competition-state-updated', checkLock);
        return () => window.removeEventListener('competition-state-updated', checkLock);
    }, []);

    useSupabaseRealtime('competitions', () => {
        loadComps();
    });

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

    const getCompetitionDisplayColor = (competitionId: string) => {
        // First check if it matches old slugs
        if (COMPETITION_CONFIG[competitionId]) {
            return COMPETITION_CONFIG[competitionId].color;
        }

        // Otherwise, look up by name in database competitions
        const comp = availableCompetitions.find(c => c.id === competitionId);
        if (comp) {
            const lower = comp.name.toLowerCase();
            if (lower.includes('junior') && lower.includes('line')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            if (lower.includes('junior') && lower.includes('terrain')) return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
            if (lower.includes('line')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            if (lower.includes('terrain')) return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';

        }

        return 'bg-role-primary/10 text-role-primary border-role-primary/20';
    };

    const [uploadingImage, setUploadingImage] = useState<'logo' | 'robot' | null>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'robot') => {
        if ((visualsLocked || profilesLocked) && !isAdmin) return;
        const file = e.target.files?.[0];
        if (!file || !team) return;

        try {
            setUploadingImage(type);

            // Import utilities
            const { uploadImageToStorage } = await import('@/lib/supabaseData');
            const { compressImage, validateImageFile } = await import('@/lib/imageCompression');

            // Validate file
            const validation = validateImageFile(file, 10);
            if (!validation.valid) {
                alert(validation.error);
                setUploadingImage(null);
                return;
            }

            // Compress image
            const compressionOptions = type === 'logo'
                ? { maxWidth: 800, maxHeight: 800, quality: 0.9, maxSizeMB: 0.5 }
                : { maxWidth: 1920, maxHeight: 1920, quality: 0.85, maxSizeMB: 2 };

            const compressedFile = await compressImage(file, compressionOptions);

            // Determine path based on type
            let path = '';
            if (type === 'logo') {
                const safeClub = (formData.club || 'unknown').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                path = `clubs/${safeClub}_logo_${Date.now()}`;
            } else {
                path = `teams/${team.id}/robot_${Date.now()}`;
            }

            // Upload to Supabase Storage
            const publicUrl = await uploadImageToStorage(compressedFile, 'admin_uploads', path);
            setFormData(prev => ({ ...prev, [type === 'logo' ? 'logo' : 'photo']: publicUrl }));
        } catch (err) {
            console.error("Failed to upload image:", err);
            alert("Upload failed. Please try again.");
        } finally {
            setUploadingImage(null);
        }
    };

    const handleLockVisuals = async () => {
        if (!formData.photo || !formData.logo) {
            alert("Please upload both a robot photo and club logo before confirming.");
            return;
        }
        if (confirm("Are you sure? Once confirmed, you will no longer be able to modify your robot photo or club logo.")) {
            if (team) {
                const updatedTeam = { ...team, visualsLocked: true };
                await upsertTeamToSupabase(updatedTeam);
                setVisualsLocked(true);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        }
    };

    const handleSaveProfile = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!team || (profilesLocked && !isAdmin)) return;
        setLoading(true);

        try {
            // Update club logo if it changed
            if (formData.logo !== team.logo) {
                await updateClubLogoInSupabase(formData.club, formData.logo);
            }

            const updatedTeam: Team = {
                ...team,
                name: formData.robotName || `Team ${team.id}`, // Maintain robot name as name
                robotName: formData.robotName,
                club: formData.club,
                university: formData.university,
                competition: formData.competition,
                members: formData.members,
                isPlaceholder: false,
                photo: formData.photo,
                logo: formData.logo,
                visualsLocked: visualsLocked
            };

            const realId = await upsertTeamToSupabase(updatedTeam);

            setIsEditing(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);

            // Trigger refresh in parent
            onUpdate({ ...updatedTeam, id: realId });
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
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-15 h-15 md:w-18 md:h-18 rounded-[1rem] md:rounded-[2.5rem] bg-gradient-to-br from-role-primary to-role-secondary p-[2px] shadow-2xl">
                            <div className="w-full h-full bg-card rounded-[calc(1.5rem-2px)] md:rounded-[calc(2.5rem-2px)] flex items-center justify-center">
                                <User className="text-role-primary w-6 h-6 md:w-8 md:h-8" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter uppercase italic leading-none mb-1 md:mb-2">Team Profile</h1>
                        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground font-bold">Identity & Hardware Specs</p>
                    </div>
                </div>

                {(() => {
                    if (!isAdmin) {
                        return null; // Don't show anything for non-owners
                    }

                    if (profilesLocked) {
                        return (
                            <div className="flex items-center gap-3 px-6 py-3 bg-muted/40 border border-card-border rounded-2xl text-muted-foreground">
                                <Lock size={14} className="opacity-50" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Profiles Locked by Admin</span>
                            </div>
                        );
                    }

                    return (
                        <button
                            onClick={() => {
                                if (isEditing) handleSaveProfile();
                                else setIsEditing(true);
                            }}
                            className={`min-h-[44px] flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg hover:scale-105 active:scale-95 ${isEditing
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/20'
                                : 'bg-gradient-to-r from-role-primary to-role-secondary text-white shadow-role-primary/20'}`}
                        >
                            {isEditing ? <CheckCircle size={14} /> : <Settings size={14} />}
                            {isEditing ? 'Save Changes' : 'Edit Specs'}
                        </button>
                    );
                })()}
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
                                    disabled={uploadingImage === 'robot'}
                                    className={`absolute bottom-6 right-6 p-4 rounded-2xl shadow-xl transition-all ${uploadingImage === 'robot'
                                        ? 'bg-role-primary/50 cursor-wait'
                                        : 'bg-role-primary text-white hover:scale-110'
                                        }`}
                                >
                                    {uploadingImage === 'robot' ? (
                                        <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Camera size={18} />
                                    )}
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
                                            disabled={uploadingImage === 'logo'}
                                            className={`absolute inset-0 flex items-center justify-center text-white transition-opacity ${uploadingImage === 'logo'
                                                ? 'bg-black/60 opacity-100'
                                                : 'bg-black/40 opacity-0 group-hover/logo:opacity-100'
                                                }`}
                                        >
                                            {uploadingImage === 'logo' ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Upload size={14} />
                                            )}
                                        </button>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-foreground">{formData.club || 'CLUB NAME'}</p>
                                    <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground opacity-60 mt-1 tracking-tighter">{formData.university || 'UNIVERSITY NAME'}</p>
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

                    <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-3xl p-8 h-[400px] overflow-hidden shadow-2xl">
                        {activeTab === 'info' && (
                            <div className="flex flex-col gap-6 h-full">
                                <div className="flex items-center justify-between h-10 shrink-0">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-role-primary flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-role-primary rounded-full"></div>
                                        Technical Specs
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto custom-scrollbar pr-2">
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
                                            <CustomSelector
                                                variant="block"
                                                fullWidth
                                                options={availableCompetitions.map(c => ({ value: c.id, label: c.name }))}
                                                value={formData.competition}
                                                onChange={(val) => setFormData({ ...formData, competition: val })}
                                            />
                                        ) : (
                                            <div className={`w-fit px-4 py-2 rounded-xl font-black uppercase text-xs tracking-widest border ${getCompetitionDisplayColor(formData.competition)}`}>
                                                {availableCompetitions.find(c => c.id === formData.competition)?.name ||
                                                    COMPETITION_CONFIG[formData.competition]?.name ||
                                                    formData.competition || 'NOT DEPLOYED'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'crew' && (
                            <div className="flex flex-col gap-4 h-full">
                                <div className="flex items-center justify-between h-10 shrink-0">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-role-primary flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-role-primary rounded-full"></div>
                                        Unit Crew
                                    </h3>
                                    {isEditing && (
                                        <button
                                            onClick={addMember}
                                            className="px-4 py-2 bg-gradient-to-r from-role-primary to-role-secondary text-white rounded-lg shadow-lg text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                        >
                                            <Plus size={14} /> Add Unit
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 content-start pr-1">
                                    {[...formData.members]
                                        .sort((a, b) => (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0))
                                        .map((member, index) => {
                                            const originalIndex = formData.members.indexOf(member);

                                            return (
                                                <div
                                                    key={originalIndex}
                                                    className={`flex items-center justify-between p-3 bg-muted/30 rounded-2xl border transition-all group ${isEditing ? 'border-card-border/70' : 'border-card-border/50 hover:border-role-primary/30'}`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        {/* Icon */}
                                                        <div
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors
                                                                ${member.isLeader
                                                                    ? 'bg-yellow-500 text-slate-900'
                                                                    : 'bg-card border border-card-border text-muted-foreground'
                                                                }`}
                                                        >
                                                            {member.isLeader ? (
                                                                <Crown size={14} />
                                                            ) : (
                                                                <span className="text-xs font-bold uppercase transition-colors">
                                                                    {member.name.charAt(0) || '?'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Name/Edit Input */}
                                                        <div className="min-w-0 flex-1">
                                                            {isEditing ? (
                                                                <input
                                                                    className="w-full h-8 bg-transparent border-none outline-none font-bold text-sm text-foreground placeholder:opacity-30"
                                                                    value={member.name}
                                                                    placeholder="Unit Name"
                                                                    onChange={(e) =>
                                                                        updateMember(originalIndex, 'name', e.target.value)
                                                                    }
                                                                />
                                                            ) : (
                                                                <div className="font-bold text-sm text-foreground group-hover:text-role-primary transition-colors truncate">
                                                                    {member.name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Role Badge/Edit Input */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-1 bg-card/50 px-2 py-1 rounded-xl border border-card-border/50">
                                                                <input
                                                                    className="w-20 bg-transparent border-none outline-none text-[9px] font-black uppercase tracking-widest text-muted-foreground/70 text-right"
                                                                    value={member.isLeader ? 'LEADER' : member.role}
                                                                    placeholder="ROLE"
                                                                    onChange={(e) =>
                                                                        updateMember(originalIndex, 'role', e.target.value)
                                                                    }
                                                                />
                                                                <button
                                                                    onClick={() => updateMember(originalIndex, 'isLeader', !member.isLeader)}
                                                                    className={`p-1 rounded-lg transition-colors ${member.isLeader ? 'text-yellow-500 bg-yellow-500/10' : 'text-muted-foreground hover:bg-muted'}`}
                                                                >
                                                                    <Crown size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => removeMember(originalIndex)}
                                                                    className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            member.isLeader ? (
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 bg-yellow-500 px-2 py-0.5 rounded-full border border-yellow-600 shadow-sm animate-pulse">
                                                                    Leader
                                                                </span>
                                                            ) : (
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-card px-2 py-0.5 rounded border border-card-border">
                                                                    {member.role || 'Member'}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden System Inputs */}
            <input type="file" ref={robotInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'robot')} />
            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />

            {
                saved && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 p-2 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl z-[100] pr-8 pl-2 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                            <CheckCircle size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white">System Updated</p>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
