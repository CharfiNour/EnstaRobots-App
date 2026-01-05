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
        { name: 'Compete', href: '/competitions', icon: 'Trophy' },
        { name: 'Rankings', href: '/rankings', icon: 'BarChart2' },
    ],
    team: [
        { name: 'Dashboard', href: '/team', icon: 'LayoutDashboard' },
        { name: 'Matches', href: '/team/matches', icon: 'Calendar' },
        { name: 'Rankings', href: '/rankings', icon: 'BarChart2' },
    ],
    judge: [
        { name: 'Dashboard', href: '/judge', icon: 'LayoutDashboard' },
        { name: 'Score', href: '/judge/score', icon: 'ClipboardCheck' },
        { name: 'Rankings', href: '/rankings', icon: 'BarChart2' },
    ],
    admin: [
        { name: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
        { name: 'Manage', href: '/admin/matches', icon: 'Calendar' },
        { name: 'Teams', href: '/admin/teams', icon: 'Users' },
        { name: 'Rankings', href: '/rankings', icon: 'BarChart2' },
    ],
};

// Desktop nav items
export const desktopNavConfig: Record<UserRole, { name: string; href: string }[]> = {
    visitor: [
        { name: 'Competitions', href: '/competitions' },
        { name: 'Rankings', href: '/rankings' },
    ],
    team: [
        { name: 'Dashboard', href: '/team' },
        { name: 'My Matches', href: '/team/matches' },
        { name: 'Rankings', href: '/rankings' },
    ],
    judge: [
        { name: 'Dashboard', href: '/judge' },
        { name: 'Score Match', href: '/judge/score' },
        { name: 'Rankings', href: '/rankings' },
    ],
    admin: [
        { name: 'Dashboard', href: '/admin' },
        { name: 'Matches', href: '/admin/matches' },
        { name: 'Teams', href: '/admin/teams' },
        { name: 'Rankings', href: '/rankings' },
    ],
};
