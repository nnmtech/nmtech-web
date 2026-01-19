// Netlify Function: submitProspect
// Receives form POST (application/x-www-form-urlencoded) and sends email via SendGrid

const SENDGRID_API = 'https://api.sendgrid.com/v3/mail/send';

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = event.body || '';
    // Parse urlencoded body
    const params = new URLSearchParams(body);
    const company = params.get('company') || 'N/A';
    const name = params.get('name') || 'N/A';
    const email = params.get('email') || 'N/A';
    const phone = params.get('phone') || 'N/A';
    const employees = params.get('employees') || 'N/A';
    const pain = params.get('pain') || 'N/A';

    // Prevent spam via honeypot
    const honeypot = params.get('honeypot');
    if (honeypot) {
      // silently accept but do nothing
      return { statusCode: 302, headers: { Location: '/success.html' }, body: '' };
    }

    const subject = `New prospect: ${company} — ${name}`;
    const textContent = `New prospect submission\n\nCompany: ${company}\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nEmployees: ${employees}\nPain: ${pain}`;
    const htmlContent = `<h2>New prospect submission</h2>
      <ul>
        <li><strong>Company:</strong> ${company}</li>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone}</li>
        <li><strong>Employees:</strong> ${employees}</li>
        <li><strong>Pain:</strong> ${pain}</li>
      </ul>`;

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const EMAIL_TO = process.env.EMAIL_TO;
    const EMAIL_FROM = process.env.EMAIL_FROM;

    if (!SENDGRID_API_KEY || !EMAIL_TO || !EMAIL_FROM) {
      console.error('Missing SendGrid env vars');
      return { statusCode: 500, body: 'Server misconfiguration: missing email settings' };
    }

    const payload = {
      personalizations: [{ to: [{ email: EMAIL_TO }] }],
      from: { email: EMAIL_FROM },
      subject: subject,
      content: [
        { type: 'text/plain', value: textContent },
        { type: 'text/html', value: htmlContent }
      ]
    };

    const res = await fetch(SENDGRID_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('SendGrid error', res.status, errText);
      return { statusCode: 502, body: 'Failed to send email' };
    }

    // Redirect to success page after sending
    return { statusCode: 302, headers: { Location: '/success.html' }, body: '' };

  } catch (err) {
    console.error('Function error', err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
