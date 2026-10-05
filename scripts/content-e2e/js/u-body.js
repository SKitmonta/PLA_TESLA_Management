// One upload-API test case from inside the page (same origin → /tesla-admin proxy → API :5277)
// CASE = { id, form: {PackageCode, ChannelCode, VersionNo, Kind, Slot, LangCode?, Index?}, file: {make, name, type, ...}, verify? } (prepended)
const enc = new TextEncoder();
const png1 = async (w, h, color) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = color || '#00317a'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#f5a623'; x.font = `700 ${Math.round(h / 6)}px Tahoma, sans-serif`;
  x.fillText('API TEST ' + CASE.id, 20, h / 2);
  return new Promise((r) => c.toBlob(r, CASE.file.canvasType || 'image/png', 0.9));
};
const bytes = (arr) => new Blob([new Uint8Array(arr)]);
const pad = (head, total) => new Blob([head, new Uint8Array(Math.max(0, total - head.length))]);
const F = CASE.file || {};
let blob = null;
switch (F.make) {
  case 'none': break;
  case 'empty': blob = new Blob([]); break;
  case 'brand': blob = await T.brandImg('x.jpg', F.w, F.h, F.title || ('API TEST ' + CASE.id), F.sub || '', 'PhillipLife · API test'); break;
  case 'canvas': blob = await png1(F.w || 400, F.h || 300, F.color); break;
  case 'gif': blob = bytes([0x47,0x49,0x46,0x38,0x39,0x61,1,0,1,0,0x80,0,0,0,0x31,0x7a,0xff,0xff,0xff,0x21,0xf9,4,1,0,0,0,0,0x2c,0,0,0,0,1,0,1,0,0,2,2,0x44,1,0,0x3b]); break;
  case 'bmp': { // 2x2 24-bit BMP
    const px = [0x7a,0x31,0x00, 0x7a,0x31,0x00, 0,0, 0x23,0xa6,0xf5, 0x23,0xa6,0xf5, 0,0];
    const size = 54 + px.length;
    const h = [0x42,0x4d, size,0,0,0, 0,0,0,0, 54,0,0,0, 40,0,0,0, 2,0,0,0, 2,0,0,0, 1,0, 24,0, 0,0,0,0, px.length,0,0,0, 0x13,0x0b,0,0, 0x13,0x0b,0,0, 0,0,0,0, 0,0,0,0];
    blob = bytes([...h, ...px]); break;
  }
  case 'text': blob = new Blob([enc.encode(F.text)]); break;
  case 'pdf': blob = T.pdf('x.pdf', F.padBytes || 0); break;
  case 'pad': blob = pad(enc.encode(F.head || ''), F.total); break;
  case 'padpng': blob = pad(new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), F.total); break;
  default: return { id: CASE.id, error: 'unknown file.make ' + F.make };
}
const body = new FormData();
if (blob) body.append('File', new File([blob], F.name, { type: F.type ?? '' }), F.name);
for (const [k, v] of Object.entries(CASE.form)) if (v !== undefined && v !== null) body.append(k, String(v));
const t0 = performance.now();
const res = await fetch('/tesla-admin/api/v1/image/upload', { method: 'POST', body });
const ms = Math.round(performance.now() - t0);
let json = null;
const raw = await res.text();
try { json = JSON.parse(raw); } catch { /* non-JSON (framework error page) */ }
const result = json?.data?.result ?? json?.data ?? null;
const out = {
  id: CASE.id, http: res.status, code: json?.status ?? null, message: json?.message ?? raw.slice(0, 160), ms,
  sentBytes: blob ? blob.size : 0,
};
if (result && result.publicUrl) {
  out.fileName = result.fileName; out.relativePath = result.relativePath; out.publicUrl = result.publicUrl;
  out.mimeType = result.mimeType; out.sizeBytes = result.sizeBytes;
}
// verify: fetch the stored file back (same origin through the proxy) and compare SHA-256 with what was sent
if (CASE.verify && out.publicUrl && blob) {
  const sha = async (b) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await b.arrayBuffer()))).map((x) => x.toString(16).padStart(2, '0')).join('');
  const back = await fetch(out.publicUrl.replace(/^https?:\/\/[^/]+/, ''), { cache: 'no-store' });
  const got = await back.blob();
  out.fetch = { http: back.status, contentType: back.headers.get('content-type'), bytes: got.size, sameBytes: (await sha(got)) === (await sha(blob)) };
}
return out;
