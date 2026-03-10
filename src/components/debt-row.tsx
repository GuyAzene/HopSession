interface DebtRowProps {
    personName: string;
    amount: number;
    youOwe: boolean; // true = you owe them, false = they owe you
}

export function DebtRow({ personName, amount, youOwe }: DebtRowProps) {
    return (
        <div className={`flex justify-between items-center p-3 rounded-lg border ${
            youOwe
                ? 'bg-brand-error/10 border-brand-error/20'
                : 'bg-brand-success/10 border-brand-success/20'
        }`}>
            <span className="font-medium text-brand-text">
                {youOwe ? `אתה חייב ל${personName}` : `${personName} חייב לך`}
            </span>
            <span className={`font-bold ${youOwe ? 'text-brand-error' : 'text-brand-success'}`} dir="ltr">
                ₪{amount.toFixed(2)}
            </span>
        </div>
    );
}
