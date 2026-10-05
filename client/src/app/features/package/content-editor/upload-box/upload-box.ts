/**
 * กล่องอัปโหลดไฟล์ (Figma: กรอบเส้นประ + ไอคอน ↑ + ชื่อ + ขนาดที่แนะนำ)
 * - โหมด Tesla Admin API + ใส่ slot: ส่งไฟล์ไป API จริง (POST /api/v1/image/upload) แล้วเก็บ "URL ของไฟล์" ใน Content
 * - โหมด Local หรือไม่ใส่ slot: เก็บเฉพาะ "ชื่อไฟล์" (Mock server ไม่มีที่เก็บไฟล์)
 * ใช้: <app-upload-box label="รูปพื้นหลัง Desktop" spec="1920×640 px · .webp/.jpg ≤ 1 MB" accept=".webp,.jpg" slot="banner_desktop" [(value)]="form.hero.bgDesktop" />
 */
import { Component, inject, input, model, signal } from '@angular/core';
import { ContentUploadService, UploadSlot } from '../upload.service';

const IMAGE_EXT = /\.(jpe?g|png|gif|bmp|webp|svg)$/i;

@Component({
  selector: 'app-upload-box',
  templateUrl: './upload-box.html',
  styleUrl: './upload-box.scss',
  host: { '[class.compact]': 'compact()', '[class.filled]': '!!value()' },
})
export class UploadBox {
  private readonly uploader = inject(ContentUploadService);

  readonly label = input('');
  readonly spec = input('');
  readonly accept = input('.webp,.jpg,.jpeg,.png');
  /** ขนาดสูงสุด (MB) — เกินแล้วไม่รับไฟล์ */
  readonly maxMb = input(1);
  readonly compact = input(false);
  /** Slot ของ API v1 (banner_desktop / banner_mobile / thumb_main / product_icon / tc_doc) — ว่าง = เก็บแค่ชื่อไฟล์ */
  readonly slot = input<UploadSlot | ''>('');
  readonly kind = input<'image' | 'pdf'>('image');
  /** tc_doc เท่านั้น: ลำดับเอกสาร 1–10 */
  readonly index = input<number | null>(null);
  readonly value = model('');
  /** signal เพื่อให้หน้าจออัปเดตแม้ callback ของ HTTP มาตอนที่หน้านี้ไม่ได้ถูกตรวจ (parent แบบ OnPush) */
  readonly error = signal('');
  readonly uploading = signal(false);

  pick(event: Event): void {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0];
    el.value = '';
    if (!file) return;
    if (file.size > this.maxMb() * 1024 * 1024) {
      this.error.set(`ไฟล์ใหญ่เกิน ${this.maxMb()} MB`);
      return;
    }
    this.error.set('');

    const slot = this.slot();
    if (slot && this.uploader.enabled()) {
      this.uploading.set(true);
      this.uploader.upload(file, { slot, kind: this.kind(), index: this.index() ?? undefined }).subscribe({
        next: (url) => {
          this.value.set(url);
          this.uploading.set(false);
        },
        error: (message: string) => {
          this.error.set(message);
          this.uploading.set(false);
        },
      });
      return;
    }
    this.value.set(file.name);
  }

  clear(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.value.set('');
  }

  /** ชื่อที่แสดง — ถ้าเป็น URL แสดงเฉพาะชื่อไฟล์ท้าย URL */
  fileLabel(): string {
    const v = this.value();
    if (!/^https?:\/\//i.test(v)) return v;
    try {
      return decodeURIComponent(v.split('?')[0].split('/').pop() ?? v);
    } catch {
      return v;
    }
  }

  /** URL รูปที่ใช้โชว์ตัวอย่างได้ (เฉพาะไฟล์ที่อัปโหลดจริงและเป็นรูป) */
  previewUrl(): string | null {
    const v = this.value();
    return /^https?:\/\//i.test(v) && IMAGE_EXT.test(v.split('?')[0]) ? v : null;
  }
}
