import { createFileRoute } from '@tanstack/react-router'
import { EventsFeed } from "@/components/events-feed"

export const Route = createFileRoute('/')({
    component: HomeComponent,
})

function HomeComponent() {
    return <EventsFeed />
}
