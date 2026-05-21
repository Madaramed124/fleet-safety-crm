import React from "react";
import { IncidentRecord, Inspection, Ticket, Violation } from "../types";
import { useApp } from "../context/AppContext";

const DriversView: React.FC = () => {
  const { records } = useApp();
  const [selectedDriver, setSelectedDriver] = React.useState<string | null>(null);

  const drivers = React.useMemo(() => {
    const map = new Map<string, { name: string; count: number; lastDate: string }>();
    records.forEach((r) => {
      const key = (r.driverName || "Unknown").trim();
      const existing = map.get(key);
      if (!existing) map.set(key, { name: key, count: 1, lastDate: r.date });
      else {
        existing.count += 1;
        if (new Date(r.date) > new Date(existing.lastDate)) existing.lastDate = r.date;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [records]);

  const incidentsFor = (driverName: string) =>
    records.filter((r) => (r.driverName || "").trim() === driverName);

  const hasViolationDetails = (r: IncidentRecord): r is Inspection | Ticket =>
    r.type === "inspection" || r.type === "ticket";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Drivers</h2>
        <div className="text-sm text-slate-400">{drivers.length} drivers</div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {drivers.map((d) => (
          <button
            key={d.name}
            onClick={() => setSelectedDriver(d.name)}
            className="w-full text-left p-4 bg-slate-800 rounded border border-slate-700 flex items-center justify-between hover:bg-slate-700"
          >
            <div>
              <div className="font-semibold">{d.name}</div>
              <div className="text-xs text-slate-400">{d.count} violation{d.count !== 1 ? "s" : ""} • last: {new Date(d.lastDate).toLocaleDateString()}</div>
            </div>
            <div className="text-xs text-cyan-400 font-bold">View</div>
          </button>
        ))}
      </div>

      {/* Driver details modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-900 rounded-lg w-11/12 max-w-3xl p-6 border border-slate-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">{selectedDriver}</h3>
                <div className="text-xs text-slate-400">Violation history</div>
              </div>
              <button onClick={() => setSelectedDriver(null)} className="text-slate-400 hover:text-white">Close</button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {incidentsFor(selectedDriver).map((r) => (
                <div key={r.id} className="p-3 bg-slate-800 rounded border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{new Date(r.date).toLocaleDateString()} — {r.type}</div>
                      <div className="text-xs text-slate-400">{r.driverName} • {r.carrierName || "-"}</div>
                    </div>
                    <div className="text-xs text-slate-300">{r.status || "-"}</div>
                  </div>
                  {hasViolationDetails(r) && r.violations && r.violations.length > 0 && (
                    <div className="mt-2 text-xs text-slate-400">
                      {r.violations.map((v: Violation, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="text-rose-400 text-sm">•</div>
                          <div>{v.code || v.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DriversView;
