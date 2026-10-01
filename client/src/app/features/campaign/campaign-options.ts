/**
 * ค่าคงที่ของเมนู Campaign (doc 06) — ใช้ร่วมกันระหว่าง Campaign list และ Add Campaign (Wizard)
 *   TYPE_ICON / TYPE_ABBR        ไอคอนและรหัสย่อของ 9 ประเภท (MS-01)
 *   BENEFIT_FIELDS               Field ของขั้น 3 สิทธิประโยชน์ แยกตามประเภท (doc 06 §4) — หน้าจอสร้างจากตารางนี้
 *   RULE_ATTRIBUTES / OPERATORS  Rule builder ขั้น 4 (CP-ELG-01…10)
 *   missing()                    ตรวจ Field บังคับรายขั้น (ตรงกับ server/src/services/campaign.service.ts)
 * เพิ่ม / แก้ Field ของประเภทใด → แก้ที่ BENEFIT_FIELDS และ BENEFIT_REQUIRED ฝั่ง Server
 */
import { CampaignData, CampaignRule, CampaignTypeCode } from '../../core/models/campaign.model';

/** ไอคอน PrimeIcons ของแต่ละประเภท (การ์ดขั้น 1 / ป้ายในตาราง) */
export const TYPE_ICON: Record<string, string> = {
  VOUCHER: 'pi pi-ticket',
  DISCOUNT: 'pi pi-percentage',
  CASHBACK: 'pi pi-wallet',
  FREE_GIFT: 'pi pi-gift',
  INSTALLMENT: 'pi pi-credit-card',
  REWARD_POINTS: 'pi pi-star',
  REFERRAL: 'pi pi-link',
  BUNDLE: 'pi pi-clone',
  LUCKY_DRAW: 'pi pi-trophy',
};

export const TYPE_ABBR: Record<string, string> = {
  VOUCHER: 'VOU',
  DISCOUNT: 'DIS',
  CASHBACK: 'CSB',
  FREE_GIFT: 'GFT',
  INSTALLMENT: 'INS',
  REWARD_POINTS: 'PTS',
  REFERRAL: 'REF',
  BUNDLE: 'BND',
  LUCKY_DRAW: 'LKD',
};

/** เฟสที่เสนอใน doc 06 §6 (แสดงเป็นป้ายบนการ์ดขั้น 1) */
export const TYPE_PHASE: Record<string, number> = {
  VOUCHER: 1,
  DISCOUNT: 1,
  CASHBACK: 1,
  REFERRAL: 1,
  FREE_GIFT: 2,
  INSTALLMENT: 2,
  BUNDLE: 2,
  REWARD_POINTS: 3,
  LUCKY_DRAW: 3,
};

// ---------------------------------------------------------------- แหล่งตัวเลือก
export interface Opt {
  value: unknown;
  label: string;
}

/**
 * แหล่งตัวเลือกของ Dropdown
 *   master   = Master ที่สร้างเอง (MS-xx) · synced = Master ที่ Sync (CHANNEL, PAYMENT_MODE, …)
 *   packages = Package ที่เลือกได้ในขั้น 2 · contents = Content ที่ Approved ของ Package ที่เลือก
 *   usage    = กรอง MS-11 ตามการใช้งาน (ส่งมอบ / ประกาศผล)
 */
export interface OptionSource {
  master?: string;
  synced?: string;
  packages?: boolean;
  contents?: boolean;
  usage?: 'ส่งมอบ' | 'ประกาศผล';
  codes?: string[];
  list?: Opt[];
}

const o = (...pairs: [string, string][]): OptionSource => ({ list: pairs.map(([value, label]) => ({ value, label })) });

// ---------------------------------------------------------------- ขั้น 3 สิทธิประโยชน์
export type FieldKind = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'textarea' | 'toggle' | 'table' | 'upload';

export interface TableColumn {
  key: string;
  label: string;
  kind: 'text' | 'number' | 'select';
  source?: OptionSource;
  decimals?: number;
}

export interface BenefitField {
  key: string;
  label: string;
  kind: FieldKind;
  id?: string;
  required?: boolean;
  source?: OptionSource;
  /** แสดงเมื่อเงื่อนไขเป็นจริง (ค่าอื่นใน benefit) */
  showIf?: (b: Record<string, unknown>) => boolean;
  decimals?: number;
  suffix?: string;
  min?: number;
  hint?: string;
  wide?: boolean;
  columns?: TableColumn[];
  accept?: string;
}

const TIER_QTY: TableColumn[] = [
  { key: 'from', label: 'เบี้ยตั้งแต่ (บาท)', kind: 'number' },
  { key: 'to', label: 'เบี้ยถึง (บาท)', kind: 'number' },
  { key: 'qty', label: 'จำนวนใบ', kind: 'number' },
];
const TIER_VALUE: TableColumn[] = [
  { key: 'from', label: 'เบี้ยตั้งแต่ (บาท)', kind: 'number' },
  { key: 'to', label: 'เบี้ยถึง (บาท)', kind: 'number' },
  { key: 'value', label: '% หรือ บาท', kind: 'number', decimals: 2 },
];

export const BENEFIT_FIELDS: Record<CampaignTypeCode, BenefitField[]> = {
  // 4.1 Voucher
  VOUCHER: [
    { id: 'CP-VOU-01', key: 'voucherCode', label: 'Voucher ที่ให้', kind: 'select', required: true, source: { master: 'MS-10' }, wide: true },
    { id: 'CP-VOU-02', key: 'mode', label: 'รูปแบบการให้', kind: 'select', required: true, source: o(['FIXED', 'จำนวนคงที่ต่อกรมธรรม์ (Fixed)'], ['TIER', 'ตาม Tier เบี้ย']) },
    { id: 'CP-VOU-03', key: 'perPolicy', label: 'จำนวนใบต่อกรมธรรม์', kind: 'number', required: true, min: 1, showIf: (b) => b['mode'] !== 'TIER' },
    { id: 'CP-VOU-04', key: 'tiers', label: 'ตาราง Tier', kind: 'table', required: true, columns: TIER_QTY, showIf: (b) => b['mode'] === 'TIER', hint: 'ช่วงเบี้ยห้ามทับซ้อน / ขาดช่วง' },
    { id: 'CP-VOU-05', key: 'allocated', label: 'จำนวนที่จัดสรรให้ Campaign', kind: 'number', required: true, min: 1, hint: 'ต้องไม่เกิน Stock คงเหลือของ Voucher · ระบบกันสต็อกเมื่อ Approved' },
    { id: 'CP-VOU-06', key: 'deliveryChannel', label: 'ช่องทางส่งมอบ', kind: 'select', required: true, source: { master: 'MS-11', usage: 'ส่งมอบ' } },
    { id: 'CP-VOU-07', key: 'validDays', label: 'อายุการใช้งานหลังได้รับ', kind: 'number', suffix: ' วัน', min: 1 },
    { id: 'CP-VOU-08', key: 'codeSource', label: 'แหล่งรหัสคูปอง', kind: 'select', required: true, source: o(['UPLOAD', 'Upload Code pool'], ['SYSTEM', 'ระบบสร้างเอง'], ['PARTNER_API', 'Partner API']) },
  ],
  // 4.2 Discount
  DISCOUNT: [
    { id: 'CP-DIS-01', key: 'discountType', label: 'รูปแบบส่วนลด', kind: 'select', required: true, source: o(['PERCENT', '% ของเบี้ย'], ['AMOUNT', 'จำนวนเงิน (บาท)']) },
    { id: 'CP-DIS-02', key: 'value', label: 'มูลค่าส่วนลด', kind: 'number', required: true, decimals: 2, min: 0, hint: '% ต้องไม่เกิน 100 · บาทต้องไม่เกินเบี้ย' },
    { id: 'CP-DIS-03', key: 'basis', label: 'ฐานที่คำนวณ', kind: 'select', required: true, source: { master: 'MS-13' } },
    { id: 'CP-DIS-04', key: 'maxPerPolicy', label: 'ส่วนลดสูงสุดต่อกรมธรรม์', kind: 'number', suffix: ' บาท', decimals: 2, min: 0 },
    { id: 'CP-DIS-06', key: 'rounding', label: 'การปัดเศษ', kind: 'select', required: true, source: { master: 'MS-14' } },
    { id: 'CP-DIS-05', key: 'tiers', label: 'ตาราง Tier (ใช้แทนมูลค่าคงที่ได้)', kind: 'table', columns: TIER_VALUE, wide: true },
  ],
  // 4.3 Cashback
  CASHBACK: [
    { id: 'CP-CSB-01', key: 'cashbackType', label: 'รูปแบบเงินคืน', kind: 'select', required: true, source: o(['PERCENT', '% ของเบี้ย'], ['AMOUNT', 'จำนวนเงิน (บาท)'], ['TIER', 'ตาม Tier เบี้ย']) },
    { id: 'CP-CSB-02', key: 'value', label: 'มูลค่า', kind: 'number', required: true, decimals: 2, min: 0, showIf: (b) => b['cashbackType'] !== 'TIER' },
    { id: 'CP-CSB-05', key: 'tiers', label: 'ตาราง Tier', kind: 'table', required: true, columns: TIER_VALUE, showIf: (b) => b['cashbackType'] === 'TIER', hint: 'ตัวอย่าง: เบี้ย ≥ 30,000 → 5%', wide: true },
    { id: 'CP-CSB-03', key: 'basis', label: 'ฐานคำนวณ', kind: 'select', required: true, source: { master: 'MS-13' } },
    { id: 'CP-CSB-04', key: 'maxPerPolicy', label: 'เงินคืนสูงสุดต่อกรมธรรม์', kind: 'number', suffix: ' บาท', decimals: 2, min: 0 },
    { id: 'CP-CSB-06', key: 'payoutMethod', label: 'ช่องทางจ่ายเงินคืน', kind: 'select', required: true, source: { master: 'MS-15' } },
    { id: 'CP-CSB-07', key: 'payoutTiming', label: 'กำหนดจ่าย', kind: 'select', required: true, source: { master: 'MS-03' } },
    { id: 'CP-CSB-08', key: 'recipient', label: 'ผู้รับเงินคืน', kind: 'select', required: true, source: o(['PAYER', 'ผู้ชำระเบี้ย'], ['INSURED', 'ผู้เอาประกันภัย']) },
  ],
  // 4.4 Free gift
  FREE_GIFT: [
    { id: 'CP-GFT-01', key: 'giftCode', label: 'ของแถม', kind: 'select', required: true, source: { master: 'MS-16' }, wide: true },
    { id: 'CP-GFT-02', key: 'perPolicy', label: 'จำนวนชิ้นต่อกรมธรรม์', kind: 'number', required: true, min: 1 },
    { id: 'CP-GFT-03', key: 'allocated', label: 'จำนวนที่จัดสรรให้ Campaign', kind: 'number', required: true, min: 1, hint: 'ต้องไม่เกิน Stock คงเหลือ' },
    { id: 'CP-GFT-05', key: 'deliveryMethod', label: 'วิธีส่งมอบ', kind: 'select', required: true, source: { master: 'MS-11', usage: 'ส่งมอบ' } },
    { id: 'CP-GFT-06', key: 'leadDays', label: 'ระยะเวลาจัดส่ง', kind: 'number', suffix: ' วันทำการ', min: 1 },
    { id: 'CP-GFT-04', key: 'allowChoice', label: 'ให้เลือกของแถมได้ (1 จาก N)', kind: 'toggle' },
    { key: 'choices', label: 'ของแถมที่ให้เลือก', kind: 'multiselect', source: { master: 'MS-16' }, showIf: (b) => !!b['allowChoice'], wide: true },
  ],
  // 4.5 Installment
  INSTALLMENT: [
    { id: 'CP-INS-01', key: 'banks', label: 'ธนาคาร / ผู้ออกบัตร', kind: 'multiselect', required: true, source: { master: 'MS-17' } },
    { id: 'CP-INS-02', key: 'terms', label: 'จำนวนงวด', kind: 'multiselect', required: true, source: { master: 'MS-18' } },
    { id: 'CP-INS-03', key: 'interestRate', label: 'อัตราดอกเบี้ย (% ต่อเดือน)', kind: 'number', required: true, decimals: 2, min: 0, hint: '0 = ผ่อน 0%' },
    { id: 'CP-INS-04', key: 'interestBearer', label: 'ผู้รับภาระดอกเบี้ย / ค่าธรรมเนียม', kind: 'select', required: true, source: o(['COMPANY', 'บริษัท'], ['CUSTOMER', 'ลูกค้า']) },
    { id: 'CP-INS-06', key: 'paymentMethods', label: 'ช่องทางชำระที่ใช้ได้', kind: 'multiselect', required: true, source: { synced: 'PAYMENT_METHOD', codes: ['PMT02', 'PMT06'] }, hint: 'บัตรเครดิต / ผ่อนชำระ และต้องมีใน Package', wide: true },
    {
      id: 'CP-INS-05', key: 'minPremiums', label: 'เบี้ยขั้นต่ำต่อจำนวนงวด', kind: 'table', required: true, wide: true, hint: 'เช่น 10 งวด ≥ 10,000 บาท',
      columns: [
        { key: 'term', label: 'จำนวนงวด', kind: 'select', source: { master: 'MS-18' } },
        { key: 'minPremium', label: 'เบี้ยขั้นต่ำ (บาท)', kind: 'number' },
      ],
    },
  ],
  // 4.6 Reward points
  REWARD_POINTS: [
    { id: 'CP-PTS-01', key: 'program', label: 'โปรแกรมคะแนน', kind: 'select', required: true, source: { master: 'MS-19' }, wide: true },
    { id: 'CP-PTS-02', key: 'points', label: 'ได้คะแนน (X คะแนน)', kind: 'number', required: true, min: 1 },
    { key: 'perBaht', label: 'ต่อเบี้ย (Y บาท)', kind: 'number', required: true, min: 1 },
    { id: 'CP-PTS-03', key: 'bonusPoints', label: 'คะแนนโบนัสคงที่', kind: 'number', min: 0 },
    { id: 'CP-PTS-04', key: 'multiplier', label: 'ตัวคูณ (Multiplier)', kind: 'number', decimals: 2, min: 1, hint: 'เช่น 2 เท่าช่วง Campaign' },
    { id: 'CP-PTS-05', key: 'maxPoints', label: 'คะแนนสูงสุดต่อกรมธรรม์', kind: 'number', min: 0 },
    { id: 'CP-PTS-06', key: 'expiryMonths', label: 'อายุคะแนน', kind: 'number', suffix: ' เดือน', min: 1, hint: 'ไม่กรอก = ใช้ค่าจากโปรแกรมคะแนน' },
  ],
  // 4.7 Referral — URL สำหรับนำไปขาย (ไม่มีสิทธิ์พิเศษ — CC-10)
  REFERRAL: [
    { id: 'CP-REF-01', key: 'landingContent', label: 'หน้าปลายทางของลิงก์', kind: 'select', required: true, source: { contents: true }, wide: true, hint: 'Content ที่ Approved ของ Package ที่เลือกในขั้น 2' },
    { id: 'CP-REF-04', key: 'attributionDays', label: 'ช่วงนับผลหลังคลิก', kind: 'number', required: true, suffix: ' วัน', min: 1, hint: 'กติกา Last click · ค่าเริ่มต้น 30 วัน' },
    { id: 'CP-REF-05', key: 'qrCode', label: 'สร้าง QR Code ให้ผู้ขายดาวน์โหลด', kind: 'toggle' },
    { id: 'CP-REF-06', key: 'utmSource', label: 'UTM source', kind: 'text' },
    { key: 'utmMedium', label: 'UTM medium', kind: 'text' },
    { id: 'CP-REF-07', key: 'shareText', label: 'ข้อความสำหรับแชร์ (≤ 300 ตัวอักษร)', kind: 'textarea', wide: true },
  ],
  // 4.8 Bundle discount
  BUNDLE: [
    { id: 'CP-BND-01', key: 'bundlePackages', label: 'Package ในชุด (2 รายการขึ้นไป)', kind: 'multiselect', required: true, source: { packages: true }, wide: true },
    { id: 'CP-BND-02', key: 'purchaseCondition', label: 'เงื่อนไขการซื้อ', kind: 'select', required: true, source: o(['SAME_APP', 'ใบคำขอเดียวกัน'], ['WITHIN_DAYS', 'ภายใน N วัน'], ['FAMILY', 'ผู้เอาประกันต่างคนได้ (ครอบครัว)']) },
    { key: 'withinDays', label: 'ภายใน', kind: 'number', suffix: ' วัน', min: 1, showIf: (b) => b['purchaseCondition'] === 'WITHIN_DAYS' },
    { id: 'CP-BND-03', key: 'benefitType', label: 'รูปแบบสิทธิ์', kind: 'select', required: true, source: o(['PERCENT', '% ต่อยอดรวม'], ['AMOUNT', 'บาท ต่อยอดรวม'], ['SECOND_PERCENT', '% เฉพาะชิ้นที่ 2']) },
    { key: 'benefitValue', label: 'มูลค่าสิทธิ์', kind: 'number', required: true, decimals: 2, min: 0 },
    { id: 'CP-BND-04', key: 'applyTo', label: 'ใช้กับ Package ไหน', kind: 'select', source: o(['TOTAL', 'ยอดรวม'], ['LOWEST', 'ชิ้นเบี้ยต่ำสุด'], ['SPECIFIC', 'ชิ้นที่ระบุ']) },
  ],
  // 4.9 Lucky draw
  LUCKY_DRAW: [
    {
      id: 'CP-LKD-01', key: 'prizes', label: 'รายการรางวัล', kind: 'table', required: true, wide: true,
      columns: [
        { key: 'prize', label: 'รางวัล', kind: 'select', source: { master: 'MS-21' } },
        { key: 'qty', label: 'จำนวน', kind: 'number' },
        { key: 'value', label: 'มูลค่า (บาท)', kind: 'number' },
      ],
    },
    { id: 'CP-LKD-02', key: 'perBaht', label: '1 สิทธิ์ลุ้น ต่อเบี้ย (บาท)', kind: 'number', required: true, min: 1 },
    { id: 'CP-LKD-07', key: 'taxBearer', label: 'ภาษีของรางวัล', kind: 'select', required: true, source: o(['WINNER', 'ผู้รับรางวัลรับภาระ'], ['COMPANY', 'บริษัทรับภาระ']) },
    { id: 'CP-LKD-03', key: 'drawDate', label: 'วันจับรางวัล', kind: 'date', required: true, hint: 'ต้องหลังวันสิ้นสุด Campaign' },
    { key: 'announceDate', label: 'วันประกาศผล', kind: 'date', required: true, hint: 'ต้องไม่ก่อนวันจับรางวัล' },
    { id: 'CP-LKD-04', key: 'announceChannels', label: 'ช่องทางประกาศผล', kind: 'multiselect', required: true, source: { master: 'MS-11', usage: 'ประกาศผล' }, wide: true },
    { id: 'CP-LKD-05', key: 'licenseNo', label: 'เลขที่ใบอนุญาตจัดชิงโชค', kind: 'text', required: true, hint: 'ทีม Marketing เป็นผู้ขอใบอนุญาต (CC-11)' },
    { key: 'licenseFile', label: 'ไฟล์ใบอนุญาต', kind: 'upload', required: true, accept: '.pdf,.jpg,.png' },
    { id: 'CP-LKD-06', key: 'controller', label: 'ผู้ควบคุมการจับรางวัล / กรรมการ', kind: 'text', wide: true },
  ],
};

/** ค่าเริ่มต้นเมื่อเลือกประเภท */
export const BENEFIT_DEFAULTS: Partial<Record<CampaignTypeCode, Record<string, unknown>>> = {
  VOUCHER: { mode: 'FIXED', perPolicy: 1, codeSource: 'SYSTEM', tiers: [] },
  DISCOUNT: { discountType: 'PERCENT', tiers: [] },
  CASHBACK: { cashbackType: 'PERCENT', recipient: 'PAYER', payoutTiming: 'AFTER_FL', tiers: [] },
  FREE_GIFT: { perPolicy: 1 },
  INSTALLMENT: { interestRate: 0, interestBearer: 'COMPANY', minPremiums: [] },
  REFERRAL: { attributionDays: 30, qrCode: true },
  BUNDLE: { purchaseCondition: 'SAME_APP', benefitType: 'PERCENT', applyTo: 'TOTAL' },
  LUCKY_DRAW: { prizes: [], taxBearer: 'WINNER' },
};

// ---------------------------------------------------------------- ขั้น 4 Rule builder
export type RuleOperator = 'GTE' | 'LTE' | 'BETWEEN' | 'IN';

export interface RuleAttribute {
  id: string;
  code: string;
  label: string;
  kind: 'number' | 'code';
  operators: RuleOperator[];
  suffix?: string;
  source?: OptionSource;
}

export const RULE_ATTRIBUTES: RuleAttribute[] = [
  { id: 'CP-ELG-01', code: 'FYP', label: 'เบี้ยประกันปีแรก (FYP)', kind: 'number', operators: ['GTE', 'LTE', 'BETWEEN'], suffix: ' บาท' },
  { id: 'CP-ELG-02', code: 'ANNUAL_PREMIUM', label: 'เบี้ยรายปี (Annualized)', kind: 'number', operators: ['GTE', 'LTE', 'BETWEEN'], suffix: ' บาท' },
  { id: 'CP-ELG-03', code: 'SUM_INSURED', label: 'จำนวนเงินเอาประกันภัย', kind: 'number', operators: ['GTE', 'LTE', 'BETWEEN'], suffix: ' บาท' },
  { id: 'CP-ELG-04', code: 'PAYMENT_MODE', label: 'งวดการชำระเบี้ย', kind: 'code', operators: ['IN'], source: { synced: 'PAYMENT_MODE' } },
  { id: 'CP-ELG-05', code: 'PAYMENT_METHOD', label: 'ช่องทางชำระเบี้ย', kind: 'code', operators: ['IN'], source: { synced: 'PAYMENT_METHOD' } },
  { id: 'CP-ELG-06', code: 'AGE', label: 'อายุผู้เอาประกันภัย', kind: 'number', operators: ['BETWEEN', 'GTE', 'LTE'], suffix: ' ปี' },
  { id: 'CP-ELG-07', code: 'GENDER', label: 'เพศ', kind: 'code', operators: ['IN'], source: { synced: 'GENDER' } },
  { id: 'CP-ELG-08', code: 'OCCUPATION_CLASS', label: 'ชั้นอาชีพ', kind: 'code', operators: ['IN'], source: { synced: 'OCCUPATION_CLASS' } },
  { id: 'CP-ELG-09', code: 'CUSTOMER_TYPE', label: 'ประเภทลูกค้า', kind: 'code', operators: ['IN'], source: { master: 'MS-08' } },
  { id: 'CP-ELG-10', code: 'POLICY_ORDER', label: 'ลำดับกรมธรรม์ที่เข้าเงื่อนไข', kind: 'number', operators: ['LTE'], suffix: ' กรมธรรม์แรก' },
];

export const OPERATOR_LABEL: Record<RuleOperator, string> = {
  GTE: '≥ ตั้งแต่',
  LTE: '≤ ไม่เกิน',
  BETWEEN: 'ระหว่าง',
  IN: 'อยู่ใน',
};

export function findAttribute(code: string | null | undefined): RuleAttribute | undefined {
  return RULE_ATTRIBUTES.find((a) => a.code === code);
}

// ---------------------------------------------------------------- ตรวจ Field บังคับรายขั้น
export interface CampaignForm {
  typeCode: CampaignTypeCode | null;
  nameTh: string;
  nameEn: string;
  startDate: string | null;
  endDate: string | null;
  packageCodes: string[];
  channelCodes: string[];
  data: CampaignData & { benefit: Record<string, unknown>; rules: CampaignRule[] };
}

export const STEPS = [
  { no: 1, title: 'เลือกประเภท', sub: 'Campaign type' },
  { no: 2, title: 'ข้อมูลทั่วไป', sub: 'Package · ช่วงวัน · ช่องทาง' },
  { no: 3, title: 'สิทธิประโยชน์', sub: 'ตามประเภท' },
  { no: 4, title: 'เงื่อนไขผู้มีสิทธิ์', sub: 'Rule builder' },
  { no: 5, title: 'ตรวจสอบ & ส่งอนุมัติ', sub: 'Summary' },
] as const;

export const blank = (v: unknown) => v === undefined || v === null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '');

export function isReferral(f: CampaignForm): boolean {
  return f.typeCode === 'REFERRAL';
}

/** Field ที่ยังไม่กรอกของแต่ละขั้น (ขั้น 5 = รวมทุกขั้น) */
export function missing(f: CampaignForm, step: number): string[] {
  const out: string[] = [];
  const need = (ok: boolean, label: string) => !ok && out.push(label);
  const d = f.data;
  if (step === 1) need(!!f.typeCode, 'ประเภท Campaign');
  if (step === 2) {
    need(!blank(f.nameTh), 'ชื่อ Campaign (TH)');
    need(f.packageCodes.length > 0, 'Package ที่ใช้ได้');
    need(!!f.startDate, 'วันเริ่ม');
    need(!!f.endDate, 'วันสิ้นสุด');
    need(f.channelCodes.length > 0, 'ช่องทางขาย');
    need(!blank(d.tncTh), 'ข้อกำหนดและเงื่อนไข (TH)');
    need(!blank(d.costCenter), 'หน่วยงานเจ้าของ / Cost center');
    if (!isReferral(f)) {
      need(!blank(d.rewardTiming), 'จังหวะการให้สิทธิ์');
      need(!blank(d.clawback), 'กติกาเรียกคืนสิทธิ์');
      need(!blank(d.bannerDesktop), 'รูป Banner Desktop');
      need(!blank(d.bannerMobile), 'รูป Banner Mobile');
      need(!blank(d.thumbnail), 'รูป Thumbnail');
    }
  }
  if (step === 3 && f.typeCode) {
    for (const field of BENEFIT_FIELDS[f.typeCode]) {
      if (!field.required || (field.showIf && !field.showIf(d.benefit))) continue;
      need(!blank(d.benefit[field.key]), field.label);
    }
  }
  if (step === 4 && !isReferral(f)) {
    d.rules.forEach((r, i) => {
      const values = r.operator === 'BETWEEN' ? [r.value, r.value2] : [r.value];
      need(!blank(r.attribute) && !blank(r.operator) && values.every((x) => !blank(x)), `เงื่อนไขข้อ ${i + 1}`);
    });
  }
  if (step === 5) for (const s of [1, 2, 3, 4]) out.push(...missing(f, s));
  return out;
}

export function emptyForm(): CampaignForm {
  return {
    typeCode: null,
    nameTh: '',
    nameEn: '',
    startDate: null,
    endDate: null,
    packageCodes: [],
    channelCodes: [],
    data: { benefit: {}, rules: [], sortOrder: 1 },
  };
}
