import { Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { STATUS_OPTIONS } from '../core/models';

/** Search box + status filter used above every list table. */
@Component({
  selector: 'app-list-toolbar',
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  template: `
    <div class="toolbar-row">
      <mat-form-field appearance="outline" class="search" subscriptSizing="dynamic">
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [placeholder]="placeholder()" [value]="q()" (input)="search.emit($any($event.target).value)" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="status-filter" subscriptSizing="dynamic">
        <mat-select [value]="status()" (selectionChange)="statusChange.emit($event.value)" placeholder="ทุกสถานะ">
          <mat-option value="">ทุกสถานะ</mat-option>
          @for (s of statusOptions; track s.value) {
            <mat-option [value]="s.value">{{ s.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <span class="muted count">{{ count() }} รายการ</span>
    </div>
  `,
  styles: `.count { margin-left: auto; font-size: 13px; }`,
})
export class ListToolbar {
  placeholder = input('ค้นหา...');
  q = input('');
  status = input('');
  count = input(0);
  search = output<string>();
  statusChange = output<string>();
  protected statusOptions = STATUS_OPTIONS;
}
