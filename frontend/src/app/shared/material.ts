import { ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageHeader } from './page-header';
import { StatusChip } from './status-chip';
import { ListToolbar } from './list-toolbar';

/** Common imports for list pages. */
export const LIST_PAGE_IMPORTS = [
  DecimalPipe,
  DatePipe,
  MatButtonModule,
  MatIconModule,
  MatTableModule,
  MatTooltipModule,
  MatProgressBarModule,
  PageHeader,
  StatusChip,
  ListToolbar,
];

/** Common imports for create/edit dialogs. */
export const FORM_DIALOG_IMPORTS = [
  ReactiveFormsModule,
  MatDialogModule,
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatIconModule,
];
