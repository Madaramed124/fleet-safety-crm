import React, { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { IncidentCard } from "./IncidentCard";
import { IncidentRecord } from "../types";

export const IncidentListView: React.FC = () => {
  const { records, selectedMonthId, searchQuery } = useApp();

  const processedRecords = useMemo(() => {
    // Stage 1: Filter by selected month or show all incidents when none is selected
    let filtered = selectedMonthId
      ? records.filter((r) => r.monthId === selectedMonthId)
      : records;

    // Stage 2: Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) =>
        r.driverName.toLowerCase().includes(query) ||
        r.caseCode.toLowerCase().includes(query) ||
        r.carrierName.toLowerCase().includes(query)
      );
    }

    // Stage 3: Group by date (descending)
    const byDate = new Map<string, IncidentRecord[]>();
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sorted.forEach((record) => {
      const dateKey = new Date(record.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, []);
      }
      byDate.get(dateKey)!.push(record);
    });

    // Stage 4: Within each date, group by carrier
    const result: Array<{ date: string; carriers: Map<string, IncidentRecord[]> }> =
      [];

    byDate.forEach((records, dateKey) => {
      const byCarrier = new Map<string, IncidentRecord[]>();
      records.forEach((record) => {
        if (!byCarrier.has(record.carrierName)) {
          byCarrier.set(record.carrierName, []);
        }
        byCarrier.get(record.carrierName)!.push(record);
      });
      result.push({ date: dateKey, carriers: byCarrier });
    });

    return result;
  }, [records, selectedMonthId, searchQuery]);

  if (processedRecords.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-lg mb-2">No violations found</p>
          <p className="text-slate-500 text-sm">
            {searchQuery.trim()
              ? "Try adjusting your search filters"
              : "Click the Add button to create a new violation"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {processedRecords.map((dateGroup) => (
          <div key={dateGroup.date}>
            {/* Date Header */}
            <div className="mb-4">
              <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest border-l-4 border-cyan-500 pl-3">
                {dateGroup.date}
              </h2>
            </div>

            {/* Carrier Groups */}
            <div className="space-y-6 ml-0">
              {Array.from(dateGroup.carriers.entries()).map(
                ([carrierName, carrierRecords]) => (
                  <div key={carrierName}>
                    {/* Carrier Header */}
                    <div className="mb-3 ml-4">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {carrierName}
                      </p>
                    </div>

                    {/* Incident Cards */}
                    <div className="space-y-3 ml-4">
                      {carrierRecords.map((record) => (
                        <IncidentCard
                          key={record.id}
                          record={record}
                          searchQuery={searchQuery}
                        />
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
