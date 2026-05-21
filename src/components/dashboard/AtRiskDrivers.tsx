import React from "react";

interface DriverRow {
  name: string;
  count: number;
  lastDate: string;
}

interface AtRiskDriversProps {
  drivers: DriverRow[];
}

export const AtRiskDrivers: React.FC<AtRiskDriversProps> = ({ drivers }) => {
  return (
    <div className="space-y-3">
      {drivers.length === 0 ? (
        <div className="text-xs text-slate-500">No recent violations found.</div>
      ) : (
        drivers.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-100">{d.name}</div>
              <div className="text-xs text-slate-500">{d.count} violations</div>
            </div>
            <div className="text-xs font-bold text-amber-300">{Math.max(0, Math.round((Date.now() - new Date(d.lastDate).getTime()) / (1000*60*60*24)))}d</div>
          </div>
        ))
      )}
    </div>
  );
};

export default AtRiskDrivers;
