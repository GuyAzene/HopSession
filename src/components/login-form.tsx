import { useState } from "react"
import { useAuthActions } from "@convex-dev/auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

export function LoginForm({
                            className,
                            ...props
                          }: React.ComponentProps<"div">) {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const isError = message?.type === "error";

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setMessage(null);

    try {
      await signIn("resend", { email });
      setMessage({ type: "success", text: "לינק התחברות נשלח! בדקו את תיבת המייל שלכם." });
    } catch (error) {
      console.error("Failed to send magic link", error);
      setMessage({ type: "error", text: "משהו השתבש בעת שליחת המייל. אנא נסו שוב." });
    } finally {
      setIsSending(false);
    }
  };

  return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        {/* אפשר גם פה לדרוס את הרקע הלבן של הקלף אם נרצה בעתיד, כרגע נשאיר אותו נקי */}
        <Card className="border-brand-text/10 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-brand-text">ברוכים הבאים ל-HopSession 🍻</CardTitle>
            <CardDescription className="text-brand-text/60">
              התחברו כדי להצטרף לטעימות ולחלוק את החשבון
            </CardDescription>
          </CardHeader>
          <CardContent>

            {message && (
                <Alert
                    // הורדנו את ה-variant המובנה כדי לשלוט בצבעים דרך המותג שלנו
                    variant="default"
                    className={cn(
                        "mb-6 text-right",
                        isError
                            ? "border-brand-error text-brand-error bg-brand-error/10"
                            : "border-brand-success text-brand-success bg-brand-success/10"
                    )}
                >
                  {isError
                      ? <AlertCircle className="stroke-brand-error" />
                      : <CheckCircle2 className="stroke-brand-success" />
                  }
                  <AlertTitle className="mr-6 mb-1 font-bold">
                    {isError ? "שגיאה" : "נשלח בהצלחה!"}
                  </AlertTitle>
                  <AlertDescription className="mr-6">
                    {message.text}
                  </AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleMagicLink}>
              <FieldGroup>

                <Field>
                  <Button
                      variant="outline"
                      type="button"
                      onClick={() => void signIn("google")}
                      className="border-brand-text/20 text-brand-text hover:bg-brand-text/5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="ml-2 h-4 w-4">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor" />
                    </svg>
                    Google
                  </Button>
                </Field>

                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card text-brand-text/50">
                  או המשיכו בעזרת אימייל
                </FieldSeparator>

                <Field>
                  <FieldLabel htmlFor="email" className="text-brand-text">אימייל</FieldLabel>
                  <Input
                      id="email"
                      type="email"
                      placeholder="moshe@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      dir="ltr"
                      className="text-left border-brand-text/20 focus-visible:ring-brand-blue"
                  />
                </Field>

                <Field>
                  <Button
                      type="submit"
                      disabled={isSending}
                      className="bg-brand-text text-brand-bg hover:bg-brand-text/90"
                  >
                    {isSending ? "שולח לינק..." : "שלח לינק התחברות"}
                  </Button>
                </Field>

              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
  )
}