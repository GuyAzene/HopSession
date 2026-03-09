import { useMemo, useState } from 'react';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { AlertCircle, Loader2, UserRound } from 'lucide-react';

import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/errors';

export const Route = createFileRoute('/invite/$eventId')({
    beforeLoad: async ({ params, context }) => {
        const { eventId } = params;
        if (!eventId.trim()) {
            throw new Error('קישור הזמנה לא תקין');
        }

        const convex = context.convex;
        const invite = await convex.query(api.events.getInviteDetails, {
            eventId: eventId as Id<'events'>,
        });

        if (invite.alreadyParticipant) {
            throw redirect({
                to: '/event/$eventId',
                params: { eventId },
            });
        }

        return { invite };
    },
    component: RouteComponent,
});

function RouteComponent() {
    const navigate = useNavigate();
    const { eventId } = Route.useParams();
    const { invite } = Route.useRouteContext();
    const join = useMutation(api.events.addParticipant);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const formattedDate = useMemo(() => {
        return new Date(invite.date).toLocaleDateString('he-IL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }, [invite.date]);

    const handleJoin = async () => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            await join({ eventId: eventId as Id<'events'> });
            await navigate({
                to: '/event/$eventId',
                params: { eventId },
            });
        } catch (error) {
            setSubmitError(getErrorMessage(error, 'לא הצלחנו לצרף אותך למפגש כרגע. נסה שוב.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDecline = async () => {
        await navigate({ to: '/' });
    };

    return (
        <div className="mx-auto mt-10 w-full max-w-xl px-4">
            <Card className="border-brand-text/10 bg-brand-surface shadow-sm">
                <CardHeader className="text-right">
                    <CardTitle className="text-2xl text-brand-text">הזמנה למפגש</CardTitle>
                    <CardDescription className="text-brand-text/60">
                        רגע לפני שמצטרפים, הנה הפרטים של המפגש.
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-5">
                    <div className="rounded-xl border border-brand-text/10 bg-brand-bg/40 p-4 text-right">
                        <p className="text-xs text-brand-text/60">שם המפגש</p>
                        <p className="text-lg font-bold text-brand-text">{invite.name}</p>

                        <div className="mt-3 flex items-center justify-end gap-2 text-sm text-brand-text/70">
                            <UserRound className="h-4 w-4" />
                            <span>{invite.ownerName}</span>
                        </div>

                        <p className="mt-2 text-sm text-brand-text/70">{formattedDate}</p>
                    </div>

                    {!invite.canJoin && invite.joinBlockedReason && (
                        <div className="flex items-center gap-2 rounded-md border border-brand-error/20 bg-brand-error/10 px-3 py-2 text-sm text-brand-error">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <p>{invite.joinBlockedReason}</p>
                        </div>
                    )}

                    {submitError && (
                        <div className="flex items-center gap-2 rounded-md border border-brand-error/20 bg-brand-error/10 px-3 py-2 text-sm text-brand-error">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <p>{submitError}</p>
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleDecline}
                            className="text-brand-text hover:bg-brand-text/5"
                        >
                            לא תודה
                        </Button>

                        <Button
                            type="button"
                            disabled={!invite.canJoin || isSubmitting}
                            onClick={handleJoin}
                            className="bg-brand-text text-brand-bg hover:bg-brand-text/90"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'כן, לצרף אותי'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
