// Mask seller names on the page before a screenshot (PDPA / rules.md §3): names come from the Tesla Seller API,
// every text node containing one is rewritten to "<first char>•••".
const ws = await fetch('/tesla-admin/api/v2/people/workspaces', { headers: { 'X-User-Id': 'U009' } }).then(r => r.json());
const names = new Set();
for (const w of ws.data.result) {
  const b = await fetch(`/tesla-admin/api/v2/people/workspaces/${w.packageCode}/${w.channelCode}`, { headers: { 'X-User-Id': 'U009' } }).then(r => r.json());
  for (const s of b.data.result.sellers) if (s.sellerName && s.sellerName !== s.sellerCode) names.add(s.sellerName);
}
const list = [...names].sort((a, b) => b.length - a.length);
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let n = 0;
for (let node = walker.nextNode(); node; node = walker.nextNode()) {
  let t = node.nodeValue;
  for (const name of list) if (t.includes(name)) { t = t.split(name).join(name.slice(0, 1) + '•••'); n++; }
  if (t !== node.nodeValue) node.nodeValue = t;
}
for (const i of document.querySelectorAll('input')) for (const name of list) if (i.value.includes(name)) i.value = i.value.split(name).join(name.slice(0, 1) + '•••');
return { names: list.length, masked: n };
