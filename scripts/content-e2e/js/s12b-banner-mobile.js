const bn = T.q('#sec-BN');
const ins = T.qa('input[type=file]', bn);
T.setFiles(ins[1], [await T.png('mob.png', 750, 900, '#0f766e')]);
for (let i = 0; i < 30 && T.qa('app-upload-box img', bn).length < 2 && !T.errors(bn).length; i++) await T.wait(500);
T.text(bn, 'Title text', 'ลดหย่อนภาษีได้ ไม่ต้องรอสิ้นปี');
T.text(bn, 'Sub title text', 'ออมสั้น 10 ปี รับเงินคืนครบสัญญา (ข้อความทดสอบ)');
const title = T.input(bn, 'Title text');
return { imgs: T.qa('app-upload-box img', bn).length, errors: T.errors(bn), titleMaxlength: title.getAttribute('maxlength'), subMaxlength: T.input(bn, 'Sub title text').getAttribute('maxlength') };
