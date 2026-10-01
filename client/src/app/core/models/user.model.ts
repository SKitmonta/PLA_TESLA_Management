/** Role ตาม doc 09 §3 — 1 ผู้ใช้มีได้หลาย Role */
export type RoleCode =
  | 'SYS_ADMIN'
  | 'CONTENT_MAKER'
  | 'CONTENT_APPROVER'
  | 'CAMPAIGN_MAKER'
  | 'CAMPAIGN_APPROVER'
  | 'PEOPLE_ADMIN'
  | 'EXECUTIVE';

export const ROLE_LABEL: Record<RoleCode, string> = {
  SYS_ADMIN: 'System Admin',
  CONTENT_MAKER: 'Content Maker',
  CONTENT_APPROVER: 'Content Approver',
  CAMPAIGN_MAKER: 'Campaign Maker',
  CAMPAIGN_APPROVER: 'Campaign Approver',
  PEOPLE_ADMIN: 'Seller Admin',
  EXECUTIVE: 'Executive',
};

export const ROLE_ORDER: RoleCode[] = [
  'SYS_ADMIN',
  'CONTENT_MAKER',
  'CONTENT_APPROVER',
  'CAMPAIGN_MAKER',
  'CAMPAIGN_APPROVER',
  'PEOPLE_ADMIN',
  'EXECUTIVE',
];

export interface AppUser {
  userId: string;
  userName: string;
  position: string;
  roles: RoleCode[];
}

export interface HealthStatus {
  status: 'ok';
  version: string;
  sprint: number;
  node: string;
  database: string;
  users: number;
  time: string;
}
