import React from "react";
import { useApp } from "../context/AppContext";
import { IncidentRecord, Accident, Inspection } from "../types";
import { formatDate, formatCurrency } from "../utils/helpers";

export const PrintLayout: React.FC = () => {
  const { records, printingRecordId } = useApp();

  const record = printingRecordId
    ? records.find((r) => r.id === printingRecordId)
    : null;

  if (!record) return null;

  const isAccident = record.type === "accident";
  const isInspection = record.type === "inspection";
  // Tickets are inspections with associated ticket details
  const isTicket = isInspection && (record as Inspection).hasAssociatedTicket;
  const ticket = isTicket ? (record as Inspection) : null;
  const accident = isAccident ? (record as Accident) : null;
  const inspection = isInspection ? (record as Inspection) : null;

  return (
    <div className="print:block hidden print:bg-white">
      <div className="w-full p-12 bg-white text-black font-sans">
        {/* Header */}
        <div className="border-b-4 border-black pb-4 mb-8">
          <h1 className="text-3xl font-bold mb-1">FLEET SAFETY CRM</h1>
          <h2 className="text-xl font-bold text-gray-700">
              {isAccident ? "ACCIDENT INCIDENT REPORT" : "INSPECTION REPORT"}
          </h2>
        </div>

        {/* Case Information */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest font-bold text-gray-600">
                Case Code
              </p>
              <p className="text-2xl font-bold font-mono">{record.caseCode}</p>
            </div>
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest font-bold text-gray-600">
                Driver Name
              </p>
              <p className="text-lg font-bold">{record.driverName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-gray-600">
                Carrier Name
              </p>
              <p className="text-lg font-bold">{record.carrierName}</p>
            </div>
          </div>
          <div>
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest font-bold text-gray-600">
                Date
              </p>
              <p className="text-lg font-mono font-bold">{formatDate(record.date)}</p>
            </div>
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest font-bold text-gray-600">
                Status
              </p>
              <p className="text-lg font-bold border-l-4 border-black pl-2">
                {record.status}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-gray-600">
                {isTicket ? "CSA Severity" : isAccident ? "Accident Severity" : "Inspection Severity"}
              </p>
              <p className="text-lg font-bold">
                {isTicket ? (ticket as any).csaSeverity : isAccident ? accident?.severity : inspection?.severity}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {record.notes && (
          <div className="mb-8 p-4 bg-gray-100 border-l-4 border-black">
            <p className="text-xs uppercase tracking-widest font-bold text-gray-600 mb-2">
              Notes
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {record.notes}
            </p>
          </div>
        )}

        {record.attachments && record.attachments.length > 0 && (
          <div className="mb-8 p-4 bg-gray-100 border-l-4 border-black">
            <p className="text-xs uppercase tracking-widest font-bold text-gray-600 mb-2">
              Attachments
            </p>
            <div className="space-y-2 text-sm">
              {record.attachments.map((attachment) => (
                <div key={attachment.id} className="flex justify-between">
                  <span>{attachment.type}</span>
                  <span className="font-mono">{attachment.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {inspection && (
          <div className="mb-8 p-4 bg-gray-100 border-l-4 border-black">
            <p className="text-xs uppercase tracking-widest font-bold text-gray-600 mb-2">
              Violations
            </p>
            {inspection.violations && inspection.violations.length > 0 ? (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-left p-2 font-bold">Code</th>
                    <th className="text-left p-2 font-bold">Description</th>
                    <th className="text-left p-2 font-bold">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {inspection.violations.map((v, i) => (
                    <tr key={v.id} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="p-2 font-mono font-bold">{v.code}</td>
                      <td className="p-2">{v.description}</td>
                      <td className="p-2 font-bold">{v.severity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-lg font-bold">Clean inspection (no violations)</p>
            )}
          </div>
        )}

        {/* Ticket-Specific Details */}
        {isTicket && ticket && (
          <div className="space-y-8">
            {/* Fines */}
            {(ticket?.fines?.length || 0) > 0 && (
              <div>
                <h3 className="text-lg font-bold border-b-2 border-black mb-4">
                  FINANCIAL FINES ({ticket?.fines?.length || 0})
                </h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="text-left p-2 font-bold">Description</th>
                      <th className="text-right p-2 font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ticket?.fines || []).map((f, i) => (
                      <tr
                        key={f.id}
                        className={i % 2 === 0 ? "bg-gray-50" : ""}
                      >
                        <td className="p-2">{f.description}</td>
                        <td className="p-2 text-right font-mono font-bold">
                          {formatCurrency(f.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-right border-t-2 border-black pt-2">
                  <p className="text-lg font-bold font-mono">
                    TOTAL: {formatCurrency(
                      (ticket?.fines || []).reduce((sum, f) => sum + f.amount, 0)
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Attorney and Recurring */}
            <div className="grid grid-cols-2 gap-8">
              <div className="p-4 bg-gray-100 border-l-4 border-black">
                <p className="text-xs uppercase tracking-widest font-bold text-gray-600 mb-2">
                  Legal Representation
                </p>
                <p className="text-xl font-bold">
                  {ticket.hasAttorney ? "ATTORNEY ASSIGNED" : "NO ATTORNEY"}
                </p>
              </div>
              <div className="p-4 bg-gray-100 border-l-4 border-black">
                <p className="text-xs uppercase tracking-widest font-bold text-gray-600 mb-2">
                  Offense Status
                </p>
                <p className="text-xl font-bold">
                  {ticket.isRecurring ? "RECURRING OFFENSE" : "FIRST OFFENSE"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Accident-Specific Details */}
        {accident && (
          <div className="space-y-8">
            {/* Injuries */}
            {accident.injuries.length > 0 && (
              <div>
                <h3 className="text-lg font-bold border-b-2 border-black mb-4">
                  INJURIES ({accident.injuries.length})
                </h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="text-left p-2 font-bold">Description</th>
                      <th className="text-left p-2 font-bold">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accident.injuries.map((inj, i) => (
                      <tr key={inj.id} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                        <td className="p-2">{inj.description}</td>
                        <td className="p-2 font-bold">{inj.severity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Accident Details */}
            <div className="grid grid-cols-2 gap-8">
              <div className="p-4 bg-gray-100 border-l-4 border-black">
                <p className="text-xs uppercase tracking-widest font-bold text-gray-600 mb-2">
                  FMCSA Status
                </p>
                <p className="text-xl font-bold">
                  {accident.isFmcsaRecordable ? "RECORDABLE" : "NOT RECORDABLE"}
                </p>
              </div>
              <div className="p-4 bg-gray-100 border-l-4 border-black">
                <p className="text-xs uppercase tracking-widest font-bold text-gray-600 mb-2">
                  Vehicle Tow
                </p>
                <p className="text-xl font-bold">
                  {accident.vehicleTowed ? "VEHICLE TOWED" : "NO TOW"}
                </p>
              </div>
            </div>
          </div>
        )}

        {inspection && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="p-4 bg-gray-100 border-l-4 border-black">
                <p className="text-xs uppercase tracking-widest font-bold text-gray-600 mb-2">
                  Citation
                </p>
                <p className="text-xl font-bold">
                  {inspection.receivedCitation ? "Issued" : "Not Issued"}
                </p>
              </div>
              <div className="p-4 bg-gray-100 border-l-4 border-black">
                <p className="text-xs uppercase tracking-widest font-bold text-gray-600 mb-2">
                  Citation Number
                </p>
                <p className="text-xl font-bold">
                  {inspection.citationNumber || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-black text-center text-xs text-gray-600">
          <p>
            Generated: {formatDate(new Date().toISOString())} | Fleet Safety CRM
          </p>
        </div>
      </div>
    </div>
  );
};
