const th = T.q('#sec-TH');
const box = T.q('app-upload-box', th);
const input = T.q('input[type=file]', th);
const out = {};
// 1) too big for this box (5 MB) — rejected in the browser, nothing sent
T.setFiles(input, [new File([new Uint8Array(6 * 1024 * 1024)], 'big.png', { type: 'image/png' })]);
await T.wait(800);
out.tooBig = T.errors(box);
// 2) wrong content (text file named .png) — sent to the API, which checks the real file type
T.setFiles(input, [new File(['this is not an image'], 'fake.png', { type: 'image/png' })]);
for (let i = 0; i < 20 && !T.errors(box).some((e) => e !== out.tooBig[0]); i++) await T.wait(500);
out.fakeImage = T.errors(box);
out.stillHasPreview = !!T.q('img', box);
return out;
