const ci = T.q('#sec-CI');
const sd = T.input(ci, 'Start Date'), ed = T.input(ci, 'End Date');
const code = location.pathname.split('/').pop();
const out = {};
const trySave = async () => { T.closeToasts(); await T.wait(300); T.button('Save').click(); await T.wait(2800); const c = await T.api(code); return { toasts: T.toasts(), saved: { start: c.startDate, end: c.endDate } }; };
T.text(ci, 'URL slug', 'tax-fighter-10-10-test');
// a) start date in the past (minimum = today 05/10/2026)
await T.date(sd, '01/10/2026');
out.pastStart = { shown: sd.value, ...(await trySave()) };
// b) valid start
await T.date(sd, '06/10/2026');
out.validStart = { shown: sd.value, ...(await trySave()) };
// c) end date before start
await T.date(ed, '01/10/2026');
out.endBeforeStart = { shown: ed.value, ...(await trySave()) };
// d) clear the bad end date
await T.date(ed, '');
return out;
