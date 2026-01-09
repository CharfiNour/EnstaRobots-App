"use client";

import Link from 'next/link';
import { JudgeActionCardProps } from '../types';

export default function JudgeActionCard({
    href,
    icon: Icon,
    title,
    description,
    isPrimary = false,
}: JudgeActionCardProps) {
    return (
        <Link href={href}>
            <div className={`p-6 border rounded-xl hover:scale-105 transition-transform cursor-pointer h-full ${isPrimary
                    ? 'bg-gradient-to-br from-role-primary/10 to-card border-role-primary/20'
                    : 'bg-card border-card-border'
                }`}>
                <Icon className={`w-8 h-8 mb-3 ${isPrimary ? 'text-role-primary' : 'text-muted-foreground'}`} />
                <h3 className="text-xl font-bold text-foreground mb-1">{title}</h3>
                <p className="text-muted-foreground text-sm">{description}</p>
            </div>
        </Link>
    );
}
