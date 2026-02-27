import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { BadgeCheckIcon, LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import { EditProfileDialog } from "@/components/edit-profile-dialog"; // ייבוא הקומפוננטה החדשה

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CurrentUser = FunctionReturnType<typeof api.users.current>;

interface UserMenuProps {
    user: Exclude<CurrentUser, null>;
}

export function UserMenu({ user }: UserMenuProps) {
    const { signOut } = useAuthActions();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

            <DropdownMenu dir="rtl">
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
                        {/* לחיצה כאן פותחת את הדיאלוג */}
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
                        onClick={() => void signOut()}
                        className="text-brand-error focus:bg-brand-error/10 focus:text-brand-error cursor-pointer font-medium"
                    >
                        <LogOutIcon className="ml-2 h-4 w-4" />
                        <span>התנתק</span>
                    </DropdownMenuItem>
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