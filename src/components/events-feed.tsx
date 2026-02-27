import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { EventCard } from "@/components/event-card"; // הקלף שלנו!
import { Loader2 } from "lucide-react";

type CurrentUser = FunctionReturnType<typeof api.users.current>;

interface EventsFeedProps {
    user: CurrentUser | undefined;
}

export function EventsFeed({ user }: EventsFeedProps) {
    // שולפים את המפגשים מהשרת
    const events = useQuery(api.events.getMyEvents);
    const isLoadingEvents = events === undefined;

    return (
        <div className="max-w-4xl mx-auto mt-8">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight">המפגשים הבאים שלך</h2>
                <CreateEventDialog user={user} />
            </div>

            {/* מצב טעינה */}
            {isLoadingEvents && (
                <div className="flex justify-center mt-20">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
            )}

            {/* מצב שיש אירועים: מציגים גריד של קלפים */}
            {events && events.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                        // חייבים להשתמש ב-! כי פילטרנו את ה-null בשרת אבל TS קצת פרנואיד
                        <EventCard key={event!._id} event={event!} />
                    ))}
                </div>
            )}

            {/* מצב ריק (Empty State) - רק אם סיים לטעון ואין אירועים */}
            {events && events.length === 0 && (
                <div className="text-center text-neutral-500 bg-white/50 border-2 border-dashed border-orange-200 rounded-2xl p-16 shadow-sm mt-8">
                    <div className="text-4xl mb-4">🍻</div>
                    <h3 className="text-lg font-semibold text-neutral-700 mb-2">עדיין אין כאן מפגשים...</h3>
                    <p className="text-neutral-500">
                        זה הזמן לפתוח סשן טעימות חדש ולהזמין את החבר'ה!
                    </p>
                </div>
            )}
        </div>
    );
}