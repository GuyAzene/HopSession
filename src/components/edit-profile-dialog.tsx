import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
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
import { Loader2, AlertCircle } from "lucide-react";

interface EditProfileDialogProps {
    user: Doc<"users">;
    isOpen: boolean;
    onClose: () => void;
}

export function EditProfileDialog({ user, isOpen, onClose }: EditProfileDialogProps) {
    const [name, setName] = useState(user.name ?? "");
    const [phone, setPhone] = useState(user.phone ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const updateProfile = useMutation(api.users.updateProfile);

    // עדכון הסטייט המקומי אם המשתמש משתנה ברקע
    useEffect(() => {
        setName(user.name ?? "");
        setPhone(user.phone ?? "");
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await updateProfile({ name, phone });
            onClose();
        } catch (error) {
            console.error("Failed to update profile:", error);
            const message = error instanceof ConvexError
                ? String(error.data)
                : 'שגיאה בשמירת הפרופיל. נסה שוב.';
            setSubmitError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent dir="rtl" className="sm:max-w-[425px] bg-brand-surface border-brand-text/10 shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl text-brand-text text-right">עריכת פרופיל</DialogTitle>
                    <DialogDescription className="text-brand-text/60 text-right">
                        עדכן את הפרטים האישיים שלך כדי שחבריך יוכלו לזהות אותך.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="py-4 text-right">
                    <FieldGroup className="flex flex-col gap-6">
                        <Field>
                            <FieldLabel className="text-brand-text">שם מלא</FieldLabel>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ישראל ישראלי"
                                className="border-brand-text/20 bg-brand-surface text-brand-text focus-visible:ring-brand-blue"
                                required
                            />
                        </Field>

                        <Field>
                            <FieldLabel className="text-brand-text text-right">אימייל (לקריאה בלבד)</FieldLabel>
                            <Input
                                value={user.email}
                                disabled
                                className="border-brand-text/10 bg-brand-text/5 text-brand-text/50 cursor-not-allowed text-left"
                                dir="ltr"
                            />
                        </Field>

                        <Field>
                            <FieldLabel className="text-brand-text">טלפון</FieldLabel>
                            <Input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="050-0000000"
                                className="border-brand-text/20 bg-brand-surface text-brand-text focus-visible:ring-brand-blue"
                                dir="ltr"
                            />
                        </Field>
                    </FieldGroup>

                    {submitError && (
                        <div className="mt-4 text-sm text-brand-error flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{submitError}</span>
                        </div>
                    )}

                    <DialogFooter className="mt-8 gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-brand-text hover:bg-brand-text/5"
                        >
                            ביטול
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-brand-text text-brand-bg hover:bg-brand-text/90"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "שמור שינויים"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}