// Netlify Scheduled Function: send-reminder.js
// Runs every 30 minutes to send session reminders
// Schedule: "*/30 * * * *" in netlify.toml
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY

const { createClient } = require('@supabase/supabase-js');

exports.handler = async () => {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const now       = new Date();
  const in1hour   = new Date(now.getTime() + 60 * 60 * 1000);
  const in90mins  = new Date(now.getTime() + 90 * 60 * 1000);

  // Find sessions starting in next 60–90 minutes
  const { data: sessions, error } = await sb
    .from('bookings')
    .select('*, learners(*, profiles(*)), trainers(*, profiles(*))')
    .eq('status', 'confirmed')
    .gte('session_date', in1hour.toISOString())
    .lte('session_date', in90mins.toISOString());

  if (error) {
    console.error('[Reminder] DB error:', error.message);
    return { statusCode: 500, body: error.message };
  }

  let sent = 0;
  for (const session of (sessions || [])) {
    const learner      = session.learners?.profiles;
    const trainer      = session.trainers?.profiles;
    const sessionTime  = new Date(session.session_date).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
    });
    const sessionDate  = new Date(session.session_date).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata'
    });

    const emailData = {
      date:       sessionDate,
      time:       sessionTime,
      zoomLink:   session.zoom_link,
      address:    session.address,
    };

    // Email to learner
    if (learner?.email) {
      await fetch(process.env.URL + '/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateKey: 'session_reminder',
          data: { name: learner.full_name, otherParty: trainer?.full_name, ...emailData }
        })
      }).catch(console.warn);
      sent++;
    }

    // Email to trainer
    if (trainer?.email) {
      await fetch(process.env.URL + '/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateKey: 'session_reminder',
          data: { name: trainer.full_name, otherParty: learner?.full_name, ...emailData }
        })
      }).catch(console.warn);
      sent++;
    }
  }

  return { statusCode: 200, body: `Sent ${sent} reminders for ${sessions?.length || 0} sessions` };
};
