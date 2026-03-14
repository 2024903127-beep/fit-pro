// Netlify / Supabase Edge Function — Email Sender via Resend
// Deploy as Supabase Edge Function OR Netlify Function

// Using Resend (https://resend.com) — free tier: 100 emails/day
// Install: npm install resend

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'FitPro <noreply@fitpro.in>';
const REPLY_TO = 'rahulmishraoffical69@gmail.com';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { userId, subject, body, templateKey, data } = JSON.parse(event.body);

    // Get user email from Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', userId).single();

    if (!profile?.email) return { statusCode: 404, body: 'User email not found' };

    // Send email
    const { data: emailData, error } = await resend.emails.send({
      from: FROM,
      to: profile.email,
      replyTo: REPLY_TO,
      subject,
      text: body,
      html: buildHtmlEmail(subject, body, profile.full_name)
    });

    if (error) throw error;

    // Also send WhatsApp notification for critical events
    if (['booking_confirmed', 'session_reminder'].includes(templateKey)) {
      await sendWhatsAppNotification(profile, templateKey, data);
    }

    return { statusCode: 200, body: JSON.stringify({ id: emailData.id }) };
  } catch (err) {
    console.error('Email error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

function buildHtmlEmail(subject, textBody, name) {
  const lines = textBody.trim().split('\n');
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:580px;margin:40px auto;background:#16161f;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#ff6b35,#ff3d68);padding:28px 32px;text-align:center">
      <div style="font-size:2rem;margin-bottom:6px">💪</div>
      <div style="font-size:1.4rem;font-weight:800;color:white;letter-spacing:-0.5px">FitPro</div>
      <div style="font-size:0.82rem;color:rgba(255,255,255,0.8);margin-top:2px">India's #1 Fitness Marketplace</div>
    </div>
    <!-- Body -->
    <div style="padding:32px">
      <h2 style="color:#f0f0f5;font-size:1.1rem;margin:0 0 20px;font-weight:700">${subject.replace(/[^\w\s—!.()]/g,'')}</h2>
      <div style="color:#8888a0;font-size:0.88rem;line-height:1.8">
        ${lines.map(l => l.trim() ? `<p style="margin:0 0 8px;color:${l.startsWith('✓')||l.startsWith('🎉')||l.startsWith('💪')?'#22d07a':'#c0c0d0'}">${l}</p>` : '<br>').join('')}
      </div>
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <div style="font-size:0.75rem;color:#55556a">© 2024 FitPro. All rights reserved.</div>
      <div style="font-size:0.75rem;color:#55556a">
        <a href="tel:8287034496" style="color:#ff6b35;text-decoration:none">📞 8287034496</a>
        &nbsp;·&nbsp;
        <a href="https://wa.me/918287034496" style="color:#25D366;text-decoration:none">💬 WhatsApp</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Optional: WhatsApp via Twilio or WATI
async function sendWhatsAppNotification(profile, templateKey, data) {
  // Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
  if (!process.env.TWILIO_ACCOUNT_SID) return;
  try {
    const msgs = {
      booking_confirmed: `✅ FitPro: Session confirmed!\n📅 ${data.date} at ${data.time}\n🏋️ ${data.trainerName}\n${data.zoomLink ? '🔗 ' + data.zoomLink : ''}`,
      session_reminder: `⏰ FitPro Reminder: Session in 1 hour!\n${data.otherParty}\n${data.zoomLink || ''}`
    };
    const msg = msgs[templateKey];
    if (!msg || !profile.phone) return;
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilio.messages.create({ from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_FROM, to: 'whatsapp:+91' + profile.phone, body: msg });
  } catch (err) { console.warn('WhatsApp notification failed:', err.message); }
}
