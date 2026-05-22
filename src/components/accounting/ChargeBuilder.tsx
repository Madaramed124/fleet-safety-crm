import React, { useEffect, useState } from "react";
import ChargeRow from "./ChargeRow";
import { IncidentRecord } from "../../types";

const emptyRow = () => ({ charge_type: "Warning Letter", description: "", amount: "", document_url: null });

const ChargeBuilder: React.FC<{ record: IncidentRecord | null; rows: any[]; setRows: (r: any[]) => void; onDirty?: (d: boolean) => void; validationErrors?: Record<number, { description?: string; amount?: string }>; disabled?: boolean; notes?: string; setNotes?: (s: string) => void }> = ({ record, rows, setRows, onDirty, validationErrors, disabled, notes, setNotes }) => {
  useEffect(() => {
    // reset when selected inspection changes
    setRows([emptyRow()]);
    onDirty && onDirty(false);
  }, [record]);

  const updateRow = (idx: number, row: any) => {
    const copy = [...rows];
    copy[idx] = row;
    setRows(copy);
    onDirty && onDirty(true);
  };

  const removeRow = (idx: number) => {
    if ((rows || []).length <= 1) {
      setRows([emptyRow()]);
    } else {
      setRows(rows.filter((_, i) => i !== idx));
    }
    onDirty && onDirty(true);
  };

  const addRow = () => { setRows([...(rows || []), emptyRow()]); onDirty && onDirty(true); };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-sm font-semibold mb-3">Charge Builder</div>
      {!record ? (
        <div className="text-xs text-slate-500">Select an inspection record to begin.</div>
      ) : (
        <div className="space-y-3">
          {(rows || []).map((r, i) => (
            <ChargeRow key={i} idx={i} row={r} onChange={updateRow} onRemove={removeRow} validationErrors={validationErrors?.[i]} disabled={disabled} />
          ))}
          <div>
            <button onClick={addRow} disabled={disabled} className="mt-2 px-3 py-2 bg-slate-800 rounded disabled:opacity-60">+ Add another charge</button>
          </div>
          <div className="pt-3">
            <label className="text-xs text-slate-400">Notes</label>
            <textarea value={notes || ""} onChange={(e) => setNotes && setNotes(e.target.value)} disabled={disabled} className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded h-24" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargeBuilder;
