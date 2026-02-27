import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "@/components/user-menu";

type CurrentUser = FunctionReturnType<typeof api.users.current>;

interface NavbarProps {
    user: CurrentUser | undefined;
}

export function Navbar({ user }: NavbarProps) {
    return (
        <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-brand-surface border-b border-brand-text/10 shadow-sm">
            <h1 className="text-2xl font-black tracking-tight text-brand-text">HopSession</h1>
            {user && <UserMenu user={user} />}
        </header>
    );
}