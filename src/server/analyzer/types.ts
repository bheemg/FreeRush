import type { AuditCategory } from "./audit";

// The structured payload stored on Report.data and rendered by the dashboard
// pages. Mirrors the original prototype's report sections so nothing is lost.
export interface BusinessProfile {
  name: string;
  type: string;
  services: string[];
  location: string | null;
  isLocal: boolean;
  trustSignals: string[];
  phone: string | null;
  address: string | null;
}

export interface KeywordRow {
  keyword: string;
  intent: string;
  priority: "now" | "soon" | "later";
  difficulty: "easy" | "medium" | "hard";
  rationale: string;
}

export interface PriorityItem {
  title: string;
  why: string;
}

export interface ReportData {
  grounded: boolean;
  overallScore: number;
  grade: string;
  aiReady: boolean;
  perf: { score: number; fetched: boolean };
  audit: AuditCategory[];
  business: BusinessProfile;
  executiveSummary: string;
  priorities: PriorityItem[];
  keywords: KeywordRow[];
}
