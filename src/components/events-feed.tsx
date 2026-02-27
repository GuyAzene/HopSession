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
                {/* צבע הכותרת עודכן למותג */}
                <h2 className="text-2xl font-bold tracking-tight text-brand-text">המפגשים הבאים שלך</h2>
                <CreateEventDialog user={user} />
            </div>

            {/* מצב טעינה */}
            {isLoadingEvents && (
                <div className="flex justify-center mt-20">
                    {/* צבע הספינר הוחלף מהכתום של פעם לצבע המותג עם שקיפות */}
                    <Loader2 className="h-8 w-8 animate-spin text-brand-text/50" />
                </div>
            )}

            {/* מצב שיש אירועים: מציגים גריד של קלפים */}
            {events && events.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                        <EventCard key={event!._id} event={event!} />
                    ))}
                </div>
            )}

            {/* מצב ריק (Empty State) - רק אם סיים לטעון ואין אירועים */}
            {events && events.length === 0 && (
                // עדכנו את הרקע, הגבולות והטקסטים שיתאימו לפלטה
                <div className="text-center bg-white/40 border-2 border-dashed border-brand-text/20 rounded-2xl p-16 shadow-sm mt-8">
                    <div className="text-4xl mb-4">🍻</div>
                    <h3 className="text-lg font-semibold text-brand-text mb-2">עדיין אין כאן מפגשים...</h3>
                    <p className="text-brand-text/60">
                        זה הזמן לפתוח סשן טעימות חדש ולהזמין את החבר'ה!
                    </p>
                </div>
            )}
        </div>
    );
}