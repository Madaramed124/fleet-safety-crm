/// <reference types="vite/client" />

import type { IncidentRecord, OperationalMonth } from "../types";
import { supabase } from "./supabaseClient";
import logError from '../utils/logger';

const STORAGE_KEYS = {
  MONTHS: "fleet_crm_months",
  RECORDS: "fleet_crm_records",
};

const parseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    logError(error, 'Failed to parse stored JSON');
    return fallback;
  }
};

export interface DataService {
  fetchMonths: () => Promise<OperationalMonth[]>;
  fetchRecords: () => Promise<IncidentRecord[]>;
  storeMonths: (months: OperationalMonth[]) => Promise<void>;
  storeRecords: (records: IncidentRecord[]) => Promise<void>;
  createMonth: (month: OperationalMonth) => Promise<OperationalMonth>;
  deleteMonth: (monthId: string) => Promise<void>;
  createRecord: (record: IncidentRecord) => Promise<IncidentRecord>;
  updateRecord: (record: IncidentRecord) => Promise<IncidentRecord>;
  deleteRecord: (recordId: string) => Promise<void>;
}

const localStorageService: DataService = {
  fetchMonths: async () => parseJson<OperationalMonth[]>(localStorage.getItem(STORAGE_KEYS.MONTHS), []),
  fetchRecords: async () => parseJson<IncidentRecord[]>(localStorage.getItem(STORAGE_KEYS.RECORDS), []),
  storeMonths: async (months) => {
    localStorage.setItem(STORAGE_KEYS.MONTHS, JSON.stringify(months));
  },
  storeRecords: async (records) => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  },
  createMonth: async (month) => {
    const months = await localStorageService.fetchMonths();
    const next = [...months, month];
    await localStorageService.storeMonths(next);
    return month;
  },
  deleteMonth: async (monthId) => {
    const months = await localStorageService.fetchMonths();
    const next = months.filter((item) => item.id !== monthId);
    await localStorageService.storeMonths(next);
  },
  createRecord: async (record) => {
    const records = await localStorageService.fetchRecords();
    const next = [...records, record];
    await localStorageService.storeRecords(next);
    return record;
  },
  updateRecord: async (record) => {
    const records = await localStorageService.fetchRecords();
    const next = records.map((item) => (item.id === record.id ? record : item));
    await localStorageService.storeRecords(next);
    return record;
  },
  deleteRecord: async (recordId) => {
    const records = await localStorageService.fetchRecords();
    const next = records.filter((item) => item.id !== recordId);
    await localStorageService.storeRecords(next);
  },
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

const remoteApiService: DataService = {
  fetchMonths: async () => {
    const response = await fetch(`${apiBaseUrl}/months`);
    if (!response.ok) {
      throw new Error("Failed to fetch months from backend");
    }
    return response.json();
  },
  fetchRecords: async () => {
    const response = await fetch(`${apiBaseUrl}/records`);
    if (!response.ok) {
      throw new Error("Failed to fetch records from backend");
    }
    return response.json();
  },
  storeMonths: async (months) => {
    const response = await fetch(`${apiBaseUrl}/months`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(months),
    });
    if (!response.ok) {
      throw new Error("Failed to persist months to backend");
    }
  },
  storeRecords: async (records) => {
    const response = await fetch(`${apiBaseUrl}/records`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(records),
    });
    if (!response.ok) {
      throw new Error("Failed to persist records to backend");
    }
  },
  createMonth: async (month) => {
    const response = await fetch(`${apiBaseUrl}/months`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(month),
    });
    if (!response.ok) {
      throw new Error("Failed to create month on backend");
    }
    return response.json();
  },
  deleteMonth: async (monthId) => {
    const response = await fetch(`${apiBaseUrl}/months/${monthId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete month on backend");
    }
  },
  createRecord: async (record) => {
    const response = await fetch(`${apiBaseUrl}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!response.ok) {
      throw new Error("Failed to create record on backend");
    }
    return response.json();
  },
  updateRecord: async (record) => {
    const response = await fetch(`${apiBaseUrl}/records/${record.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!response.ok) {
      throw new Error("Failed to update record on backend");
    }
    return response.json();
  },
  deleteRecord: async (recordId) => {
    const response = await fetch(`${apiBaseUrl}/records/${recordId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete record on backend");
    }
  },
};

const syncRecordRelations = async (record: IncidentRecord) => {
  if (!record.driverName) return null;

  console.log("[syncRecordRelations] record driverName:", record.driverName);

  const { data: driverData, error: driverError } = await supabase
    .from("drivers")
    .upsert({ name: record.driverName }, { onConflict: "name" })
    .select("id")
    .maybeSingle();

  if (driverError) {
    console.error("[syncRecordRelations] driver upsert error:", driverError);
    throw driverError;
  }

  const driverId = driverData?.id as string | null;
  console.log("[syncRecordRelations] resolved driverId:", driverId);
  if (!driverId) return null;

  const violations = (record as any).violations as Array<any> | undefined;
  if (!violations || violations.length === 0) return driverId;

  const violationRows = violations.map((violation) => ({
    id: violation.id,
    driver_id: driverId,
    code: violation.code,
    description: violation.description || null,
    severity: violation.severity || "Medium",
    date: record.date,
    accounting_status: "pending",
  }));

  console.log("[syncRecordRelations] upserting violationRows:", violationRows);
  const { data: violationData, error: violationError } = await supabase
    .from("violations")
    .upsert(violationRows, { onConflict: "id" })
    .select("id,driver_id,code,severity,date,accounting_status");

  if (violationError) {
    console.error("[syncRecordRelations] violations upsert error:", violationError);
    throw violationError;
  }

  console.log("[syncRecordRelations] violations upsert result:", violationData);
  return driverId;
};

const supabaseService: DataService = {
  fetchMonths: async () => {
    const { data, error } = await supabase.from("months").select("*");
    if (error) throw error;
    return data ?? [];
  },
  fetchRecords: async () => {
    const { data, error } = await supabase.from("records").select("id, monthId, payload");
    if (error) throw error;

    const records = (data ?? []).map((row) => ({
      ...row.payload,
      id: row.id,
      monthId: row.monthId,
    })) as IncidentRecord[];

    await Promise.all(records.map((record) => syncRecordRelations(record).catch((err) => {
      // Keep the app healthy even if sync is not perfect on load.
      logError(err, `Failed to sync driver/violation for record ${record.id}`);
    })));

    return records;
  },
  storeMonths: async (months) => {
    const { error } = await supabase.from("months").upsert(months);
    if (error) throw error;
  },
  storeRecords: async (records) => {
    const upsertPayload = records.map((record) => ({
      id: record.id,
      monthId: record.monthId,
      payload: record,
    }));
    const { error } = await supabase.from("records").upsert(upsertPayload);
    if (error) throw error;
  },
  createMonth: async (month) => {
    const { data, error } = await supabase.from("months").insert(month).select();
    if (error) throw error;
    return data?.[0] ?? month;
  },
  deleteMonth: async (monthId) => {
    const { error } = await supabase.from("months").delete().eq("id", monthId);
    if (error) throw error;
  },
  createRecord: async (record) => {
    await syncRecordRelations(record);
    const { data, error } = await supabase
      .from("records")
      .insert({ id: record.id, monthId: record.monthId, payload: record })
      .select();
    if (error) throw error;
    return data?.[0]?.payload ?? record;
  },
  updateRecord: async (record) => {
    await syncRecordRelations(record);
    const { data, error } = await supabase
      .from("records")
      .update({ payload: record })
      .eq("id", record.id)
      .select();
    if (error) throw error;
    return data?.[0]?.payload ?? record;
  },
  deleteRecord: async (recordId) => {
    const { error } = await supabase.from("records").delete().eq("id", recordId);
    if (error) throw error;
  },
};

export const getDataService = (): DataService => {
  if (import.meta.env.VITE_USE_SUPABASE === "true") {
    return supabaseService;
  }

  if (import.meta.env.VITE_USE_REMOTE_API === "true") {
    return remoteApiService;
  }

  return localStorageService;
};
