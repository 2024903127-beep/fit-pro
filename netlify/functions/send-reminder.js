// Netlify Scheduled Function — Session Reminder Emails
// Runs every hour to check upcoming sessions and notify users

const { createClient } = require('@supabase/supabase-js');

exports.handler = async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Find sessions starting in next 60 minutes
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  const { data: sessions } = await supabase
    .from('bookings')
    .select('*, learners(*, profiles(*)), trainers(*, profiles(*))')
    .eq('status', 'confirmed')
    .gte('session_date', now.toISOString())
    .lte('session_date', inOneHour.toISOString());

  for (const session of (sessions || [])) {
    const learnerEmail = session.learners?.profiles?.email;
    const trainerEmail = session.trainers?.profiles?.email;
    const sessionTime = new Date(session.session_date).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
    });

    // Send via Supabase Edge Functions or any email provider
    console.log(`Reminder: Session at ${sessionTime} — ${learnerEmail} with ${trainerEmail}`);
    // TODO: integrate with Resend / SendGrid / Nodemailer
  }

  return { statusCode: 200, body: `Processed ${sessions?.length || 0} reminders` };
};
