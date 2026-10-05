/**
 * หน้าต่างสลับผู้ใช้/Role (Prototype แทนระบบ Login จริง — OUT-04)
 * เปิดจากปุ่ม Role หรือรูปโปรไฟล์ใน Topbar · ใช้ทดสอบสิทธิ์เมนู และ Maker ≠ Approver (D-06)
 */
import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { Icon } from '../../shared/components/icon/icon';
import { SessionService } from '../../core/auth/session.service';
import { DataSourceService, TESLA_API_BASE } from '../../core/data-source/data-source.service';
import { ROLE_LABEL, ROLE_ORDER, RoleCode } from '../../core/models/user.model';

@Component({
  selector: 'app-role-switcher',
  imports: [Icon],
  templateUrl: './role-switcher.html',
  styleUrl: './role-switcher.scss',
})
export class RoleSwitcher implements OnInit {
  readonly session = inject(SessionService);
  readonly dataSource = inject(DataSourceService);
  readonly closed = output<void>();
  readonly teslaBase = TESLA_API_BASE;

  ngOnInit(): void {
    this.dataSource.checkHealth();
  }

  readonly roleLabel = ROLE_LABEL;
  /** ผู้ใช้ที่กำลังดูใน Panel (ยังไม่ได้กดใช้) */
  readonly pickedUserId = signal(this.session.userId());

  readonly pickedRoles = computed<RoleCode[]>(() => {
    const roles = this.session.users().find((u) => u.userId === this.pickedUserId())?.roles ?? [];
    return ROLE_ORDER.filter((r) => roles.includes(r));
  });

  apply(role: RoleCode): void {
    this.session.switchTo(this.pickedUserId(), role);
    this.closed.emit();
  }

  isCurrent(role: RoleCode): boolean {
    return this.pickedUserId() === this.session.userId() && role === this.session.role();
  }
}
