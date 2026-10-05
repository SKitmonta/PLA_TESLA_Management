// Approval API guards, fired from the page (same origin → proxy → API :5277) with an explicit dev actor header
const call = async (method, path, user, body) => {
  const r = await fetch('/tesla-admin/api/v2/content/' + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-User-Id': user },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = await r.json().catch(() => null);
  return { http: r.status, code: j?.status ?? null, errors: j?.data?.result?.errors ?? null };
};
return {
  'A-01 approve own work (creator SYSTEM)': await call('POST', 'CT000014/approve', 'SYSTEM', {}),
  'A-02 approve a Draft (CT000009)': await call('POST', 'CT000009/approve', 'U003', {}),
  'A-03 reject without reason': await call('POST', 'CT000014/reject', 'U003', { reason: '   ' }),
  'A-04 reject reason 501 chars': await call('POST', 'CT000014/reject', 'U003', { reason: 'ก'.repeat(501) }),
  'A-05 review unknown content': await call('GET', 'CT999999/review', 'U003'),
  'A-06 reject a Draft (CT000009)': await call('POST', 'CT000009/reject', 'U003', { reason: 'x' }),
};
