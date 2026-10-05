const ci = T.q('#sec-CI');
T.closeToasts(); await T.wait(300);
T.text(ci, 'URL slug', 'max-ten-one-10-1-xtra-ui-test'); await T.wait(300);
T.button('Save').click(); await T.wait(2800);
return { toasts: T.toasts() };
