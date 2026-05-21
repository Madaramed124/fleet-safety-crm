import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import KpiCard from "./dashboard/KpiCard";
import IncidentTypeChart from "./dashboard/IncidentTypeChart";
import AtRiskDrivers from "./dashboard/AtRiskDrivers";
import { formatCurrency, normalizeDriverName } from "../utils/helpers";

export const KPIDashboard: React.FC = () => {
  const { months, selectedMonthId, records } = useApp();
  const [range, setRange] = useState<"30" | "quarter" | "month">("30");
  const [rangeMonthId, setRangeMonthId] = useState<string | null>(null);

  // determine current month (selected or latest)
  const sortedMonths = useMemo(() => {
    return [...months].sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
  }, [months]);

  const currentMonthId = selectedMonthId ?? sortedMonths[0]?.id ?? null;
  const selectedRangeMonthId = rangeMonthId ?? currentMonthId;

  const recordsForMonth = useMemo(
    () => records.filter((r) => r.monthId === currentMonthId),
    [records, currentMonthId]
  );

  const selectedMonthLabel = selectedRangeMonthId
    ? (() => {
        const item = sortedMonths.find((m) => m.id === selectedRangeMonthId);
        return item ? `${item.month}/${item.year}` : "Selected month";
      })()
    : "Selected month";

  // compute records based on selected range (30 days / quarter / month)
  const recordsInRange = useMemo(() => {
    const now = new Date();
    if (range === "30") {
      const start = new Date();
      start.setDate(now.getDate() - 30);
      return records.filter((r) => {
        const date = new Date(r.date);
        return date >= start && date <= now;
      });
    }

    if (range === "quarter") {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1);
      return records.filter((r) => {
        const date = new Date(r.date);
        return date >= start && date <= now;
      });
    }

    const selectedMonth = selectedRangeMonthId;
    if (!selectedMonth) {
      return [];
    }
    return records.filter((r) => r.monthId === selectedMonth);
  }, [records, range, selectedRangeMonthId]);

  const recordsInPrevRange = useMemo(() => {
    const now = new Date();

    if (range === "30") {
      const currentStart = new Date();
      currentStart.setDate(now.getDate() - 30);
      const previousEnd = new Date(currentStart);
      const previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 30);
      return records.filter((r) => {
        const date = new Date(r.date);
        return date >= previousStart && date <= previousEnd;
      });
    }

    if (range === "quarter") {
      const q = Math.floor(now.getMonth() / 3);
      const currentStart = new Date(now.getFullYear(), q * 3, 1);
      const previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      const previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth() - 2, 1);
      return records.filter((r) => {
        const date = new Date(r.date);
        return date >= previousStart && date <= previousEnd;
      });
    }

    const selectedMonth = selectedRangeMonthId;
    if (!selectedMonth) {
      return [];
    }

    const monthIndex = sortedMonths.findIndex((m) => m.id === selectedMonth);
    const prevMonthEntry = monthIndex >= 0 && monthIndex + 1 < sortedMonths.length ? sortedMonths[monthIndex + 1] : null;
    if (!prevMonthEntry) {
      return [];
    }
    return records.filter((r) => r.monthId === prevMonthEntry.id);
  }, [records, range, selectedRangeMonthId, sortedMonths]);

  const count = (arr: any[], type?: string) => (type ? arr.filter((r) => r.type === type).length : arr.length);

  // use range-based records for dashboard KPIs
  const accidents = count(recordsInRange, "accident");
  const inspections = count(recordsInRange, "inspection");
  const tickets = count(recordsInRange, "ticket");
  const totalFines = recordsInRange.reduce((sum, r: any) => sum + ((r.fines || []).reduce((s: number, f: any) => s + (f.amount || 0), 0) || 0), 0);

  const prevTotal = recordsInPrevRange.length;
  const prevAccidents = count(recordsInPrevRange, "accident");

  const percentChange = (current: number, previous: number) => {
    if (previous === 0) return current === 0 ? 0 : 100;
    return Math.round(((current - previous) / previous) * 100);
  };

  // safety score: simple heuristic (placeholder)
  const safetyScore = Math.max(0, Math.round(100 - (accidents * 6 + tickets * 3 + inspections * 1)));

  // estimated incident cost: fines + accidents * avg + violations cost
  const avgAccidentCost = 5000; // placeholder
  const estimatedCost = totalFines + accidents * avgAccidentCost;

  // total CSA score lost: sum severity mapping for current range
  const csaScoreLost = recordsInRange.reduce((sum, r: any) => {
    const sev = r.csaSeverity;
    if (!sev) return sum;
    if (sev === "High") return sum + 5;
    if (sev === "Medium") return sum + 3;
    return sum + 1;
  }, 0);

  // incident type distribution for simple bar chart
  const typeCounts = {
    Accident: accidents,
    Inspection: inspections,
    Ticket: tickets,
  };

  // at-risk drivers (last 90 days)
  const atRiskDrivers = useMemo(() => {
    const days = 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const recent = records.filter((r) => new Date(r.date) >= cutoff);
    const map = new Map<string, { name: string; count: number; lastDate: string }>();
    recent.forEach((r) => {
      const key = normalizeDriverName(r.driverName) || r.driverName;
      const existing = map.get(key);
      if (!existing) map.set(key, { name: r.driverName, count: 1, lastDate: r.date });
      else {
        existing.count += 1;
        if (new Date(r.date) > new Date(existing.lastDate)) existing.lastDate = r.date;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [records]);

  return (
    <div className="space-y-6 p-6 bg-slate-950 border-b border-slate-800 no-print">
      <div className="flex flex-wrap items-center justify-between mb-2 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setRange("30")} className={`px-3 py-1 rounded text-sm ${range === "30" ? "bg-slate-800 text-cyan-300" : "text-slate-400"}`}>Last 30 days</button>
          <button onClick={() => setRange("quarter")} className={`px-3 py-1 rounded text-sm ${range === "quarter" ? "bg-slate-800 text-cyan-300" : "text-slate-400"}`}>This quarter</button>
          <button onClick={() => setRange("month")} className={`px-3 py-1 rounded text-sm ${range === "month" ? "bg-slate-800 text-cyan-300" : "text-slate-400"}`}>Select month</button>
          {range === "month" && (
            <select
              value={selectedRangeMonthId ?? ""}
              onChange={(event) => setRangeMonthId(event.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm text-slate-200"
            >
              {sortedMonths.map((month) => (
                <option key={month.id} value={month.id}>
                  {`${month.month}/${month.year}`}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" className="form-checkbox" /> Export report</label>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label={range === "30" ? "Last 30 days" : range === "quarter" ? "This quarter" : selectedMonthLabel} value={<span className="text-pink-400 font-mono">{recordsInRange.length}</span>} sub={`${percentChange(recordsInRange.length, prevTotal)}% from last`} />
        <KpiCard label="Open tickets" value={<span className="font-mono">{tickets}</span>} />
        <KpiCard label="Fleet safety score" value={<span className="text-green-400 font-mono">{safetyScore}/100</span>} />
        <KpiCard label="Estimated violation cost" value={<span className="font-mono">{formatCurrency(estimatedCost)}</span>} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-slate-900 rounded-lg p-6">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">Violations by type</p>
          <IncidentTypeChart counts={{ Accident: accidents, Inspection: inspections, Ticket: tickets }} />
        </div>

        <div className="bg-slate-900 rounded-lg p-6">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">At-risk drivers (90 days)</p>
          <AtRiskDrivers drivers={atRiskDrivers} />
        </div>
      </div>
    </div>
  );
};
