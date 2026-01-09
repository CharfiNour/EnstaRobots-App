import { Trophy, Users, Zap, Calendar } from 'lucide-react';
import { VisitorDashboardData } from '../types';

export const getVisitorDashboardData = (): VisitorDashboardData => {
    return {
        stats: [
            { icon: Trophy, label: "Competitions", value: "5" },
            { icon: Users, label: "Teams", value: "48" },
            { icon: Zap, label: "Matches Today", value: "12" },
            { icon: Calendar, label: "Days Left", value: "3" },
        ],
        competitions: [
            {
                id: "1",
                title: "Junior Line Follower",
                description: "Young talents navigate the track with precision.",
                status: "Qualifiers",
                delay: 0,
            },
            {
                id: "2",
                title: "Junior All Terrain",
                description: "Overcome obstacles and conquer the challenge.",
                status: "Group Stage",
                delay: 0.1,
            },
            {
                id: "3",
                title: "Line Follower",
                description: "Speed and accuracy meet in this classic race.",
                status: "Knockout",
                delay: 0.2,
            },
            {
                id: "4",
                title: "All Terrain",
                description: "The ultimate test of robot engineering.",
                status: "Finals",
                delay: 0.3,
            },
            {
                id: "5",
                title: "Fight",
                description: "Battle robots clash in the arena.",
                status: "Live Now",
                delay: 0.4,
                isLive: true,
            },
            {
                id: "0",
                title: "View All",
                description: "Explore the complete competition schedule.",
                status: "",
                delay: 0.5,
                isViewAll: true,
            }
        ]
    };
};
