/**
 * หน้าชั่วคราวของหน้าจอที่ยังไม่ได้พัฒนา — บอกรหัสหน้าจอ, เอกสารอ้างอิง และ Sprint ที่จะทำ
 * จะถูกแทนที่ด้วยหน้าจริงในแต่ละ Sprint
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-page-placeholder',
  imports: [Icon],
  templateUrl: './page-placeholder.html',
  styleUrl: './page-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagePlaceholder {
  readonly screenId = input.required<string>();
  readonly heading = input.required<string>();
  readonly description = input('');
  readonly sprint = input.required<number>();
  readonly specRefs = input<string[]>([]);
  readonly figmaNode = input('');
  readonly scope = input<string[]>([]);
}
