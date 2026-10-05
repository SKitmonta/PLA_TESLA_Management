// AS = { user, role } (prepended) — switch the mock user / role the FE sends as X-User-Id / X-Role, then reload
localStorage.setItem('tesla.userId', AS.user);
localStorage.setItem('tesla.role', AS.role);
localStorage.setItem('tesla.dataSource', 'tesla');
setTimeout(() => location.reload(), 50);
return 'reloading as ' + AS.user + ' / ' + AS.role;
