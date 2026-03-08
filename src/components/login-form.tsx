import { useState } from "react"
import { useAuthActions } from "@convex-dev/auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { FormMessage } from "@/components/form-message"
import { SocialButton } from "@/components/social-button"
import { getErrorMessage } from "@/lib/errors"

type Message = { type: "success" | "error"; text: string }

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await signIn("google")
      // Note: on successful OAuth, the page redirects — code below this line won't run
    } catch (error) {
      console.error("Google sign-in failed:", error)
      const message = getErrorMessage(error, "ההתחברות עם גוגל נכשלה. נסה שוב.")
      setMessage({ type: "error", text: message })
    } finally {
      // Runs on error; on success the page has already redirected
      setIsGoogleLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    setMessage(null)
    try {
      await signIn("resend", { email })
      setMessage({ type: "success", text: "לינק התחברות נשלח! בדקו את תיבת המייל שלכם." })
    } catch (error) {
      console.error("Magic link sign-in failed:", error)
      const message = getErrorMessage(error, "משהו השתבש בעת שליחת המייל. אנא נסו שוב.")
      setMessage({ type: "error", text: message })
    } finally {
      setIsSending(false)
    }
  }

  const isSuccess = message?.type === "success"

  return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="border-brand-text/10 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-brand-text">ברוכים הבאים ל-HopSession 🍻</CardTitle>
            <CardDescription className="text-brand-text/60">
              התחברו כדי להצטרף לטעימות ולחלוק את החשבון
            </CardDescription>
          </CardHeader>
          <CardContent>

              {message && <FormMessage type={message.type} text={message.text} />}

            {!isSuccess && (
                <form onSubmit={handleMagicLink}>
                  <FieldGroup>
                    <Field>
                      <SocialButton onClick={handleGoogleSignIn} isLoading={isGoogleLoading} />
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
            )}

          </CardContent>
        </Card>
      </div>
  )
}
