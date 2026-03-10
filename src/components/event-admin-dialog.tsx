import { useMemo, useState } from 'react';
import { useMutation } from 'convex/react';
import { he } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Settings2, Trash2 } from 'lucide-react';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { combineDateAndTime } from '@/lib/dates';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface EventAdminDialogProps {
    eventId: Id<'events'>;
    eventName: string;
    eventDate: number;
    triggerClassName?: string;
}

export function EventAdminDialog({ eventId, eventName, eventDate, triggerClassName }: EventAdminDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState(eventName);
    const [date, setDate] = useState<Date | undefined>(new Date(eventDate));
    const [time, setTime] = useState<string>(() => {
        const source = new Date(eventDate);
        const hours = String(source.getHours()).padStart(2, '0');
        const minutes = String(source.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateEvent = useMutation(api.events.update);
    const deleteEvent = useMutation(api.events.remove);

    const formattedDate = useMemo(() => {
        if (!date) {
            return 'בחר תאריך';
        }
        return date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }, [date]);

    const resetFromSource = () => {
        setName(eventName);
        const source = new Date(eventDate);
        setDate(source);
        setTime(`${String(source.getHours()).padStart(2, '0')}:${String(source.getMinutes()).padStart(2, '0')}`);
        setError(null);
    };

    const handleSave = async () => {
        if (!date || !time.trim() || !name.trim()) {
            setError('יש למלא שם, תאריך ושעה כדי לשמור.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await updateEvent({
                eventId,
                name,
                date: combineDateAndTime(date, time).getTime(),
            });
            setIsOpen(false);
        } catch (err) {
            setError(getErrorMessage(err, 'שמירת השינויים נכשלה. נסה שוב.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        const shouldDelete = window.confirm('למחוק את המפגש וכל הבירות שבו? אי אפשר לשחזר.');
        if (!shouldDelete) {
            return;
        }

        setIsDeleting(true);
        setError(null);

        try {
            await deleteEvent({ eventId });
            window.location.assign('/');
        } catch (err) {
            setError(getErrorMessage(err, 'מחיקת המפגש נכשלה. נסה שוב.'));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(nextOpen) => {
                setIsOpen(nextOpen);
                if (nextOpen) {
                    resetFromSource();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className={cn('border-brand-text/20 text-brand-text hover:bg-brand-text/5', triggerClassName)}
                >
                    <Settings2 className="h-4 w-4" />
                    ניהול מפגש
                </Button>
            </DialogTrigger>

            <DialogContent dir="rtl" className="sm:max-w-[460px] bg-brand-surface border-brand-text/10" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-brand-text">ניהול מפגש</DialogTitle>
                    <DialogDescription className="text-brand-text/60">
                        עדכן שם, תאריך ושעה. ניתן גם למחוק את המפגש מאזור הסכנה.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-brand-text">שם מפגש</label>
                        <Input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="border-brand-text/20 focus-visible:ring-brand-blue"
                            placeholder="שם המפגש"
                        />
                    </div>

                    <div className="grid grid-cols-[1fr_6rem] gap-3 items-end">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-brand-text">תאריך</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'h-10 justify-start border-brand-text/20 hover:bg-brand-text/5',
                                            date ? 'text-brand-text' : 'text-brand-text/50'
                                        )}
                                    >
                                        <CalendarIcon className="h-4 w-4" />
                                        {formattedDate}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="bg-brand-surface border-brand-text/10 p-0 w-auto">
                                    <Calendar mode="single" selected={date} onSelect={setDate} locale={he} dir="rtl" />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-brand-text">שעה</label>
                            <Input
                                type="time"
                                step="900"
                                value={time}
                                onChange={(event) => setTime(event.target.value)}
                                dir="ltr"
                                className="border-brand-text/20 focus-visible:ring-brand-blue text-center h-10 px-2"
                            />
                        </div>
                    </div>

                    <div className="rounded-lg border border-brand-error/20 bg-brand-error/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-brand-error">אזור סכנה</p>
                                <p className="text-xs text-brand-error/80">מחיקת מפגש תמחק גם את כל הבירות והמשתתפים.</p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isDeleting}
                                onClick={handleDelete}
                                className="border-brand-error/30 text-brand-error hover:bg-brand-error/10"
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                מחק
                            </Button>
                        </div>
                    </div>

                    {error && <p className="text-sm text-brand-error">{error}</p>}
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="text-brand-text hover:bg-brand-text/5">
                        ביטול
                    </Button>
                    <Button type="button" disabled={isSaving || isDeleting} onClick={handleSave} className="bg-brand-text text-brand-bg hover:bg-brand-text/90">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
