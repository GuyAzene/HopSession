import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Beer, Loader2, PencilLine, Trash2 } from 'lucide-react';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface MyBeersDialogProps {
    eventId: Id<'events'>;
}

interface EditingState {
    drinkId: Id<'drinks'>;
    beerName: string;
    breweryName: string;
    price: string;
}

export function MyBeersDialog({ eventId }: MyBeersDialogProps) {
    const drinks = useQuery(api.drinks.getMyDrinksByEvent, { eventId });
    const updateDrink = useMutation(api.drinks.updateDrink);
    const removeDrink = useMutation(api.drinks.removeDrink);

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<EditingState | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingDrinkId, setDeletingDrinkId] = useState<Id<'drinks'> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const totalSpent = useMemo(() => {
        if (!drinks) {
            return 0;
        }
        return drinks.reduce((sum, drink) => sum + drink.price, 0);
    }, [drinks]);

    const startEditing = (drink: NonNullable<typeof drinks>[number]) => {
        setError(null);
        setEditing({
            drinkId: drink._id,
            beerName: drink.beerName,
            breweryName: drink.breweryName ?? '',
            price: drink.price.toString(),
        });
    };

    const saveEdit = async () => {
        if (!editing) {
            return;
        }

        const parsedPrice = Number.parseFloat(editing.price);
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            setError('המחיר חייב להיות מספר חיובי תקין.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await updateDrink({
                drinkId: editing.drinkId,
                beerName: editing.beerName,
                breweryName: editing.breweryName,
                price: parsedPrice,
            });
            setEditing(null);
        } catch (err) {
            setError(getErrorMessage(err, 'שמירת הבירה נכשלה. נסה שוב.'));
        } finally {
            setIsSaving(false);
        }
    };

    const deleteDrinkById = async (drinkId: Id<'drinks'>) => {
        const shouldDelete = window.confirm('למחוק את הבירה מהרשימה?');
        if (!shouldDelete) {
            return;
        }

        setDeletingDrinkId(drinkId);
        setError(null);

        try {
            await removeDrink({ drinkId });
            if (editing?.drinkId === drinkId) {
                setEditing(null);
            }
        } catch (err) {
            setError(getErrorMessage(err, 'מחיקת הבירה נכשלה. נסה שוב.'));
        } finally {
            setDeletingDrinkId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-brand-text/20 text-brand-text hover:bg-brand-text/5">
                    <Beer className="h-4 w-4" />
                    הבירות שלי {drinks ? `(${drinks.length})` : ''}
                </Button>
            </DialogTrigger>

            <DialogContent dir="rtl" className="sm:max-w-[650px] bg-brand-surface border-brand-text/10">
                <DialogHeader>
                    <DialogTitle className="text-brand-text">ניהול הבירות שלי</DialogTitle>
                    <DialogDescription className="text-brand-text/60">
                        עריכה מהירה של הבירות שהוספת למפגש.
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg border border-brand-text/10 bg-brand-bg/40 px-4 py-3">
                    <p className="text-sm text-brand-text/70">סה"כ בירות: {drinks?.length ?? 0}</p>
                    <p className="text-lg font-bold text-brand-text" dir="ltr">₪{totalSpent.toFixed(2)}</p>
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                    {!drinks ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-5 w-5 animate-spin text-brand-text/60" />
                        </div>
                    ) : drinks.length === 0 ? (
                        <p className="py-10 text-center text-sm text-brand-text/60">עוד לא הוספת בירות למפגש.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {drinks.map((drink) => (
                                <div key={drink._id} className="rounded-lg border border-brand-text/10 bg-white px-3 py-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-brand-text">{drink.beerName}</p>
                                            <p className="text-xs text-brand-text/60">{drink.breweryName || 'ללא מבשלה'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-brand-text" dir="ltr">₪{drink.price.toFixed(2)}</p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => startEditing(drink)}
                                                className="h-8 w-8 text-brand-text hover:bg-brand-text/5"
                                            >
                                                <PencilLine className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={deletingDrinkId === drink._id}
                                                onClick={() => deleteDrinkById(drink._id)}
                                                className="h-8 w-8 text-brand-error hover:bg-brand-error/10"
                                            >
                                                {deletingDrinkId === drink._id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {editing && (
                    <div className="rounded-lg border border-brand-text/10 bg-brand-bg/50 p-3">
                        <p className="mb-3 text-sm font-semibold text-brand-text">עריכת בירה</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <Input
                                value={editing.beerName}
                                onChange={(event) => setEditing((prev) => prev ? { ...prev, beerName: event.target.value } : prev)}
                                placeholder="שם בירה"
                                className="border-brand-text/20"
                            />
                            <Input
                                value={editing.breweryName}
                                onChange={(event) => setEditing((prev) => prev ? { ...prev, breweryName: event.target.value } : prev)}
                                placeholder="מבשלה"
                                className="border-brand-text/20"
                            />
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editing.price}
                                onChange={(event) => setEditing((prev) => prev ? { ...prev, price: event.target.value } : prev)}
                                placeholder="מחיר"
                                className="border-brand-text/20"
                                dir="ltr"
                            />
                        </div>
                        <div className="mt-3 flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setEditing(null)} className="text-brand-text hover:bg-brand-text/5">
                                ביטול
                            </Button>
                            <Button onClick={saveEdit} disabled={isSaving} className="bg-brand-text text-brand-bg hover:bg-brand-text/90">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור'}
                            </Button>
                        </div>
                    </div>
                )}

                {error && <p className="text-sm text-brand-error">{error}</p>}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} className="border-brand-text/20 text-brand-text hover:bg-brand-text/5">
                        סגור
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
