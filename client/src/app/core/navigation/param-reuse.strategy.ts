/**
 * สร้างหน้าใหม่เมื่อ Parameter ของ Route เปลี่ยน (เช่น /campaign/A → /campaign/B)
 * ค่าเริ่มต้นของ Angular ใช้ Component เดิมซ้ำ ทำให้หน้าที่อ่าน Parameter ตอน ngOnInit ไม่โหลดข้อมูลใหม่
 */
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

@Injectable()
export class ParamReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig && JSON.stringify(future.params) === JSON.stringify(curr.params);
  }
}
