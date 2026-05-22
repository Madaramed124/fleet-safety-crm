import React from "react";

interface ChargeRowProps {
  idx: number;
  row: any;
  onChange: (idx: number, row: any) => void;
  onRemove: (idx: number) => void;
  validationErrors?: { description?: string; amount?: string } | null;
  disabled?: boolean;
}

const ChargeRow: React.FC<ChargeRowProps> = ({ idx, row, onChange, onRemove, validationErrors, disabled }) => {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
      <div className="space-y-3">
        <select
          disabled={disabled}
          value={row.charge_type || "Warning Letter"}
          onChange={(e) => onChange(idx, { ...row, charge_type: e.target.value })}
          className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 text-sm text-slate-100 outline-none focus:border-cyan-500"
        >
          <option>Warning Letter</option>
          <option>Fine Deduction</option>
          <option>Salary Deduction</option>
          <option>Suspension Notice</option>
          <option>Training Requirement</option>
          <option>Court Referral</option>
          <option>Custom</option>
        </select>

        <div className="grid grid-cols-[1fr_120px] gap-2">
          <div className="relative">
            <input
              disabled={disabled}
              value={row.description || ""}
              onChange={(e) => onChange(idx, { ...row, description: e.target.value })}
              placeholder="Description..."
              className={`h-12 w-full rounded-2xl border px-4 text-sm text-slate-100 outline-none ${validationErrors?.description ? 'border-red-500' : 'border-slate-800'} bg-slate-900 focus:border-cyan-500 ${disabled ? 'opacity-60' : ''}`}
            />
            {validationErrors?.description && <div className="text-red-400 text-xs mt-1">{validationErrors.description}</div>}
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">$</span>
            <input
              disabled={disabled}
              value={row.amount ?? ""}
              onFocus={() => {
                if (!disabled && (row.amount === 0 || row.amount === "0")) {
                  onChange(idx, { ...row, amount: "" });
                }
              }}
              onBlur={(e) => {
                if (!disabled && e.target.value.trim() === "") {
                  onChange(idx, { ...row, amount: "0" });
                }
              }}
              onChange={(e) => onChange(idx, { ...row, amount: e.target.value })}
              placeholder="0"
              className={`h-12 w-full rounded-2xl border border-slate-800 bg-slate-900 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-cyan-500 ${validationErrors?.amount ? 'border-red-500' : ''} ${disabled ? 'opacity-60' : ''}`}
            />
            {validationErrors?.amount && <div className="text-red-400 text-xs mt-1">{validationErrors.amount}</div>}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end">
        <button onClick={() => onRemove(idx)} disabled={disabled} className="text-sm font-semibold text-slate-400 transition hover:text-white disabled:opacity-60">
          Remove
        </button>
      </div>
    </div>
  );
};

export default ChargeRow;
