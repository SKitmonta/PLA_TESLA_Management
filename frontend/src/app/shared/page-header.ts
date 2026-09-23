import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="header">
      <div>
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p class="muted">{{ subtitle() }}</p>
        }
      </div>
      <div class="actions"><ng-content /></div>
    </div>
  `,
  styles: `
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    h1 { margin: 0; font-size: 24px; font-weight: 700; }
    p { margin: 4px 0 0; }
    .actions { display: flex; gap: 8px; }
  `,
})
export class PageHeader {
  title = input.required<string>();
  subtitle = input<string>();
}
