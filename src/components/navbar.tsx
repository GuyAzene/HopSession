import { Link } from "@tanstack/react-router";
import { UserMenu } from "@/components/user-menu";
import { useCurrentUser } from "@/lib/hooks";

export function Navbar() {
    const user = useCurrentUser();

    return (
        <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-brand-surface border-b border-brand-text/10 shadow-sm">
            <h1 className="text-2xl font-black tracking-tight">
                <Link
                    to="/"
                    className="text-brand-text hover:text-brand-text/80 transition-colors"
                >
                    HopSession
                </Link>
            </h1>

            {user && <UserMenu user={user} />}
        </header>
    );
}
