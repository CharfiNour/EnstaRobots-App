"use client";

import { TeamDashboardData } from '../types';

interface DirectivesListProps {
    directives: TeamDashboardData['directives'];
}

export default function DirectivesList({ directives }: DirectivesListProps) {
    return (
        <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2rem] p-6">
            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-4">Directives</h3>
            <div className="space-y-4">
                {directives.map((directive, index) => (
                    <div key={index} className="flex gap-3 items-center">
                        <div className={`w-8 h-8 rounded-lg ${directive.colorClass} flex items-center justify-center shrink-0`}>
                            <directive.icon size={16} />
                        </div>
                        <div>
                            <p className="font-black text-foreground uppercase text-[10px] tracking-tight">{directive.title}</p>
                            <p className="text-[10px] text-muted-foreground">{directive.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
