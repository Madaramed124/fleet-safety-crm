import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { error as notifyError, success as notifySuccess } from "../../utils/notify";

// ...existing code...

type ChargeRow = {
  id: string;
  charge_type: string;
  description: string;
  amount: number | null;
  document_url?: string | null;
  charge_documents?: { file_url: string | null; file_name?: string | null; file_type?: string | null }[] | null;
  created_at: string | null;
  violations: {
    code: string | null;
    description: string | null;
    date: string | null;
  } | null;
  drivers: {
    name: string | null;
  } | null;
};

const ChargesPage: React.FC = () => {
  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [driverFilter, setDriverFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedCharge, setSelectedCharge] = useState<ChargeRow | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const handleDeleteCharge = async () => {
    if (!selectedCharge) return;
    setDeleting(true);
    const { error } = await supabase.from("charges").delete().eq("id", selectedCharge.id);
    setDeleting(false);
    if (error) {
      notifyError("Failed to delete charge: " + error.message);
      return;
    }
    notifySuccess("Charge deleted successfully.");
    setCharges((prev) => prev.filter((c) => c.id !== selectedCharge.id));
    setSelectedCharge(null);
    setPreviewUrl(null);
    setPreviewOpen(false);
  };

  const selectedChargeDocumentUrl = selectedCharge?.document_url || selectedCharge?.charge_documents?.[0]?.file_url || null;
  const canPreviewCharge = Boolean(selectedCharge);

  useEffect(() => {
    const loadCharges = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("charges")
        .select("*, violations(code, description, date), drivers(name), charge_documents(file_url, file_name, file_type)")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message || "Failed to load charges.");
        setCharges([]);
      } else {
        setCharges((data as ChargeRow[]) || []);
      }

      setLoading(false);
    };

    loadCharges();
  }, []);

  useEffect(() => {
    return () => {
      if (generatedPreviewUrl) {
        URL.revokeObjectURL(generatedPreviewUrl);
      }
    };
  }, [generatedPreviewUrl]);

  const filteredCharges = useMemo(() => {
    if (!driverFilter.trim()) return charges;
    const filter = driverFilter.trim().toLowerCase();
    return charges.filter((charge) =>
      (charge.drivers?.name || "")?.toLowerCase().includes(filter)
    );
  }, [charges, driverFilter]);

  const totalAmount = useMemo(() => {
    return filteredCharges.reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0);
  }, [filteredCharges]);

  const generateChargePreview = () => {
    if (!selectedCharge) return null;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const lineHeight = 18;
    const darkBlue = '#1a3a5c';
    const today = new Date().toLocaleDateString();

    const driverName = selectedCharge.drivers?.name || 'Unknown';
    const violationCode = selectedCharge.violations?.code || 'N/A';
    const violationDate = selectedCharge.violations?.date ? new Date(selectedCharge.violations.date).toLocaleDateString() : 'N/A';
    const reasonText = selectedCharge.description || selectedCharge.violations?.description || 'No reason provided.';
    const amountValue = selectedCharge.amount != null ? Number(selectedCharge.amount) : 0;
    const csaPoints = Math.max(0, Math.round(amountValue / 40));

    doc.setTextColor(darkBlue);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FORMAL DRIVER WARNING', pageWidth / 2, 70, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const leftBlockStartY = 110;
    const rightBlockStartY = leftBlockStartY;
    const rightX = pageWidth / 2 + 10;

    doc.text('Employee Name:', margin, leftBlockStartY);
    doc.text(driverName, margin + 110, leftBlockStartY);
    doc.text('Employee ID:', margin, leftBlockStartY + lineHeight);
    doc.text('N/A', margin + 110, leftBlockStartY + lineHeight);
    doc.text('Job Title:', margin, leftBlockStartY + lineHeight * 2);
    doc.text('Driver', margin + 110, leftBlockStartY + lineHeight * 2);

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
    doc.text('VIOLATION DETAILS', margin, contentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    contentY += lineHeight;
    doc.text(`Report number: ${violationCode}`, margin, contentY);
    contentY += lineHeight;
    doc.text(`Date: ${violationDate}`, margin, contentY);
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
        violationCode,
        selectedCharge.violations?.description || '',
        '-',
        '-',
        '-',
        '-',
        `${csaPoints}`
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
    doc.text('COMPLIANCE REMINDER', margin, 70);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const complianceText = 'Drivers are strictly required to maintain all necessary certifications, endorsements, and medical fitness standards. Failure to comply may result in disciplinary action, loss of operating privileges, and possible termination.';
    doc.text(complianceText, margin, 90, { maxWidth: pageWidth - margin * 2, align: 'justify' });

    let pageY = 140;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('REASON FOR DISCIPLINARY ACTION:', margin, pageY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    pageY += lineHeight;
    doc.text(reasonText, margin, pageY, { maxWidth: pageWidth - margin * 2, align: 'justify' });

    pageY += lineHeight * 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PENALTY STATEMENT', margin, pageY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    pageY += lineHeight;
    const penaltyText = 'Company policy mandates a $400 penalty for any Out-of-Service (OOS) violation and a $40 per-point penalty for all non-OOS CSA violations.';
    doc.text(penaltyText, margin, pageY, { maxWidth: pageWidth - margin * 2, align: 'justify' });

    pageY += lineHeight * 3;
    doc.setFont('helvetica', 'bold');
    doc.text('CALCULATIONS', margin, pageY);

    pageY += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.text(`Non-OOS: ${csaPoints} x $40 = $${(csaPoints * 40).toFixed(2)}`, margin, pageY);

    pageY += lineHeight * 2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkBlue);
    doc.text(`TOTAL PENALTY AMOUNT: $${(csaPoints * 40).toFixed(2)}`, margin, pageY);

    pageY += lineHeight * 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    const rightColumnStart = pageWidth / 2 + 20;
    const rightLineEnd = pageWidth - margin;
    doc.text('Employee Signature:', margin, pageY);
    doc.line(margin + 115, pageY + 2, margin + 365, pageY + 2);
    doc.text('Manager Signature: Rustam Kencheshaov', rightColumnStart, pageY);
    doc.line(rightColumnStart + 170, pageY + 2, rightLineEnd, pageY + 2);

    pageY += lineHeight * 2;
    doc.text('Date:', margin, pageY);
    doc.line(margin + 35, pageY + 2, margin + 200, pageY + 2);
    doc.text(`Date: ${today}`, rightColumnStart, pageY);

    if (generatedPreviewUrl) {
      URL.revokeObjectURL(generatedPreviewUrl);
    }
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setGeneratedPreviewUrl(url);
    setPreviewUrl(url);
    return url;
  };

  const handleViewCharge = () => {
    if (selectedChargeDocumentUrl) {
      setPreviewUrl(selectedChargeDocumentUrl);
      setPreviewOpen(true);
      return;
    }

    const url = generateChargePreview();
    if (url) {
      setPreviewOpen(true);
    }
  };

  const handleCloseAll = () => {
    setPreviewOpen(false);
    setPreviewUrl(null);
    setSelectedCharge(null);
  };

  const handleDownloadCharge = () => {
    if (selectedChargeDocumentUrl) {
      window.open(selectedChargeDocumentUrl, '_blank');
      return;
    }
    const url = generatedPreviewUrl || generateChargePreview();
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `charge-${selectedCharge?.id || 'preview'}.pdf`;
    link.click();
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Charges Ledger</h2>
          <p className="text-sm text-slate-400">A read-only list of posted charges and violation history.</p>
          <p className="text-xs text-slate-500 mt-2">Click any row to view the charge details in a preview panel.</p>
        </div>
        <div className="w-full sm:w-80">
          <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="driver-filter">
            Filter by driver name
          </label>
          <input
            id="driver-filter"
            value={driverFilter}
            onChange={(event) => setDriverFilter(event.target.value)}
            placeholder="Search driver name..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-4">
        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
              <span>Loading charges...</span>
            </div>
          </div>
        ) : error ? (
          <div className="min-h-[240px] p-8 text-center text-sm text-red-400">{error}</div>
        ) : filteredCharges.length === 0 ? (
          <div className="min-h-[240px] p-8 text-center text-sm text-slate-400">
            {charges.length === 0 ? "No charges have been posted yet." : "No charges match your filter."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-300">Driver</th>
                  <th className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-300">Violation Code</th>
                  <th className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-300">Description</th>
                  <th className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-300">Charge Type</th>
                  <th className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 text-right text-slate-300">Amount</th>
                  <th className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredCharges.map((charge) => (
                  <tr
                    key={charge.id}
                    className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800 cursor-pointer"
                    onClick={() => setSelectedCharge(charge)}
                  >
                    <td className="px-4 py-3 text-slate-100">{charge.drivers?.name || "Unknown"}</td>
                    <td className="px-4 py-3 text-slate-200">{charge.violations?.code || "—"}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[280px] truncate">{charge.description || charge.violations?.description || "—"}</td>
                    <td className="px-4 py-3 text-slate-200">{charge.charge_type || "—"}</td>
                    <td className="px-4 py-3 text-right text-slate-100">{charge.amount != null ? `$${Number(charge.amount).toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{charge.violations?.date ? new Date(charge.violations.date).toLocaleDateString() : charge.created_at ? new Date(charge.created_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="px-4 py-3 text-slate-300 font-semibold" colSpan={4}>Total</td>
                  <td className="px-4 py-3 text-right text-cyan-300 font-semibold">${totalAmount.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {selectedCharge && !previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6" onClick={handleCloseAll}>
          <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-black/50" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Charge details</h3>
              <p className="text-sm text-slate-400">Review the posted charge and related inspection violation.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleViewCharge}
                disabled={!canPreviewCharge}
                className={`rounded-full px-3 py-2 text-slate-950 transition ${canPreviewCharge ? 'bg-cyan-500 hover:bg-cyan-400' : 'bg-slate-700 cursor-not-allowed'}`}
              >
                View
              </button>
              <button
                onClick={handleDeleteCharge}
                disabled={deleting}
                className="rounded-full bg-red-600 px-3 py-2 text-slate-100 hover:bg-red-500 disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={handleCloseAll}
                className="rounded-full bg-slate-800 px-3 py-2 text-slate-200 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Driver</div>
              <div className="text-lg font-semibold text-slate-100">{selectedCharge.drivers?.name || "Unknown"}</div>
              <div className="text-sm text-slate-400 mt-1">Posted {selectedCharge.created_at ? new Date(selectedCharge.created_at).toLocaleDateString() : "—"}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Violation</div>
              <div className="text-lg font-semibold text-slate-100">{selectedCharge.violations?.code || "N/A"}</div>
              <div className="text-sm text-slate-400 mt-1">{selectedCharge.violations?.date ? new Date(selectedCharge.violations.date).toLocaleDateString() : "No violation date"}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Charge type</div>
              <div className="text-lg font-semibold text-slate-100">{selectedCharge.charge_type || "—"}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Amount</div>
              <div className="text-2xl font-semibold text-cyan-300">{selectedCharge.amount != null ? `$${Number(selectedCharge.amount).toFixed(2)}` : "—"}</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Document</div>
                <div className="text-sm text-slate-300">
                  {selectedChargeDocumentUrl ? 'Attached charge document available for download' : 'Preview generated from charge details — use the top View button'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadCharge}
                  disabled={!canPreviewCharge}
                  className={`rounded-full px-4 py-2 text-xs font-semibold text-slate-200 transition ${canPreviewCharge ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-700 cursor-not-allowed'}`}
                >
                  Download
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Description</div>
            <p className="text-sm leading-6 text-slate-300">{selectedCharge.description || selectedCharge.violations?.description || "No description provided."}</p>
          </div>

          </div>
        </div>
      )}

      {previewOpen && previewUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4" onClick={handleCloseAll}>
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/50" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
              <div className="text-sm font-semibold text-slate-100">Document preview</div>
              <button
                onClick={handleCloseAll}
                className="rounded-full bg-slate-800 px-3 py-2 text-slate-200 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
            <object data={previewUrl} type="application/pdf" className="h-[calc(90vh-64px)] w-full bg-slate-950" aria-label="Document preview">
              <p className="text-sm text-slate-300">Preview not available. <a href={previewUrl} target="_blank" rel="noreferrer" className="text-cyan-400">Open in a new tab</a>.</p>
            </object>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargesPage;
