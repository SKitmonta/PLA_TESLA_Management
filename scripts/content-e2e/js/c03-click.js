// On /campaign/:code — CLICK = { button, reason? } (prepended): press a header button (and fill the reject dialog)
for (let i = 0; i < 40 && !T.q('.buttons'); i++) await T.wait(250);
await T.wait(800);
const page = window.ng.getComponent(T.q('app-campaign-detail'));
const before = { status: page.detail().status, display: page.detail().displayStatus };
T.closeToasts();
const btn = T.qa('.buttons button').find((b) => T.norm(b.textContent) === CLICK.button);
if (!btn) return { error: 'button not found: ' + CLICK.button, buttons: T.qa('.buttons button').map((b) => T.norm(b.textContent) + (b.disabled ? ' (disabled)' : '')) };
const disabled = btn.disabled;
btn.click();
if (CLICK.reason) {
  for (let i = 0; i < 20 && !T.q('.p-dialog app-textarea-field textarea'); i++) await T.wait(200);
  const ta = T.q('.p-dialog app-textarea-field textarea');
  ta.focus(); ta.value = CLICK.reason; ta.dispatchEvent(new Event('input', { bubbles: true }));
  await T.wait(300);
  T.qa('.p-dialog button').find((b) => T.norm(b.textContent) === 'ตีกลับ').click();
}
for (let i = 0; i < 40 && !T.toasts().length; i++) await T.wait(250);
await T.wait(1500);
const d = page.detail();
return { before, clickedDisabled: disabled, toasts: T.toasts(), after: { status: d.status, display: d.displayStatus, approvedBy: d.approvedByName ?? null, rejectReason: d.rejectReason ?? null },
  buttons: T.qa('.buttons button').map((b) => T.norm(b.textContent) + (b.disabled ? ' (disabled)' : '')),
  history: page.history().map((h) => h.action + ' ' + (h.actorName ?? '') + (h.reason ? ' · ' + h.reason : '')) };
