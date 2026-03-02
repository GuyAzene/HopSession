import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type FormMessageProps = {
    type: "success" | "error"
    text: string
}

export function FormMessage({ type, text }: FormMessageProps) {
    const isError = type === "error"
    return (
        <Alert
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
            <AlertDescription className="mr-6">{text}</AlertDescription>
        </Alert>
    )
}