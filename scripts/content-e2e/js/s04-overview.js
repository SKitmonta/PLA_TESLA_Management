await T.wait(300);
const code = location.pathname.split('/').pop();
const c = await T.api(code);
return {
  code, status: c.status, template: c.template, channel: c.channelCode, pkg: c.packageCode,
  nav: T.qa('.nav a, .nav button, .list-content li, nav li').map((e) => T.norm(e.textContent)).filter(Boolean).slice(0, 12),
  sections: T.qa('section.card h2').map((h) => T.norm(h.textContent)),
  header: T.norm(T.q('.hdr, header.content-hdr, .editor-hdr')?.textContent).slice(0, 200),
};
