import React from "react";

interface IncidentTypeChartProps {
  counts: Record<string, number>;
}

export const IncidentTypeChart: React.FC<IncidentTypeChartProps> = ({ counts }) => {
  const max = Math.max(...Object.values(counts), 1);
  return (
    <div className="flex items-end gap-6 h-48">
      {Object.entries(counts).map(([label, value]) => {
        const height = Math.max(6, Math.round((value / max) * 180));
        return (
          <div key={label} className="flex-1 flex flex-col items-center">
            <div className="w-full flex items-end">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-slate-700 to-cyan-500"
                style={{ height }}
              />
            </div>
            <div className="mt-3 text-sm text-slate-300 font-semibold">{label}</div>
            <div className="text-xs text-slate-500">{value}</div>
          </div>
        );
      })}
    </div>
  );
};

export default IncidentTypeChart;
