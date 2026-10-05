// Generic "fill only what is empty" for one content — PLAN is prepended by update_all.py
const page = window.ng.getComponent(T.q('app-content-editor'));
const c = page.content();
const f = page.form();
if (c.status !== 'DRAFT') return { skipped: 'status ' + c.status };
const log = [];
/** '' / null / undefined / booleans count as empty · numbers are values · arrays & objects are empty when every item is */
const isEmpty = (v) =>
  v === undefined || v === null || v === '' || typeof v === 'boolean' ||
  (Array.isArray(v) ? v.every((x) => isEmpty(x)) : typeof v === 'object' && Object.values(v).every((x) => isEmpty(x)));
const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), f);
const setIfEmpty = (path, val) => {
  const keys = path.split('.');
  const last = keys.pop();
  const obj = keys.reduce((o, k) => o[k], f);
  // coverage rows carry a default unit ('บาท') — a row counts as empty when it has no topic and no amount
  const empty = path === 'coverage' ? obj[last].every((r) => !r.topic && r.amount == null) : isEmpty(obj[last]);
  if (empty) {
    obj[last] = val;
    log.push(path);
  }
};

// expand collapsed sections so every field / upload box is rendered
for (const h of T.qa('app-editor-section header.head.clickable')) {
  if (!h.parentElement.querySelector(':scope > .body')) h.click();
}
await T.wait(500);

for (const [path, val] of Object.entries(PLAN.set || {})) setIfEmpty(path, val);

// OL_OB: topics / cards / recommend through the editor's own methods (values come from Master)
if (c.template === 'OL_OB') {
  const ol = window.ng.getComponent(T.q('app-editor-ol-ob'));
  for (let i = 0; i < 30 && (!ol.featureTopics.list().length || !ol.advantageTopics.list().length); i++) await T.wait(200);
  if (PLAN.kf && !f.features.some((r) => r.topic && ol.featureTopics.find(r.topic))) {
    f.features.splice(0, f.features.length);
    PLAN.kf.forEach((code, i) => { ol.addFeature(); ol.setTopic(i, code); });
    log.push('features=' + PLAN.kf.join(','));
  }
  if (PLAN.ka && !f.advantages.cards.some((a) => a.topic && ol.advantageTopics.find(a.topic))) {
    f.advantages.cards.splice(0, f.advantages.cards.length);
    PLAN.ka.forEach((code, i) => { ol.addAdvantage(); ol.setAdvantage(i, code); });
    log.push('advantages=' + PLAN.ka.join(','));
  }
  for (let i = 0; i < 20 && !ol.options().length && !ol.optionsError(); i++) await T.wait(200);
  if (!f.recommend.packages.length) {
    ol.options().slice(0, 2).forEach((p) => ol.pickRecommend(p.packageCode));
    log.push('recommend=' + f.recommend.packages.join(','));
  }
}
window.ng.applyChanges(page);
await T.wait(500);
return { code: c.contentCode, template: c.template, version: c.versionNo, filled: log };
