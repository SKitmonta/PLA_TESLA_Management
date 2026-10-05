// Create + submit test campaigns through API v2 from the page, as the maker in AS (CMP = [{payload}], prepended)
const call = async (method, path, body) => {
  const r = await fetch('/tesla-admin/api/v2/campaign' + path, {
    method, headers: { 'Content-Type': 'application/json', 'X-User-Id': 'U002' }, body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => null);
  return { http: r.status, result: j?.data?.result ?? null, errors: j?.data?.result?.errors ?? null };
};
const out = [];
for (const p of CMP) {
  const created = await call('POST', '', p);
  if (created.http !== 200) { out.push({ step: 'create', ...created }); continue; }
  const code = created.result.campaignCode;
  const sent = await call('POST', '/' + code + '/submit', p);
  out.push({ code, created: created.result.status, submitted: sent.http === 200 ? sent.result.status : sent });
}
return out;
