import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { IncidentRecord } from "../../types";
import { formatDate } from "../../utils/helpers";

type Props = {
  records: IncidentRecord[];
  selectedRecordId?: string | null;
  onSelect: (record: IncidentRecord) => void;
  loading?: boolean;
};

type InspectionListHandle = {
  scrollToTop: () => void;
};

const InspectionList = forwardRef<InspectionListHandle, Props>(({ records, selectedRecordId, onSelect, loading }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    scrollToTop: () => containerRef.current && (containerRef.current.scrollTop = 0),
  }));
  if (loading) {
    return (
      <div className="space-y-3 p-2" ref={containerRef}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-700 bg-slate-800 p-3 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-1/3 mb-2" />
            <div className="h-3 bg-slate-700 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return <div className="p-4 text-sm text-slate-500" ref={containerRef}>No inspection records found for this driver.</div>;
  }

  return (
    <div className="space-y-3" ref={containerRef}>
      {records.map((record) => {
        const violations = (record as any).violations || [];
        return (
          <button
            key={record.id}
            onClick={() => onSelect(record)}
            className={`w-full text-left rounded-2xl border p-4 transition ${selectedRecordId === record.id ? "border-cyan-500 bg-slate-800" : "border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-sm">{record.caseCode || record.type}</div>
                <div className="text-xs text-slate-400">{record.type.charAt(0).toUpperCase() + record.type.slice(1)} • {formatDate(record.date)}</div>
              </div>
              <div className="text-xs text-slate-300 bg-slate-800 rounded-full px-3 py-1">{violations.length} violation{violations.length === 1 ? "" : "s"}</div>
            </div>
            {violations.length > 0 && (
              <div className="mt-2 text-xs text-slate-500">
                {violations.slice(0, 2).map((v: any) => v.code).join(", ")}
                {violations.length > 2 ? `, +${violations.length - 2} more` : ""}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
});

export default InspectionList;
