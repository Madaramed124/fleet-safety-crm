import React from "react";
import { useApp } from "../context/AppContext";
import { Sidebar } from "./Sidebar";
import { KPIDashboard } from "./KPIDashboard";
import AccountingPage from "./accounting/AccountingPage";
import ChargesPage from "./accounting/ChargesPage";
// Inline DriversView to avoid cross-module resolution issues in this environment
const InlineDriversView: React.FC<{ onClose?: () => void }> = () => {
  const { records, openEditModal } = useApp();
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

  const incidentsFor = (driverName: string) => records.filter((r) => (r.driverName || "").trim() === driverName);

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
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold">{new Date(r.date).toLocaleDateString()} — {r.type}</div>
                      <div className="text-xs text-slate-400">{r.driverName} • {(r as any).company || "-"}</div>
                    </div>
                    <button
                      onClick={() => {
                        openEditModal(r.id);
                        setSelectedDriver(null);
                      }}
                      className="text-cyan-400 font-semibold text-sm transition hover:text-cyan-200"
                    >
                      Open
                    </button>
                  </div>
                  {(r as any).violations && (r as any).violations.length > 0 ? (
                    <div className="mt-2 text-xs text-slate-400">
                      {(r as any).violations.map((v: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="text-rose-400 text-sm">•</div>
                          <div>{v.code || v.description}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-500">No violations recorded.</div>
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
import { SearchFilter } from "./SearchFilter";
import { IncidentListView } from "./IncidentListView";
import { IncidentFormModal } from "./IncidentFormModal";
import { Plus } from "lucide-react";

export const AppLayout: React.FC = () => {
  const { selectedMonthId, openAddModal, isLoading, months } = useApp();
  const [tab, setTab] = React.useState<"dashboard" | "incidents" | "drivers" | "accounting" | "charges">("dashboard");
  const canAddIncident = months.length > 0;

  return (
    <div className="relative flex h-screen bg-slate-950 text-slate-100">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 text-cyan-300 text-sm font-semibold">
          Loading incident data...
        </div>
      )}
      {/* Left Sidebar */}
      <Sidebar activeTab={tab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Tabs */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 no-print flex items-center gap-4">
          <button
            onClick={() => setTab("dashboard")}
            className={`px-3 py-2 rounded text-sm font-semibold ${tab === "dashboard" ? "bg-cyan-600 text-white" : "text-slate-300"}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setTab("incidents")}
            className={`px-3 py-2 rounded text-sm font-semibold ${tab === "incidents" ? "bg-cyan-600 text-white" : "text-slate-300"}`}
          >
            Violations
          </button>
          <button
            onClick={() => setTab("drivers")}
            className={`px-3 py-2 rounded text-sm font-semibold ${tab === "drivers" ? "bg-cyan-600 text-white" : "text-slate-300"}`}
          >
            Drivers
          </button>
          <button
            onClick={() => setTab("accounting")}
            className={`px-3 py-2 rounded text-sm font-semibold ${tab === "accounting" ? "bg-cyan-600 text-white" : "text-slate-300"}`}
          >
            Charge Builder
          </button>
          <button
            onClick={() => setTab("charges")}
            className={`px-3 py-2 rounded text-sm font-semibold ${tab === "charges" ? "bg-cyan-600 text-white" : "text-slate-300"}`}
          >
            Charges
          </button>
        </div>

        {/* KPI Dashboard */}
        {tab === "dashboard" && <KPIDashboard />}

        {/* Search Filter */}
        {tab === "incidents" && <SearchFilter />}

        {/* Top action bar */}
        {tab === "incidents" && (
          <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 no-print flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {selectedMonthId
                ? "Select a violation to view details"
                : canAddIncident
                ? "Viewing all violations"
                : "Add a month before creating violations"}
            </div>
            <button
              onClick={openAddModal}
              disabled={!canAddIncident}
              className={`flex items-center gap-2 px-4 py-2 rounded font-semibold transition-all ${
                canAddIncident
                  ? "bg-cyan-500 hover:bg-cyan-600 text-slate-950"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              <Plus size={18} /> Add Violation
            </button>
          </div>
        )}

        {/* Main content: Incidents list, Drivers, or Charge Builder */}
        <div className="flex-1 overflow-auto">
          {tab === "incidents" && <IncidentListView />}
          {tab === "drivers" && <InlineDriversView />}
          {tab === "accounting" && <AccountingPage />}
          {tab === "charges" && <ChargesPage />}
        </div>
      </div>

      {/* Modals and overlays */}
      <IncidentFormModal />
    </div>
  );
};
