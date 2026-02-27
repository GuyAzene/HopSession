import {useQuery} from "convex/react";
import {api} from "../../convex/_generated/api";
import {Navbar} from "@/components/navbar.tsx";

export function Dashboard() {
    // שולפים את המשתמש שלנו מהשרת
    const user = useQuery(api.users.current);

    // מייצרים ראשי תיבות לשים באווטאר במקרה שאין תמונה
    return (
        <div className="min-h-screen flex flex-col">
            {/* תפריט עליון (Navbar) */}
            <Navbar user={user} />

            {/* אזור התוכן המרכזי שבו נשים את הבירות */}
            <main className="flex-1 p-4">
                <div className="max-w-4xl mx-auto mt-12 text-center text-neutral-500">
                    <p className="text-lg">כאן יופיעו האירועים והבירות שלנו בקרוב!</p>
                </div>
            </main>
        </div>
    );
}