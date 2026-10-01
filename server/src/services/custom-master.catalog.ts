/**
 * แคตตาล็อก Master ที่สร้างเอง MS-01…MS-22 (doc 06 §5.1)
 * หน้าจอ MS-02 สร้างตาราง + ฟอร์มจากรายการนี้อัตโนมัติ
 * เพิ่ม Field: เพิ่มใน fields[] (table: true = แสดงเป็นคอลัมน์ในตาราง)
 * หมายเหตุ: MS-20 Referral Link เป็นข้อมูล Transaction ไม่ใช่ Master ที่ผู้ใช้ตั้งค่า → ไม่อยู่ในหน้านี้ (จัดการในเมนู Seller)
 */

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'boolean';

export interface MasterField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  table?: boolean;
}

export interface MasterType {
  code: string;
  name: string;
  group: 'Campaign' | 'สิทธิประโยชน์' | 'อื่นๆ';
  description: string;
  fields: MasterField[];
  /** คอลัมน์คำนวณ "คงเหลือ = ทั้งหมด − จองแล้ว − ส่งแล้ว" (Stock rule) */
  stock?: boolean;
}

const QTY: MasterField[] = [
  { key: 'total_qty', label: 'จำนวนทั้งหมด', type: 'number', required: true, table: true },
  { key: 'reserved_qty', label: 'จองแล้ว', type: 'number', table: true },
  { key: 'delivered_qty', label: 'ส่งแล้ว', type: 'number' },
];

export const CUSTOM_MASTER_TYPES: MasterType[] = [
  {
    code: 'MS-01', name: 'Campaign Type', group: 'Campaign', description: 'ประเภท Campaign ที่แสดงเป็นการ์ดใน Wizard ขั้นที่ 1',
    fields: [
      { key: 'benefit_kind', label: 'ประเภทสิทธิ์', type: 'select', required: true, table: true, options: ['มูลค่าเงิน', 'สิ่งของ', 'คะแนน', 'ผ่อนชำระ', 'สิทธิ์ลุ้นรางวัล', 'ลิงก์ติดตาม'] },
      { key: 'description', label: 'คำอธิบาย', type: 'textarea' },
    ],
  },
  { code: 'MS-02', name: 'Campaign Objective', group: 'Campaign', description: 'วัตถุประสงค์ของ Campaign (ใช้ใน Overview)', fields: [] },
  {
    code: 'MS-03', name: 'Reward Timing', group: 'Campaign', description: 'จังหวะการให้สิทธิ์',
    fields: [
      { key: 'reference_point', label: 'จุดอ้างอิง', type: 'select', required: true, table: true, options: ['อนุมัติกรมธรรม์', 'พ้น Free look'] },
      { key: 'offset_days', label: 'บวกเพิ่ม (วัน)', type: 'number', table: true },
    ],
  },
  {
    code: 'MS-04', name: 'Clawback Rule', group: 'Campaign', description: 'กติกาเรียกคืนสิทธิ์',
    fields: [
      { key: 'event', label: 'เหตุการณ์', type: 'select', required: true, table: true, options: ['ยกเลิกใน Free look', 'เวนคืน', 'ขาดอายุ'] },
      { key: 'period_months', label: 'ภายใน (เดือน)', type: 'number', table: true },
      { key: 'method', label: 'วิธีเรียกคืน', type: 'select', table: true, options: ['เรียกคืน', 'หักจากเงินคืน'] },
    ],
  },
  {
    code: 'MS-05', name: 'T&C Template', group: 'Campaign', description: 'แม่แบบข้อกำหนดและเงื่อนไข (Compliance อนุมัติ)',
    fields: [
      { key: 'campaign_type', label: 'ประเภท Campaign', type: 'text', table: true },
      { key: 'version', label: 'Version', type: 'text', table: true },
      { key: 'effective_date', label: 'วันมีผล', type: 'date', table: true },
      { key: 'content_th', label: 'เนื้อหา (TH)', type: 'textarea', required: true },
      { key: 'content_en', label: 'เนื้อหา (EN)', type: 'textarea' },
    ],
  },
  {
    code: 'MS-07', name: 'Eligibility Attribute', group: 'Campaign', description: 'เงื่อนไขที่เลือกได้ใน Rule builder',
    fields: [
      { key: 'data_type', label: 'ชนิดข้อมูล', type: 'select', required: true, table: true, options: ['ข้อความ', 'ตัวเลข', 'วันที่', 'รหัส (Master)'] },
      { key: 'operators', label: 'Operator ที่ใช้ได้', type: 'text', table: true },
      { key: 'ref_master', label: 'Master อ้างอิง', type: 'text' },
    ],
  },
  { code: 'MS-08', name: 'Customer Type', group: 'Campaign', description: 'ประเภทลูกค้า', fields: [{ key: 'definition', label: 'นิยาม', type: 'textarea', table: true }] },
  {
    code: 'MS-22', name: 'Grant Status', group: 'Campaign', description: 'สถานะการให้สิทธิ์',
    fields: [
      { key: 'budget_effect', label: 'ผลต่องบ', type: 'select', required: true, table: true, options: ['จอง', 'ตัด', 'คืน', 'ไม่มีผล'] },
      { key: 'is_terminal', label: 'สถานะสุดท้าย', type: 'boolean', table: true },
    ],
  },
  {
    code: 'MS-09', name: 'Partner / Vendor', group: 'สิทธิประโยชน์', description: 'คู่ค้า / ผู้ให้บริการ',
    fields: [
      { key: 'partner_type', label: 'ประเภท', type: 'select', required: true, table: true, options: ['ร้านค้า', 'ธนาคาร', 'ผู้ส่งของ', 'โปรแกรมคะแนน'] },
      { key: 'contact', label: 'ผู้ติดต่อ', type: 'text', table: true },
      { key: 'contract_start', label: 'สัญญาเริ่ม', type: 'date' },
      { key: 'contract_end', label: 'สัญญาสิ้นสุด', type: 'date', table: true },
    ],
  },
  {
    code: 'MS-10', name: 'Voucher', group: 'สิทธิประโยชน์', description: 'คงเหลือ = ทั้งหมด − จองแล้ว − ส่งแล้ว · จองเมื่อ Campaign Approved', stock: true,
    fields: [
      { key: 'partner', label: 'Partner (MS-09)', type: 'text', required: true, table: true },
      { key: 'voucher_type', label: 'ประเภท', type: 'select', required: true, table: true, options: ['e-Voucher', 'กระดาษ'] },
      { key: 'face_value', label: 'มูลค่าต่อใบ (บาท)', type: 'number', required: true, table: true },
      { key: 'unit_cost', label: 'ต้นทุนต่อใบ (บาท)', type: 'number' },
      ...QTY,
      { key: 'expiry_date', label: 'วันหมดอายุ', type: 'date', required: true, table: true },
      { key: 'terms', label: 'เงื่อนไขการใช้', type: 'textarea' },
    ],
  },
  {
    code: 'MS-12', name: 'Voucher Code Pool', group: 'สิทธิประโยชน์', description: 'รหัสคูปองของแต่ละ Voucher',
    fields: [
      { key: 'voucher_code', label: 'Voucher (MS-10)', type: 'text', required: true, table: true },
      { key: 'code_status', label: 'สถานะรหัส', type: 'select', table: true, options: ['ว่าง', 'จอง', 'ส่งแล้ว', 'ใช้แล้ว', 'หมดอายุ'] },
      { key: 'policy_no', label: 'เลขกรมธรรม์', type: 'text', table: true },
    ],
  },
  {
    code: 'MS-16', name: 'Gift Item', group: 'สิทธิประโยชน์', description: 'ของแถม · คงเหลือ = ทั้งหมด − จองแล้ว − ส่งแล้ว', stock: true,
    fields: [
      { key: 'sku', label: 'SKU', type: 'text', table: true },
      { key: 'partner', label: 'Partner (MS-09)', type: 'text' },
      { key: 'unit_value', label: 'มูลค่าต่อชิ้น (บาท)', type: 'number', required: true, table: true },
      { key: 'unit_cost', label: 'ต้นทุนต่อชิ้น (บาท)', type: 'number' },
      ...QTY,
      { key: 'weight', label: 'น้ำหนัก / ขนาด', type: 'text' },
    ],
  },
  { code: 'MS-17', name: 'Bank / Card Issuer', group: 'สิทธิประโยชน์', description: 'ธนาคาร / ผู้ออกบัตร (ผ่อนชำระ)', fields: [{ key: 'card_types', label: 'ประเภทบัตร', type: 'text', table: true }] },
  { code: 'MS-18', name: 'Installment Term', group: 'สิทธิประโยชน์', description: 'จำนวนงวดผ่อน', fields: [{ key: 'months', label: 'จำนวนงวด (เดือน)', type: 'number', required: true, table: true }] },
  {
    code: 'MS-19', name: 'Points Program', group: 'สิทธิประโยชน์', description: 'โปรแกรมคะแนน',
    fields: [
      { key: 'partner', label: 'Partner', type: 'text', table: true },
      { key: 'baht_per_point', label: '1 คะแนน = กี่บาท', type: 'number', table: true },
      { key: 'expiry_months', label: 'อายุคะแนน (เดือน)', type: 'number', table: true },
    ],
  },
  {
    code: 'MS-21', name: 'Prize', group: 'สิทธิประโยชน์', description: 'รางวัล (Lucky draw)',
    fields: [
      { key: 'value', label: 'มูลค่า (บาท)', type: 'number', required: true, table: true },
      { key: 'quantity', label: 'จำนวน', type: 'number', table: true },
      { key: 'partner', label: 'Partner', type: 'text' },
    ],
  },
  {
    code: 'MS-06', name: 'Cost Center / GL', group: 'อื่นๆ', description: 'ส่งต่อฝ่ายบัญชีบันทึกค่าใช้จ่ายส่งเสริมการขาย',
    fields: [
      { key: 'cost_center', label: 'Cost center', type: 'text', required: true, table: true },
      { key: 'gl_account', label: 'GL account', type: 'text', required: true, table: true },
      { key: 'campaign_type', label: 'ประเภท Campaign', type: 'text', table: true },
    ],
  },
  { code: 'MS-11', name: 'Delivery Channel', group: 'อื่นๆ', description: 'ช่องทางส่งมอบ / ประกาศผล', fields: [{ key: 'usage', label: 'ใช้กับ', type: 'select', table: true, options: ['ส่งมอบ', 'ประกาศผล', 'ทั้งสองแบบ'] }] },
  { code: 'MS-13', name: 'Premium Basis', group: 'อื่นๆ', description: 'ฐานเบี้ยที่ใช้คำนวณส่วนลด / เงินคืน', fields: [] },
  {
    code: 'MS-14', name: 'Rounding Rule', group: 'อื่นๆ', description: 'วิธีปัดเศษ',
    fields: [
      { key: 'method', label: 'วิธีปัด', type: 'select', required: true, table: true, options: ['ปัดลง', 'ปัดขึ้น', 'ปัดตามหลักคณิตศาสตร์'] },
      { key: 'decimals', label: 'ทศนิยม (ตำแหน่ง)', type: 'number', table: true },
    ],
  },
  { code: 'MS-15', name: 'Payout Method', group: 'อื่นๆ', description: 'ช่องทางจ่ายเงินคืน', fields: [{ key: 'required_info', label: 'ข้อมูลที่ต้องใช้', type: 'text', table: true }] },
];

export function findMasterType(code: string): MasterType | undefined {
  return CUSTOM_MASTER_TYPES.find((t) => t.code === code);
}
