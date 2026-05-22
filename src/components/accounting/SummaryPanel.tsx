import React, { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import notify from '../../utils/notify';
import logError from '../../utils/logger';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SummaryPanel: React.FC<{
  driverId: string | null;
  driverInfo?: any | null;
  record: any | null;
  dirty: boolean;
  setDirty: (d: boolean) => void;
  rows: any[];
  setRows: (r: any[]) => void;
  setValidationErrors?: (e: Record<number, { description?: string; amount?: string }>) => void;
  setBusy?: (b: boolean) => void;
  setNotes?: (s: string) => void;
  onPosted?: () => void;
  refresh: () => void;
}> = ({ driverId, driverInfo, record, dirty, setDirty, rows, setRows, setValidationErrors, setBusy, setNotes, onPosted, refresh }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<number | "">(0);
  const [weight, setWeight] = useState<number | "">(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const csaPoints = Math.max(0, Number(severity) + Number(weight));

  const resolveViolationId = async (localViolation: any, recordDate?: string): Promise<string> => {
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (typeof localViolation?.id === 'string' && uuidPattern.test(localViolation.id)) {
      return localViolation.id;
    }

    if (!driverId) {
      throw new Error('Missing driver id');
    }

    const query = supabase
      .from('violations')
      .select('id')
      .eq('driver_id', driverId)
      .eq('code', localViolation.code);

    const violationDate = localViolation.date || recordDate;
    if (violationDate) {
      query.eq('date', violationDate);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error || !data) {
      throw error || new Error('Unable to resolve violation id for selected inspection');
    }

    return data.id;
  };

  const saveDraft = async () => {
    const selectedViolation = record?.violations?.[0];
    if (!driverId || !record || !selectedViolation) { notify.error('Select an inspection with at least one violation first'); return; }
    setErrorMessage(null);
    setValidationErrors && setValidationErrors({});
    setSaving(true); setBusy && setBusy(true);
    try {
      const violationId = await resolveViolationId(selectedViolation, record?.date);
      for (const r of rows) {
        const { data: charge, error: chargeErr } = await supabase
          .from('charges')
          .insert([{ violation_id: violationId, driver_id: driverId, charge_type: r.charge_type, description: r.description, amount: r.amount || null, document_url: r.document_url || null, status: 'draft' }])
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
    const selectedViolation = record?.violations?.[0];
    if (!driverId || !record || !selectedViolation) { notify.error('Select an inspection with at least one violation first'); return; }

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
      const violationId = await resolveViolationId(selectedViolation, record?.date);
      const { data, error } = await supabase.rpc('post_charges', { p_driver_id: driverId, p_violation_id: violationId, p_charges: payload, p_created_by: null });
      if (error) throw error;
      notify.success(`Charges posted for ${driverInfo?.name || 'Driver'} — Inspection ${record.id}`);
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
    if (!record) {
      notify.error('Select an inspection record first');
      return;
    }
    if (!reason.trim()) {
      notify.error('Enter a reason for disciplinary action before previewing the letter');
      return;
    }

    const selectedViolation = record?.violations?.[0] || null;
    if (!selectedViolation) {
      notify.error('Select an inspection with at least one violation first');
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const darkBlue = '#1a3a5c';
    const margin = 40;
    const lineHeight = 18;
    const today = new Date().toLocaleDateString();
    const headX = margin;
    const rightX = pageWidth / 2 + 10;

    const violationGroup = (selectedViolation as any).group || '';
    const violationOos = (selectedViolation as any).oos != null ? ((selectedViolation as any).oos ? 'Yes' : 'No') : '';
    const numericSeverity = typeof severity === 'number' ? severity : Number(severity);
    const numericWeight = typeof weight === 'number' ? weight : Number(weight);
    const violationSeverity = numericSeverity > 0 ? String(numericSeverity) : String(selectedViolation.severity || '');
    const violationWeight = numericWeight > 0 ? String(numericWeight) : ((selectedViolation as any).weight != null ? String((selectedViolation as any).weight) : '');
    const violationCsaPoints = String(csaPoints);

    doc.setTextColor(darkBlue);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FORMAL DRIVER WARNING', pageWidth / 2, 70, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const leftBlockStartY = 110;
    const rightBlockStartY = leftBlockStartY;

    doc.text('Employee Name:', headX, leftBlockStartY);
    doc.text(driverInfo?.name || 'N/A', headX + 110, leftBlockStartY);
    doc.text('Employee ID:', headX, leftBlockStartY + lineHeight);
    doc.text(driverInfo?.license || 'N/A', headX + 110, leftBlockStartY + lineHeight);
    doc.text('Job Title:', headX, leftBlockStartY + lineHeight * 2);
    doc.text('Driver', headX + 110, leftBlockStartY + lineHeight * 2);

    doc.text('Manager Name:', rightX, rightBlockStartY);
    doc.text('Rustam Kencheshaov', rightX + 110, rightBlockStartY);
    doc.text('Department:', rightX, rightBlockStartY + lineHeight);
    doc.text('Safety', rightX + 110, rightBlockStartY + lineHeight);
    doc.text('Date of Issue:', rightX, rightBlockStartY + lineHeight * 2);
    doc.text(today, rightX + 110, rightBlockStartY + lineHeight * 2);

    const underlineY = leftBlockStartY + lineHeight * 3 + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('WARNING LETTER', pageWidth / 2, underlineY, { align: 'center' });
    const titleWidth = doc.getTextWidth('WARNING LETTER');
    doc.setDrawColor(darkBlue);
    doc.setLineWidth(1.5);
    doc.line(pageWidth / 2 - titleWidth / 2, underlineY + 6, pageWidth / 2 + titleWidth / 2, underlineY + 6);

    let contentY = underlineY + 25;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkBlue);
    doc.text('VIOLATION DETAILS', headX, contentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    contentY += lineHeight;
    doc.text(`Report number: ${selectedViolation.code || 'N/A'}`, headX, contentY);
    contentY += lineHeight;
    const violationDate = selectedViolation.date || record.date;
    doc.text(`Date: ${violationDate ? new Date(violationDate).toLocaleDateString() : 'N/A'}`, headX, contentY);

    contentY += lineHeight * 2;
    autoTable(doc as any, {
      startY: contentY,
      theme: 'grid',
      headStyles: { fillColor: '#1a3a5c', textColor: '#ffffff', halign: 'center' },
      head: [[
        'Section',
        'Violation Description',
        'Violation Group',
        'OOS',
        'Severity',
        'Weight',
        'CSA Points'
      ]],
      body: [[
        selectedViolation.code || '',
        selectedViolation.description || '',
        violationGroup,
        violationOos,
        violationSeverity,
        violationWeight,
        violationCsaPoints
      ]],
      styles: { font: 'helvetica', fontSize: 10, overflow: 'linebreak' },
      columnStyles: {
        1: { cellWidth: 180 },
        2: { cellWidth: 70 },
        3: { cellWidth: 35 },
        4: { cellWidth: 55 },
        5: { cellWidth: 35 },
        6: { cellWidth: 50 }
      }
    });

    doc.addPage();
    doc.setTextColor(darkBlue);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('COMPLIANCE REMINDER', headX, 70);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const complianceText = 'Drivers are strictly required to maintain all necessary certifications, endorsements, and medical fitness standards. Failure to comply may result in disciplinary action, loss of operating privileges, and possible termination.';
    doc.text(complianceText, headX, 90, { maxWidth: pageWidth - margin * 2, align: 'justify' });

    let pageY = 140;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(darkBlue);
    doc.text('REASON FOR DISCIPLINARY ACTION:', headX, pageY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    pageY += lineHeight;
    doc.text(reason || 'No reason provided.', headX, pageY, { maxWidth: pageWidth - margin * 2, align: 'justify' });

    pageY += lineHeight * 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(darkBlue);
    doc.text('PENALTY STATEMENT', headX, pageY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    pageY += lineHeight;
    const penaltyText = 'Company policy mandates a $400 penalty for any Out-of-Service (OOS) violation and a $40 per-point penalty for all non-OOS CSA violations.';
    doc.text(penaltyText, headX, pageY, { maxWidth: pageWidth - margin * 2, align: 'justify' });

    pageY += lineHeight * 3;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkBlue);
    doc.text('CALCULATIONS', headX, pageY);

    const hasOos = violationOos === 'Yes';
    const oosCount = hasOos ? 1 : 0;
    const oosAmount = oosCount * 400;
    const nonOosAmount = csaPoints * 40;
    const totalPenalty = oosAmount + nonOosAmount;

    pageY += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    if (hasOos) {
      doc.text(`OOS: ${oosCount} x $400 = $${oosAmount.toFixed(2)}`, headX, pageY);
      pageY += lineHeight;
    }
    doc.text(`Non-OOS: ${csaPoints} x $40 = $${nonOosAmount.toFixed(2)}`, headX, pageY);

    pageY += lineHeight * 2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkBlue);
    doc.text(`TOTAL PENALTY AMOUNT: $${totalPenalty.toFixed(2)}`, headX, pageY);

    pageY += lineHeight * 3;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.text('Employee Signature:', headX, pageY);
    doc.line(headX + 130, pageY + 2, headX + 330, pageY + 2);
    doc.text('Manager Signature: Rustam Kencheshaov', rightX, pageY);
    doc.line(rightX + 190, pageY + 2, rightX + 390, pageY + 2);

    pageY += lineHeight * 2;
    doc.text('Date:', headX, pageY);
    doc.line(headX + 40, pageY + 2, headX + 200, pageY + 2);
    doc.text(`Date: ${today}`, rightX, pageY);

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setShowPreview(true);
  };

  const downloadPreview = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `warning-letter-${record?.id || 'preview'}.pdf`;
    a.click();
  };

  const Spinner: React.FC<{ size?: number }> = ({ size = 16 }) => (
    <svg className="animate-spin mr-2" width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4"/>
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div className="h-full rounded-3xl border-l-2 border-[#1D9E75] bg-slate-950 p-5 flex flex-col justify-between">
      <div>
        <div className="text-sm font-semibold mb-3 text-slate-100">Summary</div>
        <div className="text-xs text-slate-400 mb-4">Totals: ${rows.reduce((s, r) => s + (parseFloat(r.amount || 0) || 0), 0).toFixed(2)}</div>
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why this warning letter is being issued..."
              className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none resize-none min-h-[110px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Severity</label>
              <input
                type="number"
                min={0}
                value={severity}
                onFocus={() => {
                  if (severity === 0) setSeverity("");
                }}
                onBlur={(e) => {
                  if (e.target.value.trim() === "") setSeverity(0);
                }}
                onChange={(e) => setSeverity(e.target.value === "" ? "" : parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Weight</label>
              <input
                type="number"
                min={0}
                value={weight}
                onFocus={() => {
                  if (weight === 0) setWeight("");
                }}
                onBlur={(e) => {
                  if (e.target.value.trim() === "") setWeight(0);
                }}
                onChange={(e) => setWeight(e.target.value === "" ? "" : parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={saveDraft}
          disabled={saving || posting}
          className="w-full rounded-3xl border border-slate-700 bg-transparent px-3 py-3 text-sm text-slate-100 hover:bg-slate-900 disabled:opacity-60"
        >
          {saving && <Spinner />}
          <span>{saving ? 'Saving...' : 'Save draft'}</span>
        </button>
        <button
          onClick={previewLetter}
          disabled={saving || posting}
          className="w-full rounded-3xl border border-slate-700 bg-transparent px-3 py-3 text-sm text-slate-100 hover:bg-slate-900 disabled:opacity-60"
        >
          Preview letter
        </button>
        <button
          onClick={postToRecord}
          disabled={posting || saving}
          className="w-full rounded-3xl bg-[#1D9E75] px-3 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-500 disabled:opacity-60"
        >
          {posting && <Spinner />}
          <span>{posting ? 'Posting...' : 'Post to record'}</span>
        </button>
      </div>

      {errorMessage && <div className="mt-4 text-sm text-red-400">{errorMessage}</div>}

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
            <object data={previewUrl} type="application/pdf" className="w-full h-full" aria-label="Warning letter preview">
              <p className="text-sm text-slate-900">Preview not available. <a href={previewUrl} target="_blank" rel="noreferrer" className="text-cyan-600">Open in a new tab</a>.</p>
            </object>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryPanel;
