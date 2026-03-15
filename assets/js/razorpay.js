/* ════════════════════════════════════════════════
   FITPRO — RAZORPAY INTEGRATION
   Live payments + demo fallback
   Replace RAZORPAY_KEY_ID with your actual key
   ════════════════════════════════════════════════ */

// Add this script in HTML head for live payments:
// <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

const RazorpayConfig = {
  keyId:       'rzp_test_YOUR_KEY_HERE',  // Replace with rzp_live_... for production
  name:        'FitPro',
  description: 'Fitness Training Platform',
  currency:    'INR',
  theme:       { color: '#FF4500' }
};

const RazorPay = {

  // Main payment function
  pay({ amount, purpose, prefill = {}, onSuccess, onFailure }) {
    // If SDK not loaded — use demo mode
    if (!window.Razorpay) {
      this._demo(amount, purpose, onSuccess);
      return;
    }

    const options = {
      key:         RazorpayConfig.keyId,
      amount:      amount * 100,  // paise
      currency:    RazorpayConfig.currency,
      name:        RazorpayConfig.name,
      description: purpose,
      prefill: {
        name:    prefill.name    || '',
        email:   prefill.email   || '',
        contact: prefill.phone   || ''
      },
      notes:   { purpose, platform: 'FitPro' },
      theme:   RazorpayConfig.theme,
      modal: {
        ondismiss() {
          Toast.show('Payment cancelled', 'error');
          if (onFailure) onFailure({ reason: 'cancelled' });
        }
      },
      handler(response) {
        Toast.show(`✓ ₹${amount.toLocaleString()} paid successfully!`, 'success');
        if (onSuccess) onSuccess({
          paymentId: response.razorpay_payment_id,
          orderId:   response.razorpay_order_id,
          signature: response.razorpay_signature,
          amount
        });
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', res => {
      Toast.show(`Payment failed: ${res.error.description}`, 'error');
      if (onFailure) onFailure(res.error);
    });
    rzp.open();
  },

  // Demo mode — simulates payment flow
  _demo(amount, purpose, onSuccess) {
    Toast.show('Processing payment…', 'info', 1300);
    setTimeout(() => {
      const fakeId = 'pay_DEMO_' + Math.random().toString(36).substr(2,10).toUpperCase();
      Toast.show(`✓ ₹${amount.toLocaleString()} paid for ${purpose}`, 'success');
      if (onSuccess) onSuccess({ paymentId: fakeId, amount, demo: true });
    }, 1600);
  },

  // Learner coin recharge
  rechargeCoins(packName, amount, coins, userId) {
    this.pay({
      amount,
      purpose: `${coins} FitCoins — ${packName} Pack`,
      onSuccess: res => {
        Coins.add(coins);
        DB.addCoinTransaction(userId, coins, 'credit', `${packName} pack recharge`, res.paymentId);
        Toast.show(`${coins} FitCoins added to your wallet! 🪙`, 'success');
      }
    });
  },

  // Trainer registration fee
  trainerRegistration(trainerId, amount = 499) {
    this.pay({
      amount,
      purpose: 'Trainer Registration Fee',
      onSuccess: res => {
        DB.addCoinTransaction(trainerId, 0, 'fee', 'Trainer registration', res.paymentId);
        Toast.show('Registration fee paid! Profile under review.', 'success');
      }
    });
  },

  // Book with card (alternative to coins)
  bookSession(trainerId, learnerId, amount, sessionDetails) {
    this.pay({
      amount,
      purpose: `Session with ${sessionDetails.trainerName}`,
      onSuccess: res => {
        DB.addCoinTransaction(learnerId, 0, 'card_payment', `Session — ${sessionDetails.trainerName}`, res.paymentId);
        if (sessionDetails.onSuccess) sessionDetails.onSuccess(res);
      }
    });
  }
};

// Global helper used throughout the app
function demoPayment(amount, purpose, onSuccess) {
  RazorPay.pay({ amount, purpose, onSuccess });
}
