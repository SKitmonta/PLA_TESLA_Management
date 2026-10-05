const ci = T.q('#sec-CI');
return {
  slugDisabled: T.input(ci, 'URL slug')?.disabled || T.input(ci, 'URL slug')?.readOnly,
  addFeatureDisabled: T.qa('#sec-KF button').find((b) => b.getAttribute('aria-label') === 'เพิ่มหัวข้อ')?.disabled,
  addCardDisabled: T.q('#sec-KA .ka-add')?.disabled,
  resultDisabled: T.q('#sec-PR .result')?.disabled ?? null,
  banner: T.norm(T.q('.lock-banner, .locked, .p-message')?.textContent).slice(0, 200),
  saveDisabled: T.button('Save')?.disabled,
};
