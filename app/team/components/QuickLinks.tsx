"use client";

import { FileText, Award, Map, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface QuickLinksProps {
    competitionType?: string;
}

export default function QuickLinks({ competitionType }: QuickLinksProps) {
    const isJunior = competitionType?.toLowerCase().includes('junior');

    const links = [
        {
            title: "Rules (CDC)",
            icon: FileText,
            href: isJunior ? "/cdc-suiveur-junior.pdf" : "/cdc-suiveur.pdf",
            description: "Competition core directives"
        },
        {
            title: "Scoring Criteria",
            icon: Award,
            href: isJunior ? "/cotations-junior.pdf" : "/cotations-suiveur.pdf",
            description: "How points are calculated"
        },
        {
            title: "Tactical Map",
            icon: Map,
            href: "/team/matches",
            description: "Track schematic & mockup"
        }
    ];

    return (
        <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-6">
            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-4 flex items-center gap-2">
                <ExternalLink size={16} className="text-role-primary" />
                Quick Access
            </h3>
            <div className="space-y-3">
                {links.map((link, index) => (
                    <a
                        key={index}
                        href={link.href}
                        target={link.href.endsWith('.pdf') ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-3 rounded-2xl bg-muted/30 border border-card-border/50 hover:bg-muted/50 hover:border-role-primary/30 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-role-primary/10 text-role-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <link.icon size={18} />
                        </div>
                        <div>
                            <p className="font-black text-foreground uppercase text-[10px] tracking-tight">{link.title}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{link.description}</p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
