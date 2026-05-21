import React, { useEffect, useState } from "react";
import logError from '../../utils/logger';
import { supabase } from "../../services/supabaseClient";
import DriverSelect from "./DriverSelect";
import ViolationList from "./ViolationList";
import ChargeBuilder from "./ChargeBuilder";
import SummaryPanel from "./SummaryPanel";
import { Violation, Charge } from "../../types";

const AccountingPage: React.FC = () => {
  const [driverId, setDriverId] = useState<string | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [dirty, setDirty] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<number, { description?: string; amount?: string }>>({});
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [loadingViolations, setLoadingViolations] = useState(false);
  const violationListRef = React.useRef<any>(null);
  const [driverInfo, setDriverInfo] = useState<any | null>(null);
  const [confirmSwitch, setConfirmSwitch] = useState<{ pending?: Violation | null; show: boolean } | null>(null);

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
      setViolations([]);
      setSelectedViolation(null);
      setDriverInfo(null);
      return;
    }
    // load violations for driver
    (async () => {
      console.log("[AccountingPage] loading violations for driverId", driverId);
      setLoadingViolations(true);
      const { data, error } = await supabase
        .from("violations")
        .select("*")
        .eq("driver_id", driverId)
        .order("date", { ascending: false });
      setLoadingViolations(false);
      if (error) {
        console.error("[AccountingPage] violations query error for driverId", driverId, error);
        logError(error, 'Failed to load violations');
      } else {
        console.log("[AccountingPage] violations query result:", data);
        setViolations((data as Violation[]) || []);
      }

      // load driver info
      const { data: drv, error: driverError } = await supabase.from("drivers").select("*").eq("id", driverId).single();
      if (driverError) {
        console.error("[AccountingPage] driver query error for driverId", driverId, driverError);
      }
      setDriverInfo(drv || null);
    })();
  }, [driverId]);

  const handleSelectViolation = (v: Violation) => {
    if (dirty) {
      setConfirmSwitch({ pending: v, show: true });
    } else {
      setSelectedViolation(v);
      setRows([]);
    }
  };

  const confirmDiscardAndSwitch = () => {
    if (confirmSwitch?.pending) {
      setSelectedViolation(confirmSwitch.pending || null);
      setRows([]);
      setDirty(false);
    }
    setConfirmSwitch(null);
  };

  const cancelSwitch = () => setConfirmSwitch(null);

  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <DriverSelect onSelect={(id) => setDriverId(id)} />
        </div>
        <div className="col-span-2">
            <ViolationList
              ref={violationListRef}
              violations={violations}
              loading={loadingViolations}
              onSelect={(v) => handleSelectViolation(v)}
            />
        </div>
        <div className="col-span-1">
          <SummaryPanel
            driverId={driverId}
            driverInfo={driverInfo}
            violation={selectedViolation}
            dirty={dirty}
            setDirty={setDirty}
            rows={rows}
            setRows={setRows}
            setValidationErrors={setValidationErrors}
              setBusy={setBusy}
              setNotes={setNotes}
              onPosted={() => violationListRef.current?.scrollToTop?.()}
              refresh={() => {
              // reload violations
              if (driverId) {
                supabase.from("violations").select("*").eq("driver_id", driverId).order("date", { ascending: false }).then(({ data }) => setViolations((data as Violation[]) || []));
              }
            }}
          />
        </div>
      </div>

      <div className="mt-6">
        <ChargeBuilder
          violation={selectedViolation}
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
