// On /package/approval/:code — DECIDE = { action: 'APPROVE' | 'REJECT', remark } (prepended)
for (let i = 0; i < 40 && !T.button('ยืนยันผลการพิจารณา'); i++) await T.wait(250);
const page = window.ng.getComponent(T.q('app-content-approval'));
const r = page.review();
const before = { code: r.content.contentCode, status: r.content.status, version: r.content.versionNo, previous: r.previous?.versionNo ?? null, history: r.history.map((h) => h.action + ' v' + h.versionNo) };
T.closeToasts();
if (DECIDE.action === 'APPROVE') {
  for (let i = 0; document.getElementById('chk' + i); i++) {
    const box = document.getElementById('chk' + i);
    if (!box.checked) box.click();
  }
  document.getElementById('d-ok').click();
} else {
  document.getElementById('d-no').click();
  await T.wait(200);
  const ta = T.q('app-textarea-field textarea');
  ta.focus();
  ta.value = DECIDE.remark;
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}
await T.wait(500);
const btn = T.button('ยืนยันผลการพิจารณา');
const enabled = !btn.disabled;
btn.click();
for (let i = 0; i < 40 && !T.toasts().length; i++) await T.wait(250);
await T.wait(800);
const after = await T.api(before.code);
return { before, confirmEnabled: enabled, toasts: T.toasts(), url: location.pathname, after: { status: after.status, displayStatus: after.displayStatus, version: after.versionNo, approvedBy: after.approvedByName, rejectReason: after.rejectReason } };
