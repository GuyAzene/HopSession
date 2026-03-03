import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Loader2, Beer, Receipt } from "lucide-react" // הוספנו אייקונים
import { ScrollArea } from "@/components/ui/scroll-area" // הייבוא החדש
import { BeerCard } from "@/components/beer-card"
import {DebtRow} from "@/components/debt-row";

export const Route = createFileRoute('/event/$eventId')({
    component: RouteComponent,
})

function RouteComponent() {
    const { eventId } = Route.useParams()

    const event = useQuery(api.events.getEvent, {
        eventId: eventId as Id<"events">
    })

    if (event === undefined) {
        return (
            <div className="flex justify-center mt-20">
                <Loader2 className="h-8 w-8 animate-spin text-brand-text/50" />
            </div>
        )
    }

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
                <h2 className="text-3xl md:text-4xl font-black text-brand-text">{event.name}</h2>
                <div className="flex items-center gap-4 text-brand-text/70">
                    <p>{formattedDate}</p>
                </div>
            </div>

            {/* Layout Grid (תצוגת מחשב: חלוקה של 2/3 ו-1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* --- אזור 1: רשימת הבירות (תופס 2 עמודות) --- */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-brand-text/10 pb-2">
                        <Beer className="h-6 w-6 text-brand-text" />
                        <h3 className="text-2xl font-bold text-brand-text">תפריט הטעימות</h3>
                    </div>

                    {/* Scroll Area: הגבלנו גובה כדי שלא ידחוף את העמוד עד אינסוף */}
                    <ScrollArea className="h-150 rounded-2xl border border-brand-text/10 bg-brand-surface p-6 shadow-sm" dir="rtl">
                        <div className="flex flex-col gap-4 pr-4">

                            {/* פלייסחולדרים לבירות (נחליף בנתונים אמיתיים בהמשך) */}
                            {[1, 2, 3, 4, 5, 6, 7, 8 ,9, 10].map((i) => (
                                <BeerCard key={i} index={i}/>
                            ))}

                        </div>
                    </ScrollArea>
                </div>

                {/* --- אזור 2: סיידבאר התחשבנות (תופס עמודה 1) --- */}
                {/* ה-sticky top-24 גורם לו להישאר על המסך גם אם גוללים למטה בטעות */}
                <div className="flex flex-col gap-4 sticky top-24">
                    <div className="flex items-center gap-2 border-b border-brand-text/10 pb-2">
                        <Receipt className="h-6 w-6 text-brand-text" />
                        <h3 className="text-2xl font-bold text-brand-text">החשבון</h3>
                    </div>

                    <div className="rounded-2xl border border-brand-text/10 bg-brand-surface p-6 shadow-sm flex flex-col gap-4">
                        <p className="text-brand-text/60 text-sm">סיכום ביניים של ההוצאות והחובות למפגש זה.</p>

                        {/* פלייסחולדרים לחובות */}
                        <div className="flex flex-col gap-3 mt-2">
                            <DebtRow variant="owed" person="יוסי משלם לך" amount={17} />
                            <DebtRow variant="owing" person="אתה משלם לדני" amount={23} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}