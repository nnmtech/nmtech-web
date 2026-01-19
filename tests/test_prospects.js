const { handler } = require('../functions/prospects');

(async () => {
  // Mock event (x-www-form-urlencoded)
  const event = {
    httpMethod: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': '1.2.3.4' },
    body: 'company=Acme&name=Jane+Doe&email=jane%40example.com&phone=1234567890'
  };

  // Ensure external forward is skipped during local test
  process.env.APPS_SCRIPT_URL = '';

  try {
    const res = await handler(event);
    console.log('Handler response:', res);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
})();
