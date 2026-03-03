interface BeerCardProps {
  index: number;
}

export function BeerCard({index}: BeerCardProps) {
  return (
      <div className="p-5 border border-brand-text/5 rounded-xl bg-brand-bg/50 flex justify-between items-center transition-all hover:border-brand-text/20">
          <div className="flex flex-col gap-1">
              <h4 className="font-bold text-lg text-brand-text">בירה טעימה מספר {index}</h4>
              <p className="text-sm text-brand-text/60">סגנון: Smoothie Sour | 6.5%</p>
          </div>
          <div className="text-left">
              <p className="font-medium text-brand-text bg-white px-3 py-1 rounded-full border border-brand-text/10">₪45</p>
          </div>
      </div>
  );
}