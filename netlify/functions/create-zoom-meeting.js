// Netlify Serverless Function — Zoom Meeting Creator
// Deploy: this file auto-deploys as /.netlify/functions/create-zoom-meeting

const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { hostEmail, topic, startTime, duration } = JSON.parse(event.body);

  // Sign JWT (server-side only — secret never exposed)
  const payload = {
    iss: process.env.ZOOM_API_KEY,
    exp: Math.floor(Date.now() / 1000) + 60
  };
  const token = jwt.sign(payload, process.env.ZOOM_API_SECRET);

  try {
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic,
        type: 2, // scheduled meeting
        start_time: startTime,
        duration,
        timezone: 'Asia/Kolkata',
        settings: {
          host_video: true,
          participant_video: true,
          waiting_room: true,
          auto_recording: 'none'
        }
      })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
