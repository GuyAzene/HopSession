import { LoginForm } from "@/components/login-form";

export function WelcomeScreen() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
            <div className="text-center">
                {/* וידאנו שהכותרת מקבלת את הצבע העמוק שלנו */}
                <h1 className="text-5xl font-black tracking-tight text-brand-text">HopSession 🍻</h1>

                {/* טקסט משני משתמש בצבע המותג עם 70% אטימות כדי לא לבלוט מדי */}
                <p className="mt-3 text-brand-text/70 font-medium">מחלקים את החשבון, שומרים על האווירה.</p>
            </div>

            <div className="w-full max-w-sm flex flex-col items-center gap-4">
                <LoginForm className="w-full" />
            </div>
        </div>
    );
}