await T.wait(1500);
const ci = T.q('#sec-CI');
return {
  nav: T.qa('.nav a, .nav button, nav li, .list-content li').map((e) => T.norm(e.textContent)).filter(Boolean).slice(0, 10),
  slug: T.input(ci, 'URL slug')?.value,
  category: T.norm(T.q('app-select-field .p-select-label', ci)?.textContent),
  chips: T.qa('app-multiselect-field p-multiselect', ci).map((m) => T.qa('.p-multiselect-chip, .p-chip', m).map((c) => T.norm(c.textContent))),
  kf: T.qa('.kf-row').map((r) => T.norm(T.q('.p-select-label', r)?.textContent)),
  ka: T.qa('.ka-card').map((c) => T.norm(T.q('.p-select-label', c)?.textContent)),
  pr: T.qa('#sec-PR .picked').map((b) => T.norm(b.textContent)),
  docs: T.qa('#sec-DOC .docs li').map((l) => T.norm(l.textContent)),
  errors: T.errors(),
};
