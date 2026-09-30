import { useState } from "react";
import { BadgeCheckIcon, LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/lib/types";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { getErrorMessage } from "@/lib/errors";
import { authClient } from '@/lib/auth-client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
    user: Exclude<CurrentUser, null>;
}

export function UserMenu({ user }: UserMenuProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [signOutError, setSignOutError] = useState<string | null>(null);

    const initials = user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()
        : "🍻";

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium hidden sm:inline-block text-brand-text">
                {user.name}
            </span>

            <DropdownMenu dir="rtl" onOpenChange={(open) => { if (!open) setSignOutError(null); }}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-brand-text/5">
                        <Avatar>
                            <AvatarImage src={user.image} alt={user.name ?? "User"} />
                            <AvatarFallback className="bg-brand-text/10 text-brand-text font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    className="border-brand-text/10 bg-brand-surface"
                >
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            className="cursor-pointer text-brand-text focus:bg-brand-text/5"
                            onClick={() => setIsEditDialogOpen(true)}
                        >
                            <BadgeCheckIcon className="ml-2 h-4 w-4" />
                            <span>עריכת פרופיל</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="bg-brand-text/10" />

                    <DropdownMenuItem
                        onClick={() => authClient.signOut().then((result) => {
                            if (result.error) {
                                setSignOutError('ההתנתקות נכשלה. נסה שוב.');
                            }
                        }).catch((error) => {
                            console.error("Sign out failed:", error);
                            setSignOutError(getErrorMessage(error, "ההתנתקות נכשלה. נסה שוב."));
                        })}
                        className="text-brand-error focus:bg-brand-error/10 focus:text-brand-error cursor-pointer font-medium"
                    >
                        <LogOutIcon className="ml-2 h-4 w-4" />
                        <span>התנתק</span>
                    </DropdownMenuItem>
                    {signOutError && (
                        <div className="px-2 py-1 text-xs text-brand-error">{signOutError}</div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* הדיאלוג עצמו - מרונדר מחוץ לתפריט כדי למנוע בעיות Z-index */}
            <EditProfileDialog
                user={user}
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
            />
        </div>
    );
}
