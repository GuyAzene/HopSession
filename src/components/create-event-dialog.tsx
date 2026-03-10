import { useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar as CalendarIcon, PlusCircle, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldDescription,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { combineDateAndTime } from "@/lib/dates";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCurrentUser } from "@/lib/hooks";
import { getErrorMessage } from "@/lib/errors";

export function CreateEventDialog() {
    const user = useCurrentUser();
    const isLoading = user === undefined;

    const [eventName, setEventName] = useState("");
    const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
    const [eventTime, setEventTime] = useState("19:00");

    const [error, setError] = useState<string | null>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createEvent = useMutation(api.events.create);

    const handleSubmit = async () => {
        if (!eventDate || !eventName.trim() || !eventTime) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const finalDateTime = combineDateAndTime(eventDate, eventTime);

            // בדיקה שתאריך + שעה לא בעבר
            if (finalDateTime < new Date()) {
                setError('תאריך ושעת האירוע לא יכולים להיות בעבר');
                setIsSubmitting(false);
                return;
            }

            await createEvent({
                name: eventName,
                date: finalDateTime.getTime(),
            });

            // איפוס טופס אחרי הצלחה
            setEventName("");
            setEventDate(new Date());
            setEventTime("19:00");
            setIsOpen(false);

        } catch (err) {
            console.error("Failed to create event:", err);
            const message = getErrorMessage(err, 'אופס, משהו השתבש ביצירת המפגש. נסה שוב.');
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button disabled={isLoading} className="gap-2 bg-brand-text text-brand-bg hover:bg-brand-text/90 rounded-full px-6">
                    <PlusCircle className="h-5 w-5" />
                    <span>מפגש חדש</span>
                </Button>
            </DialogTrigger>

            <DialogContent dir="rtl" className="sm:max-w-[425px] bg-brand-surface border-brand-text/10 shadow-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-xl text-brand-text">יצירת מפגש טעימות</DialogTitle>
                    <DialogDescription className="text-brand-text/60">
                        הכנס את פרטי המפגש. תוכל להוסיף בירות ומשתתפים לאחר מכן.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <FieldGroup className="flex flex-col gap-6">
                        <Field>
                            <FieldLabel htmlFor="eventName" className="text-brand-text">שם המפגש</FieldLabel>
                            <Input
                                id="eventName"
                                name="eventName"
                                autoComplete="off"
                                data-1p-ignore="true"
                                placeholder="לדוגמה: טעימות IPA חמישי בערב..."
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                className="border-brand-text/20 focus-visible:ring-brand-blue bg-transparent text-brand-text placeholder:text-brand-text/40"
                            />
                            <FieldDescription className="text-brand-text/60">שם שיעזור לכולם לזהות את האירוע.</FieldDescription>
                        </Field>

                        <div className="flex flex-row justify-between gap-4">
                            <Field className="flex-1">
                                <FieldLabel className="text-brand-text">תאריך</FieldLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-right font-normal border-brand-text/20 hover:bg-brand-text/5",
                                                "bg-brand-surface",
                                                !eventDate ? "text-brand-text/50" : "text-brand-text"
                                            )}
                                        >
                                            <CalendarIcon className="ml-2 h-4 w-4" />
                                            {eventDate ? format(eventDate, "PPP", { locale: he }) : <span>בחר תאריך</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        align="start"
                                        className="w-auto p-0 border-brand-text/10 bg-brand-surface shadow-xl"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={eventDate}
                                            onSelect={setEventDate}
                                            locale={he}
                                            dir="rtl"
                                            className="bg-brand-surface rounded-md"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </Field>

                            <Field className="w-24 shrink-0 overflow-hidden">
                                <FieldLabel htmlFor="eventTime" className="text-brand-text text-center">שעה</FieldLabel>
                                <Input
                                    type="time"
                                    id="eventTime"
                                    step="900"
                                    value={eventTime}
                                    onChange={(e) => setEventTime(e.target.value)}
                                    dir="ltr"
                                    className="border-brand-text/20 focus-visible:ring-brand-blue bg-transparent text-brand-text text-center text-sm px-1 w-full"
                                />
                            </Field>
                        </div>
                    </FieldGroup>
                </div>

                {error && (
                    <div className="px-4 py-3 text-sm text-brand-error bg-brand-error/10 border border-brand-error/20 rounded-md flex items-center gap-2 mb-4">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        disabled={!eventName.trim() || !eventDate || !eventTime || isSubmitting}
                        onClick={handleSubmit}
                        className="bg-brand-text text-brand-bg hover:bg-brand-text/90 w-full sm:w-auto"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "צור מפגש"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
