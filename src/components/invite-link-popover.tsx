import { useMemo, useState } from 'react';
import { Check, Copy, Link2, Share2 } from 'lucide-react';

import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface InviteLinkPopoverProps {
    eventId: Id<'events'>;
    className?: string;
}

type CopyState = 'idle' | 'copied' | 'error';

export function InviteLinkPopover({ eventId, className }: InviteLinkPopoverProps) {
    const [copyState, setCopyState] = useState<CopyState>('idle');
    const inviteUrl = useMemo(() => {
        if (typeof window === 'undefined') {
            return `/invite/${eventId}`;
        }

        return `${window.location.origin}/invite/${eventId}`;
    }, [eventId]);

    const canUseShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopyState('copied');
            window.setTimeout(() => setCopyState('idle'), 1500);
        } catch {
            setCopyState('error');
        }
    };

    const handleShare = async () => {
        if (!canUseShare) {
            return;
        }

        try {
            await navigator.share({
                title: 'הזמנה למפגש HopSession',
                text: 'בואו נצטרף למפגש טעימות',
                url: inviteUrl,
            });
        } catch {
            // User canceled share sheet or sharing failed.
        }
    };

    const copyLabel = copyState === 'copied' ? 'הועתק!' : 'העתק קישור';

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn('border-brand-text/20 text-brand-text hover:bg-brand-text/5', className)}
                >
                    <Link2 className="h-4 w-4" />
                    הזמן משתתפים
                </Button>
            </PopoverTrigger>

            <PopoverContent dir="rtl" align="end" className="w-[320px] border-brand-text/10 bg-brand-surface">
                <PopoverHeader>
                    <PopoverTitle className="text-brand-text">קישור הזמנה</PopoverTitle>
                    <PopoverDescription className="text-brand-text/60">שתף את הקישור עם מי שתרצה לצרף למפגש.</PopoverDescription>
                </PopoverHeader>

                <div className="mt-3 flex flex-col gap-2">
                    <Input
                        readOnly
                        value={inviteUrl}
                        dir="ltr"
                        className="border-brand-text/20 bg-brand-bg/40 text-brand-text"
                    />

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            onClick={handleCopy}
                            className="flex-1 bg-brand-text text-brand-bg hover:bg-brand-text/90"
                        >
                            {copyState === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copyLabel}
                        </Button>

                        {canUseShare && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleShare}
                                className="border-brand-text/20 text-brand-text hover:bg-brand-text/5"
                            >
                                <Share2 className="h-4 w-4" />
                                שתף
                            </Button>
                        )}
                    </div>

                    {copyState === 'error' && (
                        <p className="text-xs text-brand-error">לא הצלחנו להעתיק את הקישור. אפשר להעתיק ידנית מהשדה למעלה.</p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
