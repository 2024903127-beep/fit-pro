// Netlify Function: create-razorpay-order.js
// Creates Razorpay order server-side to prevent amount tampering
// Env vars needed: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

const crypto = require('crypto');

exports.handler = async (event) => {
  const { httpMethod, path } = event;

  // POST /create-razorpay-order → create order
  if (httpMethod === 'POST' && !path.includes('verify')) {
    const { amount, currency = 'INR', purpose, userId } = JSON.parse(event.body || '{}');

    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

    try {
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount * 100, // paise
          currency,
          receipt: `fitpro_${Date.now()}`,
          notes: { purpose, userId }
        })
      });

      const order = await res.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, amount, currency })
      };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  // POST /create-razorpay-order/verify → verify signature
  if (httpMethod === 'POST' && path.includes('verify')) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = JSON.parse(event.body || '{}');

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const verified = expected === razorpay_signature;
    return {
      statusCode: 200,
      body: JSON.stringify({ verified })
    };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
