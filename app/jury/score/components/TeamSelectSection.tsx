import { Shield, Info } from 'lucide-react';
import { useMemo } from 'react';
import { Team } from '@/lib/teams';
import { TeamScoreEntry } from '../../types';
import CustomSelector from '@/components/common/CustomSelector';

interface TeamSelectSectionProps {
    isLineFollower: boolean;
    teams: TeamScoreEntry[];
    handleTeamChange: (index: number, field: string, value: string) => void;
    competitionTeams: Team[];
    globalPhase: string;
    setGlobalPhase: (v: string) => void;
    numberOfTeams: number;
    setNumberOfTeams: (v: number) => void;
    isPhaseSubmitted: (teamId: string, phase: string) => boolean;
    competitionPhases: string[];
    STATUS_OPTIONS: { value: string; label: string; color: string }[];
    selectedGroup?: string;
    setSelectedGroup?: (v: string) => void;
    groups?: string[];
    scoringMode?: 'performance' | 'homologation';
    teamsOrder?: Record<string, number>;
}

export default function TeamSelectSection({
    isLineFollower,
    teams,
    handleTeamChange,
    competitionTeams,
    globalPhase,
    setGlobalPhase,
    numberOfTeams,
    setNumberOfTeams,
    isPhaseSubmitted,
    competitionPhases,
    STATUS_OPTIONS,
    selectedGroup,
    setSelectedGroup,
    groups = [],
    scoringMode = 'performance',
    teamsOrder = {}
}: TeamSelectSectionProps) {
    const isHomo = scoringMode === 'homologation';

    // Sort teams based on the provided order
    const sortedTeams = useMemo(() => {
        if (Object.keys(teamsOrder).length === 0) return competitionTeams;
        return [...competitionTeams].sort((a, b) => {
            const orderA = teamsOrder[a.id] !== undefined ? teamsOrder[a.id] : 9999;
            const orderB = teamsOrder[b.id] !== undefined ? teamsOrder[b.id] : 9999;
            return orderA - orderB;
        });
    }, [competitionTeams, teamsOrder]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-black text-foreground flex items-center gap-3 uppercase tracking-tight italic">
                    <Shield size={22} className="text-accent" />
                    Teams & {isHomo ? 'Technical Registration' : 'Competition Phases'}
                </h2>
                {!isLineFollower && !isHomo && (
                    <div className="flex flex-row flex-wrap items-center gap-2">
                        <CustomSelector
                            prefix="Phase"
                            value={globalPhase}
                            onChange={(val) => setGlobalPhase(val)}
                            options={competitionPhases.map((p, idx) => {
                                let isLocked = false;
                                if (idx > 0) {
                                    const prevPhases = competitionPhases.slice(0, idx);
                                    isLocked = prevPhases.some(prevP =>
                                        !competitionTeams.every(t => isPhaseSubmitted(t.id, prevP))
                                    );
                                }
                                return {
                                    value: p,
                                    label: p + (isLocked ? ' (Locked)' : ''),
                                    disabled: false // Allow selection so Jury can see the "Not Started" message
                                };
                            })}
                        />

                        {setSelectedGroup && groups.length > 0 && (
                            <CustomSelector
                                prefix="Grp"
                                value={selectedGroup}
                                onChange={(val) => setSelectedGroup(val)}
                                options={groups.map(g => ({ value: g, label: g }))}
                            />
                        )}

                        <CustomSelector
                            prefix="Count"
                            value={numberOfTeams}
                            onChange={(val) => setNumberOfTeams(val)}
                            options={[2, 3, 4, 5, 6].map(n => ({ value: n, label: `${n} Teams` }))}
                        />
                    </div>
                )}
            </div>

            <div className="grid gap-3">
                {teams.map((team, index) => {
                    const phaseToCheck = isHomo ? 'Homologation' : (isLineFollower ? team.phase : globalPhase);
                    const hasSubmitted = isPhaseSubmitted(team.id, phaseToCheck!);

                    return (
                        <div key={index} className="flex flex-col md:flex-row gap-4 p-5 rounded-[2rem] bg-muted/20 border border-card-border group transition-all hover:bg-muted/30 shadow-sm relative z-0 focus-within:z-50">
                            <div className="flex-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase mb-2 block tracking-[0.2em] opacity-60">
                                    {isHomo ? 'Robot Selection' : (isLineFollower ? 'Robot Name' : `Team ${index + 1} Robot`)}
                                </label>

                                <CustomSelector
                                    variant="block"
                                    fullWidth
                                    placeholder="Select Robot..."
                                    value={team.id}
                                    onChange={(val) => handleTeamChange(index, 'id', val)}
                                    className={hasSubmitted ? 'ring-1 ring-emerald-500/50 rounded-2xl' : ''}
                                    options={sortedTeams.map((t) => ({
                                        value: t.id,
                                        label: t.name + (isPhaseSubmitted(t.id, phaseToCheck!) ? ' ✓' : ''),
                                        color: isPhaseSubmitted(t.id, phaseToCheck!) ? 'text-emerald-500' : ''
                                    }))}
                                />

                                {hasSubmitted && (
                                    <div className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 mt-2 flex items-center gap-1.5 px-1 uppercase tracking-wider">
                                        <Info size={10} /> Already submitted for {phaseToCheck?.replace(/_/g, ' ')}
                                    </div>
                                )}
                            </div>

                            <div className="md:w-56 shrink-0">
                                <label className={`text-[10px] font-black text-muted-foreground uppercase mb-2 block tracking-[0.2em] ${isHomo ? 'opacity-0 select-none' : 'opacity-60'}`}>
                                    {isLineFollower ? 'Attempt Phase' : 'Match Outcome'}
                                </label>

                                {isHomo ? (
                                    <div className="w-full px-4 py-[1.125rem] bg-role-primary/10 border border-role-primary/30 rounded-2xl flex items-center justify-center">
                                        <span className="text-[10px] font-black text-role-primary uppercase tracking-[0.2em]">Ready for Evaluation</span>
                                    </div>
                                ) : isLineFollower ? (
                                    <CustomSelector
                                        variant="block"
                                        fullWidth
                                        value={team.phase}
                                        onChange={(val) => handleTeamChange(index, 'phase', val)}
                                        options={competitionPhases.map(p => ({
                                            value: p,
                                            label: p + (isPhaseSubmitted(team.id, p) ? ' (Submitted)' : ''),
                                            disabled: isPhaseSubmitted(team.id, p)
                                        }))}
                                    />
                                ) : (
                                    <CustomSelector
                                        variant="block"
                                        fullWidth
                                        value={team.status}
                                        onChange={(val) => handleTeamChange(index, 'status', val)}
                                        options={STATUS_OPTIONS.map(o => ({
                                            value: o.value,
                                            label: o.label,
                                            color: o.color
                                        }))}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
