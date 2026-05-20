import React, { useState } from "react";
import { IncidentRecord, Accident, Inspection } from "../types";
import { useApp } from "../context/AppContext";
import {
  formatDate,
  formatCurrency,
  highlightMatch,
  getRepeatedViolationCount,
} from "../utils/helpers";
import {
  Edit2,
  Trash2,
  Printer,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Shield,
  FileSearch,
} from "lucide-react";

interface IncidentCardProps {
  record: IncidentRecord;
  searchQuery: string;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  record,
  searchQuery,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    openEditModal,
    openDeleteConfirm,
    deleteRecord,
    deleteConfirmId,
    closeDeleteConfirm,
    setPrintingRecord,
  } = useApp();

  const isDeleting = deleteConfirmId === record.id;

  const isTicket = record.type === "inspection" && (record as Inspection).hasAssociatedTicket;
  const isAccident = record.type === "accident";
  const isInspection = record.type === "inspection";
  const ticket = isTicket ? (record as Inspection) : null;
  const accident = isAccident ? (record as Accident) : null;
  const inspection = isInspection ? (record as Inspection) : null;
  const inspectionViolations = inspection?.violations || [];

  return (
    <div className="card-dark p-5 mb-4 hover:border-slate-700 transition-all duration-200">
      {/* Header Row */}
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded ${
                isTicket
                  ? "bg-cyan-500/20 text-cyan-400"
                  : isAccident
                  ? "bg-red-500/20 text-red-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}
            >
              {isTicket ? (
                <AlertTriangle size={16} />
              ) : isAccident ? (
                <Shield size={16} />
              ) : (
                <FileSearch size={16} />
              )}
            </div>
            <div>
              <div className="font-mono text-sm font-bold text-cyan-400">
                {highlightMatch(record.caseCode, searchQuery)}
              </div>
              <div className="text-xs text-slate-400">
                {formatDate(record.date)}
              </div>
            </div>
          </div>

          <div className="ml-11 space-y-1">
            <div className="text-sm font-semibold text-slate-100">
              {highlightMatch(record.driverName, searchQuery)}
            </div>
            <div className="text-xs text-slate-400">
              {highlightMatch(record.carrierName, searchQuery)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div
            className={`px-2 py-1 rounded text-xs font-bold text-code ${
              record.status === "Closed"
                ? "bg-green-500/20 text-green-400"
                : record.status === "Pending"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {record.status}
          </div>

          {/* Severity/Type Badge */}
          {isTicket && ticket ? (
            <div
              className={`px-2 py-1 rounded text-xs font-bold text-code ${
                (ticket as any).csaSeverity === "High"
                  ? "bg-red-500/20 text-red-400"
                  : (ticket as any).csaSeverity === "Medium"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              CSA {(ticket as any).csaSeverity}
            </div>
          ) : isAccident && accident ? (
            <div
              className={`px-2 py-1 rounded text-xs font-bold text-code ${
                accident.severity === "Critical"
                  ? "bg-red-500/20 text-red-400"
                  : accident.severity === "Major"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              {accident.severity}
            </div>
          ) : inspection ? (
            <div
              className={`px-2 py-1 rounded text-xs font-bold text-code ${
                inspection.severity === "Critical"
                  ? "bg-red-500/20 text-red-400"
                  : inspection.severity === "Major"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              Inspection: {inspection.receivedCitation ? "Citation" : "No Citation"}
            </div>
          ) : null}

          {/* Expand Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
          {/* Notes Section */}
          {record.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Notes
              </p>
              <p className="text-sm text-slate-200 bg-slate-800/50 p-3 rounded">
                {record.notes}
              </p>
            </div>
          )}

          {inspection && (
            <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Violations
                </p>
                <span
                  className={`text-xs font-semibold ${
                    inspectionViolations.length > 0 ? "text-cyan-400" : "text-emerald-400"
                  }`}
                >
                  {inspectionViolations.length > 0
                    ? `${inspectionViolations.length} issue${inspectionViolations.length === 1 ? "" : "s"}`
                    : "Clean"}
                </span>
              </div>
              {inspectionViolations.length > 0 ? (
                <div className="space-y-2">
                  {inspectionViolations.map((v) => (
                    <div
                      key={v.id}
                      className="bg-slate-800/50 p-2 rounded text-xs"
                    >
                      <div className="font-mono text-cyan-400 font-bold">
                        {v.code}
                      </div>
                      <div className="text-slate-300">{v.description}</div>
                      <div
                        className={`text-xs mt-1 ${
                          v.severity === "High"
                            ? "text-red-400"
                            : v.severity === "Medium"
                            ? "text-amber-400"
                            : "text-slate-400"
                        }`}
                      >
                        Severity: {v.severity}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-sm">No violations recorded.</div>
              )}
            </div>
          )}

          {isTicket && ticket && (
            <>
              {/* Fines */}
              {(ticket?.fines?.length || 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Fines ({ticket?.fines?.length || 0})
                  </p>
                  <div className="space-y-2">
                    {(ticket?.fines || []).map((f) => (
                      <div
                        key={f.id}
                        className="bg-slate-800/50 p-2 rounded text-xs flex justify-between items-center"
                      >
                        <span className="text-slate-300">{f.description}</span>
                        <span className="font-mono text-green-400 font-bold">
                          {formatCurrency(f.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-sm font-bold text-code text-green-400 text-right">
                    Total Fines: {formatCurrency(
                      (ticket?.fines || []).reduce((sum, f) => sum + f.amount, 0)
                    )}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/50 p-2 rounded">
                  <div className="text-slate-400">Has Attorney</div>
                  <div
                    className={`font-bold ${
                      ticket.hasAttorney ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {ticket.hasAttorney ? "Yes" : "No"}
                  </div>
                </div>
                <div className="bg-slate-800/50 p-2 rounded">
                  <div className="text-slate-400">Recurring Offense</div>
                  <div
                    className={`font-bold ${
                      ticket.isRecurring ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {ticket.isRecurring ? "Yes" : "No"}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Accident-Specific Details */}
          {accident && (
            <>
              {/* Injuries */}
              {accident.injuries.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Injuries ({accident.injuries.length})
                  </p>
                  <div className="space-y-2">
                    {accident.injuries.map((inj) => (
                      <div
                        key={inj.id}
                        className="bg-slate-800/50 p-2 rounded text-xs"
                      >
                        <div className="text-slate-300">{inj.description}</div>
                        <div
                          className={`text-xs mt-1 ${
                            inj.severity === "Critical"
                              ? "text-red-400"
                              : inj.severity === "Major"
                              ? "text-amber-400"
                              : "text-slate-400"
                          }`}
                        >
                          Severity: {inj.severity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accident Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/50 p-2 rounded">
                  <div className="text-slate-400">FMCSA Recordable</div>
                  <div
                    className={`font-bold ${
                      accident.isFmcsaRecordable ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {accident.isFmcsaRecordable ? "Yes" : "No"}
                  </div>
                </div>
                <div className="bg-slate-800/50 p-2 rounded">
                  <div className="text-slate-400">Vehicle Towed</div>
                  <div
                    className={`font-bold ${
                      accident.vehicleTowed ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {accident.vehicleTowed ? "Yes" : "No"}
                  </div>
                </div>
              </div>
            </>
          )}

          {inspection && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/50 p-2 rounded">
                  <div className="text-slate-400">Citation</div>
                  <div className={`font-bold ${inspection.receivedCitation ? "text-red-400" : "text-green-400"}`}>
                    {inspection.receivedCitation ? "Yes" : "No"}
                  </div>
                </div>
                {inspection.receivedCitation && (
                  <div className="bg-slate-800/50 p-2 rounded">
                    <div className="text-slate-400">Citation #</div>
                    <div className="font-bold text-slate-100">{inspection.citationNumber || "N/A"}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-800 mt-4">
            <button
              onClick={() => setPrintingRecord(record.id)}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-3 rounded text-sm font-medium transition-colors duration-200"
            >
              <Printer size={14} /> Print
            </button>

            {!isDeleting ? (
              <button
                onClick={() => openDeleteConfirm(record.id)}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 px-3 rounded text-sm font-medium transition-colors duration-200"
              >
                <Trash2 size={14} /> Delete
              </button>
            ) : (
              <div className="flex-1 flex gap-1">
                <button
                  onClick={() => deleteRecord(record.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-2 rounded text-xs font-bold transition-colors duration-200"
                >
                  Confirm
                </button>
                <button
                  onClick={closeDeleteConfirm}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-2 rounded text-xs font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
