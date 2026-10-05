const ci = T.q('#sec-CI');
const out = {};
const saveTry = async (slug) => {
  T.closeToasts(); await T.wait(300);
  T.text(ci, 'URL slug', slug); await T.wait(300);
  T.button('Save').click(); await T.wait(2800);
  return T.toasts();
};
out.upperSpace = await saveTry('Tax Fighter 10/10');
out.underscore = await saveTry('tax_fighter');
out.thai = await saveTry('ภาษี-ไฟท์เตอร์');
return out;
