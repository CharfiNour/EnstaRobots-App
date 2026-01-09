import { CompetitionOption } from '../types';

export const COMPETITIONS: CompetitionOption[] = [
    { value: 'junior_line_follower', label: 'Junior Line Follower', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { value: 'junior_all_terrain', label: 'Junior All Terrain', color: 'text-green-500 dark:text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { value: 'line_follower', label: 'Line Follower', color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { value: 'all_terrain', label: 'All Terrain', color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { value: 'fight', label: 'Fight (Battle Robots)', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { value: 'homologation', label: 'Homologation', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
];

export const PHASES_LINE_FOLLOWER = [
    { value: 'essay_1', label: 'Essay 1' },
    { value: 'essay_2', label: 'Essay 2' },
];

export const PHASES_DEFAULT = [
    { value: 'qualifications', label: 'Qualifications' },
    { value: 'quarter_final', label: 'Quarter Final' },
    { value: 'semi_final', label: 'Semi Final' },
    { value: 'final', label: 'Final' },
];

export const STATUS_OPTIONS = [
    { value: 'winner', label: 'Winner', color: 'text-yellow-600 dark:text-yellow-400' },
    { value: 'qualified', label: 'Qualified', color: 'text-blue-600 dark:text-blue-400' },
    { value: 'eliminated', label: 'Eliminated', color: 'text-red-600 dark:text-red-400' },
];

export const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
