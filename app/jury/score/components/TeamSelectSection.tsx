import { Shield, Info, Timer, Trophy, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { Team } from '@/lib/teams';
import { TeamScoreEntry } from '../../types';
import CustomSelector from '@/components/common/CustomSelector';

interface TeamSelectSectionProps {
    isLineFollower: boolean;
    isAllTerrain?: boolean;
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
    onScoreClick?: (index: number) => void;
    competitionId?: string;
}

export default function TeamSelectSection({
    isLineFollower,
    isAllTerrain = false,
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
    teamsOrder = {},
    onScoreClick,
    competitionId = ''
}: TeamSelectSectionProps) {
    const isHomo = scoringMode === 'homologation';
    const isJuniorAT = competitionId === 'junior_all_terrain';

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
                        <div key={index} className="flex flex-col md:flex-row justify-between gap-6 p-4 rounded-[1.5rem] bg-muted/20 border border-card-border group transition-all hover:bg-muted/30 shadow-sm relative z-0 focus-within:z-50">
                            <div className="flex-1 min-w-0 md:max-w-[200px]">
                                <label className="text-[10px] font-black text-muted-foreground uppercase mb-2 block tracking-[0.2em] opacity-60">
                                    {isHomo ? 'Robot Selection' : (isLineFollower ? 'Robot Name' : `Team ${index + 1} Robot`)}
                                </label>

                                <CustomSelector
                                    variant="block"
                                    size="compact"
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

                                {/* Timer (Far Left) */}
                                {!isLineFollower && !isHomo && isAllTerrain && (
                                    <div className="mt-3">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Timer size={10} className="text-accent" />
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Perf Duration</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-background/50 border border-card-border rounded-xl px-3 py-2.5 shadow-inner focus-within:border-accent/50 transition-all max-w-[200px]">
                                            <input
                                                type="text"
                                                placeholder="00"
                                                value={team.timeMinutes || ''}
                                                onChange={(e) => handleTeamChange(index, 'timeMinutes', e.target.value)}
                                                className="w-full bg-transparent text-center text-xs font-mono font-black outline-none placeholder:opacity-20"
                                            />
                                            <span className="opacity-30 text-xs font-black">:</span>
                                            <input
                                                type="text"
                                                placeholder="00"
                                                value={team.timeSeconds || ''}
                                                onChange={(e) => handleTeamChange(index, 'timeSeconds', e.target.value)}
                                                className="w-full bg-transparent text-center text-xs font-mono font-black outline-none placeholder:opacity-20"
                                            />
                                            <span className="opacity-30 text-xs font-black">:</span>
                                            <input
                                                type="text"
                                                placeholder="000"
                                                value={team.timeMillis || ''}
                                                onChange={(e) => handleTeamChange(index, 'timeMillis', e.target.value)}
                                                className="w-full bg-transparent text-center text-xs font-mono font-black outline-none placeholder:opacity-20"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="md:w-56 shrink-0 md:ml-auto">
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
                                        size="compact"
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
                                    <div className="space-y-3">
                                        <CustomSelector
                                            variant="block"
                                            size="compact"
                                            fullWidth
                                            value={team.status}
                                            onChange={(val) => handleTeamChange(index, 'status', val)}
                                            options={STATUS_OPTIONS.map(o => ({
                                                value: o.value,
                                                label: o.label,
                                                color: o.color
                                            }))}
                                        />

                                        {/* Score/Rank (Under Match Outcome) */}
                                        {!isLineFollower && !isHomo && isAllTerrain && (
                                            <div>
                                                {isJuniorAT ? (
                                                    <>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <Trophy size={10} className="text-accent" />
                                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Points</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => onScoreClick?.(index)}
                                                            className="w-full flex items-center justify-between px-3 py-[10px] bg-background/50 border border-card-border rounded-xl group hover:border-accent/30 transition-all shadow-inner"
                                                        >
                                                            <span className="text-xs font-black italic text-foreground leading-none">
                                                                {team.totalTaskPoints || 0} <span className="text-[8px] not-italic opacity-40 uppercase">Pts</span>
                                                            </span>
                                                            <ChevronRight size={14} className="text-muted-foreground group-hover:text-accent transition-all" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <Trophy size={10} className="text-amber-500" />
                                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Rank</span>
                                                        </div>
                                                        <select
                                                            value={team.rank || ''}
                                                            onChange={(e) => handleTeamChange(index, 'rank', e.target.value)}
                                                            className="w-full h-[41px] bg-background/50 border border-card-border rounded-xl text-center text-xs font-black outline-none appearance-none hover:border-accent/50 cursor-pointer shadow-inner"
                                                        >
                                                            <option value="">--</option>
                                                            {[1, 2, 3, 4, 5, 6].map(r => (
                                                                <option key={r} value={r}>{r}</option>
                                                            ))}
                                                        </select>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
