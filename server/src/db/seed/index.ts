/**
 * Seed data ตั้งต้น — เรียกทุกครั้งที่เปิดฐานข้อมูล (INSERT OR IGNORE = เติมเฉพาะข้อมูลที่ยังไม่มี)
 * แยกไฟล์ต่อหมวด แก้ข้อมูลแล้วรัน npm run db:reset เพื่อเริ่มใหม่
 */
import type { DatabaseSync } from 'node:sqlite';
import { seedUsers } from './users.seed.js';
import { seedSyncedMaster } from './synced-master.seed.js';
import { seedPackages } from './packages.seed.js';
import { seedDisplayMapping } from './display-mapping.seed.js';
import { seedCustomMaster } from './custom-master.seed.js';
import { seedContent, seedContentVersions } from './content.seed.js';
import { seedCampaign, seedCampaignGrants } from './campaign.seed.js';
import { seedPeople, seedSellers } from './people.seed.js';
import { seedPolicies, seedPolicyGrants, seedTargets } from './overview.seed.js';

export function runSeed(db: DatabaseSync): void {
  seedUsers(db);
  seedSyncedMaster(db);
  seedPackages(db);
  seedDisplayMapping(db);
  seedCustomMaster(db);
  seedContent(db);
  seedContentVersions(db);
  seedCampaign(db);
  seedCampaignGrants(db);
  seedSellers(db);
  seedPeople(db);
  seedPolicies(db);
  seedPolicyGrants(db);
  seedTargets(db);
}
