// Prepare the Content Editor for one full-page screenshot: expand every section, report the
// <main class="content"> scroll geometry for shot_contents.py (scroll + stitch).
for (const h of T.qa('app-editor-section header.head.clickable')) {
  if (!h.parentElement.querySelector(':scope > .body')) h.click();
}
await T.wait(800);
await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
await T.wait(600);
const m = document.querySelector('main.content');
// sticky elements (section nav) would repeat on every stitched screen
for (const el of m.querySelectorAll('*')) if (getComputedStyle(el).position === 'sticky') el.style.setProperty('position', 'static', 'important');
m.scrollTop = 0;
const r = m.getBoundingClientRect();
const c = window.ng.getComponent(T.q('app-content-editor')).content();
return { code: c.contentCode, version: c.versionNo, status: c.status, x: r.left, y: r.top, w: r.width, h: m.clientHeight, total: m.scrollHeight, vw: innerWidth, vh: innerHeight };
