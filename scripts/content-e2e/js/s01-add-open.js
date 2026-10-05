await T.wait(500);
const role = T.norm(T.q('.role-badge')?.textContent);
T.button('Add').click();
await T.wait(1200);
const dlg = T.q('.p-dialog, [role=dialog]');
return { role, dialog: !!dlg, labels: dlg ? T.qa('label', dlg).map((l) => T.norm(l.textContent)) : [] };
