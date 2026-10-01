/**
 * แถบแบ่งหน้าใต้ตาราง — ตาม Figma Package List (1:5216)
 * "Showing x to y of z entries" | ‹ « 1 2 3 … 10 › » | จำนวนแถว/หน้า
 * ใช้: <app-pagination [total]="total" [page]="page" [pageSize]="size" (pageChange)="..." (pageSizeChange)="..." />
 */
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';

type PageItem = number | 'gap';

@Component({
  selector: 'app-pagination',
  imports: [FormsModule, SelectModule, FloatLabelModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  readonly total = input(0);
  readonly page = input(1);
  readonly pageSize = input(10);
  readonly pageSizeOptions = input([10, 20, 50]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly from = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  readonly to = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  /** แสดงเลขหน้าแบบย่อ: 1 2 3 … 10 */
  readonly pages = computed<PageItem[]>(() => {
    const count = this.pageCount();
    const cur = this.page();
    if (count <= 5) return Array.from({ length: count }, (_, i) => i + 1);
    const set = new Set([1, count, cur - 1, cur, cur + 1].filter((p) => p >= 1 && p <= count));
    if (cur <= 3) [2, 3].forEach((p) => set.add(p));
    const sorted = [...set].sort((a, b) => a - b);
    const out: PageItem[] = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
      out.push(p);
    });
    return out;
  });

  go(p: number): void {
    const next = Math.min(Math.max(p, 1), this.pageCount());
    if (next !== this.page()) this.pageChange.emit(next);
  }

  changeSize(value: number | string): void {
    this.pageSizeChange.emit(Number(value));
  }
}
