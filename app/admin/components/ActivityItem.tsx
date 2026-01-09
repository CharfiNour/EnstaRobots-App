import { ActivityItemData } from '../types';

export default function ActivityItem({ icon: Icon, text, time }: ActivityItemData) {
    return (
        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-card-border/30">
            <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{text}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{time}</p>
            </div>
        </div>
    );
}
