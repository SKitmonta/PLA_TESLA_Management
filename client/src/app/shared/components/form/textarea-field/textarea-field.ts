/**
 * ช่องข้อความหลายบรรทัด — PrimeNG Textarea + FloatLabel (variant="in")
 */
import { Component, forwardRef, input } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { BaseField } from '../base-field';

@Component({
  selector: 'app-textarea-field',
  imports: [FormsModule, TextareaModule, FloatLabelModule],
  templateUrl: './textarea-field.html',
  styleUrl: '../field.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextareaField), multi: true }],
})
export class TextareaField extends BaseField<string> {
  readonly rows = input(4);
  readonly maxlength = input<number | undefined>(undefined);

  protected override fromModel(v: unknown): string | null {
    return v === null || v === undefined ? '' : String(v);
  }
}
