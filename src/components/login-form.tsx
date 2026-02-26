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

export function LoginForm({
                            className,
                            ...props
                          }: React.ComponentProps<"div">) {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await signIn("resend", { email });
      alert("Magic link sent! Check your inbox.");
    } catch (error) {
      console.error("Failed to send magic link", error);
      alert("Something went wrong. Did you configure an email provider in auth.ts?");
    } finally {
      setIsSending(false);
    }
  };

  return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome to HopSession 🍻</CardTitle>
            <CardDescription>
              Login to join the tasting and split the tab
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMagicLink}>
              <FieldGroup>

                {/* בדיוק כמו במקור - בלי תוספות של רוחב או פלקס! */}
                <Field>
                  <Button variant="outline" type="button" onClick={() => void signIn("github")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fill="currentColor" />
                    </svg>
                    GitHub
                  </Button>
                  <Button variant="outline" type="button" onClick={() => void signIn("google")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor" />
                    </svg>
                    Google
                  </Button>
                </Field>

                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                  Or continue with email
                </FieldSeparator>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                      id="email"
                      type="email"
                      placeholder="youremail@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                  />
                </Field>

                <Field>
                  <Button type="submit" disabled={isSending}>
                    {isSending ? "Sending link..." : "Send Magic Link"}
                  </Button>
                </Field>

              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
  )
}