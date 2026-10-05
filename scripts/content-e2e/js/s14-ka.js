const ka = T.q('#sec-KA');
T.scrollTo('#sec-KA');
T.text(ka, 'Key Advantages Header', 'ทำไมต้อง Tax Fighter 10/10');
const cards = () => T.qa('.ka-card', ka);
const out = { cardsAtStart: cards().length };
out.options = await T.options(T.q('p-select', cards()[0]));
const picks = ['ลดหย่อนภาษีสูงสุด', 'ไม่ต้องตรวจสุขภาพ', 'การันตี'];
for (let i = 0; i < picks.length; i++) await T.pick(T.q('p-select', cards()[i]), picks[i]);
// 4th card: add, check duplicate options, then remove
T.q('.ka-add', ka).click(); await T.wait(400);
out.card4Options = await T.options(T.q('p-select', cards()[3]));
T.qa('button', cards()[3]).find((b) => b.getAttribute('aria-label') === 'ลบการ์ด').click(); await T.wait(400);
out.cards = cards().map((c) => ({ topic: T.norm(T.q('.p-select-label', c)?.textContent), title: T.qa('app-text-field input', c)[0]?.value, sub: T.qa('app-text-field input', c)[1]?.value, img: T.q('.ka-img img', c)?.getAttribute('src')?.split('/').pop() || null, readonly: T.qa('app-text-field input', c).every((i) => i.readOnly) }));
return out;
