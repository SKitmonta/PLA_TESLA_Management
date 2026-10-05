const page = window.ng.getComponent(T.q('app-content-editor'));
const code = page.content().contentCode;
T.closeToasts(); await T.wait(300);
T.button('Save').click();
for (let i = 0; i < 20 && !T.toasts().length; i++) await T.wait(300);
const toasts = T.toasts();
const r = await T.api(code);
const d = r.data || {};
const url = (v) => (typeof v === 'string' && /^https?:/.test(v) ? 'URL' : v ? 'name' : '-');
return {
  code, toasts, status: r.status, version: r.versionNo, start: r.startDate,
  slug: d.page?.slug, category: d.page?.category, headline: d.hero?.headline,
  images: { thumb: url(d.card?.image), bgDesktop: url(d.hero?.bgDesktop), bgMobile: url(d.hero?.bgMobile), featureIcon: url(d.featureIcon), stickyIcon: url(d.sticky?.icon), attachment: url(d.summary?.attachment) },
  documents: (d.documents || []).filter((x) => x.url).length,
  done: T.qa('.sec-nav button').map((b) => (b.querySelector('.check') ? '✓' : '·') + T.norm(b.querySelector('.ntitle')?.textContent)),
};
