import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";

// שואבים את הטייפ המדויק מהשרת, בדיוק כמו שעשינו קודם
type CurrentUser = FunctionReturnType<typeof api.users.current>;

interface EventsFeedProps {
    user: CurrentUser | undefined;
}

export function EventsFeed({ user }: EventsFeedProps) {
    const isLoading = user === undefined;
    return (
        <div className="max-w-4xl mx-auto mt-8">
            {/* אזור הכותרת והכפתור */}
            <div className="flex items-center justify-between mb-8">
                {/* שימוש בשם המשתמש בכותרת */}
                <h2 className="text-2xl font-bold tracking-tight">המפגשים הבאים שלך</h2>
                <Button disabled={isLoading} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6">
                    <PlusCircle className="h-5 w-5" />
                    <span>מפגש חדש</span>
                </Button>
            </div>

            {/* אזור התוכן */}
            <div className="text-center text-neutral-500 bg-white/50 border-2 border-dashed border-orange-200 rounded-2xl p-16 shadow-sm">
                <div className="text-4xl mb-4">🍻</div>
                <h3 className="text-lg font-semibold text-neutral-700 mb-2">עדיין אין כאן מפגשים...</h3>
                <p className="text-neutral-500">
                    זה הזמן לפתוח סשן טעימות חדש ולהזמין את החבר'ה!
                </p>
            </div>
        </div>
    );
}