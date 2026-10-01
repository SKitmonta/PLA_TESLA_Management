/**
 * Overview (doc 08) — ตรงกับ server/src/services/overview.service.ts
 */
export type Metric = 'FYP' | 'APE' | 'POLICY';
export type TargetLevel = 'CHANNEL' | 'GROUP' | 'SELLER';
export type Section = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface DashboardQuery {
  from?: string;
  to?: string;
  channel?: string;
  package?: string;
  productType?: string;
  campaignType?: string;
  metric?: Metric;
}

export interface Kpi {
  sales: number;
  target: number | null;
  targetPct: number | null;
  approved: number;
  applications: number;
  eligible: number;
  approvalRate: number | null;
  budget: { total: number; used: number; reserved: number; remaining: number };
  costPerPolicy: number | null;
  salesPerBudget: number | null;
}

export interface Trend {
  months: string[];
  actual: number[];
  target: (number | null)[];
  byChannel: { channelCode: string; values: number[] }[];
}

export interface ChannelSales {
  channelCode: string;
  channelName: string | null;
  value: number;
  policies: number;
}

export interface PackagePerf {
  packageCode: string;
  nameTh: string;
  channelCode: string;
  target: number | null;
  actual: number;
  lifetime: number | null;
  targetPct: number | null;
  policies: number;
  activeCampaigns: number;
}

export interface CampaignPerf {
  campaignCode: string;
  nameTh: string;
  typeCode: string;
  typeName: string | null;
  displayStatus: string;
  endDate: string | null;
  stats: Record<'RESERVED' | 'CONFIRMED' | 'FULFILLED' | 'RELEASED' | 'CLAWED_BACK' | 'NOT_GRANTED', number>;
  budget: number | null;
  budgetUsed: number;
  budgetPct: number | null;
  quotaTotal: number | null;
  quotaUsed: number;
  quotaPct: number | null;
  referral: { clicks: number; applications: number; approved: number } | null;
}

export interface TopSeller {
  rank: number;
  sellerCode: string;
  sellerName: string;
  sellerType: string | null;
  groupName: string | null;
  groupColor: string | null;
  value: number;
  policies: number;
}

export interface GroupPerf {
  groupId: number;
  groupName: string;
  color: string;
  workspace: string;
  members: number;
  target: number | null;
  actual: number;
  targetPct: number | null;
  policies: number;
  referral: { clicks: number; applications: number; approved: number } | null;
}

export interface Task {
  key: string;
  label: string;
  count: number;
  link: string;
  query?: Record<string, string>;
  detail?: string;
}

export interface Activity {
  at: string;
  kind: string;
  code: string;
  action: string;
  detail: string | null;
  actor: string;
}

export interface DashboardData {
  updatedAt: string;
  metric: Metric;
  from: string;
  to: string;
  sections: Section[];
  kpi?: Kpi;
  trend?: Trend;
  byChannel?: ChannelSales[];
  packages?: PackagePerf[];
  campaigns?: CampaignPerf[];
  sellers?: { top: TopSeller[]; groups: GroupPerf[] };
  tasks?: Task[];
  activity?: Activity[];
}

export interface OverviewOptions {
  packages: { packageCode: string; nameTh: string; saleTarget: number | null; channels: string[]; productType: string | null }[];
  channels: { code: string; name: string }[];
  productTypes: { code: string; name: string }[];
  campaignTypes: { code: string; name: string }[];
}

export interface TargetRow {
  refId: string;
  name: string;
  sub?: string;
  values: Record<string, number | null>;
}

export interface TargetSheet {
  level: TargetLevel;
  metric: Metric;
  packageCode: string;
  packageName: string;
  channelCode: string;
  saleTarget: number | null;
  periods: string[];
  rows: TargetRow[];
  parentTarget: number | null;
  warnings: string[];
  saved?: number;
}
