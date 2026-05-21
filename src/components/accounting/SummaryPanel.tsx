import React, { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import notify from '../../utils/notify';
import logError from '../../utils/logger';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SummaryPanel: React.FC<{
  driverId: string | null;
  driverInfo?: any | null;
  violation: any | null;
  dirty: boolean;
  setDirty: (d: boolean) => void;
  rows: any[];
  setRows: (r: any[]) => void;
  setValidationErrors?: (e: Record<number, { description?: string; amount?: string }>) => void;
  setBusy?: (b: boolean) => void;
  setNotes?: (s: string) => void;
  onPosted?: () => void;
  refresh: () => void;
}> = ({ driverId, driverInfo, violation, dirty, setDirty, rows, setRows, setValidationErrors, setBusy, setNotes, onPosted, refresh }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveDraft = async () => {
    if (!driverId || !violation) { notify.error('Select driver and violation first'); return; }
    setErrorMessage(null);
    setValidationErrors && setValidationErrors({});
    setSaving(true); setBusy && setBusy(true);
    try {
      for (const r of rows) {
        const { data: charge, error: chargeErr } = await supabase
          .from('charges')
          .insert([{ violation_id: violation.id, driver_id: driverId, charge_type: r.charge_type, description: r.description, amount: r.amount || null, document_url: r.document_url || null, status: 'draft' }])
          .select('id')
          .single();
        if (chargeErr) throw chargeErr;
        const chargeId = (charge as any).id;
        if (r.document_url) {
          const { error: docErr } = await supabase.from('charge_documents').insert([{ charge_id: chargeId, file_name: r.file_name || '', file_url: r.document_url, file_type: r.file_type || '' }]);
          if (docErr) throw docErr;
        }
      }
      notify.success('Draft saved');
      setDirty(false);
      setValidationErrors && setValidationErrors({});
    } catch (err: any) {
      logError(err, 'Error saving draft');
      const msg = 'Error saving draft: ' + (err.message || String(err));
      setErrorMessage(msg);
    } finally {
      setSaving(false); setBusy && setBusy(false);
    }
  };

  const postToRecord = async () => {
    if (!driverId || !violation) { notify.error('Select driver and violation first'); return; }

    const errors: Record<number, { description?: string; amount?: string }> = {};
    rows.forEach((r, idx) => {
      if (!r.description || String(r.description).trim() === '') errors[idx] = { ...(errors[idx] || {}), description: 'Required' };
      if ((r.charge_type || '') !== 'Warning Letter') {
        const amt = parseFloat(r.amount || 0);
        if (!amt || amt <= 0) errors[idx] = { ...(errors[idx] || {}), amount: 'Amount must be > 0' };
      }
    });
    if (Object.keys(errors).length > 0) { setValidationErrors && setValidationErrors(errors); notify.error('Fix validation errors before posting.'); return; }

    try {
      setErrorMessage(null);
      setPosting(true); setBusy && setBusy(true);
      const payload = rows.map(r => ({ charge_type: r.charge_type, description: r.description, amount: r.amount ? parseFloat(r.amount) : null, document_url: r.document_url || null, documents: r.document_url ? [{ file_name: r.file_name || '', file_url: r.document_url, file_type: r.file_type || '' }] : [] }));
      const { data, error } = await supabase.rpc('post_charges', { p_driver_id: driverId, p_violation_id: violation.id, p_charges: JSON.stringify(payload), p_created_by: null });
      if (error) throw error;
      notify.success(`Charges posted for ${driverInfo?.name || 'Driver'} — Violation #${violation.id}`);
      setRows([]);
      setNotes && setNotes('');
      setDirty(false);
      setValidationErrors && setValidationErrors({});
      refresh();
      onPosted && onPosted();
    } catch (err: any) {
      logError(err, 'Error posting charges');
      const msg = 'Error posting charges: ' + (err.message || String(err));
      setErrorMessage(msg);
    } finally {
      setPosting(false); setBusy && setBusy(false);
    }
  };

  const previewLetter = async () => {
    // generate PDF client-side with jsPDF
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Warning Letter', 14, 20);
    doc.setFontSize(10);
    doc.text(`Driver: ${driverInfo?.name || ''}`, 14, 30);
    doc.text(`License: ${driverInfo?.license || ''}`, 14, 36);
    doc.text(`Violation: ${violation?.code || ''} — ${violation?.description || ''}`, 14, 44);
    doc.text(`Date: ${violation ? new Date(violation.date).toLocaleDateString() : ''}`, 14, 50);

    const tableData = rows.map(r => [r.charge_type, r.description, r.amount ? `$${r.amount}` : '$0']);
    autoTable(doc as any, { startY: 60, head: [['Type', 'Description', 'Amount']], body: tableData });
    const total = rows.reduce((s, r) => s + (parseFloat(r.amount || 0) || 0), 0);
    doc.text(`Total: $${total.toFixed(2)}`, 14, (doc as any).lastAutoTable?.finalY + 10 || 140);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, (doc as any).lastAutoTable?.finalY + 20 || 150);
    doc.text('Signature: ____________________________', 14, (doc as any).lastAutoTable?.finalY + 36 || 166);

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setShowPreview(true);
  };

  const downloadPreview = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `warning-letter-${violation?.id || 'preview'}.pdf`;
    a.click();
  };

  const Spinner: React.FC<{ size?: number }> = ({ size = 16 }) => (
    <svg className="animate-spin mr-2" width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4"/>
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-sm font-semibold mb-3">Summary</div>
      <div className="text-xs text-slate-400 mb-4">Totals: {rows.reduce((s, r) => s + (parseFloat(r.amount || 0) || 0), 0)}</div>
      <div className="flex flex-col gap-2">
        <button onClick={saveDraft} disabled={saving || posting} className="px-3 py-2 bg-slate-800 rounded disabled:opacity-60 flex items-center justify-center" style={{ minWidth: 160 }}>
          {saving && <Spinner />}
          <span>{saving ? 'Saving...' : 'Save draft'}</span>
        </button>
        <button onClick={previewLetter} disabled={saving || posting} className="px-3 py-2 bg-slate-800 rounded disabled:opacity-60" style={{ minWidth: 160 }}>Preview letter</button>
        <button onClick={postToRecord} disabled={posting || saving} className="px-3 py-2 bg-cyan-500 rounded text-slate-950 disabled:opacity-60 flex items-center justify-center" style={{ minWidth: 160 }}>
          {posting && <Spinner />}
          <span>{posting ? 'Posting...' : 'Post to record'}</span>
        </button>
      </div>

      {errorMessage && <div className="mt-3 text-red-400 text-sm">{errorMessage}</div>}

      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white w-3/4 h-3/4 p-4 rounded">
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold">Warning letter — {driverInfo?.name || ''}</div>
              <div className="flex gap-2">
                <button onClick={downloadPreview} className="px-2 py-1 bg-cyan-500 text-white rounded">Download</button>
                <button onClick={() => { setShowPreview(false); URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} className="px-2 py-1 bg-slate-700 text-white rounded">Close</button>
              </div>
            </div>
            <iframe src={previewUrl} className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryPanel;
