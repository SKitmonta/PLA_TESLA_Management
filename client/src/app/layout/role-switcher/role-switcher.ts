/**
 * หน้าต่างสลับผู้ใช้/Role (Prototype แทนระบบ Login จริง — OUT-04)
 * เปิดจากปุ่ม Role หรือรูปโปรไฟล์ใน Topbar · ใช้ทดสอบสิทธิ์เมนู และ Maker ≠ Approver (D-06)
 */
import { Component, computed, inject, output, signal } from '@angular/core';
import { Icon } from '../../shared/components/icon/icon';
import { SessionService } from '../../core/auth/session.service';
import { ROLE_LABEL, ROLE_ORDER, RoleCode } from '../../core/models/user.model';

@Component({
  selector: 'app-role-switcher',
  imports: [Icon],
  templateUrl: './role-switcher.html',
  styleUrl: './role-switcher.scss',
})
export class RoleSwitcher {
  readonly session = inject(SessionService);
  readonly closed = output<void>();

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
