export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
    public: {
        Tables: {
            competitions: {
                Row: { id: string; name: string; type: string | null; profiles_locked: boolean; current_phase: string | null }
                Insert: { id: string; name: string; type?: string | null; profiles_locked?: boolean; current_phase?: string | null }
                Update: { id?: string; name?: string; type?: string | null; profiles_locked?: boolean; current_phase?: string | null }
            }
            profiles: {
                Row: { id: string; role: string | null }
                Insert: { id: string; role?: string | null }
                Update: { id?: string; role?: string | null }
            }
            teams: {
                Row: { id: string; name: string; robot_name: string | null; club: string | null; university: string | null; logo_url: string | null; photo_url: string | null; code: string | null; competition_id: string | null; is_placeholder: boolean; visuals_locked: boolean; created_at: string }
                Insert: { id?: string; name: string; robot_name?: string | null; club?: string | null; university?: string | null; logo_url?: string | null; photo_url?: string | null; code?: string | null; competition_id?: string | null; is_placeholder?: boolean; visuals_locked?: boolean; created_at?: string }
                Update: { id?: string; name?: string; robot_name?: string | null; club?: string | null; university?: string | null; logo_url?: string | null; photo_url?: string | null; code?: string | null; competition_id?: string | null; is_placeholder?: boolean; visuals_locked?: boolean; created_at?: string }
            }
            team_members: {
                Row: { id: string; team_id: string; name: string; role: string | null; is_leader: boolean }
                Insert: { id?: string; team_id: string; name: string; role?: string | null; is_leader?: boolean }
                Update: { id?: string; team_id?: string; name?: string; role?: string | null; is_leader?: boolean }
            }
            scores: {
                Row: { id: string; team_id: string; competition_id: string | null; phase: string | null; match_id: string | null; time_ms: number | null; bonus_points: number | null; completed_road: boolean | null; knockouts: number | null; judge_points: number | null; damage_score: number | null; total_points: number; judge_id: string | null; status: string | null; is_sent_to_team: boolean; created_at: string }
                Insert: { id?: string; team_id: string; competition_id?: string | null; phase?: string | null; match_id?: string | null; time_ms?: number | null; bonus_points?: number | null; completed_road?: boolean | null; knockouts?: number | null; judge_points?: number | null; damage_score?: number | null; total_points: number; judge_id?: string | null; status?: string | null; is_sent_to_team?: boolean; created_at?: string }
                Update: { id?: string; team_id?: string; competition_id?: string | null; phase?: string | null; match_id?: string | null; time_ms?: number | null; bonus_points?: number | null; completed_road?: boolean | null; knockouts?: number | null; judge_points?: number | null; damage_score?: number | null; total_points?: number; judge_id?: string | null; status?: string | null; is_sent_to_team?: boolean; created_at?: string }
            }
            live_sessions: {
                Row: { id: string; competition_id: string; team_id: string; match_id: string | null; phase: string | null; start_time: string }
                Insert: { id?: string; competition_id: string; team_id: string; match_id?: string | null; phase?: string | null; start_time?: string }
                Update: { id?: string; competition_id?: string; team_id?: string; match_id?: string | null; phase?: string | null; start_time?: string }
            }
            announcements: {
                Row: { id: string; title: string; message: string; type: string; visible_to: string; competition_id: string | null; created_at: string }
                Insert: { id?: string; title: string; message: string; type?: string; visible_to?: string; competition_id?: string | null; created_at?: string }
                Update: { id?: string; title?: string; message?: string; type?: string; visible_to?: string; competition_id?: string | null; created_at?: string }
            }
        }
        Views: {}
        Functions: {}
        Enums: {}
    }
}
