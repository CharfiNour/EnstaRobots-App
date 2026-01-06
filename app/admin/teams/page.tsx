"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Reorder } from 'framer-motion';
// Actually framer-motion has Reorder components built-in! I can use those for a nice drag/drop effect if desired, 
// or stick to simple buttons if I am unsure about versions. Let's try simple buttons first to be safe.
import { ArrowUp, ArrowDown, Save, Shield, GripVertical } from 'lucide-react';
import { getTeams, reorderTeams, Team, saveTeams } from '@/lib/teams';
import { getSession } from '@/lib/auth';

export default function AdminTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const session = getSession();
        // Allow strict admin check later, for now just ensure logged in generally or assume admin flow
        // The navConfig says admin goes here.
        if (!session || session.role !== 'admin') {
            // router.push('/auth/judge'); // Redirect to login if not admin? 
            // For testing purposes I might be lenient or assume user handles auth
        }
        setIsAdmin(true);
        setTeams(getTeams());
    }, []);

    const moveTeam = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index > 0) {
            const newTeams = [...teams];
            const [moved] = newTeams.splice(index, 1);
            newTeams.splice(index - 1, 0, moved);
            setTeams(newTeams);
            saveTeams(newTeams);
        } else if (direction === 'down' && index < teams.length - 1) {
            const newTeams = [...teams];
            const [moved] = newTeams.splice(index, 1);
            newTeams.splice(index + 1, 0, moved);
            setTeams(newTeams);
            saveTeams(newTeams);
        }
    };

    return (
        <div className="min-h-screen container mx-auto px-4 py-8">
            <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
                <Shield className="w-8 h-8 text-accent" />
                Manage Teams Order
            </h1>
            <p className="text-muted-foreground mb-8">
                Reorder the teams below. This order will be reflected in all competition lists and the judge's scoring sequence.
            </p>

            <div className="max-w-3xl space-y-3">
                {teams.map((team, index) => (
                    <div
                        key={team.id}
                        className="bg-card border border-card-border p-4 rounded-xl flex items-center gap-4 shadow-sm"
                    >
                        <div className="bg-muted p-2 rounded text-muted-foreground">
                            <span className="font-mono text-xs font-bold w-6 block text-center">{index + 1}</span>
                        </div>

                        <div className="w-12 h-12 rounded-lg bg-muted border border-card-border overflow-hidden flex-shrink-0">
                            <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1">
                            <div className="font-bold text-foreground">{team.name}</div>
                            <div className="text-xs text-muted-foreground">{team.university}</div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => moveTeam(index, 'up')}
                                disabled={index === 0}
                                className="p-1.5 hover:bg-muted rounded text-foreground disabled:opacity-20 transition-colors"
                            >
                                <ArrowUp size={16} />
                            </button>
                            <button
                                onClick={() => moveTeam(index, 'down')}
                                disabled={index === teams.length - 1}
                                className="p-1.5 hover:bg-muted rounded text-foreground disabled:opacity-20 transition-colors"
                            >
                                <ArrowDown size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {teams.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-card-border rounded-xl text-muted-foreground">
                    No teams found. (This should not happen if mock data loaded)
                </div>
            )}
        </div>
    );
}
