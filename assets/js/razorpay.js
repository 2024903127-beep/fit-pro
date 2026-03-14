// ============================================================
// RAZORPAY INTEGRATION — FitPro
// Live + Demo mode. Add your key to RAZORPAY_KEY_ID below.
// ============================================================

const RazorpayConfig = {
  keyId: 'rzp_test_YOUR_KEY_HERE', // Replace with live key for production
  name: 'FitPro',
  description: 'Fitness Training Platform',
  image: 'https://fitpro.in/assets/images/logo.png',
  currency: 'INR',
  theme: { color: '#ff6b35' }
};

const Razorpay = {

  // Main payment function — auto falls back to demo if SDK not loaded
  pay({ amount, purpose, prefill = {}, onSuccess, onFailure }) {
    const amountPaise = amount * 100;

    // Check if Razorpay SDK is loaded
    if (!window.Razorpay) {
      this._demoPayment(amount, purpose, onSuccess);
      return;
    }

    const options = {
      key: RazorpayConfig.keyId,
      amount: amountPaise,
      currency: RazorpayConfig.currency,
      name: RazorpayConfig.name,
      description: purpose,
      image: RazorpayConfig.image,
      prefill: {
        name: prefill.name || '',
        email: prefill.email || '',
        contact: prefill.phone || ''
      },
      notes: { platform: 'FitPro', purpose },
      theme: RazorpayConfig.theme,
      modal: {
        ondismiss() {
          Toast.show('Payment cancelled', 'error');
          if (onFailure) onFailure({ reason: 'cancelled' });
        }
      },
      handler(response) {
        Toast.show(`Payment successful! ID: ${response.razorpay_payment_id}`, 'success');
        if (onSuccess) onSuccess({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
          amount
        });
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (res) => {
      Toast.show(`Payment failed: ${res.error.description}`, 'error');
      if (onFailure) onFailure(res.error);
    });
    rzp.open();
  },

  // Demo simulation when SDK not configured
  _demoPayment(amount, purpose, onSuccess) {
    Toast.show('Processing payment... (Demo mode)', 'info', 1200);
    setTimeout(() => {
      const fakeId = 'pay_DEMO_' + Math.random().toString(36).substr(2, 10).toUpperCase();
      Toast.show(`✓ ₹${amount} paid for ${purpose}`, 'success');
      if (onSuccess) onSuccess({ paymentId: fakeId, amount, demo: true });
    }, 1500);
  },

  // Coin recharge packages
  rechargeCoins(packageName, amount, coins, userId) {
    this.pay({
      amount,
      purpose: `${coins} FitCoins — ${packageName} Pack`,
      onSuccess: (res) => {
        CoinSystem.add(userId, coins, 'Recharge');
        DB.addCoinTransaction(userId, coins, 'credit', `${packageName} pack recharge`, res.paymentId);
        EmailNotifications.send(userId, 'coin_recharge', { coins, amount, paymentId: res.paymentId });
      }
    });
  },

  // Pay for a booking (coin deduction, not card)
  bookSession(trainerId, learnerId, coins, sessionDetails) {
    if (!CoinSystem.deduct(learnerId, coins, sessionDetails.trainerName + ' session')) return;
    DB.addCoinTransaction(learnerId, -coins, 'debit', 'Session booking', null);
    return true;
  },

  // Trainer registration fee
  trainerRegistration(trainerId, amount = 499) {
    this.pay({
      amount,
      purpose: 'Trainer Registration Fee',
      onSuccess: (res) => {
        Toast.show('Registration fee paid! Profile under review 📋', 'success');
        DB.addCoinTransaction(trainerId, 0, 'fee', 'Trainer registration', res.paymentId);
      }
    });
  }
};

// Override the global initiatePayment in app.js
function initiatePayment(amount, purpose, callback) {
  Razorpay.pay({
    amount,
    purpose,
    onSuccess: (res) => { if (callback) callback(res); }
  });
}
