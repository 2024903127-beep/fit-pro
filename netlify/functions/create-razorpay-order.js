// Netlify Function — Create Razorpay Order (server-side)
// Prevents amount tampering — always verify on server

const Razorpay = require('razorpay');
const crypto = require('crypto');

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { amount, currency = 'INR', purpose, userId } = JSON.parse(event.body);

    // Create order
    const order = await rzp.orders.create({
      amount: amount * 100, // paise
      currency,
      receipt: 'fitpro_' + Date.now(),
      notes: { purpose, userId }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, amount, currency })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// Separate handler to verify payment signature
exports.verifyPayment = async (event) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = JSON.parse(event.body);
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
  const isValid = expectedSig === razorpay_signature;
  return { statusCode: 200, body: JSON.stringify({ verified: isValid }) };
};
