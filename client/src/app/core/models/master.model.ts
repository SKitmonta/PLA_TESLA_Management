/** Type ข้อมูลของเมนู Master setup (ตรงกับ API /api/master) */

export type TemplateCode = 'OL_OB' | 'OL_PA' | 'AGENT';
export type PackageDisplayStatus = 'APPROVED' | 'DRAFTED' | 'INACTIVE';

export interface PackageChannel {
  code: string;
  name: string | null;
  template: TemplateCode | null;
}

export interface PackageRow {
  packageCode: string;
  nameTh: string;
  nameEn: string | null;
  statusCode: 'APP' | 'DRF';
  isActive: boolean;
  displayStatus: PackageDisplayStatus;
  saleStartDate: string | null;
  saleEndDate: string | null;
  sellerSelectionMode: 'ALL' | 'CUSTOM';
  sellerCount: number;
  productTypeCode: string | null;
  productTypeName: string | null;
  subProductTypeCode: string | null;
  subProductTypeName: string | null;
  channels: PackageChannel[];
  saleTarget: number | null;
  isMock: boolean;
}

export interface PackageSummary {
  total: number;
  approved: number;
  drafted: number;
  inactive: number;
}

export interface PackageListResponse {
  items: PackageRow[];
  total: number;
  page: number;
  pageSize: number;
  summary: PackageSummary;
  lastSync: string | null;
}

export interface PackageListQuery {
  code?: string;
  name?: string;
  channel?: string;
  productType?: string;
  subProductType?: string;
  status?: PackageDisplayStatus | '';
  sort?: string;
  dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CodeName {
  code: string;
  name: string | null;
}

export interface PackagePlan {
  planCode: string;
  planName: string | null;
  planRole: string;
  productTypeCode: string | null;
  subProductTypeCode: string | null;
  minSumInsured: number | null;
  maxSumInsured: number | null;
  taxExemptType: string | null;
  minIssueAge: string;
  maxIssueAge: string;
  underwriteType: string | null;
}

export interface PackageDetail extends PackageRow {
  packageType: string | null;
  description: string | null;
  freeLookPeriod: number | null;
  syncedAt: string | null;
  plans: PackagePlan[];
  sellers: { channelCode: string; sellerCode: string; sellerName: string | null }[];
  paymentModes: CodeName[];
  paymentMethods: CodeName[];
  genders: CodeName[];
  occupationClasses: CodeName[];
  derived: {
    productTypeName: string | null;
    subProductTypeName: string | null;
    underwriteName: string | null;
    underwriteDisplay: string | null;
    taxDisplay: string;
    riderDisplay: string;
    ageDisplay: string;
  };
}

// ---------- MS-02 Master ที่สร้างเอง
export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'boolean';

export interface MasterField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  table?: boolean;
}

export interface CustomMasterType {
  code: string;
  name: string;
  group: string;
  description: string;
  fields: MasterField[];
  stock?: boolean;
  count: number;
}

export interface CustomMasterItem {
  itemCode: string;
  nameTh: string;
  nameEn: string | null;
  sortOrder: number;
  isActive: boolean;
  attributes: Record<string, unknown>;
  updatedBy: string | null;
  updatedAt: string | null;
}

// ---------- MS-03 Mapping
export interface UnderwriteMapping {
  code: string;
  sourceName: string | null;
  displayText: string;
}

export interface PaymentMethodMapping {
  code: string;
  sourceName: string | null;
  isShown: boolean;
  displayText: string;
  icon: string | null;
}

export interface DisplayMappingResponse {
  channel: string;
  channels: CodeName[];
  underwrite: UnderwriteMapping[];
  paymentMethods: PaymentMethodMapping[];
  updatedBy: string | null;
  updatedAt: string | null;
}

// ---------- MS-04 Master ที่ Sync
export interface SyncedType {
  type: string;
  label: string;
  count: number;
}

export interface SyncedRow {
  code: string;
  nameTh: string | null;
  nameEn: string | null;
  parentCode: string | null;
  parentName: string | null;
  isActive: boolean;
  dataStatus: 'OK' | 'INCOMPLETE';
  templates: TemplateCode[];
}
