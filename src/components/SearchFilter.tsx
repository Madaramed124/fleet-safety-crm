import React from "react";
import { useApp } from "../context/AppContext";
import { Search, X } from "lucide-react";

export const SearchFilter: React.FC = () => {
  const { searchQuery, setSearchQuery } = useApp();

  return (
    <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 no-print">
      <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus-within:border-cyan-500 focus-within:shadow-glow transition-all duration-200">
        <Search size={18} className="text-cyan-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by driver name, case code, or carrier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {searchQuery && (
        <p className="text-xs text-slate-400 mt-2">
          Filtering results for: <span className="text-cyan-400">{searchQuery}</span>
        </p>
      )}
    </div>
  );
};
