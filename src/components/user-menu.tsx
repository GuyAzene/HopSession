import { useAuthActions } from "@convex-dev/auth/react";
import { BadgeCheckIcon, LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";

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
    const initials = user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()
        : "🍻";

    return (
        // עטפנו את הכל ב-div שמחזיק גם את השם וגם את האווטאר
        <div className="flex items-center gap-3">
      <span className="text-sm font-medium hidden sm:inline-block">
        {user.name}
      </span>

            <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Avatar>
                            <AvatarImage src={user.image} alt={user.name ?? "User"} />
                            <AvatarFallback className="bg-orange-100 text-orange-900 font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" data-lang="he">
                    <DropdownMenuGroup>
                        <DropdownMenuItem className="cursor-pointer">
                            <BadgeCheckIcon className="ml-2 h-4 w-4" />
                            <span>חשבון</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => void signOut()}
                        className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer font-medium"
                    >
                        <LogOutIcon className="ml-2 h-4 w-4" />
                        <span>התנתק</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}