/**
 * ผู้ใช้ + Role ที่กำลังใช้งาน (Prototype: สลับได้จากปุ่ม Role ที่ Topbar แทน Login จริง — OUT-04)
 * ค่าที่เลือกจำไว้ใน localStorage ของ Browser
 */
import { Injectable, computed, signal } from '@angular/core';
import { AppUser, ROLE_LABEL, RoleCode } from '../models/user.model';
import { AccessLevel, MENU_ACCESS } from './permissions';
import { MenuKey } from '../navigation/menu.config';

const STORAGE_USER = 'tesla.userId';
const STORAGE_ROLE = 'tesla.role';

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly users = signal<AppUser[]>([]);
  readonly userId = signal<string>(read(STORAGE_USER) ?? 'U001');
  readonly role = signal<RoleCode>((read(STORAGE_ROLE) as RoleCode | null) ?? 'CONTENT_MAKER');

  readonly user = computed<AppUser | undefined>(() => this.users().find((u) => u.userId === this.userId()));
  readonly roleLabel = computed(() => ROLE_LABEL[this.role()]);
  readonly initial = computed(() => (this.user()?.userName ?? '?').charAt(0).toUpperCase());

  /** รับรายชื่อผู้ใช้จาก API แล้วตรวจว่า Role ที่จำไว้ยังใช้ได้ */
  setUsers(users: AppUser[]): void {
    this.users.set(users);
    const current = users.find((u) => u.userId === this.userId()) ?? users[0];
    if (!current) return;
    const role = current.roles.includes(this.role()) ? this.role() : current.roles[0];
    this.switchTo(current.userId, role);
  }

  switchTo(userId: string, role: RoleCode): void {
    this.userId.set(userId);
    this.role.set(role);
    write(STORAGE_USER, userId);
    write(STORAGE_ROLE, role);
  }

  access(menu: MenuKey): AccessLevel {
    return MENU_ACCESS[this.role()][menu];
  }

  /** สร้าง / แก้ไข ได้ไหม — System admin ทำได้ทุก Function */
  canEdit(menu: MenuKey): boolean {
    return this.role() === 'SYS_ADMIN' || this.access(menu) === 'edit';
  }

  /** อนุมัติ / ตีกลับ ได้ไหม — System admin ทำได้ทุก Function (ยังห้ามอนุมัติงานที่ตัวเองสร้าง — D-06) */
  canApprove(menu: MenuKey): boolean {
    return this.role() === 'SYS_ADMIN' || this.access(menu) === 'approve';
  }

  canSee(menu: MenuKey): boolean {
    return this.access(menu) !== 'none';
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
