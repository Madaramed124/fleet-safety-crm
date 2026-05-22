import React, { useEffect, useState } from "react";
import logError from '../../utils/logger';
import { supabase } from "../../services/supabaseClient";
import DriverSelect from "./DriverSelect";
import InspectionList from "./InspectionList";
import ChargeBuilder from "./ChargeBuilder";
import SummaryPanel from "./SummaryPanel";
import { IncidentRecord } from "../../types";
import { useApp } from "../../context/AppContext";

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
  const violationListRef = React.useRef<any>(null);
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
    <div className="p-6">
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <DriverSelect onSelect={(id) => setDriverId(id)} />
        </div>
        <div className="col-span-2">
            <InspectionList
              records={driverRecords}
              selectedRecordId={selectedRecord?.id}
              loading={loadingRecords}
              onSelect={handleSelectRecord}
            />
        </div>
        <div className="col-span-1">
          <SummaryPanel
            driverId={driverId}
            driverInfo={driverInfo}
            record={selectedRecord}
            dirty={dirty}
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
      </div>

      <div className="mt-6">
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
