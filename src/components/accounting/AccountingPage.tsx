import React, { useEffect, useState } from "react";
import logError from '../../utils/logger';
import notify from '../../utils/notify';
import { supabase } from "../../services/supabaseClient";
import DriverSelect from "./DriverSelect";
import InspectionList from "./InspectionList";
import ChargeBuilder from "./ChargeBuilder";
import SummaryPanel from "./SummaryPanel";
import { IncidentRecord } from "../../types";
import { useApp } from "../../context/AppContext";

// HMR trigger: minor edit to force Vite to re-evaluate this module

const AccountingPage: React.FC = () => {
  const { records } = useApp();
  const [driverId, setDriverId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<IncidentRecord | null>(null);
  const [dirty, setDirty] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<number, { description?: string; amount?: string }>>({});
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [loadingRecords, setLoadingRecords] = useState(false);
  const violationListRef = React.useRef<{ scrollToTop?: () => void } | null>(null);
  const [driverInfo, setDriverInfo] = useState<any | null>(null);
  const [confirmSwitch, setConfirmSwitch] = useState<{ pending?: IncidentRecord | null; show: boolean } | null>(null);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "Leave page? Unsaved charges will be lost.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (!driverId) {
      setSelectedRecord(null);
      setDriverInfo(null);
      return;
    }

    (async () => {
      setLoadingRecords(true);
      const { data: drv, error: driverError } = await supabase.from("drivers").select("*").eq("id", driverId).single();
      if (driverError) {
        console.error("[AccountingPage] driver query error for driverId", driverId, driverError);
        logError(driverError, 'Failed to load driver');
        notify.error('Failed to load driver information');
      }
      setDriverInfo(drv || null);
      setLoadingRecords(false);
    })();
  }, [driverId]);

  const handleSelectRecord = (record: IncidentRecord) => {
    if (dirty) {
      setConfirmSwitch({ pending: record, show: true });
    } else {
      setSelectedRecord(record);
      setRows([]);
    }
  };

  const confirmDiscardAndSwitch = () => {
    if (confirmSwitch?.pending) {
      setSelectedRecord(confirmSwitch.pending || null);
      setRows([]);
      setDirty(false);
    }
    setConfirmSwitch(null);
  };

  const cancelSwitch = () => setConfirmSwitch(null);

  const driverRecords = driverInfo?.name ? records.filter((record) => record.driverName === driverInfo.name) : [];

  return (
    <div className="flex gap-4 h-[calc(100vh-60px)] p-4 min-h-0">
      <div className="basis-1/4 min-w-[240px] h-full">
        <div className="flex h-full flex-col rounded-3xl border border-slate-800 bg-slate-950 p-4">
          <DriverSelect onSelect={(id) => setDriverId(id)} selectedDriverId={driverId} />
        </div>
      </div>

      <div className="basis-1/2 min-w-0 flex flex-col gap-4 overflow-hidden">
        {!driverId ? (
          <div className="flex h-full min-h-[200px] items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-500">
            Select a driver to begin
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
              {selectedRecord ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Violation</div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm text-slate-400">Report</div>
                      <div className="text-lg font-semibold text-slate-100">{selectedRecord.caseCode || selectedRecord.id}</div>
                    </div>
                    <div className="text-sm text-slate-400">
                      <div>Date</div>
                      <div className="text-slate-100">{new Date(selectedRecord.date).toLocaleDateString()}</div>
                    </div>
                    {('violations' in selectedRecord && selectedRecord.violations?.[0]?.code) ? (
                      <div className="rounded-3xl bg-[#1D9E75] px-4 py-2 text-sm font-semibold text-slate-950">
                        {selectedRecord.violations?.[0]?.code}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400">Select an inspection record from the list below to begin building charges.</div>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="space-y-4 h-full overflow-hidden">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4 overflow-y-auto custom-scrollbar max-h-[260px]">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Inspection records</div>
                  <InspectionList
                    records={driverRecords}
                    selectedRecordId={selectedRecord?.id}
                    loading={loadingRecords}
                    onSelect={handleSelectRecord}
                  />
                </div>
                <div className="h-full overflow-hidden">
                  <ChargeBuilder
                    record={selectedRecord}
                    rows={rows}
                    setRows={setRows}
                    validationErrors={validationErrors}
                    disabled={busy}
                    notes={notes}
                    setNotes={setNotes}
                    onDirty={(d) => setDirty(d)}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="basis-1/4 min-w-[240px] h-full">
        <SummaryPanel
          driverId={driverId}
          driverInfo={driverInfo}
          record={selectedRecord}
          setDirty={setDirty}
          rows={rows}
          setRows={setRows}
          setValidationErrors={setValidationErrors}
          setBusy={setBusy}
          setNotes={setNotes}
          onPosted={() => violationListRef.current?.scrollToTop?.()}
          refresh={async () => {
            // refresh is not needed for record-based selection; app records update from context
          }}
        />
      </div>
      {confirmSwitch?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-slate-900 p-6 rounded shadow">
            <div className="mb-4">You have unsaved charges — discard and switch?</div>
            <div className="flex gap-2">
              <button onClick={confirmDiscardAndSwitch} className="px-3 py-2 bg-red-600 rounded">Discard</button>
              <button onClick={cancelSwitch} className="px-3 py-2 bg-slate-700 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingPage;
