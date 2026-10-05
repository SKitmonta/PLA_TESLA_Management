T.closeToasts(); await T.wait(300);
T.button('Save').click(); await T.wait(3000);
const toasts = T.toasts();
const code = location.pathname.split('/').pop();
const c = await T.api(code);
const d = c.data || {};
return {
  toasts, status: c.status, start: c.startDate, end: c.endDate,
  page: d.page, tagFilter: d.tagFilter,
  card: { image: !!d.card?.image, bullets: d.card?.bullets },
  hero: { bgDesktop: !!d.hero?.bgDesktop, bgMobile: !!d.hero?.bgMobile, headline: d.hero?.headline, sub: d.hero?.subHeadline },
  featureIcon: !!d.featureIcon,
  features: (d.features || []).map((f) => `${f.topic}=${f.value}`),
  advantages: { header: d.advantages?.header, cards: (d.advantages?.cards || []).map((a) => a.topic) },
  recommend: d.recommend?.packages,
  documents: (d.documents || []).map((x) => ({ name: x.name, url: !!x.url })),
};
