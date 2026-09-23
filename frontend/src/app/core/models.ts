export type RecordStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
export type DiscountType = 'PERCENT' | 'AMOUNT' | 'NONE';

export const STATUS_OPTIONS: { value: RecordStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'INACTIVE', label: 'Inactive' },
];

interface Timestamps {
  created_at: string;
  updated_at: string;
}

export interface Package extends Timestamps {
  id: number;
  code: string;
  name: string;
  description: string | null;
  price: number;
  status: RecordStatus;
}

export interface Campaign extends Timestamps {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  start_date: string;
  end_date: string;
  status: RecordStatus;
}

export interface Agent extends Timestamps {
  id: number;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: RecordStatus;
  groups: { id: number; name: string }[];
}

export interface AgentGroup extends Timestamps {
  id: number;
  code: string;
  name: string;
  description: string | null;
  status: RecordStatus;
  agent_ids: number[];
}

export interface Combination extends Timestamps {
  id: number;
  name: string;
  package_id: number;
  agent_group_id: number;
  campaign_id: number | null;
  status: RecordStatus;
  note: string | null;
  package_name: string;
  package_price: number;
  agent_group_name: string;
  campaign_name: string | null;
  discount_type: DiscountType | null;
  discount_value: number | null;
  agent_count: number;
}

interface Count {
  total: number;
  active: number;
}

export interface Dashboard {
  counts: Record<'packages' | 'campaigns' | 'agents' | 'groups' | 'combinations', Count>;
  campaignTimeline: {
    id: number;
    code: string;
    name: string;
    start_date: string;
    end_date: string;
    status: RecordStatus;
    phase: 'UPCOMING' | 'RUNNING' | 'ENDED';
    days_left: number;
  }[];
  topGroups: { id: number; name: string; agent_count: number; combination_count: number }[];
  packageUsage: { id: number; name: string; combination_count: number }[];
  recent: {
    id: number;
    name: string;
    status: RecordStatus;
    updated_at: string;
    package_name: string;
    agent_group_name: string;
    campaign_name: string | null;
  }[];
}

/** Price after applying a campaign discount (never below 0). */
export function netPrice(price: number, type?: DiscountType | null, value?: number | null): number {
  const v = value ?? 0;
  if (type === 'PERCENT') return Math.max(0, price * (1 - v / 100));
  if (type === 'AMOUNT') return Math.max(0, price - v);
  return price;
}
