// ============================================================
// ZOOM INTEGRATION — FitPro
// Uses Zoom JWT API to auto-generate meeting links on booking
// ============================================================

const ZoomConfig = {
  apiKey: 'YOUR_ZOOM_API_KEY',
  apiSecret: 'YOUR_ZOOM_API_SECRET',
  // In production: use a backend serverless function (Netlify Function)
  // to sign the JWT — never expose secret in frontend
  backendUrl: '/.netlify/functions/create-zoom-meeting'
};

const ZoomService = {

  // Create a Zoom meeting via Netlify Function
  async createMeeting(hostEmail, topic, startTime, durationMins = 60) {
    try {
      const res = await fetch(ZoomConfig.backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostEmail, topic, startTime, duration: durationMins })
      });

      if (!res.ok) throw new Error('Zoom API error');
      const data = await res.json();
      return {
        meetingId: data.id,
        joinUrl: data.join_url,
        startUrl: data.start_url,
        password: data.password
      };
    } catch (err) {
      console.warn('[Zoom] API unavailable — using demo link');
      return this.demoMeeting(topic);
    }
  },

  // Demo meeting (shown when Zoom not configured)
  demoMeeting(topic) {
    const id = Math.floor(Math.random() * 9000000000) + 1000000000;
    return {
      meetingId: id,
      joinUrl: `https://zoom.us/j/${id}?pwd=FitProDemo`,
      startUrl: `https://zoom.us/s/${id}?pwd=FitProDemo`,
      password: 'fitpro2024'
    };
  },

  // Format meeting info for display
  formatMeetingCard(meeting) {
    return `
      <div style="background:rgba(79,159,255,0.08);border:1px solid rgba(79,159,255,0.25);border-radius:var(--radius-md);padding:16px;margin-top:12px">
        <div style="font-weight:700;margin-bottom:8px;color:var(--accent-blue)">📹 Zoom Meeting Details</div>
        <div style="font-size:0.85rem;display:flex;flex-direction:column;gap:4px">
          <div>Meeting ID: <strong>${meeting.meetingId}</strong></div>
          <div>Password: <strong>${meeting.password}</strong></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          <a href="${meeting.joinUrl}" target="_blank" class="btn btn-primary btn-sm">Join Meeting</a>
          <button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText('${meeting.joinUrl}');Toast.show('Link copied!','success')">Copy Link</button>
        </div>
      </div>`;
  }
};
