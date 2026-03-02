import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from "convex/react"

// ייבוא הפיד וה-API
import { api } from "../../convex/_generated/api"
import { EventsFeed } from "@/components/events-feed"

export const Route = createFileRoute('/')({
    component: HomeComponent,
})

function HomeComponent() {
    // שולפים את המשתמש פה כדי להעביר ל-EventsFeed
    const user = useQuery(api.users.current);

    return <EventsFeed user={user} />
}