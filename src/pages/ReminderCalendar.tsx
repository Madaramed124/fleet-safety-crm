import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";

type ReminderType = "court" | "license" | "inspection" | "resolved";

type ReminderRow = {
  id: string;
  date: string;
  title: string;
  driver_id: string;
  type: ReminderType;
  notes: string | null;
};

const REMINDER_TYPES = [
  { value: "court", label: "Court Date", color: "#e57373" },
  { value: "license", label: "License Renewal", color: "#64b5f6" },
  { value: "inspection", label: "Inspection", color: "#81c784" },
  { value: "resolved", label: "Resolved", color: "#ffd54f" },
] as const;

function getTypeColor(type: ReminderType) {
  return REMINDER_TYPES.find((t) => t.value === type)?.color || "#bdbdbd";
}

export default function ReminderCalendar() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    driver_id: "",
    type: "court" as ReminderType,
    notes: "",
  });

  const days = useMemo(
    () => eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    }),
    [currentMonth]
  );

  const fetchReminders = async () => {
    setLoading(true);
    const from = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const to = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("reminders")
      .select("id,date,title,driver_id,type,notes")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true });

    if (!error) {
      setReminders((data ?? []) as ReminderRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchReminders();
  }, [currentMonth]);

  const openPanel = (date: Date) => {
    setSelectedDate(date);
    setShowPanel(true);
    setForm({ title: "", driver_id: "", type: "court", notes: "" });
  };

  const closePanel = () => {
    setShowPanel(false);
    setSelectedDate(null);
  };

  const addReminder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDate || !form.title) return;

    const { error } = await supabase.from("reminders").insert([
      {
        date: format(selectedDate, "yyyy-MM-dd"),
        title: form.title,
        driver_id: form.driver_id,
        type: form.type,
        notes: form.notes,
      },
    ]);

    if (!error) {
      await fetchReminders();
      setForm({ title: "", driver_id: "", type: "court", notes: "" });
    }
  };

  const deleteReminder = async (id: string) => {
    await supabase.from("reminders").delete().eq("id", id);
    await fetchReminders();
  };

  const firstDay = startOfMonth(currentMonth).getDay();
  const blanks = Array(firstDay).fill(null);

  const remindersForDay = (day: Date) => reminders.filter((r) => isSameDay(new Date(r.date), day));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>&lt;</button>
        <h2 className="text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>&gt;</button>
      </div>
      {loading ? <div>Loading reminders…</div> : (
        <>
          <div className="grid grid-cols-7 gap-2 bg-gray-900 rounded-lg p-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center font-semibold text-gray-400">{d}</div>
            ))}
            {blanks.map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`rounded-lg p-2 cursor-pointer min-h-[60px] border ${isSameMonth(day, currentMonth) ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-950 text-gray-700"} ${selectedDate && isSameDay(day, selectedDate) ? "border-blue-400" : "border-transparent"}`}
                onClick={() => openPanel(day)}
              >
                <div className="flex items-center justify-between">
                  <span>{day.getDate()}</span>
                  <div className="flex space-x-1">
                    {remindersForDay(day).map((r) => (
                      <span key={r.id} style={{ background: getTypeColor(r.type) }} className="inline-block w-2 h-2 rounded-full" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {showPanel && selectedDate && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end md:items-center md:justify-end z-50">
              <div className="bg-gray-900 w-full md:w-96 p-6 rounded-t-2xl md:rounded-l-2xl max-h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Reminders for {format(selectedDate, "PPP")}</h3>
                  <button onClick={closePanel}>&times;</button>
                </div>
                <div className="space-y-2 mb-4">
                  {remindersForDay(selectedDate).map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-gray-800 rounded p-2">
                      <div>
                        <div className="font-semibold">{r.title}</div>
                        <div className="text-xs text-gray-400">Driver: {r.driver_id}</div>
                        <div className="text-xs" style={{ color: getTypeColor(r.type) }}>{REMINDER_TYPES.find((t) => t.value === r.type)?.label || r.type}</div>
                        {r.notes && <div className="text-xs text-gray-400">{r.notes}</div>}
                      </div>
                      <button className="text-red-400 ml-2" onClick={() => deleteReminder(r.id)}>&#128465;</button>
                    </div>
                  ))}
                  {remindersForDay(selectedDate).length === 0 && <div className="text-gray-500">No reminders</div>}
                </div>
                <form onSubmit={addReminder} className="space-y-2">
                  <input
                    className="w-full p-2 rounded bg-gray-800 text-white"
                    placeholder="Title"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    required
                  />
                  <input
                    className="w-full p-2 rounded bg-gray-800 text-white"
                    placeholder="Driver name or ID"
                    value={form.driver_id}
                    onChange={(event) => setForm((current) => ({ ...current, driver_id: event.target.value }))}
                  />
                  <select
                    className="w-full p-2 rounded bg-gray-800 text-white"
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ReminderType }))}
                  >
                    {REMINDER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <textarea
                    className="w-full p-2 rounded bg-gray-800 text-white"
                    placeholder="Notes (optional)"
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  />
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded p-2 font-semibold">Add Reminder</button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
