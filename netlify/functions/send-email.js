// Netlify Function: send-email.js
// Sends transactional emails via Resend (https://resend.com)
// Env vars: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Not allowed' };

  const { userId, subject, body, templateKey, data } = JSON.parse(event.body || '{}');

  // Get user email from Supabase
  let toEmail = data?.email;
  if (!toEmail && userId) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const { data: profile } = await sb.from('profiles').select('email,full_name').eq('id', userId).single();
      toEmail = profile?.email;
    } catch (e) {
      console.error('Profile lookup failed:', e.message);
    }
  }

  if (!toEmail) return { statusCode: 404, body: 'Email not found' };

  const html = buildHtml(subject, body);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from:     'FitPro <noreply@fitpro.in>',
        to:       toEmail,
        reply_to: 'rahulmishraoffical69@gmail.com',
        subject,
        html,
        text: body
      })
    });

    const result = await res.json();
    return { statusCode: 200, body: JSON.stringify({ id: result.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

function buildHtml(subject, textBody) {
  const lines = textBody.trim().split('\n');
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#080808;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:580px;margin:40px auto;background:#161616;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
  <div style="background:linear-gradient(135deg,#FF4500,#FF6A35);padding:28px 32px;text-align:center">
    <div style="font-size:2rem;margin-bottom:6px">💪</div>
    <div style="font-size:1.4rem;font-weight:800;color:white;letter-spacing:-0.5px">FitPro</div>
    <div style="font-size:0.82rem;color:rgba(255,255,255,0.8);margin-top:2px">India's #1 Fitness Marketplace</div>
  </div>
  <div style="padding:32px">
    <h2 style="color:#f0f0f0;font-size:1.1rem;margin:0 0 18px;font-weight:700">${subject.replace(/[✅📅🎉⏰🪙]/g,'')}</h2>
    <div style="color:#A0A0A0;font-size:0.875rem;line-height:1.8">
      ${lines.map(l => l.trim()
        ? `<p style="margin:0 0 8px;color:${l.startsWith('✓')||l.startsWith('•')||l.startsWith('💪')?'#C8C8C8':'#A0A0A0'}">${l}</p>`
        : '<br>'
      ).join('')}
    </div>
  </div>
  <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px">
    <div style="font-size:0.75rem;color:#555">© 2024 FitPro. All rights reserved.</div>
    <div style="font-size:0.75rem">
      <a href="tel:8287034496" style="color:#FF4500;text-decoration:none">📞 8287034496</a>
      &nbsp;·&nbsp;
      <a href="https://wa.me/918287034496" style="color:#25D366;text-decoration:none">💬 WhatsApp</a>
    </div>
  </div>
</div>
</body>
</html>`;
}
