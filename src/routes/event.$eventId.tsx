import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Loader2, Beer, Receipt, Plus } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BeerCard } from "@/components/beer-card"
import { DebtRow } from "@/components/debt-row"
import { Button } from "@/components/ui/button"
import { AddDrinkDialog } from "@/components/add-drink-dialog"
import { ParticipantsPopover } from '@/components/participants-popover'
import { EventAdminDialog } from '@/components/event-admin-dialog'
import { MyBeersDialog } from '@/components/my-beers-dialog'
import { useCurrentUser } from '@/lib/hooks'

export const Route = createFileRoute('/event/$eventId')({
    component: RouteComponent,
})

function RouteComponent() {
    const { eventId } = Route.useParams()
    const hasValidEventId = Boolean(eventId.trim())
    const eventQueryArgs = hasValidEventId
        ? { eventId: eventId as Id<"events"> }
        : "skip"

    // ניהול הסטייט של המודל
    const [isAddDrinkOpen, setIsAddDrinkOpen] = useState(false)

    // שליפת פרטי האירוע
    // Note: getEvent throws for both not-found and auth errors (caught by ErrorBoundary)
    const event = useQuery(api.events.getEvent, eventQueryArgs)

    // שליפת המשקאות של האירוע
    const drinks = useQuery(api.drinks.getDrinksByEvent, eventQueryArgs)
    const participants = useQuery(api.events.getParticipantsSummary, eventQueryArgs)
    const currentUser = useCurrentUser()

    if (!hasValidEventId) {
        return (
            <div className="flex justify-center mt-20">
                <p className="text-sm text-brand-error">קישור המפגש לא תקין.</p>
            </div>
        )
    }

    // מוודא שגם האירוע וגם המשקאות נטענו לפני הרינדור
    if (event === undefined || drinks === undefined || participants === undefined || currentUser === undefined) {
        return (
            <div className="flex justify-center mt-20">
                <Loader2 className="h-8 w-8 animate-spin text-brand-text/50" />
            </div>
        )
    }

    const isOwner = currentUser?._id === event.ownerId
    const currentUserId = currentUser?._id ?? null
    const participantNameById = new Map(participants.map((participant) => [participant.userId, participant.name]))

    // getEvent throws if not found (ErrorBoundary will catch it)
    const formattedDate = new Date(event.date).toLocaleDateString("he-IL", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    });

    return (
        <div className="flex flex-col gap-8 mt-4 md:mt-8 max-w-7xl mx-auto px-4">

            {/* Header: כותרת, תאריך ומזהה */}
            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-3xl md:text-4xl font-black text-brand-text">{event.name}</h2>
                    {isOwner && <EventAdminDialog eventId={event._id} eventName={event.name} eventDate={event.date} />}
                </div>
                <div className="flex items-center gap-4 text-brand-text/70 flex-wrap">
                    <p>{formattedDate}</p>
                    <ParticipantsPopover participants={participants} />
                    <MyBeersDialog eventId={event._id} />
                </div>
            </div>

            {/* Layout Grid (תצוגת מחשב: חלוקה של 2/3 ו-1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* --- אזור 1: רשימת הבירות (תופס 2 עמודות) --- */}
                <div className="lg:col-span-2 flex flex-col gap-4">

                    {/* כותרת רשימת הבירות + כפתור הוספה (flex-between) */}
                    <div className="flex items-center justify-between border-b border-brand-text/10 pb-2">
                        <div className="flex items-center gap-2">
                            <Beer className="h-6 w-6 text-brand-text" />
                            <h3 className="text-2xl font-bold text-brand-text">תפריט הטעימות</h3>
                        </div>

                        <Button
                            onClick={() => setIsAddDrinkOpen(true)}
                            size="sm"
                            className="bg-brand-text text-brand-bg hover:bg-brand-text/90 flex items-center gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            הוסף בירה
                        </Button>
                    </div>

                    {/* Dynamic height instead of hardcoded h-150 */}
                    <ScrollArea className="max-h-[calc(100vh-16rem)] rounded-2xl border border-brand-text/10 bg-brand-surface p-6 shadow-sm" dir="rtl">
                        <div className="flex flex-col gap-4 pl-5">

                            {drinks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center py-20 gap-4 opacity-50">
                                    <Beer className="h-12 w-12 text-brand-text/50" />
                                    <p className="text-brand-text font-medium">עדיין לא הוספתם בירות למפגש.<br/>זה הזמן להתחיל!</p>
                                </div>
                            ) : (
                                drinks.map((drink) => (
                                    <BeerCard
                                        key={drink._id}
                                        beer={drink}
                                        payerName={participantNameById.get(drink.payerId) ?? 'משתתף'}
                                        canManage={Boolean(currentUserId) && (drink.payerId === currentUserId || isOwner)}
                                    />
                                ))
                            )}

                        </div>
                    </ScrollArea>
                </div>

                {/* --- אזור 2: סיידבאר התחשבנות (תופס עמודה 1) --- */}
                <div className="flex flex-col gap-4 sticky top-24">
                    <div className="flex items-center gap-2 border-b border-brand-text/10 pb-2">
                        <Receipt className="h-6 w-6 text-brand-text" />
                        <h3 className="text-2xl font-bold text-brand-text">החשבון</h3>
                    </div>

                    <div className="rounded-2xl border border-brand-text/10 bg-brand-surface p-6 shadow-sm flex flex-col gap-4">
                        <p className="text-brand-text/60 text-sm">סיכום ביניים של ההוצאות והחובות למפגש זה.</p>

                        <div className="flex flex-col gap-3 mt-2">
                            <DebtRow variant="owed" person="יוסי משלם לך" amount={17} />
                            <DebtRow variant="owing" person="אתה משלם לדני" amount={23} />
                        </div>
                    </div>
                </div>

            </div>

            <AddDrinkDialog
                eventId={eventId as Id<"events">}
                isOpen={isAddDrinkOpen}
                onClose={() => setIsAddDrinkOpen(false)}
            />
        </div>
    )
}
