import { LoginForm } from "@/components/login-form";

export function WelcomeScreen() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
            <div className="text-center">
                <h1 className="text-5xl font-black tracking-tight">HopSession 🍻</h1>
                <p className="mt-3 text-neutral-600 font-medium">מחלקים את החשבון, שומרים על האווירה.</p>
            </div>

            <div className="w-full max-w-sm flex flex-col items-center gap-4">
                <LoginForm className="w-full" />
            </div>
        </div>
    );
}