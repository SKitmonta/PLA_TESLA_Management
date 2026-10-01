/**
 * OB-09 ข้อมูลสำคัญอื่นๆ — ระยะเวลาเอาประกัน (CMS) + ค่าที่ระบบแปลงจาก Package (DRV) + ช่องทางชำระเบี้ยตาม Mapping MS-03
 */
import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentDetail } from '../../../../../core/models/content.model';
import { ContentFormData } from '../../content-form';
import { DecimalPipe } from '@angular/common';
import { TextField } from '../../../../../shared/components/form/text-field/text-field';
import { NumberField } from '../../../../../shared/components/form/number-field/number-field';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-sec-important-info',
  imports: [FormsModule, DecimalPipe, TextField, NumberField, TagModule],
  templateUrl: './important-info.html',
  styleUrl: '../section-form.scss',
})
export class SecImportantInfo {
  readonly form = input.required<ContentFormData>();
  readonly content = input.required<ContentDetail>();
  readonly pkg = computed(() => this.content().package);
  /** การพิจารณารับประกันของแผน MASTER (แผนแรก) */
  readonly uwCode = computed(() => this.pkg().plans.find((p) => p.planRole === 'MASTER')?.underwriteType ?? '–');
  startPremium(): number | null {
    const f = this.form();
    return this.content().template === 'OL_PA' ? f.quickFacts.premium : f.sticky.minPremium;
  }
}
