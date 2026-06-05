import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../services/supabaseClient";
import { formatDate, formatCurrency, generateId } from "../utils/helpers";

type TimelineStep = { label: string; date?: string | null; done?: boolean };

type DriverOption = { id: string; name: string };

type InspectionSummary = {
  id: string;
  date: string;
  caseCode: string;
  violations: string[];
};

type CourtRecord = {
  id: string;
  monthId: string;
  date: string;
  driverId?: string | null;
  caseNumber: string;
  driverName: string;
  carrierName: string;
  status: string;
  notes: string;
  attachments: Array<unknown>;
  type: "courtCase";
  filedDate: string;
  hearingDate?: string | null;
  lawyer?: string | null;
  amountPaid: number;
  totalFee: number;
  attorneyFee: number;
  violation: string;
  linkedChargeId?: string | null;
  verdictNotes?: string | null;
  outcome?: "Won" | "Lost" | null;
  timeline: TimelineStep[];
};

const getTodayIso = () => new Date().toISOString().slice(0, 10);

const statusColors: Record<string, { bg: string; dot: string }> = {
  New: { bg: "bg-slate-600", dot: "bg-slate-400" },
  "Lawyer Assigned": { bg: "bg-cyan-500", dot: "bg-cyan-400" },
  "Hearing Scheduled": { bg: "bg-amber-500", dot: "bg-amber-400" },
  "Verdict Pending": { bg: "bg-purple-400", dot: "bg-purple-300" },
  "Closed - Won": { bg: "bg-emerald-400", dot: "bg-emerald-300" },
  "Closed - Lost": { bg: "bg-rose-400", dot: "bg-rose-300" },
};

const statusPills = [
  "All",
  "New",
  "Lawyer Assigned",
  "Hearing Scheduled",
  "Verdict Pending",
  "Closed - Won",
  "Closed - Lost",
];

const defaultForm = {
  driverId: "",
  caseNumber: "",
  driverName: "",
  carrierName: "",
  violation: "",
  filedDate: new Date().toISOString().slice(0, 10),
  hearingDate: "",
  lawyer: "",
  attorneyFee: 0,
  amountPaid: 0,
  totalFee: 0,
  status: "New",
  notes: "",
};

const buildTimeline = (filedDate: string, hearingDate: string | null, status: string): TimelineStep[] => {
  return [
    { label: "Case Opened", date: filedDate, done: true },
    { label: "Sent to Lawyer", date: status !== "New" ? filedDate : null, done: status !== "New" },
    { label: "Fee Paid", date: status !== "New" ? filedDate : null, done: status !== "New" },
    {
      label: "Hearing Scheduled",
      date: hearingDate || null,
      done: status === "Hearing Scheduled" || status === "Verdict Pending" || status.startsWith("Closed"),
    },
    {
      label: "Verdict",
      date: status === "Verdict Pending" || status.startsWith("Closed") ? hearingDate || filedDate : null,
      done: status === "Verdict Pending" || status.startsWith("Closed"),
    },
    {
      label: "Closed",
      date: status.startsWith("Closed") ? hearingDate || filedDate : null,
      done: status.startsWith("Closed"),
    },
  ];
};

const Courts: React.FC = () => {
  const { records } = useApp();
  const [cases, setCases] = useState<CourtRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeVerdictCaseId, setActiveVerdictCaseId] = useState<string | null>(null);
  const [activeCloseCaseId, setActiveCloseCaseId] = useState<string | null>(null);
  const [verdictDraft, setVerdictDraft] = useState("");

  const deleteCase = async (caseId: string) => {
    setError(null);
    setIsSaving(true);
    try {
      const { error: deleteError } = await supabase.from("records").delete().eq("id", caseId);
      if (deleteError) throw deleteError;
      setCases((prev) => prev.filter((c) => c.id !== caseId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete case. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const createAttorneyFeeCharge = async (courtCase: CourtRecord) => {
    if (!courtCase.driverId || courtCase.attorneyFee <= 0) return null;
    const description = `Attorney fee - Court case ${courtCase.caseNumber}`;
    const payload: any = {
      driver_id: courtCase.driverId,
      charge_type: "Attorney Fee",
      description,
      amount: courtCase.attorneyFee,
      payment_status: "pending",
      charge_status: "charged",
      violation_code: courtCase.violation || null,
    };

    const { data, error } = await supabase.from("charges").insert([payload]).select().maybeSingle();
    if (error) throw error;
    return data?.id || null;
  };

  const updateAttorneyFeeCharge = async (courtCase: CourtRecord) => {
    if (!courtCase.linkedChargeId) return null;
    const description = `Attorney fee - Court case ${courtCase.caseNumber}`;
    const { error } = await supabase
      .from("charges")
      .update({ amount: courtCase.attorneyFee, description, charge_type: "Attorney Fee" })
      .eq("id", courtCase.linkedChargeId);
    if (error) throw error;
    return courtCase.linkedChargeId;
  };

  const syncAttorneyFeeToLedger = async (courtCase: CourtRecord) => {
    if (!courtCase.driverId || courtCase.attorneyFee <= 0) return null;

    if (courtCase.linkedChargeId) {
      await updateAttorneyFeeCharge(courtCase);
      return courtCase.linkedChargeId;
    }

    const chargeId = await createAttorneyFeeCharge(courtCase);
    if (chargeId) {
      const updatedCase = { ...courtCase, linkedChargeId: chargeId };
      const { error: updateError } = await supabase
        .from("records")
        .update({ payload: updatedCase })
        .eq("id", updatedCase.id);
      if (!updateError) {
        setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
      }
      return chargeId;
    }

    return null;
  };

  const applyCaseUpdate = async (updatedCase: CourtRecord) => {
    setError(null);
    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("records")
        .update({ payload: updatedCase })
        .eq("id", updatedCase.id);
      if (updateError) throw updateError;
      setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
      await syncAttorneyFeeToLedger(updatedCase);
    } catch (updateError) {
      console.error(updateError);
      setError("Failed to update case. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimelineStepClick = async (courtCase: CourtRecord, stepLabel: string) => {
    if (stepLabel === "Sent to Lawyer" || stepLabel === "Fee Paid") {
      if (courtCase.status !== "Lawyer Assigned") {
        await applyCaseUpdate({
          ...courtCase,
          status: "Lawyer Assigned",
          amountPaid: courtCase.totalFee > 0 ? courtCase.totalFee : courtCase.amountPaid,
          timeline: buildTimeline(courtCase.filedDate, courtCase.hearingDate || null, "Lawyer Assigned"),
        });
      }
      return;
    }

    if (stepLabel === "Hearing Scheduled") {
      if (!courtCase.hearingDate || courtCase.status !== "Hearing Scheduled") {
        const hearingDate = courtCase.hearingDate || getTodayIso();
        await applyCaseUpdate({
          ...courtCase,
          status: "Hearing Scheduled",
          hearingDate,
          timeline: buildTimeline(courtCase.filedDate, hearingDate, "Hearing Scheduled"),
        });
      }
      return;
    }

    if (stepLabel === "Verdict") {
      setActiveVerdictCaseId(courtCase.id);
      setActiveCloseCaseId(null);
      setVerdictDraft(courtCase.verdictNotes || "");
      return;
    }

    if (stepLabel === "Closed") {
      setActiveCloseCaseId(courtCase.id);
      setActiveVerdictCaseId(null);
      return;
    }
  };

  const saveVerdictNotes = async (courtCase: CourtRecord) => {
    await applyCaseUpdate({
      ...courtCase,
      status: "Verdict Pending",
      verdictNotes: verdictDraft || courtCase.verdictNotes || "",
      timeline: buildTimeline(courtCase.filedDate, courtCase.hearingDate || null, "Verdict Pending"),
    });
    setActiveVerdictCaseId(null);
  };

  const closeCase = async (courtCase: CourtRecord, outcome: "Won" | "Lost") => {
    await applyCaseUpdate({
      ...courtCase,
      status: `Closed - ${outcome}`,
      outcome,
      timeline: buildTimeline(courtCase.filedDate, courtCase.hearingDate || null, `Closed - ${outcome}`),
    });
    setActiveCloseCaseId(null);
    setActiveVerdictCaseId(null);
  };

  const parseNumberField = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase.from("records").select("id, monthId, payload");
      if (error) throw error;
      const rows = (data ?? []) as Array<{ id: string; monthId: string; payload: any }>;
      const loaded = rows
        .map((row) => {
          const attorneyFee = parseNumberField(row.payload?.attorneyFee);
          const totalFee = parseNumberField(row.payload?.totalFee);
          const amountPaid = parseNumberField(row.payload?.amountPaid);

          return {
            ...row.payload,
            id: row.id,
            monthId: row.monthId,
            attorneyFee,
            totalFee,
            amountPaid,
            linkedChargeId: row.payload?.linkedChargeId ?? null,
          };
        })
        .filter((item) => item.type === "courtCase") as CourtRecord[];
      setCases(loaded);
    } catch (fetchError) {
      console.error(fetchError);
      setError("Could not load court cases. Please refresh.");
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase.from("drivers").select("id,name").order("name", { ascending: true });
      if (error) throw error;
      setDrivers((data ?? []) as DriverOption[]);
    } catch (fetchError) {
      console.warn("Could not load drivers:", fetchError);
      setDrivers([]);
    }
  };

  const driverInspections = useMemo(() => {
    if (!form.driverName) return [] as InspectionSummary[];

    return records
      .filter((record) => record.type === "inspection" && record.driverName === form.driverName)
      .map((record) => {
        const inspection = record as any;
        const codes = (inspection.violations || []).map((v: any) => v.code || "Unknown");
        return {
          id: record.id,
          date: record.date,
          caseCode: record.caseCode || record.id,
          violations: codes,
        };
      });
  }, [form.driverName, records]);

  useEffect(() => {
    fetchCases();
    fetchDrivers();
  }, []);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const q = query.trim().toLowerCase();
      if (q && !(c.driverName.toLowerCase().includes(q) || c.caseNumber.toLowerCase().includes(q))) {
        return false;
      }
      if (filter !== "All" && c.status !== filter) return false;
      return true;
    });
  }, [cases, filter, query]);

  const totalCases = cases.length;
  const casesWon = cases.filter((c) => c.status === "Closed - Won").length;
  const totalFees = cases.reduce((sum, c) => sum + c.totalFee, 0);
  const feesCollected = cases.reduce((sum, c) => sum + c.amountPaid, 0);
  const feesPercent = totalFees === 0 ? 0 : Math.round((feesCollected / totalFees) * 100);

  const openModal = () => {
    setForm({ ...defaultForm });
    setError(null);
    setShowModal(true);
  };

  const createCase = async () => {
    setError(null);
    if (!form.caseNumber || !form.driverName || !form.violation || !form.filedDate) {
      setError("Please fill in required fields.");
      return;
    }

    const newCase: CourtRecord = {
      id: generateId(),
      monthId: "courts",
      date: form.filedDate,
      driverId: form.driverId || null,
      caseNumber: form.caseNumber,
      driverName: form.driverName,
      carrierName: form.carrierName || "",
      status: form.status,
      notes: form.notes,
      attachments: [],
      type: "courtCase",
      filedDate: form.filedDate,
      hearingDate: form.hearingDate || null,
      lawyer: form.lawyer || null,
      attorneyFee: Number(form.attorneyFee || 0),
      amountPaid: form.amountPaid,
      totalFee: form.totalFee,
      violation: form.violation,
      timeline: buildTimeline(form.filedDate, form.hearingDate || null, form.status),
    };

    setIsSaving(true);
    try {
      const { error: insertError } = await supabase.from("records").insert([{ id: newCase.id, monthId: newCase.monthId, payload: newCase }]);
      if (insertError) throw insertError;
      setCases((prev) => [newCase, ...prev]);
      await syncAttorneyFeeToLedger(newCase);
      setShowModal(false);
    } catch (createError) {
      console.error(createError);
      setError("Failed to save case. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8" style={{ backgroundColor: "#0a1628", minHeight: "100%" }}>
      <style>{`
        @keyframes pulseDot { 0% {opacity:1} 50% {opacity:0.4} 100% {opacity:1} }
        @keyframes timelineGlow { 0%, 100% { box-shadow: 0 0 0 rgba(56,189,248,0); } 50% { box-shadow: 0 0 16px rgba(56,189,248,0.2); } }
        .verdict-pulse { animation: pulseDot 1.6s infinite; }
        .timeline-step { transition: transform 0.25s ease, color 0.25s ease, opacity 0.25s ease; }
        .timeline-step:not(:disabled):hover { transform: translateY(-1px); }
        .timeline-step-complete { animation: timelineGlow 2.4s ease-in-out infinite alternate; }
        .timeline-line-fill { transition: width 0.75s ease-in-out, background-color 0.4s ease; }
        .progress-bar-fill { transition: width 1s ease-in-out, background-color 0.4s ease; }
      `}</style>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Court Cases</h1>
          <p className="text-sm text-slate-400">Track legal proceedings, payments & outcomes</p>
        </div>
        <button onClick={openModal} className="px-4 py-2 bg-cyan-400 text-slate-950 font-semibold rounded-lg shadow-lg shadow-cyan-500/20">+ New Case</button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-[#111827] border border-[#1f2937] rounded-lg">
          <div className="text-xs text-slate-400 uppercase">Total Cases</div>
          <div className="text-2xl font-bold">{totalCases}</div>
          <div className="text-xs text-slate-500">{filtered.length} active</div>
        </div>
        <div className="p-4 bg-[#111827] border border-[#1f2937] rounded-lg">
          <div className="text-xs text-slate-400 uppercase">Cases Won</div>
          <div className="text-2xl font-bold text-emerald-400">{casesWon}</div>
          <div className="text-xs text-slate-500">closed successfully</div>
        </div>
        <div className="p-4 bg-[#111827] border border-[#1f2937] rounded-lg">
          <div className="text-xs text-slate-400 uppercase">Total Fees</div>
          <div className="text-2xl font-bold">{formatCurrency(totalFees)}</div>
          <div className="text-xs text-slate-500">across all cases</div>
        </div>
        <div className="p-4 bg-[#111827] border border-[#1f2937] rounded-lg">
          <div className="text-xs text-slate-400 uppercase">Fees Collected</div>
          <div className="text-2xl font-bold text-amber-400">{formatCurrency(feesCollected)}</div>
          <div className="text-xs text-slate-500">{feesPercent}% of total</div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search driver or case #..." className="flex-1 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100" />
        <div className="flex flex-wrap gap-2">
          {statusPills.map((p) => (
            <button key={p} onClick={() => setFilter(p)} className={`px-3 py-1 rounded-full text-sm font-semibold ${filter === p ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-sm text-rose-200">{error}</div>}

      <div className="space-y-4">
        {filtered.map((c) => {
          const displayAttorneyFee = c.attorneyFee > 0 ? c.attorneyFee : c.totalFee;
          const pct = c.totalFee === 0 ? 0 : Math.round((c.amountPaid / c.totalFee) * 100);
          const isExpanded = expanded === c.id;
          const statusMeta = statusColors[c.status] || { bg: "bg-slate-600", dot: "bg-slate-400" };
          return (
            <div key={c.id} className={`bg-[#111827] border border-[#1f2937] rounded-lg p-4 transition-transform duration-200 ${isExpanded ? "translate-x-1" : "hover:translate-x-0.5"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold">{c.driverName}</div>
                  <div className="text-xs text-slate-400 font-mono">{c.caseNumber}</div>
                  <div className="text-sm text-slate-300 mt-2">{c.violation}</div>
                  <div className="text-xs text-slate-400 mt-2">Attorney fee: {formatCurrency(displayAttorneyFee)}</div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${statusMeta.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${statusMeta.dot} ${c.status === "Verdict Pending" ? "verdict-pulse" : ""}`}></span>
                    <span>{c.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setExpanded(isExpanded ? null : c.id)} className="text-cyan-400 text-sm">{isExpanded ? "Collapse" : "Expand"}</button>
                    <button onClick={() => setDeleteConfirmId(c.id)} className="text-rose-400 text-sm hover:text-rose-300">Remove</button>
                  </div>
                </div>
              </div>

              <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[1200px] mt-4" : "max-h-0"}`}>
                <div className="grid grid-cols-1 gap-4 p-4 bg-slate-900 rounded md:grid-cols-2">
                  <div>
                    <div className="text-xs text-slate-400 uppercase">Filed</div>
                    <div className="font-bold">{formatDate(c.filedDate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase">Hearing</div>
                    <div className="font-bold">{c.hearingDate ? formatDate(c.hearingDate) : "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase">Lawyer</div>
                    <div className="font-bold">{c.lawyer || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase">Attorney fee</div>
                    <div className="font-bold">{formatCurrency(displayAttorneyFee)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase">Case #</div>
                    <div className="font-mono font-bold">{c.caseNumber}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs text-slate-400 uppercase">Payment progress</div>
                  <div className="w-full bg-slate-800 rounded-full h-3 mt-2 overflow-hidden border border-slate-700">
                    <div style={{ width: `${pct}%` }} className={`progress-bar-fill h-3 ${pct === 100 ? "bg-emerald-400" : "bg-amber-400"}`}></div>
                  </div>
                  <div className="text-sm text-right font-mono mt-2">{formatCurrency(c.amountPaid)} / {formatCurrency(c.totalFee)}</div>
                </div>

                {c.notes && (
                  <div className="mt-4 p-3 bg-slate-900 border-l-4 border-cyan-400 rounded">
                    <div className="text-sm text-slate-300 whitespace-pre-wrap">{c.notes}</div>
                  </div>
                )}

                <div className="mt-4 p-4 bg-slate-900 rounded">
                  <div className="relative px-12 py-10 overflow-x-auto">
                    <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-800"></div>
                    <div
                      className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-cyan-400 timeline-line-fill"
                      style={{ width: `${Math.max(0, ((c.timeline.filter((step) => step.done).length - 1) / (c.timeline.length - 1)) * 100)}%` }}
                    />
                    <div className="relative grid w-full grid-cols-6 gap-2 min-w-[720px]">
                      {c.timeline.map((t, idx) => {
                        const complete = Boolean(t.done);
                        return (
                          <div key={idx} className="relative flex h-32 w-full flex-col items-center">
                            <button
                              type="button"
                              disabled={complete || isSaving}
                              onClick={() => !complete && handleTimelineStepClick(c, t.label)}
                              className={`timeline-step flex h-12 w-12 flex-none items-center justify-center rounded-full border transition ${complete ? "bg-cyan-400 border-cyan-300 text-slate-950 shadow-[0_0_16px_rgba(56,189,248,0.24)]" : "bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700"}`}
                            >
                              {complete ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              ) : (
                                <div className="w-3 h-3 rounded-full bg-slate-600" />
                              )}
                            </button>
                            <div className="mt-16 px-1 text-center text-[11px] leading-tight text-slate-400">{t.label}</div>
                            <div className="mt-0.5 text-[11px] text-slate-500">{t.date || ""}</div>
                            {!complete && <div className="mt-1 text-[10px] text-cyan-300">Click to advance</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-slate-900 rounded border border-slate-800">
                  <div className="text-sm text-slate-300 font-semibold mb-3">Workflow</div>
                  {activeVerdictCaseId === c.id ? (
                    <div className="space-y-3">
                      <div className="text-sm text-slate-400">Add a verdict summary for this case.</div>
                      <textarea
                        value={verdictDraft}
                        onChange={(e) => setVerdictDraft(e.target.value)}
                        rows={4}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
                        placeholder="Enter verdict details..."
                      />
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => saveVerdictNotes(c)} className="px-4 py-2 bg-cyan-500 text-slate-950 rounded-lg font-semibold">Save Verdict</button>
                        <button onClick={() => setActiveVerdictCaseId(null)} className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg">Cancel</button>
                      </div>
                    </div>
                  ) : activeCloseCaseId === c.id ? (
                    <div className="space-y-3">
                      <div className="text-sm text-slate-400">Choose the final case result.</div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => closeCase(c, "Won")} className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-lg font-semibold">Mark Won</button>
                        <button onClick={() => closeCase(c, "Lost")} className="px-4 py-2 bg-rose-500 text-slate-950 rounded-lg font-semibold">Mark Lost</button>
                        <button onClick={() => setActiveCloseCaseId(null)} className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-slate-300">
                      <div>Click any incomplete timeline step above to advance the case workflow.</div>
                      {c.verdictNotes && (
                        <div className="rounded-lg bg-slate-950 border border-slate-700 p-3 text-sm text-slate-200">
                          <div className="font-semibold text-slate-100">Verdict detail</div>
                          <div className="mt-1 text-slate-300 whitespace-pre-wrap">{c.verdictNotes}</div>
                        </div>
                      )}
                      {c.outcome && (
                        <div className="rounded-lg bg-slate-950 border border-slate-700 p-3 text-sm text-slate-200">
                          <div className="font-semibold text-slate-100">Closed result</div>
                          <div className="mt-1 text-slate-300">{c.outcome}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl shadow-cyan-500/10 max-w-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-rose-400">Delete Court Case</h3>
              <p className="text-sm text-slate-400 mt-2">Are you sure you want to permanently remove this court case from the database? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
              <button onClick={() => deleteCase(deleteConfirmId)} disabled={isSaving} className="flex-1 px-4 py-2 rounded-lg bg-rose-500 text-slate-950 font-semibold hover:bg-rose-600 disabled:opacity-60">
                {isSaving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl shadow-cyan-500/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Create New Court Case</h2>
                <p className="text-sm text-slate-400">Saved cases are persisted to the database.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-white">Close</button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-300">
                Driver
                <select
                  value={form.driverId || ""}
                  onChange={(e) => {
                    const driverId = e.target.value;
                    const driver = drivers.find((d) => d.id === driverId);
                    setForm((prev) => ({
                      ...prev,
                      driverId,
                      driverName: driver ? driver.name : prev.driverName,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100"
                >
                  <option value="">Select existing driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Case number
                <input value={form.caseNumber} onChange={(e) => setForm((prev) => ({ ...prev, caseNumber: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100" />
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Carrier name
                <input value={form.carrierName} onChange={(e) => setForm((prev) => ({ ...prev, carrierName: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100" />
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Violation
                <input
                  list="existing-inspections"
                  value={form.violation}
                  onChange={(e) => setForm((prev) => ({ ...prev, violation: e.target.value }))}
                  placeholder={form.driverId ? "Choose an inspection reference or type a new violation" : "Select a driver first"}
                  disabled={!form.driverId}
                  className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <datalist id="existing-inspections">
                  {driverInspections.map((inspection) => (
                    <option
                      key={inspection.id}
                      value={inspection.caseCode}
                      label={`${formatDate(inspection.date)} — ${inspection.violations.join(", ")}`}
                    />
                  ))}
                </datalist>
                {form.driverId && driverInspections.length > 0 ? (
                  <div className="mt-2 text-xs text-slate-400">
                    Existing inspections for {form.driverName}:
                    <ul className="mt-2 space-y-2 pl-4 text-slate-300">
                      {driverInspections.map((inspection) => (
                        <li key={inspection.id}>
                          <span className="font-semibold">{inspection.caseCode}</span>
                          <span className="text-slate-500"> — {formatDate(inspection.date)}</span>
                          <div className="text-slate-400">Violations: {inspection.violations.join(", ") || "None"}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : form.driverId ? (
                  <div className="mt-2 text-xs text-slate-500">No historical inspections with violations found for this driver.</div>
                ) : null}
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Filed date
                <input type="date" value={form.filedDate} onChange={(e) => setForm((prev) => ({ ...prev, filedDate: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100" />
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Hearing date
                <input type="date" value={form.hearingDate} onChange={(e) => setForm((prev) => ({ ...prev, hearingDate: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100" />
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Lawyer
                <input value={form.lawyer} onChange={(e) => setForm((prev) => ({ ...prev, lawyer: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100" />
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Attorney fee
                <input type="number" value={form.attorneyFee} onChange={(e) => setForm((prev) => ({ ...prev, attorneyFee: Number(e.target.value) }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100" />
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Status
                <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100">
                  {statusPills.filter((status) => status !== "All").map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Total fee
                <input type="number" value={form.totalFee} onChange={(e) => setForm((prev) => ({ ...prev, totalFee: Number(e.target.value) }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100" />
              </label>
              <label className="space-y-1 text-sm text-slate-300">
                Amount paid
                <input type="number" value={form.amountPaid} onChange={(e) => setForm((prev) => ({ ...prev, amountPaid: Number(e.target.value) }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100" />
              </label>
              <label className="space-y-1 text-sm text-slate-300 lg:col-span-2">
                Notes
                <textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100" rows={4} />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
              <button onClick={createCase} disabled={isSaving} className="px-5 py-2 rounded-lg bg-cyan-400 text-slate-950 font-semibold hover:bg-cyan-300 disabled:opacity-60">
                {isSaving ? "Saving..." : "Save Case"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courts;
