const { Redis } = (() => {
  try { return require('@upstash/redis'); } catch (e) { return {}; }
})();
const fetchLib = (typeof fetch !== 'undefined') ? fetch : (typeof global !== 'undefined' ? global.fetch : undefined);
const fetchFn = fetchLib || (function(){ try { return require('node-fetch'); } catch(e){ return null } })();

// In-memory fallback rate limiter for local testing when Upstash is not configured
const localRateMap = new Map();

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Parse body (support JSON and x-www-form-urlencoded)
  let bodyObj = {};
  const contentType = (event.headers['content-type'] || event.headers['Content-Type'] || '').toLowerCase();
  try {
    if (contentType.includes('application/json')) {
      bodyObj = JSON.parse(event.body || '{}');
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const { parse } = require('querystring');
      bodyObj = parse(event.body || '');
    } else if (contentType.includes('multipart/form-data')) {
      // Netlify functions don't expose raw multipart parsing by default here.
      // Recommend sending application/x-www-form-urlencoded or JSON from the client.
      return { statusCode: 415, body: JSON.stringify({ error: 'Unsupported Media Type. Send JSON or x-www-form-urlencoded.' }) };
    } else {
      // Try JSON fallback
      try { bodyObj = JSON.parse(event.body || '{}'); } catch(e) { bodyObj = {}; }
    }
  } catch (err) {
    console.error('Body parse error', err);
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  // Rate limiting: prefer Upstash Redis, fallback to in-memory map
  const ip = (event.headers['x-forwarded-for'] || event.headers['client-ip'] || event.requestContext?.identity?.sourceIp || 'unknown').split(',')[0].trim();
  const key = `rate:${ip}`;

  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN && Redis) {
      const redis = new Redis.Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, 60);
      if (count > 10) {
        return { statusCode: 429, body: JSON.stringify({ error: 'Rate limited' }) };
      }
    } else {
      // local fallback
      const now = Date.now();
      const entry = localRateMap.get(key) || { count: 0, ts: now };
      if (now - entry.ts > 60_000) { entry.count = 0; entry.ts = now; }
      entry.count += 1;
      localRateMap.set(key, entry);
      if (entry.count > 10) return { statusCode: 429, body: JSON.stringify({ error: 'Rate limited' }) };
    }
  } catch (err) {
    console.error('Rate limiter error', err);
    // don't fail open in production — but allow request to proceed if rate limiter failed unexpectedly
  }

  // Honeypot
  if (bodyObj.honeypot) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Spam detected' }) };
  }

  // Sanitize and validate fields
  const company = (bodyObj.company || '').toString().trim().slice(0, 100);
  const name = (bodyObj.name || '').toString().trim().slice(0, 50);
  const email = (bodyObj.email || '').toString().toLowerCase().trim();
  const phone = (bodyObj.phone || '').toString().replace(/[^\d+]/g, '').slice(0, 20);
  const size = (bodyObj.size || '').toString().slice(0, 20);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Valid email required' }) };
  }

  const payload = {
    company, name, email, phone, size,
    status: 'Hot', source: bodyObj.source || 'Landing', timestamp: new Date().toISOString()
  };

  try {
    // Forward to Google Apps Script or configured webhook
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    if (appsScriptUrl) {
      const fetcher = fetchFn;
      if (!fetcher) throw new Error('No fetch available in function environment');
      const res = await fetcher(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        console.error('Apps Script responded with', res.status);
      }
    } else {
      console.warn('APPS_SCRIPT_URL not configured; skipping external forward');
    }

    // SendGrid notification (optional)
    try {
      const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
      const SENDGRID_FROM = process.env.SENDGRID_FROM; // e.g. "no-reply@nmtechmsp.com"
      const SENDGRID_NOTIFY_TO = process.env.SENDGRID_NOTIFY_TO; // internal notifications

      if (SENDGRID_API_KEY && SENDGRID_FROM && SENDGRID_NOTIFY_TO) {
        const sg = require('@sendgrid/mail');
        sg.setApiKey(SENDGRID_API_KEY);

        // Notification to internal team
        const notifyMsg = {
          to: SENDGRID_NOTIFY_TO,
          from: SENDGRID_FROM,
          subject: `New prospect: ${company || name}`,
          text: `New prospect submitted:\n\nCompany: ${company}\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nSize: ${size}\nSource: ${payload.source}`,
          html: `<p>New prospect submitted</p><ul><li><strong>Company:</strong> ${company}</li><li><strong>Name:</strong> ${name}</li><li><strong>Email:</strong> ${email}</li><li><strong>Phone:</strong> ${phone}</li><li><strong>Size:</strong> ${size}</li></ul>`
        };

        await sg.send(notifyMsg);

        // Optional confirmation to prospect
        const SEND_CONFIRMATION = process.env.SEND_CONFIRMATION_EMAIL === '1' || process.env.SEND_CONFIRMATION_EMAIL === 'true';
        if (SEND_CONFIRMATION) {
          const confirmMsg = {
            to: email,
            from: SENDGRID_FROM,
            subject: 'Your Free IT Assessment is Scheduled',
            text: `Thanks ${name || ''},\n\nWe've received your request for a free IT assessment. We'll contact you shortly to schedule.`,
            html: `<p>Thanks ${name || ''},</p><p>We've received your request for a free IT assessment. We'll contact you shortly to schedule.</p>`
          };
          await sg.send(confirmMsg);
        }
      } else {
        console.log('SendGrid not configured; skipping email notifications');
      }
    } catch (emailErr) {
      console.error('SendGrid error:', emailErr);
      // do not fail the whole request if email fails
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error('Prospect handler error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
