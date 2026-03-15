// Netlify Function: create-zoom-meeting.js
// Creates a Zoom meeting server-side (JWT secret never exposed to frontend)
// Env vars needed: ZOOM_API_KEY, ZOOM_API_SECRET

const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { topic, startTime, duration = 60, hostEmail } = JSON.parse(event.body || '{}');

  // Sign JWT server-side
  const payload = { iss: process.env.ZOOM_API_KEY, exp: Math.floor(Date.now() / 1000) + 60 };
  const token = jwt.sign(payload, process.env.ZOOM_API_SECRET);

  try {
    const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: topic || 'FitPro Training Session',
        type: 2, // Scheduled meeting
        start_time: startTime,
        duration,
        timezone: 'Asia/Kolkata',
        settings: {
          host_video: true,
          participant_video: true,
          waiting_room: true,
          auto_recording: 'none',
          join_before_host: false
        }
      })
    });

    const data = await res.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
