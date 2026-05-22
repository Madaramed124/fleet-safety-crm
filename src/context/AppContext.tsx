import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { IncidentRecord, OperationalMonth, KPIData } from "../types";
import logError from '../utils/logger';
import { generateId } from "../utils/helpers";
import { getDataService } from "../services/dataService";

interface AppContextType {
  // Data collections
  months: OperationalMonth[];
  records: IncidentRecord[];
  selectedMonthId: string | null;
  searchQuery: string;
  companyFilter: string | null;
  isLoading: boolean;

  // Modal/view states
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  editingRecordId: string | null;
  deleteConfirmId: string | null;

  // Actions
  addMonth: (monthLabel: string, year: number, month: number) => Promise<void>;
  deleteMonth: (monthId: string) => Promise<void>;
  selectMonth: (monthId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setCompanyFilter: (company: string | null) => void;

  // Record operations
  addRecord: (record: IncidentRecord) => Promise<void>;
  updateRecord: (record: IncidentRecord) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;

  // Modal controls
  openAddModal: () => void;
  closeAddModal: () => void;
  openEditModal: (recordId: string) => void;
  closeEditModal: () => void;
  openDeleteConfirm: (recordId: string) => void;
  closeDeleteConfirm: () => void;

  // KPI calculation
  calculateKPI: () => KPIData;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [months, setMonths] = useState<OperationalMonth[]>([]);
  const [records, setRecords] = useState<IncidentRecord[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const dataService = useMemo(() => getDataService(), []);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      try {
        const [savedMonths, savedRecords] = await Promise.all([
          dataService.fetchMonths(),
          dataService.fetchRecords(),
        ]);

        setMonths(savedMonths);
        setRecords(
          savedRecords.map((record) => ({
            ...record,
            attachments: record.attachments ?? [],
          }))
        );
      } catch (error) {
        logError(error, 'Failed to initialize app data');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [dataService]);

  const addMonth = useCallback(
    async (monthLabel: string, year: number, month: number) => {
      const newMonth: OperationalMonth = {
        id: generateId(),
        monthLabel,
        year,
        month,
        createdAt: new Date().toISOString(),
      };
      setMonths((prev) => [...prev, newMonth]);
      setSelectedMonthId(newMonth.id);

      try {
        await dataService.createMonth(newMonth);
      } catch (error) {
        logError(error, 'Failed to create month');
      }
    },
    [dataService]
  );

  const deleteMonth = useCallback(
    async (monthId: string) => {
      const nextMonths = months.filter((m) => m.id !== monthId);
      const nextRecords = records.filter((r) => r.monthId !== monthId);
      setMonths(nextMonths);
      setRecords(nextRecords);
      setSelectedMonthId(null);

      try {
        await dataService.deleteMonth(monthId);
        await dataService.storeRecords(nextRecords);
      } catch (error) {
        logError(error, 'Failed to delete month');
      }
    },
    [dataService, months, records]
  );

  const selectMonth = useCallback((monthId: string | null) => {
    setSelectedMonthId(monthId);
  }, []);

  const addRecord = useCallback(
    async (record: IncidentRecord) => {
      const recordWithId = { ...record, id: generateId() };
      setRecords((prev) => [...prev, recordWithId]);

      try {
        await dataService.createRecord(recordWithId);
      } catch (error) {
        logError(error, 'Failed to create record');
      }
    },
    [dataService]
  );

  const updateRecord = useCallback(
    async (record: IncidentRecord) => {
      setRecords((prev) => prev.map((r) => (r.id === record.id ? record : r)));

      try {
        await dataService.updateRecord(record);
      } catch (error) {
        logError(error, 'Failed to update record');
      }
    },
    [dataService]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      setRecords((prev) => prev.filter((r) => r.id !== recordId));

      try {
        await dataService.deleteRecord(recordId);
      } catch (error) {
        logError(error, 'Failed to delete record');
      }
    },
    [dataService]
  );

  const calculateKPI = useCallback((): KPIData => {
    const filtered = selectedMonthId
      ? records.filter((r) => r.monthId === selectedMonthId)
      : records;
    const totalAccidents = filtered.filter((r) => r.type === "accident").length;
    const totalInspections = filtered.filter((r) => r.type === "inspection").length;
    // Tickets are now represented as inspections that have an associated ticket
    const totalTickets = filtered.filter(
      (r) => r.type === "inspection" && (r as any).hasAssociatedTicket
    ).length;

    let totalViolations = 0;
    let totalFines = 0;

    filtered.forEach((record) => {
      if (record.type === "inspection" && (record as any).hasAssociatedTicket) {
        const rec = record as any;
        totalViolations += (rec.violations || []).length;
        totalFines += (rec.fines || []).reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
      }
    });

    return {
      totalTickets,
      totalAccidents,
      totalInspections,
      totalViolations,
      totalFines,
    };
  }, [records, selectedMonthId]);

  const value: AppContextType = {
    months,
    records,
    selectedMonthId,
    searchQuery,
    companyFilter,
    isLoading,

    isAddModalOpen,
    isEditModalOpen,
    editingRecordId,
    deleteConfirmId,

    addMonth,
    deleteMonth,
    selectMonth,
    setSearchQuery,
    setCompanyFilter,

    addRecord,
    updateRecord,
    deleteRecord,

    openAddModal: () => setIsAddModalOpen(true),
    closeAddModal: () => setIsAddModalOpen(false),
    openEditModal: (id) => {
      setEditingRecordId(id);
      setIsEditModalOpen(true);
    },
    closeEditModal: () => {
      setIsEditModalOpen(false);
      setEditingRecordId(null);
    },
    openDeleteConfirm: (id) => setDeleteConfirmId(id),
    closeDeleteConfirm: () => setDeleteConfirmId(null),

    calculateKPI,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
