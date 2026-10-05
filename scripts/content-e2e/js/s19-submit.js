T.closeToasts(); await T.wait(300);
T.button('Submit').click(); await T.wait(3500);
const code = location.pathname.split('/').pop();
const c = await T.api(code);
return { toasts: T.toasts(), status: c.status, saveDisabled: T.button('Save')?.disabled, submitDisabled: T.button('Submit')?.disabled };
