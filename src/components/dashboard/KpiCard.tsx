import React from "react";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, icon: Icon, className = "" }) => {
  return (
    <div className={`bg-slate-900 rounded-lg p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
        </div>
        {Icon ? <Icon size={20} className="text-slate-400" /> : null}
      </div>
      <div className="flex items-baseline gap-3">
        <div className="text-3xl font-bold font-mono text-white">{value}</div>
        {sub ? <div className="text-sm text-slate-400">{sub}</div> : null}
      </div>
    </div>
  );
};

export default KpiCard;
