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
    <div className="flex gap-2 items-start">
      <select value={row.charge_type || "Warning Letter"} onChange={(e) => onChange(idx, { ...row, charge_type: e.target.value })} className="px-2 py-2 bg-slate-900 border border-slate-700 rounded">
        <option>Warning Letter</option>
        <option>Fine Deduction</option>
        <option>Salary Deduction</option>
        <option>Suspension Notice</option>
        <option>Training Requirement</option>
        <option>Court Referral</option>
        <option>Custom</option>
      </select>
      <div className="flex-1">
        <input
          disabled={disabled}
          value={row.description || ""}
          onChange={(e) => onChange(idx, { ...row, description: e.target.value })}
          placeholder="Description"
          className={`w-full px-2 py-2 bg-slate-900 border ${validationErrors?.description ? 'border-red-500' : 'border-slate-700'} rounded ${disabled ? 'opacity-60' : ''}`}
        />
        {validationErrors?.description && <div className="text-red-400 text-xs mt-1">{validationErrors.description}</div>}
      </div>
      <div className="w-24">
        <input
          disabled={disabled}
          value={row.amount ?? ""}
          onChange={(e) => onChange(idx, { ...row, amount: e.target.value })}
          placeholder="Amount"
          className={`w-full px-2 py-2 bg-slate-900 border ${validationErrors?.amount ? 'border-red-500' : 'border-slate-700'} rounded ${disabled ? 'opacity-60' : ''}`}
        />
        {validationErrors?.amount && <div className="text-red-400 text-xs mt-1">{validationErrors.amount}</div>}
      </div>
      <button onClick={() => onRemove(idx)} disabled={disabled} className="px-2 py-2 text-red-400 disabled:opacity-60">×</button>
    </div>
  );
};

export default ChargeRow;
