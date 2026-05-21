import React from "react";

const suggestionMap: Record<string, string[]> = {
  speeding: ["Warning Letter", "Fine Deduction"],
  seatbelt: ["Warning Letter"],
  dui: ["Suspension Notice", "Court Referral"],
};

const SuggestedCharges: React.FC<{ category?: string; onAdd: (type: string) => void }> = ({ category, onAdd }) => {
  const suggestions = category ? suggestionMap[category.toLowerCase()] || [] : [];
  if (suggestions.length === 0) return null;
  return (
    <div className="mt-3">
      <div className="text-xs text-slate-400 mb-2">Suggested charges</div>
      <div className="flex gap-2">
        {suggestions.map(s => (
          <button key={s} onClick={() => onAdd(s)} className="px-3 py-1 rounded bg-slate-800 border border-slate-700">{s}</button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedCharges;
