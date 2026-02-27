import { useConvexAuth } from "convex/react";
import { WelcomeScreen } from "@/components/welcome-screen";
import { Dashboard } from "@/components/dashboard";

export default function App() {
    const { isAuthenticated, isLoading } = useConvexAuth();

    if (isLoading) {
        return (
            // שימוש בצבעי המותג החדשים במקום צבעים מקודדים
            <div className="flex min-h-screen items-center justify-center bg-brand-bg text-brand-text">
                <p className="text-brand-text/70 animate-pulse text-lg font-medium">מוזג בירה... 🍺</p>
            </div>
        );
    }

    // הראוטינג בפעולה בתוך מעטפת ששומרת על הרקע והטקסט הגלובלי שלנו
    return (
        <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
            {isAuthenticated ? <Dashboard /> : <WelcomeScreen />}
        </div>
    );
}