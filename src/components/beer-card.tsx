import { useState } from 'react';
import { useMutation } from 'convex/react';
import { MoreVertical, PencilLine, Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Beer } from "lucide-react";
import type { Doc } from "../../convex/_generated/dataModel";
import { api } from '../../convex/_generated/api';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BeerCardProps {
    beer: Doc<"drinks">;
    payerName: string;
    canManage: boolean;
}

export function BeerCard({ beer, payerName, canManage }: BeerCardProps) {
    const updateDrink = useMutation(api.drinks.updateDrink);
    const removeDrink = useMutation(api.drinks.removeDrink);

    const [isEditing, setIsEditing] = useState(false);
    const [beerName, setBeerName] = useState(beer.beerName);
    const [breweryName, setBreweryName] = useState(beer.breweryName ?? '');
    const [price, setPrice] = useState(beer.price.toString());
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // בונים את רשימת פרטי המשנה (מבשלה, סגנון, אחוז אלכוהול) בצורה חכמה
    // זה מונע מצב של נקודות מפרידות (•) כפולות או תלויות באוויר אם חסר נתון
    const details = [];
    if (beer.breweryName) {
        details.push(<span key="brewery" className="font-medium text-brand-text/80">{beer.breweryName}</span>);
    }
    if (beer.style) {
        details.push(<span key="style">{beer.style}</span>);
    }
    if (beer.abv !== undefined) {
        details.push(<span key="abv" dir="ltr">{beer.abv}%</span>);
    }

    const handleSave = async () => {
        const parsedPrice = Number.parseFloat(price);
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            setError('המחיר חייב להיות מספר חיובי תקין.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await updateDrink({
                drinkId: beer._id,
                beerName,
                breweryName,
                price: parsedPrice,
            });
            setIsEditing(false);
        } catch (err) {
            setError(getErrorMessage(err, 'שמירת השינויים נכשלה. נסה שוב.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        const shouldDelete = window.confirm('למחוק את הבירה מהרשימה?');
        if (!shouldDelete) {
            return;
        }

        setIsDeleting(true);
        setError(null);

        try {
            await removeDrink({ drinkId: beer._id });
        } catch (err) {
            setError(getErrorMessage(err, 'מחיקת הבירה נכשלה. נסה שוב.'));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="rounded-xl border border-brand-text/10 bg-brand-surface px-4 py-3 transition-all hover:border-brand-text/25">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-11 w-11 border border-brand-text/10 bg-white shadow-sm shrink-0 mt-0.5">
                        <AvatarImage
                            src={beer.beerImageURL}
                            alt={beer.beerName}
                            className="object-contain p-1"
                        />
                        <AvatarFallback className="bg-brand-text/5">
                            <Beer className="h-5 w-5 text-brand-text/40" />
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-base text-brand-text leading-tight">{beer.beerName}</h4>
                            <span className="rounded-full bg-brand-text/5 px-2 py-0.5 text-xs text-brand-text/70">{payerName}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-text/60">
                            {details.map((detail, index) => (
                                <span key={index} className="flex items-center gap-x-2">
                                    {detail}
                                    {index < details.length - 1 && <span className="text-brand-text/30">•</span>}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <p className="rounded-full border border-brand-text/10 bg-brand-bg px-3 py-1 text-sm font-semibold text-brand-text" dir="ltr">
                        ₪{beer.price.toFixed(2)}
                    </p>

                    {canManage && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-text hover:bg-brand-text/5">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-brand-text/10 bg-brand-surface">
                                <DropdownMenuItem className="text-brand-text" onClick={() => setIsEditing(true)}>
                                    <PencilLine className="h-4 w-4" />
                                    עריכה
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                    <Trash2 className="h-4 w-4" />
                                    מחיקה
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {isEditing && canManage && (
                <div className="mt-3 rounded-lg border border-brand-text/10 bg-brand-bg/40 p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <Input
                            value={beerName}
                            onChange={(event) => setBeerName(event.target.value)}
                            placeholder="שם הבירה"
                            className="border-brand-text/20"
                        />
                        <Input
                            value={breweryName}
                            onChange={(event) => setBreweryName(event.target.value)}
                            placeholder="מבשלה"
                            className="border-brand-text/20"
                        />
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={price}
                            onChange={(event) => setPrice(event.target.value)}
                            placeholder="מחיר"
                            dir="ltr"
                            className="border-brand-text/20"
                        />
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                        <Button variant="ghost" className="text-brand-text hover:bg-brand-text/5" onClick={() => setIsEditing(false)}>
                            ביטול
                        </Button>
                        <Button className="bg-brand-text text-brand-bg hover:bg-brand-text/90" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'שומר...' : 'שמירה'}
                        </Button>
                    </div>
                </div>
            )}

            {error && <p className="mt-2 text-xs text-brand-error">{error}</p>}
        </div>
    );
}
