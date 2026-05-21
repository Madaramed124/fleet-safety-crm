import React, { useState, useEffect, useRef } from "react";
import notify from '../utils/notify';
import { useApp } from "../context/AppContext";
import {
  IncidentRecord,
  Accident,
  Inspection,
  Ticket,
  Violation,
  Fine,
  Injury,
  Attachment,
} from "../types";
import { generateId } from "../utils/helpers";
import { Plus, Trash2, X, UploadCloud, FileText, Image } from "lucide-react";

const inspectionAttachmentTypes = ["Inspection Report", "Proof of Repair", "Other"] as const;
const citationAttachmentTypes = ["Warning Letter", "Citation"] as const;

const attachmentTypeDescription = (typeOption: Attachment["type"]) => {
  switch (typeOption) {
    case "Inspection Report":
      return "Official inspection document";
    case "Proof of Repair":
      return "Repair completion record";
    case "Warning Letter":
      return "Official notice document";
    case "Pictures":
      return "Accident scene photos";
    case "Police Report":
      return "Official police report";
    case "Citation":
      return "Inspection citation paperwork";
    case "Other":
      return "Any other supporting document";
    default:
      return "Upload file";
  }
};

const getAttachmentIcon = (typeOption: Attachment["type"]) => {
  switch (typeOption) {
    case "Inspection Report":
    case "Police Report":
    case "Warning Letter":
    case "Citation":
      return <FileText size={16} className="text-cyan-400" />;
    case "Proof of Repair":
      return <FileText size={16} className="text-emerald-400" />;
    case "Pictures":
      return <Image size={16} className="text-amber-400" />;
    default:
      return <UploadCloud size={16} className="text-cyan-400" />;
  }
};

export const IncidentFormModal: React.FC = () => {
  const {
    isAddModalOpen,
    isEditModalOpen,
    editingRecordId,
    records,
    months,
    selectedMonthId,
    closeAddModal,
    closeEditModal,
    addRecord,
    updateRecord,
  } = useApp();

  const isOpen = isAddModalOpen || isEditModalOpen;
  const editingRecord = editingRecordId
    ? records.find((r) => r.id === editingRecordId)
    : null;

  const [type, setType] = useState<"accident" | "inspection" | "ticket">("inspection");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [caseCode, setCaseCode] = useState("");
  const [driverName, setDriverName] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [formMonthId, setFormMonthId] = useState<string>(selectedMonthId ?? "");
  const [status, setStatus] = useState<"Open" | "Pending" | "Closed">("Open");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const [newAttachmentType, setNewAttachmentType] = useState<
    | "Inspection Report"
    | "Proof of Repair"
    | "Warning Letter"
    | "Pictures"
    | "Police Report"
    | "Citation"
    | "Other"
  >("Inspection Report");
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ticketAttachmentTypes = [
    "Inspection Report",
    "Proof of Repair",
    "Warning Letter",
  ] as const;
  const accidentAttachmentTypes = ["Pictures", "Police Report"] as const;

  const companyNameSuggestions = [
    "Euro Kam LTD",
    "WTA GLOBAL INC",
    "Pro Line Cargo LLC",
    "WTA Carollinas",
    "ARBA Motors",
    "Minga Transport INC",
  ];

  // Ticket fields
  const [csaSeverity, setCsaSeverity] = useState<"High" | "Medium" | "Low">("Medium");
  const [hasAttorney, setHasAttorney] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [csaImpactScore, setCsaImpactScore] = useState("");
  const [companyImpactLevel, setCompanyImpactLevel] = useState<"Low" | "Medium" | "High">("Medium");
  const [companyImpactNotes, setCompanyImpactNotes] = useState("");
  const [referredToLawyers, setReferredToLawyers] = useState<"Yes" | "No">("No");
  const [totalCost, setTotalCost] = useState(0);
  const [legalNotes, setLegalNotes] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Accident and inspection fields
  const [severity, setSeverity] = useState<"Minor" | "Major" | "Critical">("Minor");
  const [isFmcsaRecordable, setIsFmcsaRecordable] = useState(false);
  const [vehicleTowed, setVehicleTowed] = useState(false);
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [receivedCitation, setReceivedCitation] = useState(false);
  const [citationNumber, setCitationNumber] = useState("");
  const [inspectionHasTicketDetails, setInspectionHasTicketDetails] = useState(false);
  const [isCleanInspection, setIsCleanInspection] = useState(false);
  const currentAttachmentTypes =
    type === "accident" ? accidentAttachmentTypes : inspectionAttachmentTypes;

  // Initialize form with editing record if exists
  useEffect(() => {
    if (isEditModalOpen && editingRecord) {
      setType(editingRecord.type as "accident" | "inspection" | "ticket");
      setDate(editingRecord.date);
      setCaseCode(editingRecord.caseCode);
      setDriverName(editingRecord.driverName);
      setCarrierName(editingRecord.carrierName);
      setStatus(editingRecord.status);
      setNotes(editingRecord.notes);
      setAttachments(editingRecord.attachments ?? []);
      if (editingRecord.type === "ticket") {
        const ticket = editingRecord as any;
        setCsaSeverity(ticket.csaSeverity ?? "Medium");
        setHasAttorney(ticket.hasAttorney ?? false);
        setIsRecurring(ticket.isRecurring ?? false);
        setViolations(ticket.violations ?? []);
        setFines(ticket.fines ?? []);
        setCsaImpactScore(ticket.csaImpactScore ?? "");
        setCompanyImpactLevel(ticket.companyImpactLevel ?? "Medium");
        setCompanyImpactNotes(ticket.companyImpactNotes ?? "");
        setReferredToLawyers(ticket.referredToLawyers ?? "No");
        setTotalCost(ticket.totalCost ?? 0);
        setLegalNotes(ticket.legalNotes ?? "");
        setResolutionNotes(ticket.resolutionNotes ?? "");
        setReceivedCitation(true);
        setCitationNumber(ticket.citationNumber ?? "");
        setInspectionHasTicketDetails(true);
      } else if (editingRecord.type === "accident") {
        const accident = editingRecord as Accident;
        setSeverity(accident.severity);
        setIsFmcsaRecordable(accident.isFmcsaRecordable);
        setVehicleTowed(accident.vehicleTowed);
        setInjuries(accident.injuries);
      } else if (editingRecord.type === "inspection") {
        const inspection = editingRecord as Inspection;
        setSeverity(inspection.severity);
        setReceivedCitation(inspection.receivedCitation);
        setCitationNumber(inspection.citationNumber);
        setInspectionHasTicketDetails(!!inspection.hasAssociatedTicket);
        setIsCleanInspection((inspection.violations?.length ?? 0) === 0);
        setViolations(inspection.violations ?? []);
        setFines(inspection.fines ?? []);
        setCsaImpactScore(inspection.csaImpactScore ?? "");
        setCompanyImpactLevel(inspection.companyImpactLevel ?? "Medium");
        setCompanyImpactNotes(inspection.companyImpactNotes ?? "");
        setReferredToLawyers(inspection.referredToLawyers ?? "No");
        setTotalCost(inspection.totalCost ?? 0);
        setLegalNotes(inspection.legalNotes ?? "");
        setResolutionNotes(inspection.resolutionNotes ?? "");
      }
    } else {
      resetForm();
      setFormMonthId(selectedMonthId ?? months[0]?.id ?? "");
    }
  }, [isOpen, editingRecord, isEditModalOpen, selectedMonthId, months]);

  const resetForm = () => {
    setType("inspection");
    setDate(new Date().toISOString().split("T")[0]);
    setCaseCode("");
    setDriverName("");
    setCarrierName("");
    setStatus("Open");
    setNotes("");
    setCsaSeverity("Medium");
    setHasAttorney(false);
    setIsRecurring(false);
    setViolations([]);
    setFines([]);
    setCsaImpactScore("");
    setCompanyImpactLevel("Medium");
    setCompanyImpactNotes("");
    setReferredToLawyers("No");
    setTotalCost(0);
    setLegalNotes("");
    setResolutionNotes("");
    setSeverity("Minor");
    setIsFmcsaRecordable(false);
    setVehicleTowed(false);
    setInjuries([]);
    setReceivedCitation(false);
    setCitationNumber("");
    setInspectionHasTicketDetails(false);
    setIsCleanInspection(false);
    setAttachments([]);
    setNewAttachmentType("Inspection Report");
    setFormMonthId(selectedMonthId ?? months[0]?.id ?? "");
  };

  const handleFileUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      notify.error("File must be under 10 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const fileResult = reader.result;
      if (typeof fileResult === "string") {
        setAttachments((prev) => [
          ...prev,
          {
            id: generateId(),
            type: newAttachmentType,
            name: file.name,
            url: fileResult,
          },
        ]);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleFileUpload(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    handleFileUpload(file);
  };

  const getAttachmentPreviewType = (attachment: Attachment) => {
    const fileName = attachment.name.toLowerCase();
    if (attachment.url.startsWith("data:image/")) return "image";
    if (attachment.url.startsWith("data:application/pdf") || fileName.endsWith(".pdf")) return "pdf";
    return "other";
  };

  const handleSubmit = () => {
    if (!formMonthId) {
      notify.error("Please select a month for this violation");
      return;
    }

    if (!caseCode.trim() || !driverName.trim() || !carrierName.trim()) {
      notify.error("Please fill in all required fields");
      return;
    }

    const baseData = {
      id: editingRecord?.id || generateId(),
      monthId: formMonthId,
      date,
      caseCode,
      driverName,
      carrierName,
      status,
      notes,
      attachments,
    };

    let record: IncidentRecord;

    if (type === "accident") {
      record = {
        ...baseData,
        type: "accident",
        severity,
        isFmcsaRecordable,
        vehicleTowed,
        injuries,
      } as Accident;
    } else if (type === "ticket") {
      record = {
        ...baseData,
        type: "ticket",
        citationNumber,
        csaSeverity,
        hasAttorney,
        isRecurring,
        violations,
        fines,
        csaImpactScore,
        companyImpactLevel,
        companyImpactNotes,
        referredToLawyers,
        totalCost,
        legalNotes,
        resolutionNotes,
      } as Ticket;
    } else {
      record = {
        ...baseData,
        type: "inspection",
        severity,
        receivedCitation,
        citationNumber,
        hasAssociatedTicket: inspectionHasTicketDetails || receivedCitation,
        csaSeverity:
          inspectionHasTicketDetails || receivedCitation ? csaSeverity : undefined,
        hasAttorney:
          inspectionHasTicketDetails || receivedCitation ? hasAttorney : undefined,
        isRecurring:
          inspectionHasTicketDetails || receivedCitation ? isRecurring : undefined,
        violations,
        fines:
          inspectionHasTicketDetails || receivedCitation ? fines : undefined,
        csaImpactScore:
          inspectionHasTicketDetails || receivedCitation ? csaImpactScore : undefined,
        companyImpactLevel:
          inspectionHasTicketDetails || receivedCitation ? companyImpactLevel : undefined,
        companyImpactNotes:
          inspectionHasTicketDetails || receivedCitation ? companyImpactNotes : undefined,
        referredToLawyers:
          inspectionHasTicketDetails || receivedCitation ? referredToLawyers : undefined,
        totalCost:
          inspectionHasTicketDetails || receivedCitation ? totalCost : undefined,
        legalNotes:
          inspectionHasTicketDetails || receivedCitation ? legalNotes : undefined,
        resolutionNotes:
          inspectionHasTicketDetails || receivedCitation ? resolutionNotes : undefined,
      } as Inspection;
    }

    if (isEditModalOpen) {
      updateRecord(record);
      closeEditModal();
    } else {
      addRecord(record);
      closeAddModal();
      resetForm();
    }
  };

  const handleClose = () => {
    isAddModalOpen ? closeAddModal() : closeEditModal();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-4 no-print">
      <div className="modal-shell custom-scrollbar bg-slate-950/95 border border-slate-800/90 rounded-[28px] shadow-[0_24px_120px_-40px_rgba(15,23,42,0.95)] max-w-3xl w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <h2 className="text-xl font-bold text-cyan-400">
            {isEditModalOpen ? "Edit Violation" : "Add New Violation"}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-bold text-cyan-400 mb-3">
              Violation Type
            </label>
            {isEditModalOpen ? (
              <div className="py-3 px-4 rounded bg-slate-800 text-slate-200 font-semibold">
                {type === "accident"
                  ? "Accident"
                  : type === "ticket"
                  ? "Ticket"
                  : "Inspection"}
              </div>
            ) : (
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => {
                    setType("accident");
                    setInjuries([]);
                    setAttachments([]);
                    setNewAttachmentType("Pictures");
                  }}
                  className={`flex-1 py-3 px-4 rounded font-semibold transition-all ${
                    type === "accident"
                      ? "bg-red-500 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Accident
                </button>
                <button
                  onClick={() => {
                    setType("inspection");
                    setReceivedCitation(false);
                    setCitationNumber("");
                    setInspectionHasTicketDetails(false);
                    setInjuries([]);
                    setAttachments([]);
                    setNewAttachmentType("Inspection Report");
                  }}
                  className={`flex-1 py-3 px-4 rounded font-semibold transition-all ${
                    type === "inspection"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Inspection
                </button>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Case Code *
              </label>
              <input
                type="text"
                value={caseCode}
                onChange={(e) => setCaseCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                placeholder="e.g., CSO-2024-001"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Driver Name *
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Carrier Name *
              </label>
              <select
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="" disabled>
                  Select company
                </option>
                {companyNameSuggestions.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {months.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Month
              </label>
              <select
                value={formMonthId}
                onChange={(e) => setFormMonthId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="" disabled>
                  Select month
                </option>
                {months.map((month) => (
                  <option key={month.id} value={month.id}>
                    {month.monthLabel}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option>Open</option>
                <option>Pending</option>
                <option>Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option>Critical</option>
                <option>Major</option>
                <option>Minor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 resize-none h-20"
              placeholder="Additional details..."
            />
          </div>

          {(() => {
            const generalAttachments = attachments.filter(
              (a) => a.type !== "Warning Letter" && a.type !== "Citation"
            );
            return (
              <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="rounded-full bg-cyan-500/10 p-2 text-cyan-300">
                        <UploadCloud size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          Attachments ({generalAttachments.length})
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {type === "accident"
                            ? "Upload accident photos or the official police report."
                            : "Upload inspection reports, proof of repair, or other supporting documents."}
                        </p>
                      </div>
                    </div>
                    <div
                      onDrop={handleDrop}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragActive(true);
                      }}
                      onDragLeave={() => setIsDragActive(false)}
                      onClick={() => fileInputRef.current?.click()}
                      className={`group cursor-pointer rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-all ${
                        isDragActive
                          ? "border-cyan-400 bg-slate-900"
                          : "border-slate-700 bg-slate-900/80 hover:border-cyan-400"
                      }`}
                    >
                      <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-cyan-400 transition-colors group-hover:bg-cyan-500/10">
                        <UploadCloud size={28} />
                      </div>
                      <p className="text-sm font-semibold text-slate-100">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        PDF, DOCX, PNG — max 10 MB
                      </p>
                      <div className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-cyan-300 shadow-sm transition-colors group-hover:border-cyan-400">
                        Browse files
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
                      onChange={handleAttachmentUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-3 w-full lg:w-[320px] flex flex-col items-center">
                    {currentAttachmentTypes.map((typeOption) => (
                      <button
                        key={typeOption}
                        type="button"
                        onClick={() => {
                          setNewAttachmentType(typeOption);
                          fileInputRef.current?.click();
                        }}
                        className="group flex w-full max-w-[320px] items-center gap-3 rounded-3xl border border-slate-700 bg-slate-900 px-4 py-4 text-left transition-colors hover:border-cyan-400 hover:bg-slate-800"
                      >
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-800 text-cyan-400 transition-colors group-hover:bg-cyan-500/10">
                          {getAttachmentIcon(typeOption)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-100">
                            {typeOption}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {attachmentTypeDescription(typeOption)}
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-300 transition-colors group-hover:border-cyan-400 group-hover:text-cyan-300">
                          +
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {generalAttachments.length === 0 ? (
                    <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-4 text-xs text-slate-500">
                      No attachments yet. Use the upload area or quick-add cards.
                    </div>
                  ) : (
                    generalAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex flex-col gap-3 rounded-3xl border border-slate-700 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <span className="inline-flex rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
                            {attachment.type}
                          </span>
                          <div className="mt-2 text-sm font-semibold text-slate-100 truncate">
                            {attachment.name}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setViewingAttachment(attachment)}
                            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                          >
                            View
                          </button>
                          <a
                            href={attachment.url}
                            download={attachment.name}
                            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                          >
                            Download
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments((prev) =>
                                prev.filter((item) => item.id !== attachment.id)
                              )
                            }
                            className="text-xs font-semibold text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })()}

          {viewingAttachment && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setViewingAttachment(null)}
            >
              <div
                className="relative w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <p className="text-sm uppercase tracking-widest text-slate-500">
                      Attachment preview
                    </p>
                    <p className="text-lg font-semibold text-slate-100">
                      {viewingAttachment.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingAttachment(null)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-4 h-[70vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
                  {getAttachmentPreviewType(viewingAttachment) === "image" ? (
                    <img
                      src={viewingAttachment.url}
                      alt={viewingAttachment.name}
                      className="h-full w-full object-contain"
                    />
                  ) : getAttachmentPreviewType(viewingAttachment) === "pdf" ? (
                    <iframe
                      title={viewingAttachment.name}
                      src={viewingAttachment.url}
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-sm text-slate-400">
                      <p className="text-slate-100">Preview not available for this file type.</p>
                      <a
                        href={viewingAttachment.url}
                        download={viewingAttachment.name}
                        className="rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
                      >
                        Download to open
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Type-specific fields */}
          {type === "accident" ? (
            <AccidentFields
              isFmcsaRecordable={isFmcsaRecordable}
              setIsFmcsaRecordable={setIsFmcsaRecordable}
              vehicleTowed={vehicleTowed}
              setVehicleTowed={setVehicleTowed}
              injuries={injuries}
              setInjuries={setInjuries}
            />
          ) : (
            <InspectionFields
              receivedCitation={receivedCitation}
              setReceivedCitation={setReceivedCitation}
              citationNumber={citationNumber}
              setCitationNumber={setCitationNumber}
              hasTicketDetails={inspectionHasTicketDetails}
              setHasTicketDetails={setInspectionHasTicketDetails}
              hasAttorney={hasAttorney}
              setHasAttorney={setHasAttorney}
              isRecurring={isRecurring}
              setIsRecurring={setIsRecurring}
              csaSeverity={csaSeverity}
              setCsaSeverity={setCsaSeverity}
              violations={violations}
              setViolations={setViolations}
              isCleanInspection={isCleanInspection}
              setIsCleanInspection={setIsCleanInspection}
              fines={fines}
              setFines={setFines}
              csaImpactScore={csaImpactScore}
              setCsaImpactScore={setCsaImpactScore}
              companyImpactLevel={companyImpactLevel}
              setCompanyImpactLevel={setCompanyImpactLevel}
              companyImpactNotes={companyImpactNotes}
              setCompanyImpactNotes={setCompanyImpactNotes}
              referredToLawyers={referredToLawyers}
              setReferredToLawyers={setReferredToLawyers}
              totalCost={totalCost}
              setTotalCost={setTotalCost}
              legalNotes={legalNotes}
              setLegalNotes={setLegalNotes}
              resolutionNotes={resolutionNotes}
              setResolutionNotes={setResolutionNotes}
              attachments={attachments}
              setAttachments={setAttachments}
              setViewingAttachment={setViewingAttachment}
              setNewAttachmentType={setNewAttachmentType}
              fileInputRef={fileInputRef}
            />
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-950 py-3 px-4 rounded font-bold transition-colors"
            >
              {isEditModalOpen ? "Update Violation" : "Create Violation"}
            </button>
            <button
              onClick={handleClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-4 rounded font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TicketsProps {
  csaSeverity: "High" | "Medium" | "Low";
  setCsaSeverity: (v: "High" | "Medium" | "Low") => void;
  hasAttorney: boolean;
  setHasAttorney: (v: boolean) => void;
  isRecurring: boolean;
  setIsRecurring: (v: boolean) => void;
  fines: Fine[];
  setFines: (v: Fine[]) => void;
  csaImpactScore: string;
  setCsaImpactScore: (v: string) => void;
  companyImpactLevel: "Low" | "Medium" | "High";
  setCompanyImpactLevel: (v: "Low" | "Medium" | "High") => void;
  companyImpactNotes: string;
  setCompanyImpactNotes: (v: string) => void;
  referredToLawyers: "Yes" | "No";
  setReferredToLawyers: (v: "Yes" | "No") => void;
  totalCost: number;
  setTotalCost: (v: number) => void;
  legalNotes: string;
  setLegalNotes: (v: string) => void;
  resolutionNotes: string;
  setResolutionNotes: (v: string) => void;
}

const Tickets: React.FC<TicketsProps> = ({
  csaSeverity,
  setCsaSeverity,
  hasAttorney,
  setHasAttorney,
  isRecurring,
  setIsRecurring,
  fines,
  setFines,
  csaImpactScore,
  setCsaImpactScore,
  companyImpactLevel,
  setCompanyImpactLevel,
  companyImpactNotes,
  setCompanyImpactNotes,
  referredToLawyers,
  setReferredToLawyers,
  totalCost,
  setTotalCost,
  legalNotes,
  setLegalNotes,
  resolutionNotes,
  setResolutionNotes,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
          CSA Severity
        </label>
        <select
          value={csaSeverity}
          onChange={(e) => setCsaSeverity(e.target.value as any)}
          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
        >
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasAttorney}
            onChange={(e) => setHasAttorney(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-300">Has Attorney</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-300">Recurring Offense</span>
        </label>
      </div>

      {/* Fines Section */}
      <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-green-400">
            Fines ({fines.length})
          </label>
          <button
            onClick={() =>
              setFines([
                ...fines,
                { id: generateId(), description: "", amount: 0 },
              ])
            }
            className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-green-400 px-2 py-1 rounded transition-colors"
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {fines.map((f, i) => (
            <div key={f.id} className="flex gap-2">
              <input
                type="text"
                value={f.description}
                onChange={(e) => {
                  const updated = [...fines];
                  updated[i].description = e.target.value;
                  setFines(updated);
                }}
                placeholder="Description"
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="number"
                value={f.amount}
                onChange={(e) => {
                  const updated = [...fines];
                  updated[i].amount = parseFloat(e.target.value) || 0;
                  setFines(updated);
                }}
                placeholder="Amount"
                className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => setFines(fines.filter((_, idx) => idx !== i))}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Case Analysis */}
      <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
        <div className="flex flex-col gap-3 border-b border-slate-700 pb-4 mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-400 uppercase tracking-[0.2em]">
            <span>⚖️</span>
            Case Analysis
          </div>
          <p className="text-xs text-slate-500">
            Capture the business impact, legal review, and follow-up actions for this case.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              CSA Score Impact
            </label>
            <input
              type="text"
              value={csaImpactScore}
              onChange={(e) => setCsaImpactScore(e.target.value)}
              placeholder="e.g. 10"
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Company Impact Level
            </label>
            <select
              value={companyImpactLevel}
              onChange={(e) => setCompanyImpactLevel(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
            How will this impact our company?
          </label>
          <textarea
            value={companyImpactNotes}
            onChange={(e) => setCompanyImpactNotes(e.target.value)}
            placeholder="Describe the business impact, potential consequences, or risk to operations..."
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 resize-none h-24"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Referred to lawyers?
            </label>
            <select
              value={referredToLawyers}
              onChange={(e) => setReferredToLawyers(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
            >
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Total cost to company ($)
            </label>
            <input
              type="number"
              value={totalCost}
              onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}
              placeholder="e.g. 2500.00"
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Lawyer / Legal Notes
            </label>
            <textarea
              value={legalNotes}
              onChange={(e) => setLegalNotes(e.target.value)}
              placeholder="Name of attorney, firm, status of legal proceedings, advice received..."
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 resize-none h-20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              What was done to address this case?
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe actions taken: driver counseling, policy changes, legal filings, insurance claims, training..."
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 resize-none h-20"
            />
          </div>
        </div>
      </div>

    </div>
  );
};

interface InspectionFieldsProps {
  receivedCitation: boolean;
  setReceivedCitation: (v: boolean) => void;
  citationNumber: string;
  setCitationNumber: (v: string) => void;
  hasTicketDetails: boolean;
  setHasTicketDetails: (v: boolean) => void;
  hasAttorney: boolean;
  setHasAttorney: (v: boolean) => void;
  isRecurring: boolean;
  setIsRecurring: (v: boolean) => void;
  csaSeverity: "High" | "Medium" | "Low";
  setCsaSeverity: (v: "High" | "Medium" | "Low") => void;
  violations: Violation[];
  setViolations: (v: Violation[]) => void;
  isCleanInspection: boolean;
  setIsCleanInspection: (v: boolean) => void;
  fines: Fine[];
  setFines: (v: Fine[]) => void;
  csaImpactScore: string;
  setCsaImpactScore: (v: string) => void;
  companyImpactLevel: "Low" | "Medium" | "High";
  setCompanyImpactLevel: (v: "Low" | "Medium" | "High") => void;
  companyImpactNotes: string;
  setCompanyImpactNotes: (v: string) => void;
  referredToLawyers: "Yes" | "No";
  setReferredToLawyers: (v: "Yes" | "No") => void;
  totalCost: number;
  setTotalCost: (v: number) => void;
  legalNotes: string;
  setLegalNotes: (v: string) => void;
  resolutionNotes: string;
  setResolutionNotes: (v: string) => void;
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  setViewingAttachment: (attachment: Attachment | null) => void;
  setNewAttachmentType: (v: Attachment["type"]) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const InspectionFields: React.FC<InspectionFieldsProps> = ({
  receivedCitation,
  setReceivedCitation,
  citationNumber,
  setCitationNumber,
  hasTicketDetails,
  setHasTicketDetails,
  hasAttorney,
  setHasAttorney,
  isRecurring,
  setIsRecurring,
  csaSeverity,
  setCsaSeverity,
  violations,
  setViolations,
  isCleanInspection,
  setIsCleanInspection,
  fines,
  setFines,
  csaImpactScore,
  setCsaImpactScore,
  companyImpactLevel,
  setCompanyImpactLevel,
  companyImpactNotes,
  setCompanyImpactNotes,
  referredToLawyers,
  setReferredToLawyers,
  totalCost,
  setTotalCost,
  legalNotes,
  setLegalNotes,
  resolutionNotes,
  setResolutionNotes,
  attachments,
  setAttachments,
  setViewingAttachment,
  setNewAttachmentType,
  fileInputRef,
}) => {
  const shouldShowTicketComponent = receivedCitation || hasTicketDetails;

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={isCleanInspection}
            onChange={(e) => {
              const clean = e.target.checked;
              setIsCleanInspection(clean);
              if (clean) {
                setViolations([]);
              }
            }}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-100 font-semibold">Clean inspection (no violations)</span>
        </label>

        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-cyan-400">Violations ({violations.length})</label>
          <button
            disabled={isCleanInspection}
            onClick={() => {
              setViolations([
                ...violations,
                { id: generateId(), code: "", description: "", severity: "Medium" },
              ]);
              setIsCleanInspection(false);
            }}
            className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-cyan-400 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {violations.length === 0 ? (
            <div className="text-slate-400 text-sm">
              {isCleanInspection
                ? "This inspection is marked clean."
                : "No violations added yet. Add a violation or mark the inspection as clean."}
            </div>
          ) : (
            violations.map((v, i) => (
              <div key={v.id} className="flex gap-2">
                <input
                  type="text"
                  value={v.code}
                  onChange={(e) => {
                    const updated = [...violations];
                    updated[i].code = e.target.value;
                    setViolations(updated);
                  }}
                  placeholder="Code"
                  className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  value={v.description}
                  onChange={(e) => {
                    const updated = [...violations];
                    updated[i].description = e.target.value;
                    setViolations(updated);
                  }}
                  placeholder="Description"
                  className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <select
                  value={v.severity}
                  onChange={(e) => {
                    const updated = [...violations];
                    updated[i].severity = e.target.value as any;
                    setViolations(updated);
                  }}
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                <button
                  onClick={() => setViolations(violations.filter((_, idx) => idx !== i))}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={receivedCitation}
            onChange={(e) => setReceivedCitation(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-300">Received citation</span>
        </label>
      </div>
      {receivedCitation && (
        <div className="space-y-4">
          <div className="space-y-4 bg-slate-800/50 p-4 rounded border border-slate-700">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-400 uppercase tracking-[0.2em] mb-3">
              <span>📄</span>
              Citation Details
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Citation Number
              </label>
              <input
                type="text"
                value={citationNumber}
                onChange={(e) => setCitationNumber(e.target.value)}
                placeholder="e.g. 123456"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-400 uppercase tracking-[0.2em] mb-4">
              <span>📝</span>
              Legal & Warning Documents
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {citationAttachmentTypes.map((typeOption) => (
                <button
                  key={typeOption}
                  type="button"
                  onClick={() => {
                    setNewAttachmentType(typeOption);
                    fileInputRef.current?.click();
                  }}
                  className="group flex w-full items-center gap-3 rounded-3xl border border-slate-700 bg-slate-900 px-4 py-4 text-left transition-colors hover:border-cyan-400 hover:bg-slate-800"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-800 text-cyan-400 transition-colors group-hover:bg-cyan-500/10">
                    {getAttachmentIcon(typeOption)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-100">{typeOption}</p>
                    <p className="text-xs text-slate-500 mt-1">{attachmentTypeDescription(typeOption)}</p>
                  </div>
                  <span className="rounded-full border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-300 transition-colors group-hover:border-cyan-400 group-hover:text-cyan-300">
                    +
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-500">
                Attach warning letters and citation paperwork here.
              </p>
              {attachments.filter((a) => a.type === "Warning Letter" || a.type === "Citation").length === 0 ? (
                <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-4 text-xs text-slate-500">
                  No legal documents added yet. Use the cards above to add files.
                </div>
              ) : (
                <div className="space-y-3">
                  {attachments
                    .filter((a) => a.type === "Warning Letter" || a.type === "Citation")
                    .map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex flex-col gap-3 rounded-3xl border border-slate-700 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <span className="inline-flex rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
                            {attachment.type}
                          </span>
                          <div className="mt-2 text-sm font-semibold text-slate-100 truncate">
                            {attachment.name}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setViewingAttachment(attachment)}
                            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                          >
                            View
                          </button>
                          <a
                            href={attachment.url}
                            download={attachment.name}
                            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                          >
                            Download
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments((prev) =>
                                prev.filter((item) => item.id !== attachment.id)
                              )
                            }
                            className="text-xs font-semibold text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {shouldShowTicketComponent && (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-cyan-400 uppercase tracking-[0.2em]">
            Tickets
          </div>
          <Tickets
            csaSeverity={csaSeverity}
            setCsaSeverity={setCsaSeverity}
            hasAttorney={hasAttorney}
            setHasAttorney={setHasAttorney}
            isRecurring={isRecurring}
            setIsRecurring={setIsRecurring}
            fines={fines}
            setFines={setFines}
            csaImpactScore={csaImpactScore}
            setCsaImpactScore={setCsaImpactScore}
            companyImpactLevel={companyImpactLevel}
            setCompanyImpactLevel={setCompanyImpactLevel}
            companyImpactNotes={companyImpactNotes}
            setCompanyImpactNotes={setCompanyImpactNotes}
            referredToLawyers={referredToLawyers}
            setReferredToLawyers={setReferredToLawyers}
            totalCost={totalCost}
            setTotalCost={setTotalCost}
            legalNotes={legalNotes}
            setLegalNotes={setLegalNotes}
            resolutionNotes={resolutionNotes}
            setResolutionNotes={setResolutionNotes}
          />
        </div>
      )}
    </div>
  );
};

interface AccidentFieldsProps {
  isFmcsaRecordable: boolean;
  setIsFmcsaRecordable: (v: boolean) => void;
  vehicleTowed: boolean;
  setVehicleTowed: (v: boolean) => void;
  injuries: Injury[];
  setInjuries: (v: Injury[]) => void;
}

const AccidentFields: React.FC<AccidentFieldsProps> = ({
  isFmcsaRecordable,
  setIsFmcsaRecordable,
  vehicleTowed,
  setVehicleTowed,
  injuries,
  setInjuries,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isFmcsaRecordable}
            onChange={(e) => setIsFmcsaRecordable(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-300">FMCSA Recordable</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={vehicleTowed}
            onChange={(e) => setVehicleTowed(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-300">Vehicle Towed</span>
        </label>
      </div>

      {/* Injuries Section */}
      <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-red-400">
            Injuries ({injuries.length})
          </label>
          <button
            onClick={() =>
              setInjuries([
                ...injuries,
                { id: generateId(), description: "", severity: "Minor" },
              ])
            }
            className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-red-400 px-2 py-1 rounded transition-colors"
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {injuries.map((inj, i) => (
            <div key={inj.id} className="flex gap-2">
              <input
                type="text"
                value={inj.description}
                onChange={(e) => {
                  const updated = [...injuries];
                  updated[i].description = e.target.value;
                  setInjuries(updated);
                }}
                placeholder="Description"
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <select
                value={inj.severity}
                onChange={(e) => {
                  const updated = [...injuries];
                  updated[i].severity = e.target.value as any;
                  setInjuries(updated);
                }}
                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option>Critical</option>
                <option>Major</option>
                <option>Minor</option>
              </select>
              <button
                onClick={() => setInjuries(injuries.filter((_, idx) => idx !== i))}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
