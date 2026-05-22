import React from "react";
import { useApp } from "../context/AppContext";
import { Search, X } from "lucide-react";

export const SearchFilter: React.FC = () => {
  const { searchQuery, setSearchQuery, records, companyFilter, setCompanyFilter } = useApp();

  const companies = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.carrierName && r.carrierName.trim()) set.add(r.carrierName.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [records]);

  return (
    <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 no-print">
      <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus-within:border-cyan-500 focus-within:shadow-glow transition-all duration-200">
        <Search size={18} className="text-cyan-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by driver name, case code, or carrier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-sm min-w-0"
        />

        <select
          value={companyFilter ?? ""}
          onChange={(e) => setCompanyFilter(e.target.value || null)}
          className="ml-2 rounded-md border border-slate-700 bg-slate-900 text-slate-200 px-3 py-1 text-sm"
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 mt-2">
        {searchQuery && (
          <p className="text-xs text-slate-400">
            Filtering results for: <span className="text-cyan-400">{searchQuery}</span>
          </p>
        )}
        {companyFilter && (
          <p className="text-xs text-slate-400 ml-3">
            Company: <span className="text-cyan-400">{companyFilter}</span>
          </p>
        )}
      </div>
    </div>
  );
};
