"use client";

import { Send, Users, Target } from 'lucide-react';
import {
    ANNOUNCEMENT_TYPES,
    VISIBILITY_OPTIONS,
    COMPETITIONS
} from '../services/announcementService';
import { AnnouncementFormData } from '../types';

interface AnnouncementFormProps {
    formData: AnnouncementFormData;
    setFormData: (data: AnnouncementFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
    submitting: boolean;
}

export default function AnnouncementForm({
    formData,
    setFormData,
    onSubmit,
    submitting
}: AnnouncementFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 mb-2 block">
                            Title
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Match Schedule Update"
                            className="w-full px-5 py-3 bg-muted/20 border border-card-border rounded-xl text-foreground placeholder:text-muted-foreground/50 font-bold focus:outline-none focus:border-role-primary/50 focus:bg-muted/30 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 mb-2 block">
                            Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {ANNOUNCEMENT_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: type.value })}
                                    className={`px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${formData.type === type.value
                                        ? type.color + ' ring-1 ring-inset ring-current'
                                        : 'bg-muted/10 border-transparent text-muted-foreground hover:bg-muted/20'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 mb-2 block">
                            Visibility
                        </label>
                        <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <select
                                value={formData.visibleTo}
                                onChange={(e) => setFormData({ ...formData, visibleTo: e.target.value })}
                                className="w-full pl-11 pr-5 py-3 bg-muted/20 border border-card-border rounded-xl text-foreground font-bold appearance-none focus:outline-none focus:border-role-primary/50 transition-all"
                                required
                            >
                                {VISIBILITY_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value} className="text-black">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 mb-2 block">
                            Target Competition
                        </label>
                        <div className="relative">
                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <select
                                value={formData.competitionId}
                                onChange={(e) => setFormData({ ...formData, competitionId: e.target.value })}
                                className="w-full pl-11 pr-5 py-3 bg-muted/20 border border-card-border rounded-xl text-foreground font-bold appearance-none focus:outline-none focus:border-role-primary/50 transition-all"
                                required
                            >
                                {COMPETITIONS.map((comp) => (
                                    <option key={comp.id} value={comp.id} className="text-black">
                                        {comp.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 mb-2 block">
                    Message Body
                </label>
                <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Enter your detailed announcement message here..."
                    rows={6}
                    className="w-full px-5 py-4 bg-muted/20 border border-card-border rounded-xl text-foreground placeholder:text-muted-foreground/50 font-medium focus:outline-none focus:border-role-primary/50 focus:bg-muted/30 transition-all resize-none leading-relaxed"
                    required
                />
            </div>

            <div className="pt-4 border-t border-card-border/50">
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-role-primary to-role-secondary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-role-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-sm"
                >
                    <Send size={18} />
                    {submitting ? 'Broadcasting...' : 'Broadcast Announcement'}
                </button>
            </div>
        </form>
    );
}
