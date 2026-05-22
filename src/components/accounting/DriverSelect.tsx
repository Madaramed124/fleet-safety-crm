import React, { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import notify from '../../utils/notify';
import logError from '../../utils/logger';

const DriverSelect: React.FC<{ onSelect: (id: string | null) => void; selectedDriverId?: string | null }> = ({ onSelect, selectedDriverId }) => {
  const [query, setQuery] = useState("");
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const q = supabase.from("drivers").select("id, name").limit(50);
        const { data, error } = await q;
        if (error) {
          logError(error, 'Failed to load drivers');
          notify.error('Failed to load drivers');
        }
        if (isMounted) setDrivers(data || []);
      } catch (err: any) {
        logError(err, 'Unexpected error loading drivers');
        notify.error('Failed to load drivers');
      }
    })();
    return () => { isMounted = false };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // simple client-side filter for now
    onSelect(null);
  };

  return (
    <div className="flex h-full flex-col">
      <label className="block text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">Drivers</label>
      <input
        value={query}
        onChange={onChange}
        placeholder="Search drivers..."
        className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-100 outline-none"
      />
      <div className="mt-4 flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
        {drivers.filter(d => d.name.toLowerCase().includes(query.toLowerCase())).map(d => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className={`w-full text-left rounded-[6px] px-3 py-2 border transition ${selectedDriverId === d.id ? 'border-[#1D9E75] bg-[#1D9E75] text-white' : 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'}`}
          >
            {d.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DriverSelect;
