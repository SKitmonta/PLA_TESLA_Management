const dlg = T.q('.p-dialog, [role=dialog]');
T.qa('button', dlg).find((b) => T.norm(b.textContent) === 'Save').click();
for (let i = 0; i < 30 && !/\/package\/add\/CT/.test(location.pathname); i++) await T.wait(500);
await T.wait(2500);
return { url: location.pathname, toasts: T.toasts(), title: T.norm(T.q('h1, .hdr-title, .title')?.textContent) };
