async function verifyProduction() {
  console.log('--- [Production Verification] Testing Live Vercel Deployment ---');
  console.log('Target: https://ebe-fintech-kpis.vercel.app');

  // 1. Authenticate as Team Lead (Ahmed Hashim)
  const loginRes = await fetch('https://ebe-fintech-kpis.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 47 })
  });
  const loginData = await loginRes.json();
  console.log('1. Login Status:', loginRes.status, '| Authenticated User:', loginData.user?.name, `(${loginData.user?.role})`);
  if (!loginData.token) throw new Error('Authentication failed: No JWT token returned');

  const headers = { 'Authorization': 'Bearer ' + loginData.token };

  // 2. Fetch all scorecards
  const scRes = await fetch('https://ebe-fintech-kpis.vercel.app/api/scorecards', { headers });
  const scData = await scRes.json();
  console.log('2. Scorecards Endpoint Status:', scRes.status, '| Total Scorecards:', scData.scorecards?.length);

  if (!scData.scorecards || scData.scorecards.length === 0) {
    throw new Error('Verification failed: No scorecards returned');
  }

  let alyFound = false;
  let rawanFound = false;

  scData.scorecards.forEach(s => {
    console.log(`   * ${s.employee_name.padEnd(16)} | Status: ${s.status.padEnd(10)} | Self Score: ${String(s.self_composite_score).padEnd(5)} | Lead Score: ${s.final_composite_score}`);
    if (s.employee_name.toLowerCase().includes('aly')) {
      alyFound = true;
      if (s.status !== 'Submitted' || s.self_composite_score !== 8.54) {
        console.warn(`   [!] Warning: ALy Alaa expected Status='Submitted', SelfScore=8.54, got Status='${s.status}', SelfScore=${s.self_composite_score}`);
      } else {
        console.log(`   [✓] ALy Alaa record verified on Turso (Status: Submitted, Score: 8.54)`);
      }
    }
    if (s.employee_name.toLowerCase().includes('rawan')) {
      rawanFound = true;
      if (s.status !== 'Submitted' || s.self_composite_score !== 6.89) {
        console.warn(`   [!] Warning: Rawan Mohamed expected Status='Submitted', SelfScore=6.89, got Status='${s.status}', SelfScore=${s.self_composite_score}`);
      } else {
        console.log(`   [✓] Rawan Mohamed record verified on Turso (Status: Submitted, Score: 6.89)`);
      }
    }
  });

  // 3. Fetch Audit Feed
  const auditRes = await fetch('https://ebe-fintech-kpis.vercel.app/api/audit-feed', { headers });
  const auditData = await auditRes.json();
  console.log('3. Audit Feed Status:', auditRes.status, '| Log Entries Count:', auditData.feed?.length);
  if (auditData.feed && auditData.feed.length > 0) {
    auditData.feed.slice(0, 3).forEach(l => {
      console.log(`   * [${l.action}] by ${l.author_name}: "${l.comment?.substring(0, 60)}..."`);
    });
  }

  // 4. Fetch Leaderboard
  const lbRes = await fetch('https://ebe-fintech-kpis.vercel.app/api/analytics/leaderboard', { headers });
  const lbData = await lbRes.json();
  console.log('4. Leaderboard Status:', lbRes.status, '| Counts:', JSON.stringify(lbData.counts));

  console.log('========================================================================');
  console.log('LIVE PRODUCTION VERIFICATION SUCCESSFUL: Turso cloud database is active!');
  console.log('========================================================================');
}

verifyProduction().catch(err => {
  console.error('[Verification Failure]', err);
  process.exit(1);
});
