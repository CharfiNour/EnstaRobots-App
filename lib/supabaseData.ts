import { supabase } from './supabase';
import { Team, TeamMember } from './teams';
import { OfflineScore } from './offlineScores';
import { Database } from '../types/supabase';

type DBTeam = Database['public']['Tables']['teams']['Row'];
type DBTeamMember = Database['public']['Tables']['team_members']['Row'];
type DBScore = Database['public']['Tables']['scores']['Row'];

/**
 * COMPETITIONS SERVICE
 */

export async function fetchCompetitionsFromSupabase() {
    console.log("Supabase URL Check:", process.env.NEXT_PUBLIC_SUPABASE_URL ? 'DEFINED' : 'MISSING');
    const { data, error } = await supabase
        .from('competitions')
        .select('id, name, type, profiles_locked, current_phase, created_at');

    if (error) {
        console.error('Error fetching competitions RAW:', error);
        console.error('Error fetching competitions MSG:', error.message || 'No message');
        return [];
    }
    return data as any;
}

export async function updateCompetitionStatusToSupabase(competitionId: string, status: string) {
    // Check if competitionId is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(competitionId);

    let query = (supabase.from('competitions') as any).update({ current_phase: status } as any);

    if (isUuid) {
        query = query.eq('id', competitionId);
    } else {
        query = query.eq('type', competitionId);
    }

    const { error } = await query;

    if (error) {
        console.error('Error updating competition status:', error);
        throw error;
    }
}

/**
 * TEAMS SERVICE
 */

export async function fetchTeamsFromSupabase(fields: 'minimal' | 'full' = 'full'): Promise<Team[]> {
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

    const { data, error } = await supabase
        .from('teams')
        .select(selectQuery);

    if (error) {
        console.error('--- SUPABASE TEAMS FETCH ERROR ---', error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((t: any) => ({
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
        organization: t.university || '',
    }));
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
}

export async function updateClubLogoInSupabase(clubName: string, logoUrl: string) {
    const { error } = await (supabase.from('teams') as any)
        .update({ logo_url: logoUrl })
        .eq('club', clubName);

    if (error) {
        console.error('Error updating club logo:', error);
        throw error;
    }
}

/**
 * SCORES SERVICE
 */

export async function fetchScoresFromSupabase(): Promise<OfflineScore[]> {
    const { data, error } = await supabase
        .from('scores')
        .select('id, match_id, team_id, competition_id, phase, time_ms, bonus_points, completed_road, knockouts, judge_points, damage_score, total_points, judge_id, status, is_sent_to_team, created_at, detailed_scores')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('--- SUPABASE FETCH ERROR ---');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        return [];
    }

    return (data || []).map((s: any) => ({
        id: s.id,
        matchId: s.match_id || '',
        teamId: s.team_id,
        competitionType: s.competition_id || '',
        phase: s.phase || '',
        timeMs: s.time_ms ?? undefined,
        bonusPoints: s.bonus_points ?? undefined,
        completedRoad: s.completed_road ?? undefined,
        knockouts: s.knockouts ?? undefined,
        juryPoints: s.judge_points ?? undefined,
        damageScore: s.damage_score ?? undefined,
        totalPoints: s.total_points,
        detailedScores: s.detailed_scores as Record<string, number> | undefined,
        juryId: s.judge_id || '',
        timestamp: new Date(s.created_at || Date.now()).getTime(),
        synced: true,
        isSentToTeam: s.is_sent_to_team,
        status: s.status || undefined
    }));
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
                // It's likely a slug (e.g., 'line_follower'), resolve to UUID
                const { data: comp } = await supabase
                    .from('competitions')
                    .select('id')
                    .or(`id.eq.${targetCompId},type.eq.${targetCompId}`)
                    .single();

                if (comp) {
                    targetCompId = comp.id;
                } else {
                    console.warn(`Could not resolve competition ID for slug: ${targetCompId}. Attempting to use slug as ID.`);
                    // Fallback: Use the slug itself. If the DB requires UUID, this will fail in the upsert below,
                    // but if the DB is text, it will work.
                }
            }

            sessionEntries.push({
                competition_id: targetCompId,
                team_id: String(sub.teamId),
                phase: sub.phase || '',
                start_time: new Date(sub.startTime || Date.now()).toISOString()
            });
        }

        if (sessionEntries.length > 0) {
            // Use upsert to be robust against race conditions
            const { error: insertError } = await (supabase.from('live_sessions') as any)
                .upsert(sessionEntries, { onConflict: 'competition_id' });

            if (insertError) {
                console.group('--- SUPABASE LIVE SYNC ERROR ---');
                console.error('Code:', insertError.code);
                console.error('Message:', insertError.message);
                console.log('Attempted Data:', sessionEntries);
                console.groupEnd();
            }
        }
    } catch (e) {
        console.error("Critical error in syncLiveStateToSupabase:", e);
    }
}

export async function deleteLiveSessionFromSupabase(competitionId: string) {
    try {
        const { error } = await supabase
            .from('live_sessions')
            .delete()
            .eq('competition_id', competitionId);

        if (error) {
            console.error('Error deleting live session from Supabase:', error.message, error.code);
        }
    } catch (e: any) {
        console.error("Critical error in deleteLiveSessionFromSupabase:", e?.message || e);
    }
}

export async function clearAllLiveSessionsFromSupabase() {
    try {
        const { error } = await supabase
            .from('live_sessions')
            .delete()
            .neq('competition_id', '00000000-0000-0000-0000-000000000001'); // Delete all

        if (error) {
            console.error('Error clearing all live sessions from Supabase:', error);
        }
    } catch (e) {
        console.error("Critical error in clearAllLiveSessionsFromSupabase:", e);
    }
}

export async function fetchLiveSessionsFromSupabase(): Promise<Record<string, any>> {
    const { data, error } = await supabase
        .from('live_sessions')
        .select('competition_id, team_id, phase, start_time');

    if (error) {
        console.group('--- SUPABASE LIVE FETCH ERROR ---');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.groupEnd();
        return {};
    }

    const sessions: Record<string, any> = {};
    data?.forEach((s: any) => {
        sessions[s.competition_id] = {
            teamId: s.team_id,
            phase: s.phase,
            startTime: new Date(s.start_time).getTime()
        };
    });

    return sessions;
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
