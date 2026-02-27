import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Navbar } from "@/components/navbar";
import { EventsFeed } from "@/components/events-feed";

export function Dashboard() {
    const user = useQuery(api.users.current);

    return (
        <div className="min-h-screen flex flex-col">
            {/* תפריט עליון (Navbar) */}
            <Navbar user={user} />

            {/* אזור התוכן המרכזי */}
            <main className="flex-1 p-4">
                <EventsFeed user={user} />
            </main>
        </div>
    );
}