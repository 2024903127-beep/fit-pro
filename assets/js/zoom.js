/* ════════════════════════════════════════════════
   FITPRO — ZOOM INTEGRATION
   Auto-generates meeting links on booking confirm
   Uses Netlify Function (server-side JWT signing)
   ════════════════════════════════════════════════ */

const ZoomConfig = {
  backendUrl: '/.netlify/functions/create-zoom-meeting',
  // Keys live server-side only — never in frontend
};

const Zoom = {

  // Create a meeting via Netlify serverless function
  async createMeeting({ topic, startTime, durationMins = 60, hostEmail = '' }) {
    try {
      const res = await fetch(ZoomConfig.backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, startTime, duration: durationMins, hostEmail })
      });
      if (!res.ok) throw new Error('Zoom API returned ' + res.status);
      const data = await res.json();
      return {
        meetingId:  data.id,
        joinUrl:    data.join_url,
        startUrl:   data.start_url,
        password:   data.password,
        topic:      data.topic
      };
    } catch (err) {
      console.warn('[Zoom] API unavailable, using demo meeting:', err.message);
      return this._demoMeeting(topic);
    }
  },

  // Demo meeting for when Zoom is not configured
  _demoMeeting(topic = 'FitPro Training Session') {
    const id = Math.floor(Math.random() * 9000000000) + 1000000000;
    const pwd = 'fitpro' + Math.floor(Math.random() * 9000 + 1000);
    return {
      meetingId: id,
      joinUrl:   `https://zoom.us/j/${id}?pwd=${pwd}`,
      startUrl:  `https://zoom.us/s/${id}?pwd=${pwd}`,
      password:  pwd,
      topic,
      demo: true
    };
  },

  // Render meeting info card HTML
  renderCard(meeting) {
    return `
      <div style="background:rgba(56,191,255,0.08);border:1px solid rgba(56,191,255,0.22);border-radius:14px;padding:16px;margin-top:12px">
        <div style="font-weight:700;color:#38BFFF;margin-bottom:10px;font-size:0.88rem">📹 Zoom Meeting Details</div>
        <div style="font-size:0.82rem;display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
          <div>Meeting ID: <strong>${meeting.meetingId}</strong></div>
          <div>Password: <strong>${meeting.password}</strong></div>
          <div style="color:var(--txt-3);font-size:0.72rem">${meeting.demo ? '⚠ Demo link — configure Zoom API for live links' : '✓ Live Zoom meeting generated'}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a href="${meeting.joinUrl}" target="_blank" class="btn btn-sky btn-sm">Join Meeting →</a>
          <button class="btn btn-glass btn-sm" onclick="navigator.clipboard.writeText('${meeting.joinUrl}');Toast.show('Link copied!','success')">Copy Link</button>
        </div>
      </div>`;
  },

  // Validate a Zoom join URL
  isValidUrl(url) {
    return url && (url.includes('zoom.us/j/') || url.includes('zoom.us/s/'));
  }
};
