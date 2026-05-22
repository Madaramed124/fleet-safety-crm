import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import notify from '../../utils/notify';
import logError from '../../utils/logger';

type LedgerCharge = {
  id: string;
  created_at: string | null;
  amount: number | null;
  charge_type: string | null;
  description: string | null;
  payment_status: string | null;
  charge_status: string | null;
  drivers: { name: string | null } | null;
  violations: { code: string | null; description: string | null; date: string | null } | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
};

const formatMoney = (value: number | null | undefined) => {
  const amount = Number(value || 0);
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getMonthLabel = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
};

const AccountingLedger: React.FC = () => {
  const [charges, setCharges] = useState<LedgerCharge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchDriver, setSearchDriver] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [selectedCharge, setSelectedCharge] = useState<LedgerCharge | null>(null);
  const [updatingChargeId, setUpdatingChargeId] = useState<string | null>(null);

  const loadCharges = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("charges")
        .select(`id,created_at,amount,charge_type,description,payment_status,charge_status,drivers(name),violations(code,description,date)`)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message || "Failed to load charges.");
        setCharges([]);
        logError(error, 'Failed to load charges');
        notify.error('Failed to load charges');
      } else {
        const normalized = (data || []).map((row: any) => ({
          ...row,
          amount: row.amount != null ? Number(row.amount) : null,
          payment_status: row.payment_status || "unpaid",
          charge_status: row.charge_status || "pending",
        }));
        setCharges(normalized);
      }
    } catch (err: any) {
      logError(err, 'Unexpected error loading charges');
      setError(err?.message || 'Failed to load charges');
      notify.error('Failed to load charges');
      setCharges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharges();
  }, []);

  const filteredCharges = useMemo(() => {
    return charges.filter((charge) => {
      const driverName = (charge.drivers?.name || "").toLowerCase();
      if (searchDriver.trim() && !driverName.includes(searchDriver.trim().toLowerCase())) {
        return false;
      }

      const created = charge.created_at ? new Date(charge.created_at) : null;
      if (fromDate) {
        const from = new Date(fromDate + "T00:00:00");
        if (!created || created < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate + "T23:59:59");
        if (!created || created > to) return false;
      }

      if (minAmount) {
        const min = Number(minAmount);
        if (Number(charge.amount || 0) < min) return false;
      }
      if (maxAmount) {
        const max = Number(maxAmount);
        if (Number(charge.amount || 0) > max) return false;
      }

      return true;
    });
  }, [charges, searchDriver, fromDate, toDate, minAmount, maxAmount]);

  const totalAmount = useMemo(() => {
    return filteredCharges.reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
  }, [filteredCharges]);

  const monthBreakdown = useMemo(() => {
    const groups = new Map<string, number>();
    filteredCharges.forEach((charge) => {
      const label = getMonthLabel(charge.created_at);
      if (!label) return;
      groups.set(label, (groups.get(label) || 0) + Number(charge.amount || 0));
    });
    return Array.from(groups.entries())
      .sort((a, b) => {
        const aDate = new Date(a[0]);
        const bDate = new Date(b[0]);
        return bDate.getTime() - aDate.getTime();
      })
      .map(([month, amount]) => `${month}: ${formatMoney(amount)}`);
  }, [filteredCharges]);

  const exportCsv = () => {
    const rows = [
      ["Date", "Driver", "Violation", "Charge Type", "Amount", "Payment Status", "Charge Status"],
      ...filteredCharges.map((charge) => [
        formatDate(charge.created_at),
        charge.drivers?.name || "-",
        charge.violations?.code || "-",
        charge.charge_type || "-",
        formatMoney(charge.amount),
        (charge.payment_status || "unpaid").toUpperCase(),
        (charge.charge_status || "pending").toUpperCase(),
      ]),
    ];

    const csvContent = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `accounting-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleTogglePaymentStatus = async (charge: LedgerCharge) => {
    const nextPayment = charge.payment_status === "paid" ? "unpaid" : "paid";
    const nextCharge = nextPayment === "paid" ? "charged" : "pending";
    setUpdatingChargeId(charge.id);
    const { error } = await supabase
      .from("charges")
      .update({ payment_status: nextPayment, charge_status: nextCharge })
      .eq("id", charge.id);

    if (error) {
      setError(error.message || "Unable to update payment status.");
      logError(error, 'Failed to update payment/charge status');
      notify.error('Failed to update payment status');
    } else {
      setCharges((prev) =>
        prev.map((item) => (item.id === charge.id ? { ...item, payment_status: nextPayment, charge_status: nextCharge } : item))
      );
      notify.success('Payment status updated');
    }
    setUpdatingChargeId(null);
  };

  const handleToggleChargeStatus = async (charge: LedgerCharge) => {
    // Only allow toggling charge status when payment is paid
    if (charge.payment_status !== "paid") return;

    const nextStatus = charge.charge_status === "charged" ? "pending" : "charged";
    setUpdatingChargeId(charge.id);
    const { error } = await supabase.from("charges").update({ charge_status: nextStatus }).eq("id", charge.id);
    if (error) {
      setError(error.message || "Unable to update charge status.");
      logError(error, 'Failed to update charge status');
      notify.error('Failed to update charge status');
    } else {
      setCharges((prev) => prev.map((item) => (item.id === charge.id ? { ...item, charge_status: nextStatus } : item)));
      notify.success('Charge status updated');
    }
    setUpdatingChargeId(null);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Accounting Ledger</h1>
          <p className="mt-2 text-sm text-slate-400">Review posted charges, filter the ledger, and export your results.</p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Export CSV
        </button>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 mb-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">Driver name</label>
          <input
            value={searchDriver}
            onChange={(e) => setSearchDriver(e.target.value)}
            placeholder="Search driver..."
            className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">From date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">To date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Min amount</label>
            <input
              type="number"
              min="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Max amount</label>
            <input
              type="number"
              min="0"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 mb-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Charges</div>
          <div className="mt-2 text-2xl font-semibold text-slate-100">{filteredCharges.length}</div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Total amount</div>
          <div className="mt-2 text-2xl font-semibold text-cyan-300">{formatMoney(totalAmount)}</div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Monthly breakdown</div>
          <div className="mt-2 text-sm leading-6 text-slate-200">
            {monthBreakdown.length > 0 ? monthBreakdown.join(" · ") : "No charges in date range."}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-auto">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-slate-950/95">
              <tr>
                <th className="sticky top-0 border-b border-slate-800 px-4 py-3 text-slate-300">Date</th>
                <th className="sticky top-0 border-b border-slate-800 px-4 py-3 text-slate-300">Driver</th>
                <th className="sticky top-0 border-b border-slate-800 px-4 py-3 text-slate-300">Violation</th>
                <th className="sticky top-0 border-b border-slate-800 px-4 py-3 text-slate-300">Charge Type</th>
                <th className="sticky top-0 border-b border-slate-800 px-4 py-3 text-right text-slate-300">Amount</th>
                <th className="sticky top-0 border-b border-slate-800 px-4 py-3 text-center text-slate-300">Payment Status</th>
                <th className="sticky top-0 border-b border-slate-800 px-4 py-3 text-center text-slate-300">Charge Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading ledger...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-red-400">{error}</td>
                </tr>
              ) : filteredCharges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No charges match the current filters.</td>
                </tr>
              ) : (
                filteredCharges.map((charge) => {
                  const paymentStatus = charge.payment_status || "unpaid";
                  const chargeStatus = charge.charge_status || "pending";
                  return (
                    <tr
                      key={charge.id}
                      onClick={() => setSelectedCharge(charge)}
                      className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800 cursor-pointer"
                    >
                      <td className="px-4 py-4 text-slate-100">{formatDate(charge.created_at)}</td>
                      <td className="px-4 py-4 text-slate-100">{charge.drivers?.name || "Unknown"}</td>
                      <td className="px-4 py-4 text-slate-200">{charge.violations?.code || charge.violations?.description || "-"}</td>
                      <td className="px-4 py-4 text-slate-200">{charge.charge_type || "-"}</td>
                      <td className="px-4 py-4 text-right text-slate-100">{formatMoney(charge.amount)}</td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePaymentStatus(charge);
                          }}
                          disabled={updatingChargeId === charge.id}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            paymentStatus === "paid"
                              ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                              : "bg-rose-500 text-white hover:bg-rose-400"
                          }`}
                        >
                          {paymentStatus === "paid" ? "Paid" : "Unpaid"}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (paymentStatus !== "paid") return;
                            handleToggleChargeStatus(charge);
                          }}
                          disabled={updatingChargeId === charge.id || paymentStatus !== "paid"}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            paymentStatus !== "paid"
                              ? "opacity-50 bg-slate-800 text-slate-500 cursor-not-allowed"
                              : chargeStatus === "charged"
                              ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                              : "bg-amber-500 text-slate-950 hover:bg-amber-400"
                          }`}
                        >
                          {chargeStatus === "charged" ? "Charged" : "Pending"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredCharges.length > 0 && (
              <tfoot>
                <tr>
                  <td className="px-4 py-4 text-slate-300 font-semibold" colSpan={4}>Total</td>
                  <td className="px-4 py-4 text-right text-cyan-300 font-semibold">{formatMoney(totalAmount)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {selectedCharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6" onClick={() => setSelectedCharge(null)}>
          <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-black/50" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Charge details</h2>
                <p className="text-sm text-slate-400">Review the full charge information for this entry.</p>
              </div>
              <button
                onClick={() => setSelectedCharge(null)}
                className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Date</div>
                <div className="text-lg font-semibold text-slate-100">{formatDate(selectedCharge.created_at)}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Driver</div>
                <div className="text-lg font-semibold text-slate-100">{selectedCharge.drivers?.name || "Unknown"}</div>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Violation</div>
                <div className="text-lg font-semibold text-slate-100">{selectedCharge.violations?.code || "-"}</div>
                <div className="text-sm text-slate-400 mt-1">{selectedCharge.violations?.date ? formatDate(selectedCharge.violations.date) : "-"}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Charge Type</div>
                <div className="text-lg font-semibold text-slate-100">{selectedCharge.charge_type || "-"}</div>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Amount</div>
                <div className="text-2xl font-semibold text-cyan-300">{formatMoney(selectedCharge.amount)}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Statuses</div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white">Payment: {selectedCharge.payment_status === "paid" ? "Paid" : "Unpaid"}</span>
                  <span className="rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-950">Charge: {selectedCharge.charge_status === "charged" ? "Charged" : "Pending"}</span>
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
    </div>
  );
};

export default AccountingLedger;
