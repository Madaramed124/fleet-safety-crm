import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Plus, Trash2 } from "lucide-react";

export const Sidebar: React.FC = () => {
  const {
    months,
    selectedMonthId,
    records,
    addMonth,
    deleteMonth,
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
      alert("Select a valid month");
      return;
    }

    if (months.some((item) => item.month === monthNum && item.year === yearInput)) {
      alert("That month and year already exist. Please choose a different month or year.");
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
    <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-screen no-print">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-cyan-400 mb-1">Fleet Safety CRM</h1>
        <p className="text-xs text-slate-400">Ticket & Incident Tracker</p>
      </div>

      {/* Add Month Section */}
      <div className="p-4 border-b border-slate-800">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 py-2 px-3 rounded text-sm font-medium transition-colors duration-200"
          >
            <Plus size={16} /> Add Month
          </button>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Month
              </label>
              <select
                value={monthInput}
                onChange={(e) => setMonthInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-cyan-400 focus:outline-none focus:border-cyan-500"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Year
              </label>
              <input
                type="number"
                min="2020"
                max="2030"
                value={yearInput}
                onChange={(e) => setYearInput(parseInt(e.target.value, 10) || new Date().getFullYear())}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-cyan-400 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddMonth}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-950 py-1 px-2 rounded text-xs font-bold transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 px-2 rounded text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-b border-slate-800">
        <button
          onClick={() => selectMonth(null)}
          className={`w-full text-left p-3 rounded border transition-all duration-200 ${
            selectedMonthId === null
              ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">All incidents</div>
              <div className="text-xs text-slate-400 mt-1">
                {records.length} incident{records.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div
              className={`flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                selectedMonthId === null
                  ? "bg-cyan-500 text-slate-950"
                  : "bg-slate-700 text-cyan-400"
              }`}
            >
              {records.length}
            </div>
          </div>
        </button>
      </div>

      {/* Months List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {months.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-8">
            No months added yet
          </p>
        ) : (
          months.map((month) => {
            const count = getIncidentCount(month.id);
            const isSelected = selectedMonthId === month.id;
            return (
              <button
                key={month.id}
                onClick={() => selectMonth(month.id)}
                className={`w-full text-left p-3 rounded border transition-all duration-200 ${
                  isSelected
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm">{month.monthLabel}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {count} incident{count !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                      isSelected
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-700 text-cyan-400"
                    }`}
                  >
                    {count}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Delete Month Button */}
      {selectedMonthId && (
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Delete this month and all associated incidents?"
                )
              ) {
                deleteMonth(selectedMonthId);
              }
            }}
            className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 px-3 rounded text-sm font-medium transition-colors duration-200 border border-red-500/30"
          >
            <Trash2 size={16} /> Delete Month
          </button>
        </div>
      )}
    </div>
  );
};
