import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Loader2, Beer, Receipt, Plus, LogOut } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BeerCard } from "@/components/beer-card"
import { DebtRow } from "@/components/debt-row"
import { Button } from "@/components/ui/button"
import { AddDrinkDialog } from "@/components/add-drink-dialog"
import { ParticipantsPopover } from '@/components/participants-popover'
import { EventAdminDialog } from '@/components/event-admin-dialog'
import { MyBeersDialog } from '@/components/my-beers-dialog'
import { InviteLinkPopover } from '@/components/invite-link-popover'
import { getErrorMessage } from '@/lib/errors'
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
    const [isLeaving, setIsLeaving] = useState(false)
    const [leaveError, setLeaveError] = useState<string | null>(null)

    // שליפת פרטי האירוע
    // Note: getEvent throws for both not-found and auth errors (caught by ErrorBoundary)
    const event = useQuery(api.events.getEvent, eventQueryArgs)

    // שליפת המשקאות של האירוע
    const drinks = useQuery(api.drinks.getDrinksByEvent, eventQueryArgs)
    const participants = useQuery(api.events.getParticipantsSummary, eventQueryArgs)
    const debts = useQuery(api.debts.getEventDebts, eventQueryArgs)
    const removeParticipant = useMutation(api.events.removeParticipant)
    const currentUser = useCurrentUser()

    const isOwner = Boolean(event && currentUser && currentUser._id === event.ownerId)

    // חייב להיות לפני כל early return — Rules of Hooks
    const participantNameById = useMemo(
        () => new Map((participants ?? []).map((participant) => [participant.userId, participant.name])),
        [participants]
    )

    if (!hasValidEventId) {
        return (
            <div className="flex justify-center mt-20">
                <p className="text-sm text-brand-error">קישור המפגש לא תקין.</p>
            </div>
        )
    }

    // מוודא שגם האירוע וגם המשקאות נטענו לפני הרינדור
    if (event === undefined || drinks === undefined || participants === undefined || debts === undefined || currentUser === undefined || currentUser === null) {
        return (
            <div className="flex justify-center mt-20">
                <Loader2 className="h-8 w-8 animate-spin text-brand-text/50" />
            </div>
        )
    }

    const currentUserId = currentUser._id

    // getEvent throws if not found (ErrorBoundary will catch it)
    const formattedDate = new Date(event.date).toLocaleDateString("he-IL", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    });

    const handleLeaveEvent = async () => {
        if (!currentUserId) {
            return
        }

        const shouldLeave = window.confirm('לעזוב את המפגש? כל הבירות שהוספת יימחקו מהמפגש.')
        if (!shouldLeave) {
            return
        }

        setIsLeaving(true)
        setLeaveError(null)

        try {
            await removeParticipant({
                eventId: event._id,
                userId: currentUserId,
            })
            // hard redirect — כשעוזבים אירוע, Convex כבר עדכן את ה-subscriptions לפני שה-promise
            // הסתיים, ולכן router.navigate גורם ל-ErrorBoundary לתפוס שגיאת הרשאה. window.location
            // מנווט לפני שהקומפוננטה מרנדרת שוב.
            window.location.href = '/'
        } catch (err) {
            setLeaveError(getErrorMessage(err, 'לא הצלחנו לעזוב את המפגש כרגע. נסה שוב.'))
        } finally {
            setIsLeaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-8 mt-4 md:mt-8 max-w-7xl mx-auto px-4">

            {/* Header: כותרת, תאריך ומזהה */}
            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="min-w-0 flex-1 text-3xl md:text-4xl font-black text-brand-text break-words">{event.name}</h2>
                    {currentUserId && (
                        <div className="w-full sm:w-auto sm:flex-none">
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                                {isOwner ? (
                                    <>
                                        <InviteLinkPopover
                                            eventId={event._id}
                                            className="w-full justify-center sm:w-auto"
                                        />
                                        <EventAdminDialog
                                            eventId={event._id}
                                            eventName={event.name}
                                            eventDate={event.date}
                                            triggerClassName="w-full justify-center sm:w-auto"
                                        />
                                    </>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isLeaving}
                                        onClick={handleLeaveEvent}
                                        className="w-full justify-center border-brand-error/30 text-brand-error hover:bg-brand-error/10 sm:w-auto"
                                    >
                                        {isLeaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                                        עזוב מפגש
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {leaveError && <p className="text-sm text-brand-error">{leaveError}</p>}
                <div className="flex items-center gap-4 text-brand-text/70 flex-wrap">
                    <p>{formattedDate}</p>
                </div>
            </div>

            {/* Layout Grid (תצוגת מחשב: חלוקה של 2/3 ו-1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* --- אזור 1: רשימת הבירות (תופס 2 עמודות) --- */}
                <div className="lg:col-span-2 flex flex-col gap-4">

                    {/* כותרת רשימת הבירות + כפתור הוספה (flex-between) */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-text/10 pb-2">
                        <div className="flex items-center gap-2">
                            <Beer className="h-6 w-6 text-brand-text" />
                            <h3 className="text-2xl font-bold text-brand-text">תפריט הטעימות</h3>
                        </div>

                        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                            <ParticipantsPopover
                                eventId={event._id}
                                participants={participants}
                                currentUserId={currentUserId}
                                canManageParticipants={isOwner}
                                className="w-full justify-center sm:w-auto"
                            />
                            <MyBeersDialog
                                eventId={event._id}
                                triggerClassName="w-full justify-center sm:w-auto"
                            />

                            <Button
                                onClick={() => setIsAddDrinkOpen(true)}
                                size="sm"
                                className="w-full justify-center bg-brand-text text-brand-bg hover:bg-brand-text/90 sm:w-auto"
                            >
                                <Plus className="h-4 w-4" />
                                הוסף בירה
                            </Button>
                        </div>
                    </div>

                    {/* מובייל: גובה קבוע כדי שה-ScrollArea יתנהג כ-scroll container ולא יגדל לאינסוף.
                        דסקטופ: max-height דינמי לפי הויופורט
                        Wrapper div holds the rounded border so cards at top/bottom aren't clipped by ScrollArea's viewport */}
                    <div className="rounded-2xl border border-brand-text/10 bg-brand-surface shadow-sm overflow-hidden">
                    <ScrollArea className="h-[45vh] lg:h-[calc(100vh-20rem)] p-3 sm:p-6" dir="rtl">
                        <div className="flex flex-col gap-4 pl-3 sm:pl-5">

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
                            {debts.filter(d => d.from === currentUserId || d.to === currentUserId).length === 0 ? (
                                <p className="text-sm text-brand-text/50">אין חובות — הכל מסודר!</p>
                            ) : (
                                debts
                                    .filter(d => d.from === currentUserId || d.to === currentUserId)
                                    .map((d: (typeof debts)[number], i) => {
                                        const youOwe = d.from === currentUserId;
                                        const otherPersonId = youOwe ? d.to : d.from;
                                        return (
                                            <DebtRow
                                                key={i}
                                                personName={participantNameById.get(otherPersonId) ?? 'משתתף'}
                                                amount={d.amount}
                                                youOwe={youOwe}
                                            />
                                        );
                                    })
                            )}
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
