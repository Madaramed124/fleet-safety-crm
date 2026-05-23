import React, { useState } from "react";
import notify from '../utils/notify';
import { useApp } from "../context/AppContext";
import { Plus } from "lucide-react";

export const Sidebar: React.FC<{ activeTab?: "dashboard" | "incidents" | "drivers" | "calendar" | "accounting" | "charges" }> = ({ activeTab = "dashboard" }) => {
  const {
    months,
    selectedMonthId,
    records,
    addMonth,
    selectMonth,
  } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [monthInput, setMonthInput] = useState("1");
  const [yearInput, setYearInput] = useState(new Date().getFullYear());

  const monthOptions = [
    { label: "January", value: 1 },
    { label: "February", value: 2 },
    { label: "March", value: 3 },
    { label: "April", value: 4 },
    { label: "May", value: 5 },
    { label: "June", value: 6 },
    { label: "July", value: 7 },
    { label: "August", value: 8 },
    { label: "September", value: 9 },
    { label: "October", value: 10 },
    { label: "November", value: 11 },
    { label: "December", value: 12 },
  ];

  const handleAddMonth = () => {
    const monthNum = parseInt(monthInput, 10);
    if (!monthNum || monthNum < 1 || monthNum > 12) {
      notify.error("Select a valid month");
      return;
    }

    if (months.some((item) => item.month === monthNum && item.year === yearInput)) {
      notify.error("That month and year already exist. Please choose a different month or year.");
      return;
    }

    const monthLabel = monthOptions.find((option) => option.value === monthNum)?.label || "";
    addMonth(`${monthLabel} ${yearInput}`, yearInput, monthNum);
    setMonthInput("1");
    setShowAddForm(false);
  };

  const getIncidentCount = (monthId: string): number => {
    return records.filter((r) => r.monthId === monthId).length;
  };

  return (
    <aside className="w-80 min-w-[280px] bg-slate-950/95 backdrop-blur-xl border-r border-slate-800 shadow-[0_0_80px_-30px_rgba(15,23,42,0.8)] flex flex-col h-screen no-print">
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.35em] uppercase text-cyan-300/80">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Meder Production
            </span>
            <h1 className="mt-3 text-2xl font-bold text-white leading-tight">CRM Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4 border-b border-slate-800">
        {activeTab === "incidents" ? (
          !showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-slate-800 px-4 py-3 text-sm font-semibold text-cyan-200 shadow-sm shadow-cyan-500/5 transition hover:bg-slate-900"
            >
              <Plus size={16} /> Add Month
            </button>
          ) : (
            <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900/95 p-4 shadow-inner shadow-slate-950/20">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Month</label>
                <select
                  value={monthInput}
                  onChange={(e) => setMonthInput(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-cyan-200 outline-none transition focus:border-cyan-500"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Year</label>
                <input
                  type="number"
                  min="2020"
                  max="2030"
                  value={yearInput}
                  onChange={(e) => setYearInput(parseInt(e.target.value, 10) || new Date().getFullYear())}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-cyan-200 outline-none transition focus:border-cyan-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddMonth}
                  className="flex-1 rounded-2xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-4 shadow-inner shadow-slate-950/20">
            <div className="text-sm font-semibold text-slate-100">Reminders</div>
            <p className="mt-2 text-xs text-slate-400">Unclosed violations and alerts will appear here.</p>
          </div>
        )}
      </div>

      {activeTab === "incidents" ? (
        <div className="p-5 border-b border-slate-800">
          <button
            onClick={() => selectMonth(null)}
            className={`w-full text-left rounded-3xl border px-4 py-4 transition duration-200 ${
              selectedMonthId === null
                ? "border-cyan-500 bg-cyan-500/15 text-cyan-100 shadow-sm shadow-cyan-500/10"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-sm">All violations</div>
                <div className="mt-1 text-xs text-slate-400">{records.length} violation{records.length !== 1 ? "s" : ""}</div>
              </div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-2xl text-xs font-bold ${
                selectedMonthId === null ? "bg-cyan-500 text-slate-950" : "bg-slate-700 text-cyan-300"
              }`}>
                {records.length}
              </div>
            </div>
          </button>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-950">
        {activeTab === "incidents" ? (
          months.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/80 p-6 text-center text-sm text-slate-500">No months added yet</div>
          ) : (
            months.map((month) => {
              const count = getIncidentCount(month.id);
              const isSelected = selectedMonthId === month.id;
              return (
                <button
                  key={month.id}
                  onClick={() => selectMonth(month.id)}
                  className={`w-full text-left rounded-3xl border px-4 py-4 transition duration-200 ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-100 shadow-sm shadow-cyan-500/10"
                      : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-sm">{month.monthLabel}</div>
                      <div className="mt-1 text-xs text-slate-400">{count} violation{count !== 1 ? "s" : ""}</div>
                    </div>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-2xl text-xs font-bold ${
                      isSelected ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-cyan-300"
                    }`}>
                      {count}
                    </div>
                  </div>
                </button>
              );
            })
          )
        ) : (
          (() => {
            const uniqueUnclosed = Array.from(
              records
                .filter((r) => r.status !== "Closed")
                .reduce((map, record) => {
                  const key = `${record.driverName}|${new Date(record.date).toISOString()}|${record.type}|${record.status}|${record.caseCode}`;
                  if (!map.has(key)) map.set(key, record);
                  return map;
                }, new Map<string, typeof records[number]>() )
              .values()
            );

            return uniqueUnclosed.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/80 p-6 text-center text-sm text-slate-500">No reminders</div>
            ) : (
              uniqueUnclosed.slice(0, 10).map((r) => (
                <div key={`${r.id}-${r.type}-${new Date(r.date).getTime()}`} className="rounded-3xl border border-slate-800 bg-slate-900/95 p-4 shadow-sm shadow-slate-950/20">
                  <div className="font-semibold text-sm text-white">{r.driverName}</div>
                  <div className="mt-1 text-xs text-slate-400">{new Date(r.date).toLocaleDateString()}</div>
                  <div className="mt-3 text-xs text-slate-300">{r.type}</div>
                </div>
              ))
            );
          })()
        )}
      </div>
    </aside>
  );
};
