/**
 * ผู้ใช้จำลองสำหรับทดสอบ Role และ Maker ≠ Approver (D-06)
 * แก้/เพิ่มผู้ใช้ได้ที่นี่ แล้วรัน npm run db:reset
 */
import type { DatabaseSync } from 'node:sqlite';

interface SeedUser {
  userId: string;
  userName: string;
  position: string;
  roles: string[];
}

export const SEED_USERS: SeedUser[] = [
  {
    userId: 'U001',
    userName: 'Kitmonta',
    position: 'Assistant Manager',
    roles: ['SYS_ADMIN', 'CONTENT_MAKER', 'CONTENT_APPROVER', 'CAMPAIGN_MAKER', 'CAMPAIGN_APPROVER', 'PEOPLE_ADMIN', 'EXECUTIVE'],
  },
  { userId: 'U002', userName: 'User A', position: 'Marketing Officer', roles: ['CONTENT_MAKER', 'CAMPAIGN_MAKER'] },
  { userId: 'U003', userName: 'User B', position: 'Marketing Manager', roles: ['CONTENT_APPROVER', 'CAMPAIGN_APPROVER'] },
  { userId: 'U004', userName: 'User C', position: 'Content Officer', roles: ['CONTENT_MAKER'] },
  { userId: 'U005', userName: 'User D', position: 'Agency Support', roles: ['PEOPLE_ADMIN'] },
  { userId: 'U006', userName: 'User E', position: 'Head of Sales', roles: ['EXECUTIVE'] },
  { userId: 'U007', userName: 'IT Admin', position: 'System Administrator', roles: ['SYS_ADMIN'] },
];

export function seedUsers(db: DatabaseSync): void {
  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO app_user (user_id, user_name, position) VALUES (?, ?, ?)',
  );
  const insertRole = db.prepare(
    'INSERT OR IGNORE INTO app_user_role (user_id, role_code) VALUES (?, ?)',
  );
  for (const u of SEED_USERS) {
    insertUser.run(u.userId, u.userName, u.position);
    for (const role of u.roles) insertRole.run(u.userId, role);
  }
}
