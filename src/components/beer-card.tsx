import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Beer } from "lucide-react";
import type { Doc } from "../../convex/_generated/dataModel";

interface BeerCardProps {
    beer: Doc<"drinks">;
}

export function BeerCard({ beer }: BeerCardProps) {
    // בונים את רשימת פרטי המשנה (מבשלה, סגנון, אחוז אלכוהול) בצורה חכמה
    // זה מונע מצב של נקודות מפרידות (•) כפולות או תלויות באוויר אם חסר נתון
    const details = [];
    if (beer.breweryName) {
        details.push(<span key="brewery" className="font-medium text-brand-text/80">{beer.breweryName}</span>);
    }
    if (beer.style) {
        details.push(<span key="style">{beer.style}</span>);
    }
    if (beer.abv !== undefined) {
        details.push(<span key="abv" dir="ltr">{beer.abv}%</span>);
    }

    return (
        // שינינו ל-items-start כדי שהתמונה והמחיר יישארו למעלה כשהטקסט יורד שורה
        <div className="p-4 md:p-5 border border-brand-text/5 rounded-xl bg-brand-bg/50 flex justify-between items-start transition-all hover:border-brand-text/20 gap-4">

            {/* צד ימין: תמונה ופרטים */}
            <div className="flex items-start gap-4 flex-1">
                {/* התמונה של הבירה */}
                <Avatar className="h-12 w-12 md:h-14 md:w-14 border border-brand-text/10 bg-white shadow-sm shrink-0 mt-0.5">
                    <AvatarImage
                        src={beer.beerImageURL}
                        alt={beer.beerName}
                        className="object-contain p-1"
                    />
                    <AvatarFallback className="bg-brand-text/5">
                        <Beer className="h-6 w-6 text-brand-text/40" />
                    </AvatarFallback>
                </Avatar>

                {/* טקסטים - ללא הגבלות אורך! */}
                <div className="flex flex-col gap-1.5 pt-0.5">
                    <h4 className="font-bold text-lg text-brand-text leading-tight">
                        {beer.beerName}
                    </h4>

                    {/* flex-wrap דואג שאם הסגנון או המבשלה ארוכים מדי - הם ירדו שורה מסודר */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-brand-text/60">
                        {details.map((detail, index) => (
                            <React.Fragment key={index}>
                                {detail}
                                {index < details.length - 1 && <span className="text-brand-text/30">•</span>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* צד שמאל: מחיר */}
            <div className="text-left shrink-0 mt-1">
                <p className="font-medium text-brand-text bg-white px-3 py-1.5 rounded-full border border-brand-text/10 shadow-sm" dir="ltr">
                    ₪{beer.price.toFixed(2)}
                </p>
            </div>

        </div>
    );
}