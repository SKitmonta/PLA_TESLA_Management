/**
 * Breadcrumb (แถบนำทาง) ใต้ Topbar — ตาม Figma Bar / Property 1=Navigate (1:6365)
 * 🏠 / ชื่อเมนู / ชื่อหน้า — ชื่อหน้ามาจาก data.title ใน routes (ไม่แสดงถ้า data.crumb = false)
 */
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuItem } from '../../core/navigation/menu.config';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
})
export class Breadcrumb {
  readonly menu = input<MenuItem | undefined>(undefined);
  /** ชื่อหน้าปัจจุบัน — ว่าง = อยู่หน้าแรกของเมนู */
  readonly title = input('');
}
