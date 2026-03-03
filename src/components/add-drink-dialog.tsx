import { useState } from "react";
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

interface AddDrinkDialogProps {
    eventId: Id<"events">;
    isOpen: boolean;
    onClose: () => void;
}

export function AddDrinkDialog({ eventId, isOpen, onClose }: AddDrinkDialogProps) {
    // סטייט עבור שאיבת הנתונים
    const [untappdUrl, setUntappdUrl] = useState("");
    const [isScraping, setIsScraping] = useState(false);
    const [scrapeError, setScrapeError] = useState<string | null>(null);

    // סטייט עבור הטופס (הגלוי)
    const [beerName, setBeerName] = useState("");
    const [breweryName, setBreweryName] = useState("");
    const [price, setPrice] = useState("");

    // סטייט עבור נתונים נסתרים מאנטאפד
    const [abv, setAbv] = useState<number | undefined>(undefined);
    const [rating, setRating] = useState<number | undefined>(undefined);
    const [style, setStyle] = useState<string | undefined>(undefined);
    const [beerImageURL, setBeerImageURL] = useState<string | undefined>(undefined);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // חיבור לפונקציות השרת (שים לב לנתיב, תקן אם קראת לקובץ בשם אחר)
    const scrapeUntappdBeer = useAction(api.drinks.scrapeUntappdBeer);
    // תזכורת: נצטרך ליצור את המוטציה הזו בהמשך!
    const addDrink = useMutation(api.drinks.addDrink);

    const handleScrape = async () => {
        if (!untappdUrl.trim()) return;

        setIsScraping(true);
        setScrapeError(null);

        try {
            const data = await scrapeUntappdBeer({ untappdUrl });

            // מילוי אוטומטי של הטופס!
            setBeerName(data.beerName || "");
            setBreweryName(data.breweryName || "");

            // שמירת שאר הנתונים ברקע
            setAbv(data.abv);
            setRating(data.rating);
            setStyle(data.style);
            setBeerImageURL(data.beerImageURL);

        } catch (error) {
            console.error("Scraping failed:", error);
            setScrapeError("לא הצלחנו למשוך נתונים מהלינק. נסה שוב או הזן ידנית.");
        } finally {
            setIsScraping(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!beerName || !price) return;

        setIsSubmitting(true);
        try {
            await addDrink({
                eventId,
                beerName,
                breweryName: breweryName || undefined,
                price: parseFloat(price),
                abv,
                rating,
                style,
                beerImageURL,
                untappdLink: untappdUrl || undefined,
            });

            // איפוס וסגירה
            handleClose();
        } catch (error) {
            console.error("Failed to add drink:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        // איפוס כל הסטייטים בעת סגירת המודל
        setUntappdUrl("");
        setBeerName("");
        setBreweryName("");
        setPrice("");
        setAbv(undefined);
        setRating(undefined);
        setStyle(undefined);
        setBeerImageURL(undefined);
        setScrapeError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent dir="rtl" className="sm:max-w-[425px] bg-brand-surface border-brand-text/10 shadow-lg max-h-[90vh] overflow-y-auto">
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
                                value={untappdUrl}
                                onChange={(e) => setUntappdUrl(e.target.value)}
                                placeholder="https://untappd.com/b/..."
                                dir="ltr"
                                className="border-brand-text/20 bg-brand-surface text-brand-text focus-visible:ring-brand-blue flex-1"
                            />
                            <Button
                                type="button"
                                onClick={handleScrape}
                                disabled={isScraping || !untappdUrl}
                                className="bg-brand-text text-brand-bg hover:bg-brand-text/90 shrink-0"
                            >
                                {isScraping ? <Loader2 className="animate-spin h-4 w-4" /> : <DownloadCloud className="h-4 w-4" />}
                            </Button>
                        </div>

                        {scrapeError && (
                            <div className="text-sm text-brand-error flex items-center gap-1 mt-1">
                                <AlertCircle className="h-3 w-3" />
                                <span>{scrapeError}</span>
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
                                    value={beerName}
                                    onChange={(e) => setBeerName(e.target.value)}
                                    placeholder="לדוגמה: Bianca Raspberry Peach"
                                    className="border-brand-text/20 bg-brand-surface text-brand-text focus-visible:ring-brand-blue"
                                    required
                                    dir="ltr"
                                />
                            </Field>

                            <Field>
                                <FieldLabel className="text-brand-text">מבשלה</FieldLabel>
                                <Input
                                    value={breweryName}
                                    onChange={(e) => setBreweryName(e.target.value)}
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
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="border-brand-text/20 bg-brand-surface text-brand-text focus-visible:ring-brand-blue"
                                    required
                                    dir="ltr"
                                />
                            </Field>
                        </FieldGroup>
                    </form>
                </div>

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
                        disabled={isSubmitting || !beerName || !price}
                        className="bg-brand-text text-brand-bg hover:bg-brand-text/90"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "הוסף למפגש"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}