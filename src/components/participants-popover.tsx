import { Users } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from '@/components/ui/popover';

interface ParticipantSummary {
    userId: string;
    name: string;
    image?: string;
    beersBrought: number;
    totalSpent: number;
}

interface ParticipantsPopoverProps {
    participants: ParticipantSummary[];
    className?: string;
}

export function ParticipantsPopover({ participants, className }: ParticipantsPopoverProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn('h-9 border-brand-text/20 bg-brand-surface text-brand-text hover:bg-brand-text/5', className)}
                >
                    <Users className="h-4 w-4" />
                    {participants.length} משתתפים
                </Button>
            </PopoverTrigger>

            <PopoverContent dir="rtl" align="end" className="w-[320px] border-brand-text/10 bg-brand-surface">
                <PopoverHeader>
                    <PopoverTitle className="text-brand-text">מי מגיע למפגש</PopoverTitle>
                    <PopoverDescription className="text-brand-text/60">סטטוס מהיר של מי מביא מה</PopoverDescription>
                </PopoverHeader>

                <div className="mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
                    {participants.map((participant) => (
                        <div key={participant.userId} className="flex items-center justify-between rounded-lg border border-brand-text/10 bg-brand-bg/40 px-3 py-2">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 border border-brand-text/10">
                                    <AvatarImage src={participant.image} alt={participant.name} />
                                    <AvatarFallback className="bg-brand-text/5 text-xs text-brand-text">
                                        {participant.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-brand-text">{participant.name}</span>
                            </div>

                            <div className="text-left" dir="ltr">
                                <p className="text-xs text-brand-text/60">{participant.beersBrought} בירות</p>
                                <p className="text-xs font-semibold text-brand-text">₪{participant.totalSpent.toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
