type DebtVariant = "owed" | "owing"

interface DebtRowProps {
    variant: DebtVariant;
    person: string;
    amount: number;
}

export function DebtRow({ variant, person, amount }: DebtRowProps) {
    const isOwed = variant === "owed"

    return (
        <div className={`flex justify-between items-center p-3 rounded-lg border ${
            isOwed
                ? "bg-brand-success/10 border-brand-success/20"
                : "bg-brand-error/10 border-brand-error/20"
        }`}>
            <span className="font-medium text-brand-text">{person}</span>
            <span className={`font-bold ${isOwed ? "text-brand-success" : "text-brand-error"}`} dir="ltr">
        ₪{amount}
      </span>
        </div>
    )
}