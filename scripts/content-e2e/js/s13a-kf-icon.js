const kf = T.q('#sec-KF');
T.scrollTo('#sec-KF');
T.setFiles(T.q('.icon-asset input[type=file], input[type=file]', kf), [await T.png('kf-icon.png', 800, 600, '#9a3412')]);
for (let i = 0; i < 30 && !T.q('.icon-asset img, app-upload-box img', kf) && !T.errors(kf).length; i++) await T.wait(500);
return { icon: !!T.q('.icon-asset img, app-upload-box img', kf), errors: T.errors(kf) };
