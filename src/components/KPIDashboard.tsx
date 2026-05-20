import React from "react";
import { useApp } from "../context/AppContext";
import { AlertCircle, Shield, TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency } from "../utils/helpers";

export const KPIDashboard: React.FC = () => {
  const { selectedMonthId, calculateKPI } = useApp();

  const kpi = calculateKPI();

  const cards = [
    {
      label: "Inspections",
      value: kpi.totalInspections,
      icon: AlertCircle,
      color: "cyan",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      textColor: "text-cyan-400",
    },
    {
      label: "Total Accidents",
      value: kpi.totalAccidents,
      icon: Shield,
      color: "red",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      textColor: "text-red-400",
    },
    {
      label: "Total Tickets",
      value: kpi.totalTickets,
      icon: TrendingUp,
      color: "amber",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      textColor: "text-amber-400",
    },
    {
      label: "Total Fines",
      value: formatCurrency(kpi.totalFines),
      icon: DollarSign,
      color: "green",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      textColor: "text-green-400",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 p-6 bg-slate-950 border-b border-slate-800 no-print">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`${card.bgColor} border ${card.borderColor} rounded-lg p-6 backdrop-blur-sm`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  {card.label}
                </p>
              </div>
              <Icon size={20} className={card.textColor} />
            </div>
            <div className={`text-3xl font-bold font-mono ${card.textColor}`}>
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};
