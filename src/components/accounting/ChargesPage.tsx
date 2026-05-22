import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../services/supabaseClient";

type ChargeRow = {
  id: string;
  charge_type: string;
  description: string;
  amount: number | null;
  document_url?: string | null;
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

  useEffect(() => {
    const loadCharges = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("charges")
        .select("*, violations(code, description, date), drivers(name)")
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

      {selectedCharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Charge details</h3>
                <p className="text-sm text-slate-400">Review the posted charge and related inspection violation.</p>
              </div>
              <button onClick={() => setSelectedCharge(null)} className="rounded-full bg-slate-800 px-3 py-2 text-slate-200 hover:bg-slate-700">Close</button>
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

            {selectedCharge.document_url && (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Document</div>
                    <div className="text-sm text-slate-300">Attached charge document</div>
                  </div>
                  <a
                    href={selectedCharge.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    Download
                  </a>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Description</div>
              <p className="text-sm leading-6 text-slate-300">{selectedCharge.description || selectedCharge.violations?.description || "No description provided."}</p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ChargesPage;
