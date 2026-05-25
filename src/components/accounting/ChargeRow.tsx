import React, { useRef } from "react";
import csaPointsLookup from "../../data/csaPoints.json";
import { formatDisplayText } from "../../utils/helpers";

interface ChargeRowProps {
  idx: number;
  row: any;
  onChange: (idx: number, row: any) => void;
  onRemove: (idx: number) => void;
  validationErrors?: { description?: string; amount?: string } | null;
  disabled?: boolean;
}

type CsaLookupEntry = {
  description: string;
  group: string;
  category: string;
  severity: number;
  weight: number;
};

type CsaLookup = Record<string, CsaLookupEntry>;

const lookup = csaPointsLookup as CsaLookup;

const normalizeSection = (value: string) => value.trim().toLowerCase();

const getAutoAmount = (entry: CsaLookupEntry | null) => {
  if (!entry) {
    return "";
  }

  return String(entry.severity * entry.weight * 40);
};

const buildLookupState = (sectionValue: string) => {
  const normalized = normalizeSection(sectionValue);

  if (!normalized) {
    return { status: 'empty' as const, entry: null };
  }

  const entry = lookup[normalized];

  if (!entry) {
    return { status: 'not_found' as const, entry: null };
  }

  return { status: 'found' as const, entry };
};



const ChargeRow: React.FC<ChargeRowProps> = ({ idx, row, onChange, onRemove, validationErrors, disabled }) => {
  const sectionValue = row.section || "";
  const lookupState = buildLookupState(sectionValue);
  const formattedDescription = formatDisplayText(row.description || "");
  const formattedViolationGroup = formatDisplayText(row.violation_group || "");
  const formattedLookupGroup = formatDisplayText(lookupState.entry?.group || "");

  // Track if user has manually overridden the amount
  const userOverridden = useRef(false);

  // Helper to compute CSA points
  const computeCsaPoints = (sev: string, wt: string) => {
    const s = Number(sev);
    const w = Number(wt);
    return Number.isFinite(s) && Number.isFinite(w) ? s * w : 0;
  };

  // When section changes, always update all violation fields
  const handleSectionChange = (nextSection: string) => {
    const trimmed = nextSection.trim();
    const normalized = normalizeSection(trimmed);
    userOverridden.current = false;

    if (!normalized) {
      onChange(idx, {
        ...row,
        section: "",
        description: "",
        violation_group: "",
        severity: "",
        weight: "",
        total_csa_points: "",
        amount: ""
      });
      return;
    }

    const entry = lookup[normalized];

    if (!entry) {
      onChange(idx, {
        ...row,
        section: trimmed,
        description: "",
        violation_group: "",
        severity: "",
        weight: "",
        total_csa_points: "",
        amount: ""
      });
      return;
    }

    const csaPoints = entry.severity * entry.weight;
    onChange(idx, {
      ...row,
      section: trimmed,
      description: entry.description,
      violation_group: entry.group,
      severity: String(entry.severity),
      weight: String(entry.weight),
      total_csa_points: String(csaPoints),
      amount: String(csaPoints * 40)
    });
  };

  // When severity or weight changes (should be read-only, but if ever editable), update CSA points and amount if not overridden
  React.useEffect(() => {
    if (!userOverridden.current && row.severity && row.weight) {
      const csaPoints = computeCsaPoints(row.severity, row.weight);
      if (String(csaPoints) !== row.total_csa_points || String(csaPoints * 40) !== row.amount) {
        onChange(idx, {
          ...row,
          total_csa_points: String(csaPoints),
          amount: String(csaPoints * 40)
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.severity, row.weight]);

  const totalPoints = row.total_csa_points || "";

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

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Section number</label>
          <input
            disabled={disabled}
            value={sectionValue}
            onChange={(e) => handleSectionChange(e.target.value)}
            placeholder="e.g. 392.2C"
            className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 text-sm text-slate-100 outline-none focus:border-cyan-500"
          />
          {lookupState.status === 'found' && (
            <div className="mt-2 text-xs text-emerald-300">
              {formattedLookupGroup} • {totalPoints} CSA points
            </div>
          )}
          {lookupState.status === 'not_found' && sectionValue.length > 3 && (
            <div className="mt-2 text-xs text-rose-300">Section not found</div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Violation Description</label>
            <input
              readOnly
              value={formattedDescription}
              className={`h-12 w-full rounded-2xl border px-4 text-sm text-slate-100 outline-none ${validationErrors?.description ? 'border-red-500' : 'border-slate-800'} bg-slate-900`}
            />
            {validationErrors?.description && <div className="text-red-400 text-xs mt-1">{validationErrors.description}</div>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Violation Group</label>
            <input
              readOnly
              value={formattedViolationGroup}
              className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 text-sm text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Severity</label>
            <input
              readOnly
              value={row.severity || ""}
              className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 text-sm text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Weight</label>
            <input
              readOnly
              value={row.weight || ""}
              className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 text-sm text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total CSA Points</label>
            <input
              readOnly
              value={totalPoints}
              className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 text-sm text-slate-100 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_120px] gap-2">
          <div className="relative">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Charge amount</label>
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
                onChange={(e) => {
                  userOverridden.current = true;
                  onChange(idx, { ...row, amount: e.target.value });
                }}
                placeholder="0"
                className={`h-12 w-full rounded-2xl border border-slate-800 bg-slate-900 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-cyan-500 ${validationErrors?.amount ? 'border-red-500' : ''} ${disabled ? 'opacity-60' : ''}`}
              />
            </div>
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
