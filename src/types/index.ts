// Base types for all incident records
export interface BaseRecord {
  id: string;
  monthId: string;
  date: string;
  caseCode: string;
  driverName: string;
  carrierName: string;
  status: "Open" | "Pending" | "Closed";
  notes: string;
  attachments: Attachment[];
  type: "accident" | "inspection" | "ticket";
}

// Sub-entity: Individual violation
export interface Violation {
  id: string;
  code: string;
  description: string;
  severity: "High" | "Medium" | "Low";
}

// Sub-entity: Individual fine/charge
export interface Fine {
  id: string;
  description: string;
  amount: number;
}

// Sub-entity: File attachment
export interface Attachment {
  id: string;
  type:
    | "Inspection Report"
    | "Proof of Repair"
    | "Warning Letter"
    | "Pictures"
    | "Police Report"
    | "Citation"
    | "Other";
  name: string;
  url: string;
}

// Sub-entity: Individual injury
export interface Injury {
  id: string;
  description: string;
  severity: "Minor" | "Major" | "Critical";
}

// Note: ticket data is now modeled as part of an Inspection when applicable

// Specialized Accident record
export interface Accident extends BaseRecord {
  type: "accident";
  severity: "Minor" | "Major" | "Critical";
  isFmcsaRecordable: boolean;
  vehicleTowed: boolean;
  injuries: Injury[];
}

export interface Inspection extends BaseRecord {
  type: "inspection";
  severity: "Minor" | "Major" | "Critical";
  receivedCitation: boolean;
  citationNumber: string;
  hasAssociatedTicket?: boolean;
  csaSeverity?: "High" | "Medium" | "Low";
  hasAttorney?: boolean;
  isRecurring?: boolean;
  violations?: Violation[];
  fines?: Fine[];
  csaImpactScore?: string;
  companyImpactLevel?: "Low" | "Medium" | "High";
  companyImpactNotes?: string;
  referredToLawyers?: "Yes" | "No";
  totalCost?: number;
  legalNotes?: string;
  resolutionNotes?: string;
}

export interface Ticket extends BaseRecord {
  type: "ticket";
  citationNumber: string;
  csaSeverity: "High" | "Medium" | "Low";
  hasAttorney: boolean;
  isRecurring: boolean;
  violations?: Violation[];
  fines?: Fine[];
  csaImpactScore?: string;
  companyImpactLevel?: "Low" | "Medium" | "High";
  companyImpactNotes?: string;
  referredToLawyers?: "Yes" | "No";
  totalCost?: number;
  legalNotes?: string;
  resolutionNotes?: string;
}

// Union type for polymorphic records
export type IncidentRecord = Accident | Inspection | Ticket;

// Operational month tracking
export interface OperationalMonth {
  id: string;
  monthLabel: string; // e.g., "January 2024"
  year: number;
  month: number;
  createdAt: string;
}

// KPI aggregated data
export interface KPIData {
  totalTickets: number;
  totalAccidents: number;
  totalInspections: number;
  totalViolations: number;
  totalFines: number;
}
