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

    // סטייט לשליטה על המודל (פתוח/סגור) ועל מצב טעינה
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isLoading = user === undefined;

    // מביאים את הפונקציה שיצרנו עכשיו בשרת
    const createEvent = useMutation(api.events.create);

    const handleSubmit = async () => {
        if (!eventDate || !eventName.trim()) return;

        setIsSubmitting(true);
        try {
            // קוראים לשרת ושומרים!
            await createEvent({
                name: eventName,
                date: eventDate.getTime(),
            });

            // אם הצלחנו: מנקים את הטופס וסוגרים את המודל
            setEventName("");
            setEventDate(new Date());
            setIsOpen(false);

        } catch (error) {
            console.error("Failed to create event:", error);
            // פה בעתיד נוכל להוסיף הודעת שגיאה יפה למשתמש
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button disabled={isLoading} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6">
                    <PlusCircle className="h-5 w-5" />
                    <span>מפגש חדש</span>
                </Button>
            </DialogTrigger>

            <DialogContent dir="rtl" className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle className="text-xl">יצירת מפגש טעימות</DialogTitle>
                    <DialogDescription>
                        הכנס את פרטי המפגש. תוכל להוסיף בירות ומשתתפים לאחר מכן.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <FieldGroup className="flex flex-col gap-6">
                        <Field>
                            <FieldLabel htmlFor="eventName">שם המפגש</FieldLabel>
                            <Input
                                id="eventName"
                                name="eventName"
                                autoComplete="off"
                                data-1p-ignore="true"
                                placeholder="לדוגמה: טעימות IPA חמישי בערב..."
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                            />
                            <FieldDescription>שם שיעזור לכולם לזהות את האירוע.</FieldDescription>
                        </Field>

                        <Field>
                            <FieldLabel>תאריך המפגש</FieldLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-right font-normal",
                                            !eventDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {eventDate ? format(eventDate, "PPP", { locale: he }) : <span>בחר תאריך</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={eventDate}
                                        onSelect={setEventDate}
                                        locale={he}
                                        dir="rtl"
                                    />
                                </PopoverContent>
                            </Popover>
                        </Field>
                    </FieldGroup>
                </div>

                <DialogFooter>
                    <Button
                        disabled={!eventName.trim() || !eventDate || isSubmitting}
                        onClick={handleSubmit}
                        className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
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