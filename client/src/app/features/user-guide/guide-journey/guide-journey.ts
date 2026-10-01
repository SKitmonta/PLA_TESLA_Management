/**
 * User guide › User journey — ลำดับงานข้าม Role ตั้งแต่เตรียม Master จนติดตามผลบน Overview (doc 11)
 * แต่ละขั้นกดไปดูคู่มือทีละขั้นตอนได้ · ด้านล่างเป็นผลการตรวจสอบระบบตาม Journey (JOURNEY_CHECKS)
 */
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { SessionService } from '../../../core/auth/session.service';
import { JOURNEY, JOURNEY_CHECKS } from '../guide-content';

@Component({
  selector: 'app-guide-journey',
  imports: [RouterLink, ButtonModule, TagModule, TimelineModule],
  templateUrl: './guide-journey.html',
  styleUrl: './guide-journey.scss',
})
export class GuideJourney {
  readonly session = inject(SessionService);
  readonly stages = JOURNEY;
  readonly checks = JOURNEY_CHECKS;
  readonly passed = JOURNEY_CHECKS.filter((c) => c.result === 'ผ่าน').length;
}
