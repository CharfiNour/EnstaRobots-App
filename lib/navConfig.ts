// Navigation configuration per user role
// This ensures each role sees appropriate navigation items

export type UserRole = 'visitor' | 'team' | 'jury' | 'admin';

export interface NavItem {
    name: string;
    href: string;
    icon: string; // Lucide icon name
}

export const navConfig: Record<UserRole, NavItem[]> = {
    visitor: [
        { name: 'Home', href: '/', icon: 'Home' },
        { name: 'Announcements', href: '/announcements', icon: 'Bell' },
        { name: 'Competitions', href: '/competitions', icon: 'Trophy' },
    ],
    team: [
        { name: 'Dashboard', href: '/team', icon: 'LayoutDashboard' },
        { name: 'Briefing', href: '/team/matches', icon: 'Calendar' },
        { name: 'Score History', href: '/team/score-card', icon: 'History' },
    ],
    jury: [
        { name: 'Dashboard', href: '/jury', icon: 'LayoutDashboard' },
        { name: 'Competition', href: '/jury/score', icon: 'ClipboardCheck' },
        { name: 'Score History', href: '/jury/history', icon: 'History' },
    ],
    admin: [
        { name: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
        { name: 'Matches', href: '/admin/matches', icon: 'Calendar' },
        { name: 'Scores', href: '/admin/scores', icon: 'History' },
        { name: 'Teams', href: '/admin/teams', icon: 'Users' },
    ],
};

// Desktop nav items
export const desktopNavConfig: Record<UserRole, { name: string; href: string }[]> = {
    visitor: [
        { name: 'Announcements', href: '/announcements' },
        { name: 'Competitions', href: '/competitions' },
    ],
    team: [
        { name: 'Dashboard', href: '/team' },
        { name: 'Briefing', href: '/team/matches' },
        { name: 'Score History', href: '/team/score-card' },
    ],
    jury: [
        { name: 'Dashboard', href: '/jury' },
        { name: 'Competition', href: '/jury/score' },
        { name: 'Score History', href: '/jury/history' },
    ],
    admin: [
        { name: 'Dashboard', href: '/admin' },
        { name: 'Matches', href: '/admin/matches' },
        { name: 'Scores', href: '/admin/scores' },
        { name: 'Teams', href: '/admin/teams' },
    ],
};
