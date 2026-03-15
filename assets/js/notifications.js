/* ════════════════════════════════════════════════
   FITPRO — NOTIFICATIONS
   Email templates · WhatsApp · In-app · Reminders
   ════════════════════════════════════════════════ */

const Notifications = {

  // ── EMAIL TEMPLATES ─────────────────────────
  templates: {

    booking_confirmed: (d) => ({
      subject: '✅ Session Confirmed — FitPro',
      body: `Hi ${d.learnerName},

Your training session is confirmed! Here are the details:

📅 Date: ${d.date}
⏰ Time: ${d.time}
🏋️ Trainer: ${d.trainerName}
📍 Type: ${d.sessionType}
${d.zoomLink ? `🔗 Zoom Link: ${d.zoomLink}\n🔑 Password: ${d.zoomPassword}` : `📍 Address: ${d.address}`}

💡 Tips:
• Join 5 minutes early
• Have water & towel ready
• Wear comfortable workout clothes

See you there! 💪
— FitPro Team

📞 8287034496
✉️ rahulmishraoffical69@gmail.com
💬 https://wa.me/918287034496`
    }),

    booking_request: (d) => ({
      subject: '📅 New Booking Request — FitPro',
      body: `Hi ${d.trainerName},

You have a new booking request!

👤 Learner: ${d.learnerName}
📅 Date: ${d.date}
⏰ Time: ${d.time}
📍 Type: ${d.sessionType}
🪙 Coins: ${d.coins}

Login to accept or decline:
https://fitpro.in/pages/trainer-dashboard.html

— FitPro Team`
    }),

    session_reminder: (d) => ({
      subject: '⏰ Session Starting in 1 Hour — FitPro',
      body: `Hi ${d.name},

Your session starts in 1 hour!

📅 ${d.date} at ${d.time}
🏋️ ${d.otherParty}
${d.zoomLink ? `🔗 Join: ${d.zoomLink}` : `📍 Location: ${d.address}`}

Get ready! 💪
— FitPro Team`
    }),

    coin_recharge: (d) => ({
      subject: '🪙 Coins Added to Your Wallet — FitPro',
      body: `Hi there,

${d.coins} FitCoins have been added to your wallet!

💳 Amount Paid: ₹${d.amount}
🪙 Coins Added: +${d.coins}
📋 Payment ID: ${d.paymentId}

Happy training! 🎯
— FitPro Team`
    }),

    trainer_verified: (d) => ({
      subject: '🎉 You\'re Now a Verified Trainer — FitPro',
      body: `Hi ${d.trainerName},

Congratulations! Your trainer profile has been verified.

✓ Your profile is now live on the marketplace
✓ Learners can find and book you
✓ Start accepting bookings!

Login to your dashboard:
https://fitpro.in/pages/trainer-dashboard.html

Welcome to FitPro! 💪
— FitPro Team`
    }),

    welcome_learner: (d) => ({
      subject: '🎉 Welcome to FitPro — 100 Free Coins!',
      body: `Hi ${d.name},

Welcome to FitPro — India's #1 Fitness Marketplace!

🎁 You've received 100 FREE FitCoins to book your first sessions!

What's next:
1. Browse verified trainers
2. Book your first session with your free coins
3. Start your transformation!

👉 https://fitpro.in/pages/learner-dashboard.html

Need help? WhatsApp us: https://wa.me/918287034496
— FitPro Team`
    }),

    welcome_trainer: (d) => ({
      subject: '✅ Trainer Registration Received — FitPro',
      body: `Hi ${d.name},

Your trainer registration is under review.

Our admin team will verify your profile within 24 hours.
You'll receive an email once you're approved.

While you wait, complete your profile:
https://fitpro.in/pages/trainer-dashboard.html

— FitPro Team`
    })
  },

  // ── SEND EMAIL via Netlify Function ──────────
  async send(userId, templateKey, data) {
    const tpl = this.templates[templateKey];
    if (!tpl) { console.warn('[Notify] Unknown template:', templateKey); return; }

    // Always show in-app notification
    this._inApp(templateKey, data);

    // Try sending real email via backend
    try {
      if (!window.supabase) return; // demo mode
      await window.supabase.functions.invoke('send-email', {
        body: { userId, templateKey, data, ...tpl(data) }
      });
    } catch (err) {
      console.warn('[Notify] Email backend unavailable:', err.message);
    }
  },

  // ── IN-APP NOTIFICATION ─────────────────────
  _inApp(type, data) {
    const msgs = {
      booking_confirmed: `📅 Session with ${data.trainerName} confirmed! Check email for Zoom link.`,
      booking_request:   `📋 New booking from ${data.learnerName}!`,
      session_reminder:  `⏰ Session in 1 hour with ${data.otherParty}!`,
      coin_recharge:     `🪙 ${data.coins} coins added to wallet!`,
      trainer_verified:  `🎉 Your trainer profile is now verified!`,
      welcome_learner:   `🎉 Welcome to FitPro, ${data.name}! 100 coins added.`,
      welcome_trainer:   `📋 Registration received! Verification in 24 hours.`
    };
    if (msgs[type]) Toast.show(msgs[type], 'success', 5000);
  },

  // ── WHATSAPP NOTIFICATION ───────────────────
  // Sends via Twilio WhatsApp API (configured in Netlify env)
  async sendWhatsApp(phone, message) {
    try {
      await fetch('/.netlify/functions/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
    } catch (err) {
      console.warn('[Notify] WhatsApp unavailable:', err.message);
    }
  },

  // ── SESSION REMINDER SCHEDULER ──────────────
  // Schedules a browser reminder 1 hour before session
  scheduleReminder(sessionDateISO, name, otherParty, zoomLink) {
    const sessionMs = new Date(sessionDateISO).getTime();
    const reminderMs = sessionMs - 60 * 60 * 1000; // 1 hour before
    const now = Date.now();

    if (reminderMs > now) {
      const delay = reminderMs - now;
      setTimeout(() => {
        Toast.show(`⏰ Session in 1 hour with ${otherParty}!`, 'info', 8000);
        // Also play a gentle sound if permitted
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 440;
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
        } catch(e) {}
      }, delay);
      console.log(`[Remind] Scheduled for ${new Date(reminderMs).toLocaleString('en-IN')}`);
    }
  }
};
