import React from "react";
import type { IncidentRecord } from "../types";

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const normalizeDriverName = (name: string): string => {
  const parts = name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  return `${parts[0]} ${parts[parts.length - 1]}`;
};

export const getRepeatedViolationCount = (
  record: IncidentRecord,
  records: IncidentRecord[]
): number => {
  const normalized = normalizeDriverName(record.driverName);
  if (!normalized) return 0;

  return records.filter(
    (item) => normalizeDriverName(item.driverName) === normalized
  ).length;
};

export const highlightMatch = (
  text: string,
  query: string
): (string | React.ReactNode)[] => {
  if (!query.trim()) return [text];

  const parts: (string | React.ReactNode)[] = [];
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const split = text.split(regex);

  split.forEach((part, i) => {
    if (regex.test(part)) {
      parts.push(
               React.createElement("span", {
  key: i,
  className: "highlight-match",
  children: part,
})

      );
    } else {
      parts.push(part);
    }
  });

  return parts;
};

export const groupRecordsByDate = (
  records: any[]
): Map<string, any[]> => {
  const grouped = new Map<string, any[]>();
  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  sorted.forEach((record) => {
    const dateKey = new Date(record.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(record);
  });

  return grouped;
};

export const groupByCarrier = (records: any[]): Map<string, any[]> => {
  const grouped = new Map<string, any[]>();

  records.forEach((record) => {
    if (!grouped.has(record.carrierName)) {
      grouped.set(record.carrierName, []);
    }
    grouped.get(record.carrierName)!.push(record);
  });

  return grouped;
};
