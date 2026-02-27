import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import type {Doc} from "../../convex/_generated/dataModel";

interface EventCardProps {
    event: Doc<"events">;
}

export function EventCard({ event }: EventCardProps) {
    return (
        <Card
            dir="rtl"
            className="w-full bg-brand-surface border-brand-text/10 hover:border-brand-text/30 transition-colors shadow-sm"
        >
            <CardHeader>
                <CardTitle className="text-brand-text">{event.name}</CardTitle>
                <CardDescription className="text-brand-text/60">
                    {format(new Date(event.date), "PPP", { locale: he })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-brand-text/50">
                    עיצוב מלא ומידע על משתתפים/בירות יגיעו בקרוב... 🍻
                </p>
            </CardContent>
        </Card>
    );
}