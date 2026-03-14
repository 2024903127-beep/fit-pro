// ============================================================
// EMAIL NOTIFICATIONS — FitPro
// Uses Supabase Edge Functions to trigger emails via Resend
// ============================================================

const EmailNotifications = {

  templates: {
    booking_confirmed: {
      subject: '✅ Session Confirmed — FitPro',
      body: (d) => `
Hi ${d.learnerName},

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

📞 8287034496 | rahulmishraoffical69@gmail.com
      `
    },
    booking_request: {
      subject: '📅 New Booking Request — FitPro',
      body: (d) => `
Hi ${d.trainerName},

You have a new booking request!

👤 Learner: ${d.learnerName}
📅 Date: ${d.date}
⏰ Time: ${d.time}
📍 Type: ${d.sessionType}
🪙 Coins: ${d.coins}

Login to accept or decline:
https://fitpro.in/pages/trainer-dashboard.html

— FitPro Team
      `
    },
    session_reminder: {
      subject: '⏰ Session in 1 Hour — FitPro',
      body: (d) => `
Hi ${d.name},

Your session starts in 1 hour!

📅 ${d.date} at ${d.time}
🏋️ ${d.otherParty}
${d.zoomLink ? `🔗 Join: ${d.zoomLink}` : ''}

Get ready! 💪
— FitPro Team
      `
    },
    coin_recharge: {
      subject: '🪙 Coins Added to Wallet — FitPro',
      body: (d) => `
Hi there,

${d.coins} FitCoins have been added to your wallet!

💳 Amount Paid: ₹${d.amount}
🪙 Coins Added: ${d.coins}
📋 Payment ID: ${d.paymentId}

Happy training! 🎯
— FitPro Team
      `
    },
    trainer_verified: {
      subject: '🎉 You\'re Verified! — FitPro',
      body: (d) => `
Hi ${d.trainerName},

Congratulations! Your trainer profile has been verified.

✓ You can now accept bookings
✓ Your profile is live on the marketplace
✓ Learners can discover and book you

Login to complete your profile:
https://fitpro.in/pages/trainer-dashboard.html

Welcome to FitPro! 💪
— FitPro Team
      `
    },
    welcome: {
      subject: '🎉 Welcome to FitPro!',
      body: (d) => `
Hi ${d.name},

Welcome to FitPro — India's #1 Fitness Marketplace!

${d.role === 'learner' ? `🎁 You've received 100 FREE FitCoins to book your first session!

What's next:
1. Browse verified trainers
2. Book your first session
3. Start your transformation!

https://fitpro.in/pages/learner-dashboard.html` :
`Your registration is under review.
Our team will verify your profile within 24 hours.

https://fitpro.in/pages/trainer-dashboard.html`}

Need help? WhatsApp us: https://wa.me/918287034496
— FitPro Team
      `
    }
  },

  // Send email via Supabase Edge Function
  async send(userId, templateKey, data) {
    const template = this.templates[templateKey];
    if (!template) { console.warn('Unknown email template:', templateKey); return; }

    // In-app notification always works
    this._showInAppNotification(templateKey, data);

    // Try sending real email via backend
    try {
      if (!window.supabase) return; // Demo mode
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          userId,
          subject: template.subject,
          body: template.body(data),
          templateKey,
          data
        }
      });
      if (error) throw error;
      console.log('[Email] Sent:', templateKey, 'to userId:', userId);
    } catch (err) {
      console.warn('[Email] Backend unavailable, in-app only:', err.message);
    }
  },

  // Show in-app toast notification
  _showInAppNotification(type, data) {
    const msgs = {
      booking_confirmed: `📅 Session confirmed with ${data.trainerName}! Check your email.`,
      booking_request: `📋 New booking request from ${data.learnerName}`,
      session_reminder: `⏰ Session in 1 hour with ${data.otherParty}`,
      coin_recharge: `🪙 ${data.coins} coins added to wallet!`,
      trainer_verified: `🎉 Your trainer profile is now verified!`,
      welcome: `🎉 Welcome to FitPro, ${data.name}!`
    };
    if (msgs[type]) Toast.show(msgs[type], 'success', 5000);
  },

  // Schedule a reminder (uses setTimeout for demo; use cron in prod)
  scheduleReminder(sessionDateISO, userId, data) {
    const sessionMs = new Date(sessionDateISO).getTime();
    const reminderMs = sessionMs - 60 * 60 * 1000; // 1 hour before
    const now = Date.now();
    if (reminderMs > now) {
      setTimeout(() => {
        this.send(userId, 'session_reminder', data);
      }, reminderMs - now);
      console.log(`[Reminder] Scheduled for ${new Date(reminderMs).toLocaleString()}`);
    }
  }
};
