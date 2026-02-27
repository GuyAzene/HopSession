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
    event: Doc<"events">; // טייפסקריפט יודע אוטומטית שיש פה name, date, etc...
}

export function EventCard({ event }: EventCardProps) {
    return (
        <Card dir="rtl" className="w-full hover:border-orange-300 transition-colors">
            <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>
                    {/* ממירים את המספר מהדאטה-בייס לתאריך יפה בעברית */}
                    {format(new Date(event.date), "PPP", { locale: he })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-neutral-500">
                    עיצוב מלא ומידע על משתתפים/בירות יגיעו בקרוב... 🍻
                </p>
            </CardContent>
        </Card>
    );
}