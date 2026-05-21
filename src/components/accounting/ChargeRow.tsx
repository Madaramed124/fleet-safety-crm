import React, { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import notify from '../../utils/notify';
import logError from '../../utils/logger';

interface ChargeRowProps {
  idx: number;
  row: any;
  onChange: (idx: number, row: any) => void;
  onRemove: (idx: number) => void;
  validationErrors?: { description?: string; amount?: string } | null;
  disabled?: boolean;
}

const ChargeRow: React.FC<ChargeRowProps> = ({ idx, row, onChange, onRemove, validationErrors, disabled }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      notify.error("File too large (max 10MB)");
      return;
    }
    setUploading(true);
    const path = `charge-documents/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("charge-documents").upload(path, file, { upsert: true });
    if (error) {
      logError(error, 'File upload failed. Please retry.');
      onChange(idx, { ...row, uploadError: true });
      setUploading(false);
      setUploadFailed(true);
      // bring the row into view so user can see retry
      setTimeout(() => containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }
    // choose signed or public URL based on VITE flag
    const useSigned = import.meta.env.VITE_USE_SIGNED_URLS === 'true';
    let publicURL: string | null = null;
    if (useSigned) {
      const { data: signedData, error: signedErr } = await supabase.storage.from("charge-documents").createSignedUrl(path, 60 * 60);
      if (signedErr) {
        logError(signedErr, 'Failed to create signed URL; falling back to public URL');
      } else {
        publicURL = (signedData as any)?.signedUrl || (signedData as any)?.signedURL || null;
      }
    }
    if (!publicURL) {
      const { data } = supabase.storage.from("charge-documents").getPublicUrl(path);
      publicURL = (data as any)?.publicUrl || null;
    }

    onChange(idx, { ...row, document_url: publicURL, file_name: file.name, file_type: file.type, uploadError: false });
    setUploading(false);
  };

  return (
    <div ref={containerRef} className="flex gap-2 items-start">
      <select value={row.charge_type || "Warning Letter"} onChange={(e) => onChange(idx, { ...row, charge_type: e.target.value })} className="px-2 py-2 bg-slate-900 border border-slate-700 rounded">
        <option>Warning Letter</option>
        <option>Fine Deduction</option>
        <option>Salary Deduction</option>
        <option>Suspension Notice</option>
        <option>Training Requirement</option>
        <option>Court Referral</option>
        <option>Custom</option>
      </select>
      <div className="flex-1">
        <input disabled={disabled} value={row.description || ""} onChange={(e) => onChange(idx, { ...row, description: e.target.value })} placeholder="Description" className={`w-full px-2 py-2 bg-slate-900 border ${validationErrors?.description ? 'border-red-500' : 'border-slate-700'} rounded ${disabled ? 'opacity-60' : ''}`} />
        {validationErrors?.description && <div className="text-red-400 text-xs mt-1">{validationErrors.description}</div>}
      </div>
      <div className="w-24">
        <input disabled={disabled} value={row.amount ?? ""} onChange={(e) => onChange(idx, { ...row, amount: e.target.value })} placeholder="Amount" className={`w-full px-2 py-2 bg-slate-900 border ${validationErrors?.amount ? 'border-red-500' : 'border-slate-700'} rounded ${disabled ? 'opacity-60' : ''}`} />
        {validationErrors?.amount && <div className="text-red-400 text-xs mt-1">{validationErrors.amount}</div>}
      </div>
      <div className="flex flex-col gap-2">
        <label className={`px-3 py-2 rounded ${row.document_url ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-200'} ${disabled ? 'opacity-60' : ''}`}>
          {uploading ? 'Uploading...' : row.document_url ? 'Attached' : 'Attach'}
          <input ref={fileInputRef} type="file" accept="application/pdf,image/*" onChange={(e) => { setUploadFailed(false); handleFile(e.target.files?.[0]); }} className="hidden" disabled={disabled} />
        </label>
        {uploadFailed && (
          <button onClick={() => fileInputRef.current?.click()} className="text-sm text-yellow-300">Retry attach</button>
        )}
      </div>
      <button onClick={() => onRemove(idx)} disabled={disabled} className="px-2 py-2 text-red-400 disabled:opacity-60">×</button>
    </div>
  );
};

export default ChargeRow;
