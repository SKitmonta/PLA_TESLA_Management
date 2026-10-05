const kf = T.q('#sec-KF');
const rows = () => T.qa('.kf-row', kf);
const read = () => rows().map((r) => ({ topic: T.norm(T.q('.p-select-label', r)?.textContent), value: T.q('app-text-field input', r)?.value, readonly: T.q('app-text-field input', r)?.readOnly, icon: T.q('.kf-icon img', r)?.getAttribute('src')?.split('/').pop() || null }));
const addBtn = () => T.qa('button', kf).find((b) => b.getAttribute('aria-label') === 'เพิ่มหัวข้อ');
const out = {};
out.options = await T.options(T.q('p-select', rows()[0]));
await T.pick(T.q('p-select', rows()[0]), 'คุ้มครองชีวิตตลอดสัญญา');
addBtn().click(); await T.wait(400);
await T.pick(T.q('p-select', rows()[1]), 'ลดหย่อนภาษีสูงสุด');
addBtn().click(); await T.wait(400);
out.row3Options = await T.options(T.q('p-select', rows()[2]));
await T.pick(T.q('p-select', rows()[2]), 'สมัครง่าย');
// add then remove a 4th row
addBtn().click(); await T.wait(400);
out.rowsAfterAdd = rows().length;
T.qa('button', rows()[3]).find((b) => b.getAttribute('aria-label') === 'ลบหัวข้อ').click(); await T.wait(400);
out.rowsAfterRemove = rows().length;
out.rows = read();
return out;
