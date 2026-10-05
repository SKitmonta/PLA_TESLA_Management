const bn = T.q('#sec-BN');
T.scrollTo('#sec-BN');
const ins = T.qa('input[type=file]', bn);
T.setFiles(ins[0], [await T.png('desk.png', 1920, 640, '#00317a')]);
for (let i = 0; i < 30 && T.qa('app-upload-box img', bn).length < 1 && !T.errors(bn).length; i++) await T.wait(500);
return { imgs: T.qa('app-upload-box img', bn).length, errors: T.errors(bn) };
