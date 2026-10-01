/**
 * OB-02 Hero Banner — รูปพื้นหลัง, Label หมวด (DRV แก้ได้), ชื่อแสดงผล (PKG แก้ได้), Headline, Sub-headline
 */
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentDetail } from '../../../../../core/models/content.model';
import { ContentFormData } from '../../content-form';
import { UploadBox } from '../../upload-box/upload-box';
import { TextField } from '../../../../../shared/components/form/text-field/text-field';

@Component({
  selector: 'app-sec-hero-banner',
  imports: [FormsModule, UploadBox, TextField],
  templateUrl: './hero-banner.html',
  styleUrl: '../section-form.scss',
})
export class SecHeroBanner {
  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();
}
