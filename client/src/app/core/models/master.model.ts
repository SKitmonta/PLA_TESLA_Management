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
  /** Tesla API: รายการมาจากตารางอื่น (MS-01 → M_CAMPAIGN_TYPE) — เพิ่ม / แก้ไขไม่ได้ */
  readOnly?: boolean;
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

// ---------- หมวดสินค้า + Tag Filter ของ Content (Tesla: Master ของ v1 · เส้น /marketing-content/master/*)
export type ContentMasterType = 'insurance-types' | 'coverage-types' | 'feature-tags';

export interface ContentMasterItem {
  id: number;
  code: string;
  nameTh: string | null;
  nameEn: string | null;
  displayOrder: number;
}

/** Package ที่ขายในช่องทางหนึ่ง (Tesla: v1 /marketing-content/master/packages?channelCode=) — ใช้ใน Package recommend */
export interface ChannelPackage {
  packageCode: string;
  packageNameTh: string;
  packageNameEn: string | null;
  subProductTypeNameTh: string | null;
  saleStartDate: string | null;
}

// ---------- หัวข้อ Key Features / Key Advantages (Tesla: M_MARKETING_KEY_TOPIC · เส้น v1)
export interface KeyTopic {
  id: number;
  code: string;
  topicType: 'FEATURE' | 'ADVANTAGE';
  systemCode: 'F2F' | 'ONLINE';
  nameTh: string;
  nameEn: string | null;
  /** ADVANTAGE: ข้อความรองของการ์ด (Sub title) */
  descriptionTh: string | null;
  /** FEATURE: ค่าที่แสดงคู่หัวข้อ เช่น "10 ปี" */
  formatTemplate: string | null;
  /** FEATURE: ไอคอน · ADVANTAGE: รูปพื้นการ์ด */
  imageUrl: string | null;
  displayOrder: number;
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
