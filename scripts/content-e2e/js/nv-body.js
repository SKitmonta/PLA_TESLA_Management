// APPROVED → "สร้าง Version ใหม่" (Draft) so the content can be updated; the approved version stays live
const page = window.ng.getComponent(T.q('app-content-editor'));
const c = page.content();
if (c.status === 'DRAFT') return { already: 'DRAFT', version: c.versionNo };
if (c.status !== 'APPROVED') return { skipped: c.status };
const b = T.button('สร้าง Version ใหม่');
if (!b) return { error: 'no new-version button' };
b.click();
for (let i = 0; i < 30 && page.content().status !== 'DRAFT'; i++) await T.wait(300);
return { status: page.content().status, version: page.content().versionNo, toasts: T.toasts() };
