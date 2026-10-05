const doc = T.q('#sec-DOC');
T.setFiles(T.q('input[type=file]', doc), [T.pdf('tax-fighter-terms.pdf')]);
await T.wait(4000);
return { docs: T.qa('.docs li', doc).map((l) => T.norm(l.textContent)), errors: T.errors(doc) };
