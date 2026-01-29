import { supabase } from './supabase';
import { Team, TeamMember } from './teams';
import { OfflineScore } from './offlineScores';
import { Database } from '../types/supabase';
import { dataCache, cacheKeys } from './dataCache';

type DBTeam = Database['public']['Tables']['teams']['Row'];
type DBTeamMember = Database['public']['Tables']['team_members']['Row'];
type DBScore = Database['public']['Tables']['scores']['Row'];

/**
 * COMPETITIONS SERVICE
 */

export async function fetchCompetitionsFromSupabase(fields: 'minimal' | 'full' = 'full', forceRefresh: boolean = false): Promise<any[]> {
    const cacheKey = cacheKeys.competitions(fields);
    if (!forceRefresh) {
        const cached = dataCache.get<any[]>(cacheKey);

        if (cached) {
            console.log(`📦 [CACHE HIT] Competitions (${fields}) loaded from cache`);
            return cached;
        }
    }

    const selectQuery = fields === 'minimal'
        ? 'id, name, type, current_phase, total_teams, total_matches, arena, schedule'
        : '*';

    try {
        const { data, error } = await supabase
            .from('competitions')
            .select(selectQuery);

        if (error) {
            console.error('--- SUPABASE COMPS FETCH ERROR ---', {
                code: error.code || 'N/A',
                message: error.message || 'Network Error or Failed to Fetch'
            });
            return [];
        }

        // Store in cache
        dataCache.set(cacheKey, data as any);
        console.log('💾 [CACHE SET] Competitions cached');

        return data as any;
    } catch (e: any) {
        console.error("Critical error in fetchCompetitionsFromSupabase:", e.message || e);
        return [];
    }
}

export async function updateCompetitionToSupabase(competitionId: string, updates: {
    name?: string,
    current_phase?: string,
    total_matches?: number,
    total_teams?: number,
    arena?: string,
    schedule?: string
}) {
    try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(competitionId);

        // 1. Try to find the record first to decide between Update vs Insert
        let query = supabase.from('competitions').select('id');

        if (isUuid) {
            query = query.eq('id', competitionId);
        } else {
            // Flexible match for legacy IDs or Slugs
            query = query.or(`type.eq.${competitionId},name.eq.${competitionId}`);
        }

        const { data: existingData, error: checkError } = await query;
        const existing = existingData as any[]; // Cast to any to avoid TS errors if types are stale

        if (checkError) {
            console.error('Error checking competition existence:', JSON.stringify(checkError));
            return;
        }

        const recordExists = existing && existing.length > 0;

        if (recordExists) {
            // UPDATE EXISTING
            const targetId = existing[0].id;
            const { error: updateError } = await (supabase.from('competitions') as any)
                .update(updates)
                .eq('id', targetId);

            if (updateError) {
                console.error('Error updating competition:', JSON.stringify(updateError));
            }
        } else {
            // INSERT NEW
            const payload: any = { ...updates };
            if (isUuid) {
                payload.id = competitionId;
            } else {
                // If it's a slug like 'line_follower', treat it as type
                payload.type = competitionId;
                // Ensure name is set if not in updates
                if (!payload.name) payload.name = updates.name || competitionId;
            }

            const { error: insertError } = await supabase
                .from('competitions')
                .insert(payload);

            if (insertError) {
                console.error('Error inserting competition:', JSON.stringify(insertError));
            }
        }

    } catch (e: any) {
        console.error("Critical error in updateCompetitionToSupabase:", e.message || JSON.stringify(e));
    } finally {
        // Invalidate competitions cache after mutation
        dataCache.invalidate(cacheKeys.competitions());
    }
}

/**
 * TEAMS SERVICE
 */

export async function fetchTeamsFromSupabase(fields: 'minimal' | 'full' = 'full', forceRefresh: boolean = false): Promise<Team[]> {
    // Check cache first (unless forced)
    const cacheKey = cacheKeys.teams(fields);
    if (!forceRefresh) {
        const cached = dataCache.get<Team[]>(cacheKey);

        if (cached) {
            console.log(`📦 [CACHE HIT] Teams (${fields}) loaded from cache`);
            return cached;
        }
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error("CRITICAL: NEXT_PUBLIC_SUPABASE_URL is not defined in the environment!");
        return [];
    }

    const selectQuery = fields === 'minimal'
        ? 'id, name, robot_name, club, university, logo_url, competition_id, is_placeholder'
        : `
            id, name, robot_name, club, university, logo_url, photo_url, team_code, competition_id, is_placeholder, visuals_locked,
            team_members (team_id, name, role, is_leader)
        `;

    try {
        const { data, error } = await supabase
            .from('teams')
            .select(selectQuery);

        if (error) {
            console.error('--- SUPABASE TEAMS FETCH ERROR ---', {
                code: error.code || 'N/A',
                message: error.message || 'Network Error or Failed to Fetch'
            });
            return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processedTeams = (data || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            robotName: t.robot_name || t.name,
            club: t.club || '',
            university: t.university || '', // Default for minimal
            logo: t.logo_url || '',
            photo: t.photo_url || '',
            code: t.team_code || '',
            competition: t.competition_id || '',
            isPlaceholder: t.is_placeholder,
            visualsLocked: t.visuals_locked,
            members: (t.team_members || []).map((m: any) => ({
                name: m.name,
                role: m.role || '',
                isLeader: m.is_leader
            })),
        }));

        // Strict system-wide filter for dead/dummy data
        // Strict system-wide filter for dead/dummy data (Aggressive version)
        const filteredTeams = processedTeams.filter((t: any) => {
            const teamName = String(t.name || '').toUpperCase();
            const robotName = String(t.robotName || '').toUpperCase();
            const clubName = String(t.club || '').toUpperCase();

            // Pattern 1: Any mention of "TEAM-42" or "TEAM 42"
            const isTeam42 = /TEAM\s*[-–—]?\s*42/.test(teamName) || /TEAM\s*[-–—]?\s*42/.test(robotName);

            // Pattern 2: "CLUB UNKNOWN" or "UNKNOWN CLUB"
            const isUnknownClub = clubName.includes('UNKNOWN') || teamName.includes('UNKNOWN');

            // Pattern 3: Incomplete slots
            const isDummySlot = t.isPlaceholder && (teamName === 'SLOT' || !t.competition);

            return !isTeam42 && !isUnknownClub && !isDummySlot;
        });

        // Store in cache
        dataCache.set(cacheKey, filteredTeams);
        console.log(`💾 [CACHE SET] Teams (${fields}) cached`);

        return filteredTeams;
    } catch (e: any) {
        console.error("Critical error in fetchTeamsFromSupabase:", e.message || e);
        return [];
    }
}

/**
 * Fetches a single team with full details (photo, members).
 * Used for "Deep Detail" view to avoid loading photos for all teams at once.
 */
export async function fetchSingleTeamFromSupabase(teamId: string, forceRefresh: boolean = false): Promise<Team | null> {
    const cacheKey = cacheKeys.teamDetail(teamId);
    if (!forceRefresh) {
        const cached = dataCache.get<Team>(cacheKey);
        if (cached) return cached;
    }

    try {
        const { data, error } = await supabase
            .from('teams')
            .select(`
                id, name, robot_name, club, university, logo_url, photo_url, team_code, competition_id, is_placeholder, visuals_locked,
                team_members (team_id, name, role, is_leader)
            `)
            .eq('id', teamId)
            .single();

        if (error) throw error;
        if (!data) return null;

        const t: any = data;
        const team: Team = {
            id: t.id,
            name: t.name,
            robotName: t.robot_name || t.name,
            club: t.club || '',
            university: t.university || '',
            logo: t.logo_url || '',
            photo: t.photo_url || '',
            code: t.team_code || '',
            competition: t.competition_id || '',
            isPlaceholder: t.is_placeholder,
            visualsLocked: t.visuals_locked,
            members: (t.team_members || []).map((m: any) => ({
                name: m.name,
                role: m.role || '',
                isLeader: m.is_leader
            })),
        };

        dataCache.set(cacheKey, team);
        return team;
    } catch (e) {
        console.error(`Error fetching team ${teamId}:`, e);
        return null;
    }
}

export async function upsertTeamToSupabase(team: Team): Promise<string> {
    const isNew = team.id.startsWith('slot-') || team.id.startsWith('club-') || team.id.includes('temp');

    // Construct payload
    const teamPayload: any = {
        name: team.name || 'Slot',
        robot_name: team.robotName || team.name || '',
        club: team.club,
        university: team.university || '',
        logo_url: team.logo,
        photo_url: team.photo || '',
        team_code: team.code,
        competition_id: team.competition || null,
        is_placeholder: !!team.isPlaceholder,
        visuals_locked: !!team.visualsLocked
    };

    // Only include ID if it's NOT a new slot (update existing)
    if (!isNew) {
        teamPayload.id = team.id;
    }

    console.log(`🚀 ${isNew ? 'INSERTING' : 'UPDATING'} TEAM:`, teamPayload);

    // 1. Upsert Team
    const { data: inserted, error: teamError } = await (supabase.from('teams') as any)
        .upsert(teamPayload)
        .select('id')
        .single();

    if (teamError) {
        console.group('--- SUPABASE TEAM UPSERT ERROR ---');
        console.error('Code:', teamError.code);
        console.error('Message:', teamError.message);
        console.error('Payload:', teamPayload);
        console.groupEnd();
        throw teamError;
    }

    // Get the real ID (either existing or newly generated)
    const realId = inserted.id;

    // 2. Refresh Members
    if (realId) {
        try {
            // Delete existing members
            await (supabase.from('team_members') as any).delete().eq('team_id', realId);

            // Insert new members if any
            if (team.members && team.members.length > 0) {
                const { error: memberError } = await (supabase.from('team_members') as any)
                    .insert(team.members.map(m => ({
                        team_id: realId,
                        name: m.name,
                        role: m.role || '',
                        is_leader: !!m.isLeader
                    })));
                if (memberError) {
                    console.error("Member Insert Error:", memberError);
                    // We don't throw here to avoid failing the whole team update for members
                }
            }
        } catch (mErr) {
            console.warn("Non-critical error updating members:", mErr);
        }
    }

    // Invalidate teams cache after mutation
    dataCache.invalidatePattern('teams');

    return realId;
}

export async function deleteTeamFromSupabase(teamId: string) {
    const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

    if (error) {
        console.error('Error deleting team from Supabase:', error);
        throw error;
    }

    // Invalidate teams cache after deletion
    dataCache.invalidatePattern('teams');
}

export async function updateClubLogoInSupabase(clubName: string, logoUrl: string) {
    const { error } = await (supabase.from('teams') as any)
        .update({ logo_url: logoUrl })
        .eq('club', clubName);

    if (error) {
        console.error('Error updating club logo:', error);
        throw error;
    }

    // Invalidate teams cache after logo update
    dataCache.invalidatePattern('teams');
}

/**
 * SCORES SERVICE
 */

export async function fetchScoresFromSupabase(): Promise<OfflineScore[]> {
    // Check cache first
    const cacheKey = cacheKeys.scores();
    const cached = dataCache.get<OfflineScore[]>(cacheKey);

    if (cached) {
        console.log('📦 [CACHE HIT] Scores loaded from cache');
        return cached;
    }

    try {
        const [scoresResponse, compsResponse] = await Promise.all([
            supabase.from('scores').select('*').order('created_at', { ascending: false }),
            supabase.from('competitions').select('id, type')
        ]);

        if (scoresResponse.error) {
            const err = scoresResponse.error;
            console.error('--- SUPABASE SCORES FETCH ERROR ---', {
                code: err.code || 'N/A',
                message: err.message || 'Network Error or Failed to Fetch',
                details: err.details || 'Check console network tab'
            });
            return [];
        }

        if (compsResponse.error) {
            console.warn('--- SUPABASE COMPS MAP ERROR ---', compsResponse.error.message);
            // Continue without mapping if possible, or fallback
        }

        const scores = scoresResponse.data || [];
        const comps = compsResponse.data || [];

        const compMap: Record<string, string> = {};
        (comps as any[]).forEach(c => {
            if (c.id && c.type) compMap[c.id] = c.type;
        });

        const processedScores = scores.map((s: any) => ({
            id: s.id || '',
            matchId: s.match_id || '',
            teamId: s.team_id || '',
            competitionType: (s.competition_id ? compMap[s.competition_id] : '') || s.competition_id || '',
            phase: s.phase || '',
            timeMs: s.time_ms ?? undefined,
            bonusPoints: s.bonus_points ?? undefined,
            completedRoad: s.completed_road ?? undefined,
            knockouts: s.knockouts ?? undefined,
            juryPoints: s.judge_points ?? undefined,
            damageScore: s.damage_score ?? undefined,
            totalPoints: s.total_points || 0,
            detailedScores: s.detailed_scores as Record<string, number> | undefined,
            juryId: s.judge_id || '',
            timestamp: new Date(s.created_at || Date.now()).getTime(),
            synced: true,
            isSentToTeam: s.is_sent_to_team,
            status: s.status || undefined
        }));

        // Store in cache
        dataCache.set(cacheKey, processedScores);
        console.log('💾 [CACHE SET] Scores cached');

        return processedScores;
    } catch (e: any) {
        console.error("Critical error in fetchScoresFromSupabase:", e.message || e);
        return [];
    }
}

export async function pushScoreToSupabase(score: OfflineScore) {
    const scoreData: any = {
        id: score.id && !score.id.startsWith('offline-') ? score.id : undefined,
        team_id: String(score.teamId),
        competition_id: score.competitionType ? String(score.competitionType) : null,
        phase: score.phase || 'qualifications',
        match_id: score.matchId ? String(score.matchId) : null,
        time_ms: score.timeMs ?? null,
        bonus_points: score.bonusPoints ?? null,
        completed_road: (score as any).completedRoad ?? (score as any).completed_road ?? null,
        knockouts: score.knockouts ?? null,
        judge_points: score.juryPoints ?? null,
        damage_score: score.damageScore ?? null,
        total_points: score.totalPoints || 0,
        detailed_scores: score.detailedScores || null,
        judge_id: score.juryId && score.juryId !== '' ? String(score.juryId) : null,
        status: score.status || 'pending',
        is_sent_to_team: !!score.isSentToTeam,
        created_at: new Date(score.timestamp || Date.now()).toISOString()
    };

    const { error } = await (supabase.from('scores') as any).upsert(scoreData);

    if (error) {
        console.group('--- SUPABASE PUSH ERROR ---');
        console.groupEnd();
        throw error;
    }

    // Invalidate scores cache after mutation
    dataCache.invalidate(cacheKeys.scores());
}

export async function deleteScoreFromSupabase(scoreId: string) {
    const { error } = await supabase
        .from('scores')
        .delete()
        .eq('id', scoreId);

    if (error) {
        console.error('Error deleting score from Supabase:', error);
        throw error;
    }

    // Invalidate scores cache after deletion
    dataCache.invalidate(cacheKeys.scores());
}

export async function clearAllScoresFromSupabase() {
    const { error } = await supabase
        .from('scores')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

    if (error) {
        console.error('Error clearing all scores:', error);
        throw error;
    }

    // Invalidate scores cache after clearing
    dataCache.invalidate(cacheKeys.scores());
}

export async function clearCategoryMatchesFromSupabase(competitionId: string) {
    // Specifically delete 'pending' scores for a competition to "reset" a draw
    const { error } = await supabase
        .from('scores')
        .delete()
        .eq('competition_id', competitionId)
        .eq('status', 'pending');

    if (error) {
        console.error('Error clearing category matches:', error);
        throw error;
    }

    // Invalidate scores cache after clearing matches
    dataCache.invalidate(cacheKeys.scores());
}

export async function clearCategoryScoresFromSupabase(competitionId: string) {
    // Delete ALL scores (pending or confirmed) for a competition
    const { error } = await supabase
        .from('scores')
        .delete()
        .eq('competition_id', competitionId);

    if (error) {
        console.error('Error clearing category scores:', error);
        throw error;
    }

    // Invalidate scores cache after clearing category
    dataCache.invalidate(cacheKeys.scores());
}

/**
 * LIVE STATE SERVICE
 */

export async function syncLiveStateToSupabase(sessions: Record<string, any>) {
    try {
        const sessionEntries = [];

        for (const [compId, sub] of Object.entries(sessions)) {
            let targetCompId = String(compId);

            // Verify if it's a UUID
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetCompId);

            if (!isUuid) {
                // Resolution: check 'type' (slug) first, then 'name'
                const { data } = await (supabase
                    .from('competitions')
                    .select('id')
                    .or(`id.eq.${targetCompId},type.eq.${targetCompId},name.ilike.${targetCompId}`)
                    .limit(1) as any);

                const comp = data && data.length > 0 ? data[0] : null;

                if (comp) {
                    targetCompId = comp.id;
                } else {
                    console.warn(`Could not resolve competition ID for slug: ${targetCompId}. Attempting to use slug as ID.`);
                }
            }

            sessionEntries.push({
                competition_id: targetCompId,
                team_id: String(sub.teamId),
                phase: sub.phase || '',
                start_time: new Date(sub.startTime || Date.now()).toISOString(),
                score_summary: sub.scoreSummary || null,
                updated_at: new Date().toISOString()
            });
        }

        if (sessionEntries.length > 0) {
            // Use upsert to be robust against race conditions
            const { error: insertError } = await (supabase.from('live_sessions') as any)
                .upsert(sessionEntries, { onConflict: 'competition_id' });

            if (insertError) {
                // Graceful Degradation: If schema is missing columns, retry with legacy payload
                if (insertError.code === 'PGRST204') {
                    console.warn("⚠️ Database Schema Mismatch: Retrying live sync without 'score_summary' or 'updated_at' columns.");

                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const legacyEntries = sessionEntries.map(({ score_summary, updated_at, ...rest }) => rest);

                    const { error: retryError } = await (supabase.from('live_sessions') as any)
                        .upsert(legacyEntries, { onConflict: 'competition_id' });

                    if (retryError) {
                        console.error("❌ Legacy sync failing too:", retryError.message);
                    }
                } else {
                    console.group('--- SUPABASE LIVE SYNC ERROR ---');
                    console.error('Code:', insertError.code);
                    console.error('Message:', insertError.message);
                    console.log('Attempted Data:', sessionEntries);
                    console.groupEnd();
                }
            }
        }
    } catch (e) {
        console.error("Critical error in syncLiveStateToSupabase:", e);
    } finally {
        // Invalidate live sessions cache after sync
        dataCache.invalidate(cacheKeys.liveSessions());
    }
}

export async function deleteLiveSessionFromSupabase(competitionId: string) {
    try {
        let uuidToDelete = '';
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(competitionId);

        if (isUuid) {
            uuidToDelete = competitionId;
        } else {
            // Resolve slug to UUID
            const { data } = await (supabase
                .from('competitions')
                .select('id')
                .or(`id.eq.${competitionId},type.eq.${competitionId}`)
                .limit(1) as any);

            if (data && data.length > 0) {
                uuidToDelete = data[0].id;
            }
        }

        // Delete using the resolved UUID if found
        if (uuidToDelete) {
            const { error: uuidErr } = await supabase
                .from('live_sessions')
                .delete()
                .eq('competition_id', uuidToDelete);

            if (uuidErr) console.warn("Failed to delete by UUID:", uuidErr.message);
        }

        // Always attempt fallback by the exact input string as well, just in case the DB is text-based
        const { error: textErr } = await supabase
            .from('live_sessions')
            .delete()
            .eq('competition_id', competitionId);

        if (textErr && !uuidToDelete) {
            console.error('Error deleting live session from Supabase:', textErr.message);
        }

    } catch (e: any) {
        console.error("Critical error in deleteLiveSessionFromSupabase:", e?.message || e);
    } finally {
        // Invalidate live sessions cache after deletion
        dataCache.invalidate(cacheKeys.liveSessions());
    }
}

export async function clearAllLiveSessionsFromSupabase() {
    try {
        const { error } = await supabase
            .from('live_sessions')
            .delete()
            .neq('competition_id', '00000000-0000-0000-0000-000000000001'); // Delete all

        if (error) {
            console.error('Error clearing all live sessions from Supabase:', {
                message: error.message,
                code: error.code,
                hint: error.hint
            });
        }
    } catch (e: any) {
        console.error("Critical error in clearAllLiveSessionsFromSupabase:", {
            message: e.message || e,
            code: e.code,
            hint: e.hint
        });
    } finally {
        // Invalidate live sessions cache after clearing
        dataCache.invalidate(cacheKeys.liveSessions());
    }
}

export async function fetchLiveSessionsFromSupabase(): Promise<Record<string, any>> {
    // Check cache first
    const cacheKey = cacheKeys.liveSessions();
    const cached = dataCache.get<Record<string, any>>(cacheKey);

    if (cached) {
        console.log('📦 [CACHE HIT] Live sessions loaded from cache');
        return cached;
    }

    try {
        const [sessResponse, compsResponse] = await Promise.all([
            supabase.from('live_sessions').select('*'),
            supabase.from('competitions').select('id, type')
        ]);

        if (sessResponse.error) {
            const err = sessResponse.error;
            console.error('--- SUPABASE LIVE FETCH ERROR ---', {
                code: err.code || 'N/A',
                message: err.message || 'Network Error or Failed to Fetch',
                hint: err.hint || 'Ensure your device has internet access and correct API keys'
            });
            return {};
        }

        if (compsResponse.error) {
            console.warn('--- SUPABASE COMPS MAP ERROR (LIVE) ---', {
                message: compsResponse.error.message,
                code: compsResponse.error.code,
                hint: compsResponse.error.hint
            });
        }

        const sessionsData = sessResponse.data || [];
        const compsData = compsResponse.data || [];

        const compMap: Record<string, string> = {};
        (compsData as any[]).forEach(c => {
            if (c.id && c.type) compMap[c.id] = c.type;
        });

        const sessions: Record<string, any> = {};
        sessionsData.forEach((s: any) => {
            const key = compMap[s.competition_id] || s.competition_id;
            sessions[key] = {
                teamId: s.team_id,
                phase: s.phase,
                startTime: new Date(s.start_time).getTime(),
                scoreSummary: s.score_summary || undefined,
                lastUpdate: s.updated_at ? new Date(s.updated_at).getTime() : undefined
            };
        });

        // Store in cache
        dataCache.set(cacheKey, sessions);
        console.log('💾 [CACHE SET] Live sessions cached');

        return sessions;
    } catch (e: any) {
        console.error("Critical error in fetchLiveSessionsFromSupabase:", {
            message: e.message || e,
            code: e.code,
            hint: e.hint
        });
        return {};
    }
}

/**
 * STORAGE SERVICE
 */

export async function uploadImageToStorage(file: File, bucket: string, path: string): Promise<string> {
    try {
        console.log(`[STORAGE] Uploading file to ${bucket}/${path}...`);

        // Upload file
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.error('[STORAGE] Upload failed:', uploadError);
            throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        console.log(`[STORAGE] Upload success. Public URL:`, publicUrl);
        return publicUrl;
    } catch (e) {
        console.error('[STORAGE] Critical upload error:', e);
        throw e;
    }
}

export async function deleteImageFromStorage(bucket: string, path: string) {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            console.error('[STORAGE] Delete failed:', error);
            throw error;
        }
    } catch (e) {
        console.error('[STORAGE] Critical delete error:', e);
        throw e;
    }
}
