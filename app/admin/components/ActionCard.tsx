"use client";

import Link from 'next/link';
import { ActionCardProps } from '../types';

export default function ActionCard({
    href,
    icon: Icon,
    title,
    description,
    color,
}: ActionCardProps) {
    return (
        <Link href={href}>
            <div className={`p-6 bg-gradient-to-br ${color} to-card border border-card-border rounded-xl hover:scale-105 transition-transform cursor-pointer shadow-md shadow-black/[0.02]`}>
                <Icon className="w-8 h-8 text-foreground mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </Link>
    );
}
