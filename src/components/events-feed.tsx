// src/components/events-feed.tsx
import { Link } from "@tanstack/react-router"; // הייבוא החדש!
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { EventCard } from "@/components/event-card";
import { Loader2 } from "lucide-react";

type CurrentUser = FunctionReturnType<typeof api.users.current>;

interface EventsFeedProps {
    user: CurrentUser | undefined;
}

export function EventsFeed({ user }: EventsFeedProps) {
    const events = useQuery(api.events.getMyEvents);
    const isLoadingEvents = events === undefined;

    return (
        <div className="max-w-4xl mx-auto mt-8">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-brand-text">המפגשים הבאים שלך</h2>
                <CreateEventDialog user={user} />
            </div>

            {isLoadingEvents && (
                <div className="flex justify-center mt-20">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-text/50" />
                </div>
            )}

            {events && events.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                        // כאן עטפנו את הקלף ב-Link של הראוטר!
                        <Link
                            key={event!._id}
                            to="/event/$eventId"
                            params={{ eventId: event!._id }}
                            className="block transition-transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-text rounded-xl"
                        >
                            <EventCard event={event!} />
                        </Link>
                    ))}
                </div>
            )}

            {events && events.length === 0 && (
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