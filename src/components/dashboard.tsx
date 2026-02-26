import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Dashboard() {
    const { signOut } = useAuthActions();
    // שולפים את המשתמש שלנו מהשרת
    const user = useQuery(api.users.current);

    // מייצרים ראשי תיבות לשים באווטאר במקרה שאין תמונה
    const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : "🍻";

    return (
        <div className="min-h-screen flex flex-col">
            {/* תפריט עליון (Navbar) */}
            <header className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-md border-b border-orange-200/50">
                <h1 className="text-2xl font-black tracking-tight">HopSession</h1>

                {user && (
                    <div className="flex items-center gap-3">
            <span className="text-sm font-medium hidden sm:inline-block">
              {user.name}
            </span>
                        <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-orange-200/50">
                                    <Avatar>
                                        <AvatarImage src={user.pictureUrl} alt={user.name ?? "User"} />
                                        <AvatarFallback className="bg-orange-100 text-orange-900 font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                    onClick={() => void signOut()}
                                    className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer font-medium"
                                >
                                    התנתק
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </header>

            {/* אזור התוכן המרכזי שבו נשים את הבירות */}
            <main className="flex-1 p-4">
                <div className="max-w-4xl mx-auto mt-12 text-center text-neutral-500">
                    <p className="text-lg">כאן יופיעו האירועים והבירות שלנו בקרוב!</p>
                </div>
            </main>
        </div>
    );
}