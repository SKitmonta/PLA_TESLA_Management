// Campaign approval guards from the page with an explicit dev actor (CODES = { pending, approved }, prepended)
const call = async (path, user, body) => {
  const r = await fetch('/tesla-admin/api/v2/campaign/' + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Id': user }, body: JSON.stringify(body ?? {}),
  });
  const j = await r.json().catch(() => null);
  return { http: r.status, errors: j?.data?.result?.errors ?? null };
};
return {
  'G-01 approve own work (maker U002)': await call(CODES.pending + '/approve', 'U002'),
  'G-02 reject without reason': await call(CODES.pending + '/reject', 'U003', { reason: ' ' }),
  'G-03 suspend a Pending campaign': await call(CODES.pending + '/suspend', 'U002'),
  'G-04 resume a campaign that is not suspended': await call(CODES.pending + '/resume', 'U002'),
  'G-05 approve a Draft (CMP25690004)': await call('CMP25690004/approve', 'U003'),
};
