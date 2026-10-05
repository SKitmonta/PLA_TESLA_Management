// Test helpers for the Content Editor — injected in front of every step (page reloads drop window state)
const T = {
  wait: (ms) => new Promise((r) => setTimeout(r, ms)),
  q: (sel, root = document) => root.querySelector(sel),
  qa: (sel, root = document) => [...root.querySelectorAll(sel)],
  norm: (s) => (s || '').replace(/\s+/g, ' ').trim(),
  /** PrimeNG marks disabled options with class p-disabled / data-p-disabled (no aria-disabled) */
  isDisabled: (li) => li.classList.contains('p-disabled') || li.getAttribute('data-p-disabled') === 'true' || li.getAttribute('aria-disabled') === 'true',
  /** input of a floating-label field inside `root` whose label starts with `label` */
  input(root, label, nth = 0) {
    const ls = T.qa('label', root).filter((l) => T.norm(l.textContent).startsWith(label));
    const l = ls[nth];
    if (!l) return null;
    return document.getElementById(l.getAttribute('for')) || l.parentElement.querySelector('input,textarea');
  },
  setValue(el, v) {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  },
  /** PrimeNG DatePicker only reacts to typing that follows a keydown — focus, keydown, value, input, blur */
  async date(el, v) {
    el.focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true }));
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await T.wait(300);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    el.blur();
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    await T.wait(400);
  },
  text(root, label, v, nth = 0) {
    const el = T.input(root, label, nth);
    if (!el) throw new Error('field not found: ' + label);
    T.setValue(el, v);
  },
  /** p-select: open, click the option with this text (null = first enabled) */
  /** the open overlay that has options (closing overlays linger during the fade-out) */
  async overlay(kind) {
    for (let i = 0; i < 20; i++) {
      const ov = T.qa(kind).filter((o) => T.qa('li[role=option]', o).length && getComputedStyle(o).opacity !== '0').pop();
      if (ov) return ov;
      await T.wait(150);
    }
    return null;
  },
  /** wait until dropdown overlays are gone (no Escape — it would also close a dialog) */
  async closeOverlays() {
    for (let i = 0; i < 25 && T.qa('.p-select-overlay, .p-multiselect-overlay').length; i++) await T.wait(150);
  },
  async pick(selectEl, optText) {
    await T.closeOverlays();
    selectEl.click();
    const ov = await T.overlay('.p-select-overlay');
    const opts = ov ? T.qa('li[role=option]', ov) : [];
    const o = optText === null ? opts.find((x) => !T.isDisabled(x)) : opts.find((x) => T.norm(x.textContent) === optText);
    if (!o) {
      selectEl.click();
      throw new Error('option not found: ' + optText + ' in ' + opts.map((x) => T.norm(x.textContent)).join('|'));
    }
    o.click();
    await T.wait(500);
  },
  /** options of a p-select as "text [disabled]" */
  async options(selectEl) {
    await T.closeOverlays();
    selectEl.click();
    const ov = await T.overlay('.p-select-overlay');
    const out = ov ? T.qa('li[role=option]', ov).map((x) => T.norm(x.textContent) + (T.isDisabled(x) ? ' [disabled]' : '')) : [];
    selectEl.click(); // toggle closed
    await T.closeOverlays();
    return out;
  },
  async pickMulti(msEl, names) {
    await T.closeOverlays();
    msEl.click();
    const ov = await T.overlay('.p-multiselect-overlay');
    for (const n of names) {
      const it = T.qa('li[role=option]', ov).find((i) => T.norm(i.textContent) === n);
      if (!it) throw new Error('multi option not found: ' + n);
      it.click();
      await T.wait(250);
    }
    msEl.click(); // toggle closed
    await T.closeOverlays();
  },
  async png(name, w = 800, h = 600, color = '#1d4ed8') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    x.fillStyle = color;
    x.fillRect(0, 0, w, h);
    x.fillStyle = '#fff';
    x.font = 'bold 48px sans-serif';
    x.fillText('TEST ' + name, 30, h / 2);
    const b = await new Promise((r) => c.toBlob(r, 'image/png'));
    return new File([b], name, { type: 'image/png' });
  },
  /** branded JPEG (navy gradient + product name) for real uploads */
  async brandImg(name, w, h, title, sub, tag) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#00317a'); g.addColorStop(1, '#2f6fd6');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalAlpha = 0.12; x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(w * 0.85, h * 0.2, Math.min(w, h) * 0.45, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(w * 0.1, h * 0.95, Math.min(w, h) * 0.35, 0, Math.PI * 2); x.fill();
    x.globalAlpha = 1;
    const s = Math.min(w / 800, h / 600);
    const pad = Math.round(48 * Math.max(s, 0.8));
    x.fillStyle = '#f5a623';
    x.font = `700 ${Math.round(26 * Math.max(s, 0.9))}px 'Leelawadee UI', Tahoma, sans-serif`;
    x.fillText(tag || 'PhillipLife', pad, pad + 10);
    x.fillStyle = '#ffffff';
    let fs = Math.round(64 * Math.max(s, 0.9));
    x.font = `700 ${fs}px 'Leelawadee UI', Tahoma, sans-serif`;
    while (x.measureText(title).width > w - pad * 2 && fs > 20) { fs -= 2; x.font = `700 ${fs}px 'Leelawadee UI', Tahoma, sans-serif`; }
    x.fillText(title, pad, h / 2);
    x.font = `400 ${Math.round(fs * 0.5)}px 'Leelawadee UI', Tahoma, sans-serif`;
    x.fillText(sub || '', pad, h / 2 + fs * 0.9);
    x.font = `400 ${Math.round(18 * Math.max(s, 0.9))}px 'Leelawadee UI', Tahoma, sans-serif`;
    x.globalAlpha = 0.7;
    x.fillText('ภาพตัวอย่าง (DEV)', pad, h - pad / 2);
    const b = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.88));
    return new File([b], name, { type: 'image/jpeg' });
  },
  pdf(name, padBytes = 0) {
    const s = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n';
    return new File([s, new Uint8Array(padBytes)], name, { type: 'application/pdf' });
  },
  /** one file into one <input type=file> — uploads are done ONE AT A TIME (antivirus) */
  setFiles(input, files) {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  },
  button(label) {
    return T.qa('button').find((b) => T.norm(b.textContent) === label);
  },
  toasts() {
    return T.qa('.p-toast-message').map((t) => T.norm(t.textContent));
  },
  closeToasts() {
    T.qa('.p-toast-message .p-toast-close-button, .p-toast-message button').forEach((b) => b.click());
  },
  errors(root = document) {
    return T.qa('.hint.err, .err', root).map((e) => T.norm(e.textContent)).filter(Boolean);
  },
  async api(code) {
    const r = await fetch('/tesla-admin/api/v2/content/' + code).then((x) => x.json());
    return r.data.result;
  },
  scrollTo(sel) {
    const el = T.q(sel);
    if (el) el.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -10);
  },
};
