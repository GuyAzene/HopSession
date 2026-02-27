import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "@/components/user-menu";

type CurrentUser = FunctionReturnType<typeof api.users.current>;

interface NavbarProps {
    user: CurrentUser | undefined;
}

export function Navbar({ user }: NavbarProps) {
    return (
        <header className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-md border-b border-orange-200/50">
            <h1 className="text-2xl font-black tracking-tight">HopSession</h1>
            {user && <UserMenu user={user} />}
        </header>
    );
}