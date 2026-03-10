import { useReducer } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Loader2, DownloadCloud, AlertCircle } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";

interface AddDrinkDialogProps {
    eventId: Id<"events">;
    isOpen: boolean;
    onClose: () => void;
}

// All form state in one place — avoids 10 separate useState calls and
// makes the reset logic trivial (just dispatch RESET)
interface FormState {
    untappdUrl: string;
    isScraping: boolean;
    scrapeError: string | null;
    beerName: string;
    breweryName: string;
    price: string;
    abv: number | undefined;
    rating: number | undefined;
    style: string | undefined;
    beerImageURL: string | undefined;
    isSubmitting: boolean;
    submitError: string | null;
}

type FormAction =
    | { type: 'SET_UNTAPPD_URL'; payload: string }
    | { type: 'SCRAPE_START' }
    | { type: 'SCRAPE_SUCCESS'; payload: { beerName: string; breweryName?: string; abv?: number; rating?: number; style?: string; beerImageURL?: string } }
    | { type: 'SCRAPE_ERROR'; payload: string }
    | { type: 'SET_FIELD'; field: 'beerName' | 'breweryName' | 'price'; payload: string }
    | { type: 'SUBMIT_START' }
    | { type: 'SUBMIT_END' }
    | { type: 'SET_SUBMIT_ERROR'; payload: string }
    | { type: 'RESET' }

const initialState: FormState = {
    untappdUrl: '',
    isScraping: false,
    scrapeError: null,
    beerName: '',
    breweryName: '',
    price: '',
    abv: undefined,
    rating: undefined,
    style: undefined,
    beerImageURL: undefined,
    isSubmitting: false,
    submitError: null,
};

function formReducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {
        case 'SET_UNTAPPD_URL':
            // Clear stale error when URL changes
            return { ...state, untappdUrl: action.payload, scrapeError: null };
        case 'SCRAPE_START':
            return { ...state, isScraping: true, scrapeError: null };
        case 'SCRAPE_SUCCESS':
            return {
                ...state,
                isScraping: false,
                beerName: action.payload.beerName,
                breweryName: action.payload.breweryName ?? '',
                abv: action.payload.abv,
                rating: action.payload.rating,
                style: action.payload.style,
                beerImageURL: action.payload.beerImageURL,
            };
        case 'SCRAPE_ERROR':
            return { ...state, isScraping: false, scrapeError: action.payload };
        case 'SET_FIELD':
            return { ...state, [action.field]: action.payload };
        case 'SUBMIT_START':
            return { ...state, isSubmitting: true, submitError: null };
        case 'SUBMIT_END':
            return { ...state, isSubmitting: false };
        case 'SET_SUBMIT_ERROR':
            return { ...state, isSubmitting: false, submitError: action.payload };
        case 'RESET':
            return initialState;
    }
}

export function AddDrinkDialog({ eventId, isOpen, onClose }: AddDrinkDialogProps) {
    const [state, dispatch] = useReducer(formReducer, initialState);

    const scrapeUntappdBeer = useAction(api.drinks.scrapeUntappdBeer);
    const addDrink = useMutation(api.drinks.addDrink);

    const handleScrape = async () => {
        if (!state.untappdUrl.trim()) return;

        dispatch({ type: 'SCRAPE_START' });
        try {
            const data = await scrapeUntappdBeer({ untappdUrl: state.untappdUrl });
            dispatch({ type: 'SCRAPE_SUCCESS', payload: data });
        } catch (error) {
            console.error("Scraping failed:", error);
            const message = getErrorMessage(error, "לא הצלחנו למשוך נתונים מהלינק. נסה שוב או הזן ידנית.");
            dispatch({ type: 'SCRAPE_ERROR', payload: message });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.beerName || !state.price) return;

        const parsedPrice = Number.parseFloat(state.price);
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            dispatch({ type: 'SET_SUBMIT_ERROR', payload: 'המחיר חייב להיות מספר חיובי תקין.' });
            return;
        }

        dispatch({ type: 'SUBMIT_START' });
        try {
            await addDrink({
                eventId,
                beerName: state.beerName,
                breweryName: state.breweryName || undefined,
                price: parsedPrice,
                abv: state.abv,
                rating: state.rating,
                style: state.style,
                beerImageURL: state.beerImageURL,
                untappdLink: state.untappdUrl || undefined,
            });
            handleClose();
        } catch (error) {
            console.error("Failed to add drink:", error);
            const message = getErrorMessage(error, 'שגיאה בהוספת הבירה. נסה שוב.');
            dispatch({ type: 'SET_SUBMIT_ERROR', payload: message });
        } finally {
            dispatch({ type: 'SUBMIT_END' });
        }
    };

    // Single RESET action handles all fields — no manual list to maintain
    const handleClose = () => {
        dispatch({ type: 'RESET' });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent dir="rtl" className="sm:max-w-[425px] bg-brand-surface border-brand-text/10 shadow-lg max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-xl text-brand-text">הוספת בירה למפגש</DialogTitle>
                    <DialogDescription className="text-brand-text/60">
                        הדבק לינק מאנטאפד למילוי אוטומטי, או הזן את הפרטים ידנית.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 flex flex-col gap-6">

                    {/* חלק עליון: שאיבה מאנטאפד */}
                    <div className="flex flex-col gap-3 p-4 bg-brand-text/5 rounded-xl border border-brand-text/10">
                        <FieldLabel className="text-brand-text font-bold flex items-center gap-2">
                            <span className="bg-[#FFC000] text-black text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider">Untappd</span>
                            ייבוא מהיר
                        </FieldLabel>
                        <div className="flex gap-2">
                            <Input
                                value={state.untappdUrl}
                                onChange={(e) => dispatch({ type: 'SET_UNTAPPD_URL', payload: e.target.value })}
                                placeholder="https://untappd.com/b/..."
                                dir="ltr"
                                className="border-brand-text/20 bg-brand-surface text-brand-text focus-visible:ring-brand-blue flex-1"
                            />
                            <Button
                                type="button"
                                onClick={handleScrape}
                                disabled={state.isScraping || !state.untappdUrl}
                                className="bg-brand-text text-brand-bg hover:bg-brand-text/90 shrink-0"
                            >
                                {state.isScraping ? <Loader2 className="animate-spin h-4 w-4" /> : <DownloadCloud className="h-4 w-4" />}
                            </Button>
                        </div>

                        {state.scrapeError && (
                            <div className="text-sm text-brand-error flex items-center gap-1 mt-1">
                                <AlertCircle className="h-3 w-3" />
                                <span>{state.scrapeError}</span>
                            </div>
                        )}
                    </div>

                    {/* מפריד SSO קלאסי */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="bg-brand-text/10" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-brand-surface px-2 text-brand-text/50">או הזנה ידנית</span>
                        </div>
                    </div>

                    {/* חלק תחתון: הטופס הידני */}
                    <form id="add-drink-form" onSubmit={handleSubmit}>
                        <FieldGroup className="flex flex-col gap-4">
                            <Field>
                                <FieldLabel className="text-brand-text">שם הבירה <span className="text-brand-error">*</span></FieldLabel>
                                <Input
                                    value={state.beerName}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'beerName', payload: e.target.value })}
                                    placeholder="לדוגמה: Bianca Raspberry Peach"
                                    className="border-brand-text/20 bg-brand-surface text-brand-text focus-visible:ring-brand-blue"
                                    required
                                    dir="ltr"
                                />
                            </Field>

                            <Field>
                                <FieldLabel className="text-brand-text">מבשלה</FieldLabel>
                                <Input
                                    value={state.breweryName}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'breweryName', payload: e.target.value })}
                                    placeholder="לדוגמה: Omnipollo"
                                    className="border-brand-text/20 bg-brand-surface text-brand-text focus-visible:ring-brand-blue"
                                    dir="ltr"
                                />
                            </Field>

                            <Field>
                                <FieldLabel className="text-brand-text">מחיר (₪) <span className="text-brand-error">*</span></FieldLabel>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={state.price}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'price', payload: e.target.value })}
                                    placeholder="0.00"
                                    className="border-brand-text/20 bg-brand-surface text-brand-text focus-visible:ring-brand-blue"
                                    required
                                    dir="ltr"
                                />
                            </Field>
                        </FieldGroup>
                    </form>
                </div>

                {state.submitError && (
                    <div className="text-sm text-brand-error flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{state.submitError}</span>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClose}
                        className="text-brand-text hover:bg-brand-text/5"
                    >
                        ביטול
                    </Button>
                    <Button
                        type="submit"
                        form="add-drink-form"
                        disabled={state.isSubmitting || !state.beerName || !state.price}
                        className="bg-brand-text text-brand-bg hover:bg-brand-text/90"
                    >
                        {state.isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "הוסף למפגש"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
