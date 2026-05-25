import React, { useEffect } from "react";
import ChargeRow from "./ChargeRow";
import { IncidentRecord } from "../../types";

const emptyRow = () => ({
  charge_type: "Warning Letter",
  section: "",
  description: "",
  violation_group: "",
  severity: "",
  weight: "",
  total_csa_points: "",
  amount: "",
  document_url: null
});

const ChargeBuilder: React.FC<{ record: IncidentRecord | null; rows: any[]; setRows: (r: any[]) => void; onDirty?: (d: boolean) => void; validationErrors?: Record<number, { description?: string; amount?: string }>; disabled?: boolean; notes?: string; setNotes?: (s: string) => void }> = ({ record, rows, setRows, onDirty, validationErrors, disabled, notes, setNotes }) => {
  useEffect(() => {
    // reset when selected inspection changes
    setRows([emptyRow()]);
    if (onDirty) {
      onDirty(false);
    }
  }, [record, onDirty, setRows]);

  const updateRow = (idx: number, row: any) => {
    const copy = [...rows];
    copy[idx] = row;
    setRows(copy);
    if (onDirty) {
      onDirty(true);
    }
  };

  const removeRow = (idx: number) => {
    if ((rows || []).length <= 1) {
      setRows([emptyRow()]);
    } else {
      setRows(rows.filter((_, i) => i !== idx));
    }
    if (onDirty) {
      onDirty(true);
    }
  };

  const addRow = () => {
    setRows([...(rows || []), emptyRow()]);
    if (onDirty) {
      onDirty(true);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-100">Charge Builder</div>
          <div className="text-xs text-slate-400">Build one or more charge lines for the selected inspection.</div>
        </div>
        <button
          onClick={addRow}
          disabled={disabled}
          className="text-sm font-semibold text-[#1D9E75] transition hover:text-white disabled:opacity-50"
        >
          + Add another charge
        </button>
      </div>

      {!record ? (
        <div className="flex h-full items-center justify-center rounded-3xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-500">
          Select an inspection record to begin.
        </div>
      ) : (
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
            {(rows || []).map((r, i) => (
              <ChargeRow key={i} idx={i} row={r} onChange={updateRow} onRemove={removeRow} validationErrors={validationErrors?.[i]} disabled={disabled} />
            ))}
          </div>

          <div className="pt-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 mb-2">Notes</label>
            <textarea
              value={notes || ""}
              onChange={(e) => setNotes && setNotes(e.target.value)}
              disabled={disabled}
              className="w-full min-h-[108px] rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-[#1D9E75]"
              placeholder="Add notes for this charge batch"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargeBuilder;
