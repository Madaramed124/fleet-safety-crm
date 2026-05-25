import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../services/supabaseClient";

type ReminderType = "court" | "license" | "inspection" | "resolved";

type ReminderRow = {
  id: string;
  date: string;
  title: string;
  driver_id: string;
  type: ReminderType;
  notes: string | null;
  created_at?: string;
};

const reminderTypes = [
  { value: "court", label: "Court date", color: "#d97706" },
  { value: "license", label: "License renewal", color: "#2563eb" },
  { value: "inspection", label: "Inspection", color: "#059669" },
  { value: "resolved", label: "Resolved", color: "#6b7280" },
] as const;

const EVENT_DOT = "#e63";

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const getMonthDays = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const days: Date[] = [];

  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    days.push(new Date(current));
  }

  return days;
};

const getMonthCalendar = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const blanks = Array.from({ length: firstDay.getDay() }, () => null);
  const days = getMonthDays(date);
  return [...blanks, ...days];
};

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const getReminderType = (type: ReminderType) =>
  reminderTypes.find((item) => item.value === type) ?? reminderTypes[0];

export const ReminderCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [form, setForm] = useState({
    title: "",
    driver_id: "",
    type: "court" as ReminderType,
    notes: "",
  });

  const today = useMemo(() => new Date(), []);
  const calendarDays = useMemo(() => getMonthCalendar(currentMonth), [currentMonth]);

  const fetchReminders = async () => {
    setLoading(true);

    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from("reminders")
      .select("id,date,title,driver_id,type,notes,created_at")
      .gte("date", formatDateKey(start))
      .lte("date", formatDateKey(end))
      .order("date", { ascending: true });

    if (!error) {
      setReminders((data ?? []) as ReminderRow[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchReminders();
  }, [currentMonth]);

  useEffect(() => {
    const channel = supabase
      .channel("reminders-calendar")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reminders" },
        () => {
          fetchReminders();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const selectedDayReminders = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    return reminders.filter((reminder) => isSameDay(new Date(reminder.date), selectedDate));
  }, [reminders, selectedDate]);

  const openDayPanel = (day: Date | null) => {
    if (!day) {
      return;
    }

    setSelectedDate(day);
    setShowPanel(true);
    setForm({
      title: "",
      driver_id: "",
      type: "court",
      notes: "",
    });
  };

  const openAddForToday = () => {
    setSelectedDate(new Date());
    setShowPanel(true);
    setForm({
      title: "",
      driver_id: "",
      type: "court",
      notes: "",
    });
  };

  const closePanel = () => {
    setShowPanel(false);
    setSelectedDate(null);
  };

  const addReminder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDate) {
      return;
    }

    const { error } = await supabase.from("reminders").insert({
      date: formatDateKey(selectedDate),
      title: form.title,
      driver_id: form.driver_id,
      type: form.type,
      notes: form.notes,
      created_at: new Date().toISOString(),
    });

    if (!error) {
      setForm({
        title: "",
        driver_id: "",
        type: "court",
        notes: "",
      });
      await fetchReminders();
    }
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase.from("reminders").delete().eq("id", id);

    if (!error) {
      setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
    }
  };

  return (
    <div className="min-h-full h-full w-full bg-slate-950 text-slate-100 px-8 py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Reminder Calendar</p>
          <h2 className="mt-2 text-[22px] font-bold tracking-[-0.03em] text-white">
            {dateFormatter.format(currentMonth)}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="rounded-full border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 transition hover:border-slate-700"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="rounded-full border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 transition hover:border-slate-700"
          >
            →
          </button>
          <button
            type="button"
            onClick={openAddForToday}
            className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            + Add
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-500">
        <span>Notes meet planning.</span>
        <span>{loading ? "Syncing…" : "Live"}</span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
          <div key={label} className="pb-2 text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {label}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          const dayReminders = day ? reminders.filter((item) => isSameDay(new Date(item.date), day)) : [];
          const isToday = day ? isSameDay(day, today) : false;

          return (
            <button
              key={day ? formatDateKey(day) : `blank-${index}`}
              type="button"
              onClick={() => openDayPanel(day)}
              disabled={!day}
              className={`min-h-[118px] rounded-xl border p-2 text-left transition ${
                day
                  ? "border-slate-800 bg-slate-900 hover:border-slate-700"
                  : "border-transparent bg-transparent"
              }`}
            >
              {day && (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center text-[13px] ${
                        isToday
                          ? "rounded-full bg-cyan-500 text-slate-950"
                          : "text-slate-200"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {dayReminders.length > 0 && (
                      <span
                        className="mt-1 inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: EVENT_DOT }}
                      />
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    {dayReminders.slice(0, 2).map((reminder) => (
                      <div key={reminder.id} className="truncate text-[11px] text-slate-300">
                        {reminder.title}
                      </div>
                    ))}
                    {dayReminders.length > 2 && (
                      <div className="text-[10px] text-slate-500">+{dayReminders.length - 2} more</div>
                    )}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {showPanel && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/75 backdrop-blur-[1px] md:items-center md:justify-end">
          <div className="w-full max-w-[420px] border-l border-slate-800 bg-slate-950 px-6 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)] md:h-full md:overflow-y-auto">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{formatDateKey(selectedDate)}</p>
                <h3 className="mt-2 text-[20px] font-bold text-white">
                  {selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-full border border-slate-800 px-3 py-1 text-sm text-slate-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {selectedDayReminders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/70 px-4 py-5 text-sm text-slate-400">
                  No reminders yet for this day.
                </div>
              ) : (
                selectedDayReminders.map((reminder) => (
                  <div key={reminder.id} className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[15px] font-semibold text-white">{reminder.title}</div>
                        <div className="mt-1 text-sm text-slate-400">Driver: {reminder.driver_id || "—"}</div>
                        <div className="mt-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: getReminderType(reminder.type).color }}
                          />
                          {getReminderType(reminder.type).label}
                        </div>
                        {reminder.notes ? (
                          <p className="mt-3 text-sm leading-6 text-slate-300">{reminder.notes}</p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteReminder(reminder.id)}
                        className="rounded-full border border-slate-800 px-3 py-1 text-sm text-slate-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={addReminder} className="mt-6 space-y-3 border-t border-slate-800 pt-5">
              <div>
                <label className="mb-1 block text-[12px] uppercase tracking-[0.2em] text-slate-400">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/70"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] uppercase tracking-[0.2em] text-slate-400">Driver name / ID</label>
                <input
                  value={form.driver_id}
                  onChange={(event) => setForm((current) => ({ ...current, driver_id: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/70"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] uppercase tracking-[0.2em] text-slate-400">Type</label>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as ReminderType,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/70"
                >
                  {reminderTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[12px] uppercase tracking-[0.2em] text-slate-400">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  rows={4}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/70"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Save reminder
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderCalendar;
