async function verifyProduction() {
  const loginRes = await fetch('https://ebe-fintech-kpis.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 47 })
  });
  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status, 'User:', loginData.user?.name);
  if (!loginData.token) throw new Error('No login token');

  const scRes = await fetch('https://ebe-fintech-kpis.vercel.app/api/scorecards', {
    headers: { 'Authorization': 'Bearer ' + loginData.token }
  });
  const scData = await scRes.json();
  console.log('Scorecards Status:', scRes.status, 'Response:', scData);
  console.log('Total scorecards returned:', scData.scorecards?.length);
  if (scData.scorecards) {
    scData.scorecards.forEach(s => {
      console.log('  - ' + s.employee_name + ': Status=' + s.status + ', SelfScore=' + s.self_composite_score + ', LeadScore=' + s.final_composite_score);
    });
  }
}
verifyProduction().catch(console.error);
