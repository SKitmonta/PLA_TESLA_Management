const th = T.q('#sec-TH');
T.scrollTo('#sec-TH');
T.setFiles(T.q('input[type=file]', th), [await T.png('thumb.png', 800, 600, '#0b4aa2')]);
for (let i = 0; i < 30 && !T.q('app-upload-box img', th) && !T.errors(th).length; i++) await T.wait(500);
T.text(th, '1st Thumbnail', 'ลดหย่อนภาษีได้สูงสุด 100,000 บาท');
T.text(th, '2nd Thumbnail', 'จ่ายเบี้ย 10 ปี คุ้มครอง 10 ปี');
T.text(th, '3rd Thumbnail', 'ไม่ต้องตรวจสุขภาพ');
await T.wait(500);
return { img: T.q('app-upload-box img', th)?.getAttribute('src')?.split('/').slice(-4).join('/') || null, errors: T.errors(th) };
