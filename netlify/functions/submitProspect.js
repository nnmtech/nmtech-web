// Netlify Function: submitProspect (Nodemailer SMTP)
// Receives form POST (application/x-www-form-urlencoded) and sends email via SMTP using Nodemailer.

const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = event.body || '';
    const params = new URLSearchParams(body);

    // Honeypot spam protection
    if (params.get('honeypot')) {
      return { statusCode: 302, headers: { Location: '/success.html' }, body: '' };
    }

    const company = params.get('company') || 'N/A';
    const name = params.get('name') || 'N/A';
    const email = params.get('email') || 'N/A';
    const phone = params.get('phone') || 'N/A';
    const employees = params.get('employees') || 'N/A';
    const pain = params.get('pain') || 'N/A';

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

    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT || '587';
    const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const EMAIL_TO = process.env.EMAIL_TO;
    const EMAIL_FROM = process.env.EMAIL_FROM;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_TO || !EMAIL_FROM) {
      console.error('Missing SMTP env vars');
      return { statusCode: 500, body: 'Server misconfiguration: missing email settings' };
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });

    // send mail
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: subject,
      text: textContent,
      html: htmlContent
    });

    return { statusCode: 302, headers: { Location: '/success.html' }, body: '' };

  } catch (err) {
    console.error('Function error', err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
