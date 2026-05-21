import React, { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import notify from '../../utils/notify';
import logError from '../../utils/logger';

const DriverSelect: React.FC<{ onSelect: (id: string | null) => void }> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const q = supabase.from("drivers").select("id, name").limit(50);
      const { data, error } = await q;
      if (error) { logError(error, 'Failed to load drivers'); }
      if (isMounted) setDrivers(data || []);
    })();
    return () => { isMounted = false };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // simple client-side filter for now
    onSelect(null);
  };

  return (
    <div>
      <label className="block text-xs text-slate-400 mb-2">Select Driver</label>
      <input value={query} onChange={onChange} placeholder="Search drivers..." className="w-full rounded px-3 py-2 bg-slate-900 border border-slate-700 text-sm" />
      <div className="mt-2 space-y-2 max-h-64 overflow-auto">
        {drivers.filter(d => d.name.toLowerCase().includes(query.toLowerCase())).map(d => (
          <button key={d.id} onClick={() => onSelect(d.id)} className="w-full text-left rounded px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700">
            {d.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DriverSelect;
