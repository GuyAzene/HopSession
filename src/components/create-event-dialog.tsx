import { useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar as CalendarIcon, PlusCircle, Loader2 } from "lucide-react";

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

import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";

type CurrentUser = FunctionReturnType<typeof api.users.current>;

interface CreateEventDialogProps {
    user: CurrentUser | undefined;
}

export function CreateEventDialog({ user }: CreateEventDialogProps) {
    const [eventName, setEventName] = useState("");
    const [eventDate, setEventDate] = useState<Date | undefined>(new Date());

    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isLoading = user === undefined;

    const createEvent = useMutation(api.events.create);

    const handleSubmit = async () => {
        if (!eventDate || !eventName.trim()) return;

        setIsSubmitting(true);
        try {
            await createEvent({
                name: eventName,
                date: eventDate.getTime(),
            });

            setEventName("");
            setEventDate(new Date());
            setIsOpen(false);

        } catch (error) {
            console.error("Failed to create event:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {/* כפתור הטריגר: רקע כהה, טקסט שמנת */}
                <Button disabled={isLoading} className="gap-2 bg-brand-text text-brand-bg hover:bg-brand-text/90 rounded-full px-6">
                    <PlusCircle className="h-5 w-5" />
                    <span>מפגש חדש</span>
                </Button>
            </DialogTrigger>

            {/* תוכן המודל: רקע שמנת, גבול עדין */}
            <DialogContent dir="rtl" className="sm:max-w-106.25 bg-brand-surface border-brand-text/10 shadow-lg">                <DialogHeader>
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
                                // עיצוב ה-Input לפלטה החדשה
                                className="border-brand-text/20 focus-visible:ring-brand-blue bg-transparent text-brand-text placeholder:text-brand-text/40"
                            />
                            <FieldDescription className="text-brand-text/60">שם שיעזור לכולם לזהות את האירוע.</FieldDescription>
                        </Field>

                        <Field>
                            <FieldLabel className="text-brand-text">תאריך המפגש</FieldLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-right font-normal border-brand-text/20 hover:bg-brand-text/5",
                                            // הוספת צבע הרקע המדויק כאן
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
                    </FieldGroup>
                </div>

                <DialogFooter>
                    {/* כפתור אישור: רקע כהה, טקסט שמנת */}
                    <Button
                        disabled={!eventName.trim() || !eventDate || isSubmitting}
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