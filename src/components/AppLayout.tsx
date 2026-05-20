import React from "react";
import { useApp } from "../context/AppContext";
import { Sidebar } from "./Sidebar";
import { KPIDashboard } from "./KPIDashboard";
import { SearchFilter } from "./SearchFilter";
import { IncidentListView } from "./IncidentListView";
import { IncidentFormModal } from "./IncidentFormModal";
import { PrintLayout } from "./PrintLayout";
import { Plus } from "lucide-react";

export const AppLayout: React.FC = () => {
  const { selectedMonthId, openAddModal, isLoading, months } = useApp();
  const canAddIncident = months.length > 0;

  return (
    <div className="relative flex h-screen bg-slate-950 text-slate-100">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 text-cyan-300 text-sm font-semibold">
          Loading incident data...
        </div>
      )}
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* KPI Dashboard */}
        <KPIDashboard />

        {/* Search Filter */}
        <SearchFilter />

        {/* Top action bar */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 no-print flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedMonthId
              ? "Select an incident to view details"
              : canAddIncident
              ? "Viewing all incidents"
              : "Add a month before creating incidents"}
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
            <Plus size={18} /> Add Incident
          </button>
        </div>

        {/* Incidents List */}
        <IncidentListView />
      </div>

      {/* Modals and overlays */}
      <IncidentFormModal />
      <PrintLayout />
    </div>
  );
};
