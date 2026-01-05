// Navigation configuration per user role
// This ensures each role sees appropriate navigation items

export type UserRole = 'visitor' | 'team' | 'judge' | 'admin';

export interface NavItem {
    name: string;
    href: string;
    icon: string; // Lucide icon name
}

export const navConfig: Record<UserRole, NavItem[]> = {
    visitor: [
        { name: 'Home', href: '/', icon: 'Home' },
        { name: 'Live', href: '/live', icon: 'PlayCircle' },
        { name: 'Compete', href: '/competitions', icon: 'Trophy' },
        { name: 'Rankings', href: '/rankings', icon: 'BarChart2' },
    ],
    team: [
        { name: 'Dashboard', href: '/team', icon: 'LayoutDashboard' },
        { name: 'Matches', href: '/team/matches', icon: 'Calendar' },
        { name: 'Live', href: '/live', icon: 'PlayCircle' },
        { name: 'Rankings', href: '/rankings', icon: 'BarChart2' },
    ],
    judge: [
        { name: 'Dashboard', href: '/judge', icon: 'LayoutDashboard' },
        { name: 'Score', href: '/judge/score', icon: 'ClipboardCheck' },
        { name: 'Live', href: '/live', icon: 'PlayCircle' },
        { name: 'History', href: '/judge/history', icon: 'History' },
    ],
    admin: [
        { name: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
        { name: 'Matches', href: '/admin/matches', icon: 'Calendar' },
        { name: 'Teams', href: '/admin/teams', icon: 'Users' },
        { name: 'Live', href: '/live', icon: 'PlayCircle' },
    ],
};

// Desktop nav items (simpler, no icons shown in UI)
export const desktopNavConfig: Record<UserRole, { name: string; href: string }[]> = {
    visitor: [
        { name: 'Live Center', href: '/live' },
        { name: 'Competitions', href: '/competitions' },
        { name: 'Rankings', href: '/rankings' },
    ],
    team: [
        { name: 'My Dashboard', href: '/team' },
        { name: 'My Matches', href: '/team/matches' },
        { name: 'Live Center', href: '/live' },
    ],
    judge: [
        { name: 'Dashboard', href: '/judge' },
        { name: 'Score Match', href: '/judge/score' },
        { name: 'History', href: '/judge/history' },
    ],
    admin: [
        { name: 'Dashboard', href: '/admin' },
        { name: 'Manage Matches', href: '/admin/matches' },
        { name: 'Teams & Robots', href: '/admin/teams' },
    ],
};
