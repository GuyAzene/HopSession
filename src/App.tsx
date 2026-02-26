import { useConvexAuth } from "convex/react";
import { WelcomeScreen } from "@/components/welcome-screen";
import { Dashboard } from "@/components/dashboard";

export default function App() {
    const { isAuthenticated, isLoading } = useConvexAuth();

    if (isLoading) {
        return (
            // הוספנו פה את הצבע של הרקע והטקסט למסך הטעינה
            <div className="flex min-h-screen items-center justify-center bg-[#FFECCC] text-neutral-900">
                <p className="text-neutral-500 animate-pulse text-lg font-medium">מוזג בירה... 🍺</p>
            </div>
        );
    }

    // הראוטינג בפעולה בתוך מעטפת ששומרת על הרקע הגלובלי שלנו!
    return (
        <div className="min-h-screen bg-[#FFECCC] text-neutral-900 font-sans">
            {isAuthenticated ? <Dashboard /> : <WelcomeScreen />}
        </div>
    );
}