import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Violation } from "../../types";

type Props = { violations: Violation[]; onSelect: (v: Violation) => void; loading?: boolean };

const ViolationList = forwardRef(function ViolationList({ violations, onSelect, loading }: Props, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(ref, () => ({
    scrollToTop: () => containerRef.current && (containerRef.current.scrollTop = 0),
  }));

  if (loading) {
    return (
      <div className="space-y-3 p-2" ref={containerRef}>
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-2xl border border-slate-700 bg-slate-800 p-3 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-1/3 mb-2" />
            <div className="h-3 bg-slate-700 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!violations || violations.length === 0) return <div className="p-4 text-sm text-slate-500">No violations on record.</div>;

  return (
    <div className="space-y-3" ref={containerRef}>
      {violations.map(v => (
        <div key={v.id} className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">{v.code}</div>
              <div className="text-xs text-slate-400">{v.description}</div>
            </div>
            <div>
              <button onClick={() => onSelect(v)} className="text-cyan-400 text-sm font-semibold">Open</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default ViolationList;
