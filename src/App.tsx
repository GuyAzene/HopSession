import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/login-form";

export default function App() {
    const { isAuthenticated, isLoading } = useConvexAuth();
    const { signOut } = useAuthActions();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#FFECCC] text-neutral-900 p-4">
            <div className="text-center">
                <h1 className="text-5xl font-black tracking-tight">HopSession 🍻</h1>
                <p className="mt-3 text-neutral-600 font-medium">Split the tab, not the vibe.</p>
            </div>

            <div className="w-full max-w-sm flex flex-col items-center gap-4">
                {isLoading ? (
                    <p className="text-neutral-500 animate-pulse text-lg font-medium">מוזג בירה... 🍺</p>
                ) : isAuthenticated ? (
                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="rounded-xl bg-green-100/50 px-6 py-4 text-center text-sm font-bold text-green-900 border border-green-200/50 w-full shadow-sm">
                            🎉 אתה מחובר בהצלחה!
                        </div>
                        <Button
                            onClick={() => void signOut()}
                            variant="outline"
                            className="w-full border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-[#FFECCC]"
                        >
                            התנתק
                        </Button>
                    </div>
                ) : (
                    // הפתרון לקווץ': אמרנו לטופס לקחת 100% מהרוחב של האבא (max-w-sm)
                    <LoginForm className="w-full" />
                )}
            </div>
        </div>
    );
}