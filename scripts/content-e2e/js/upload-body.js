// One real upload through the page's own upload box — UP = { sel, idx, path, kind, name, w, h, b64, title, sub } (prepended)
const page = window.ng.getComponent(T.q('app-content-editor'));
const f = page.form();
const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), f);
const cur = UP.path ? get(UP.path) : null;
if (UP.path && typeof cur === 'string' && /^https?:\/\//.test(cur)) return { skipped: 'already uploaded', path: UP.path };
if (UP.docs && f.documents.some((d) => d.url)) return { skipped: 'documents already uploaded' };
for (const h of T.qa('app-editor-section header.head.clickable')) if (!h.parentElement.querySelector(':scope > .body')) h.click();
await T.wait(400);
const input = T.qa(UP.sel)[UP.idx || 0];
if (!input) return { error: 'input not found: ' + UP.sel };
input.scrollIntoView({ block: 'center' });
let file;
if (UP.b64) {
  const bin = atob(UP.b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  file = new File([bytes], UP.name, { type: 'application/pdf' });
} else {
  file = await T.brandImg(UP.name, UP.w, UP.h, UP.title, UP.sub, UP.tag);
}
const box = input.closest('app-upload-box');
T.setFiles(input, [file]);
for (let i = 0; i < 60; i++) {
  await T.wait(500);
  const v = UP.path ? get(UP.path) : null;
  if (v && /^https?:\/\//.test(v)) return { ok: true, path: UP.path, url: v.split('/').slice(-4).join('/') };
  if (UP.docs) {
    const d = f.documents.find((x) => x.name === UP.name);
    if (d && d.url) return { ok: true, doc: d.url.split('/').slice(-4).join('/') };
  }
  const err = box ? T.errors(box) : T.errors(input.closest('section, app-editor-section') || document);
  if (err.length) return { error: err };
}
return { error: 'timeout waiting for upload' };
