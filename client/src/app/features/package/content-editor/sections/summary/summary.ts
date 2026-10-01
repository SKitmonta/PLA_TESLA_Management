/**
 * OB-10 สรุปสาระสำคัญ / เงื่อนไขทั่วไป — ข้อความ Legal (GLB), Free look (DRV), เอกสารแนบ PDF (CMS)
 */
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentDetail } from '../../../../../core/models/content.model';
import { ContentFormData } from '../../content-form';
import { UploadBox } from '../../upload-box/upload-box';
import { TextField } from '../../../../../shared/components/form/text-field/text-field';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-sec-summary',
  imports: [FormsModule, UploadBox, TextField, MessageModule],
  templateUrl: './summary.html',
  styleUrl: '../section-form.scss',
})
export class SecSummary {
  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();
}
