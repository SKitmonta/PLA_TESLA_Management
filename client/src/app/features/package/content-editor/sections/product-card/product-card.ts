/**
 * OB-12 การ์ดสินค้า (ใช้ในหน้ารายการและ Recommend) — รูป, Label หมวด (DRV), ชื่อ (PKG), Bullet ≤ 3
 */
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentDetail } from '../../../../../core/models/content.model';
import { ContentFormData } from '../../content-form';
import { UploadBox } from '../../upload-box/upload-box';
import { TextField } from '../../../../../shared/components/form/text-field/text-field';

@Component({
  selector: 'app-sec-product-card',
  imports: [FormsModule, UploadBox, TextField],
  templateUrl: './product-card.html',
  styleUrl: '../section-form.scss',
})
export class SecProductCard {
  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();
}
