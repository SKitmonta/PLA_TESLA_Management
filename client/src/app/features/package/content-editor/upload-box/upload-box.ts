/**
 * กล่องอัปโหลดไฟล์ (Figma: กรอบเส้นประ + ไอคอน ↑ + ชื่อ + ขนาดที่แนะนำ)
 * Prototype: เก็บเฉพาะ "ชื่อไฟล์" ใน Content (ยังไม่อัปโหลดไฟล์จริง — ทำเมื่อมีที่เก็บไฟล์)
 * ใช้: <app-upload-box label="รูปพื้นหลัง Desktop" spec="1920×640 px · .webp/.jpg ≤ 1 MB" accept=".webp,.jpg" [(value)]="form.hero.bgDesktop" />
 */
import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-upload-box',
  templateUrl: './upload-box.html',
  styleUrl: './upload-box.scss',
  host: { '[class.compact]': 'compact()', '[class.filled]': '!!value()' },
})
export class UploadBox {
  readonly label = input('');
  readonly spec = input('');
  readonly accept = input('.webp,.jpg,.jpeg,.png');
  /** ขนาดสูงสุด (MB) — เกินแล้วไม่รับไฟล์ */
  readonly maxMb = input(1);
  readonly compact = input(false);
  readonly value = model('');
  error = '';

  pick(event: Event): void {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0];
    el.value = '';
    if (!file) return;
    if (file.size > this.maxMb() * 1024 * 1024) {
      this.error = `ไฟล์ใหญ่เกิน ${this.maxMb()} MB`;
      return;
    }
    this.error = '';
    this.value.set(file.name);
  }

  clear(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.value.set('');
  }
}
