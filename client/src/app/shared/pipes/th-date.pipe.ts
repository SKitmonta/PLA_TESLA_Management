/**
 * แปลงวันที่ 'YYYY-MM-DD' หรือ 'YYYY-MM-DD HH:mm:ss' → 'DD/MM/YYYY' (ค.ศ.)
 * ค่าว่าง → ข้อความแทน (ค่าเริ่มต้น "ไม่ระบุ")
 * ใช้: {{ row.saleStartDate | thDate }}  ·  {{ syncedAt | thDate: 'ไม่ระบุ' : true }} (แสดงเวลา)
 */
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'thDate' })
export class ThDatePipe implements PipeTransform {
  transform(value: string | null | undefined, empty = 'ไม่ระบุ', withTime = false): string {
    if (!value) return empty;
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(value);
    if (!m) return value;
    const date = `${m[3]}/${m[2]}/${m[1]}`;
    return withTime && m[4] ? `${date} ${m[4]}:${m[5]}` : date;
  }
}
