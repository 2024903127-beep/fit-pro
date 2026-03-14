// FitPro Platform - Core JS
// ============================

// THEME
const ThemeManager = {
  init() {
    const saved = localStorage.getItem('theme') || 'dark';
    this.apply(saved);
  },
  apply(theme) {
    document.body.classList.toggle('light-mode', theme === 'light');
    localStorage.setItem('theme', theme);
  },
  toggle() {
    const isLight = document.body.classList.contains('light-mode');
    this.apply(isLight ? 'dark' : 'light');
  }
};

// TOAST
const Toast = {
  container: null,
  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },
  show(msg, type = 'info', duration = 3500) {
    if (!this.container) this.init();
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
    this.container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; setTimeout(() => t.remove(), 300); }, duration);
  }
};

// MODAL
const Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }
};

// DEMO DATA
const DEMO_TRAINERS = [
  { id: 1, name: 'Arjun Sharma', specialty: 'Weight Loss & HIIT', rating: 4.9, reviews: 128, price: 1200, coins: 50, location: 'Delhi', avatar: 'AS', badge: 'Top Rated', online: true, offline: true, exp: '8 years', verified: true, about: 'Certified personal trainer with expertise in weight loss transformations. Helped 200+ clients achieve their goals.' },
  { id: 2, name: 'Priya Mehta', specialty: 'Yoga & Flexibility', rating: 4.8, reviews: 95, price: 900, coins: 40, location: 'Mumbai', avatar: 'PM', badge: 'Trending', online: true, offline: false, exp: '6 years', verified: true, about: 'RYT-500 certified yoga instructor. Specializes in Hatha and Vinyasa yoga for stress relief and flexibility.' },
  { id: 3, name: 'Rahul Singh', specialty: 'Muscle Building', rating: 4.7, reviews: 203, price: 1500, coins: 60, location: 'Bangalore', avatar: 'RS', badge: 'Pro', online: true, offline: true, exp: '10 years', verified: true, about: 'Former national-level powerlifter. Expert in hypertrophy training and strength programming.' },
  { id: 4, name: 'Kavya Nair', specialty: 'Nutrition & Diet', rating: 4.9, reviews: 76, price: 800, coins: 35, location: 'Chennai', avatar: 'KN', badge: 'New', online: true, offline: false, exp: '4 years', verified: true, about: 'Certified nutritionist and fitness coach. Custom meal plans for every body type and goal.' },
  { id: 5, name: 'Vikram Bose', specialty: 'Crossfit & Functional', rating: 4.6, reviews: 142, price: 1100, coins: 45, location: 'Kolkata', avatar: 'VB', badge: 'Top Rated', online: true, offline: true, exp: '7 years', verified: true, about: 'CrossFit Level 2 trainer. Specializes in functional fitness and athletic performance.' },
  { id: 6, name: 'Anjali Patel', specialty: 'Prenatal & Postnatal', rating: 4.8, reviews: 54, price: 950, coins: 42, location: 'Pune', avatar: 'AP', badge: 'Specialist', online: true, offline: true, exp: '5 years', verified: true, about: 'Specialized in pre and postnatal fitness. Safe and effective workouts for mothers.' },
];

const DEMO_LEARNERS = [
  { id: 1, name: 'Amit Kumar', goal: 'Lose 10kg', coins: 150, streak: 12, sessions: 8, avatar: 'AK' },
  { id: 2, name: 'Sneha Roy', goal: 'Build strength', coins: 85, streak: 5, sessions: 3, avatar: 'SR' },
  { id: 3, name: 'Rohan Verma', goal: 'Marathon prep', coins: 200, streak: 21, sessions: 15, avatar: 'RV' },
];

// RAZORPAY DEMO
function initiatePayment(amount, purpose, callback) {
  const options = {
    key: 'rzp_test_demo_key',
    amount: amount * 100,
    currency: 'INR',
    name: 'FitPro Platform',
    description: purpose,
    image: '',
    handler: function(response) {
      Toast.show(`Payment of ₹${amount} successful! ID: ${response.razorpay_payment_id?.slice(0,10) || 'DEMO_'+Date.now()}`, 'success');
      if (callback) callback(response);
    },
    prefill: { name: 'Demo User', email: 'demo@fitpro.in', contact: '9999999999' },
    theme: { color: '#ff6b35' }
  };
  // Demo mode - simulate payment
  setTimeout(() => {
    Toast.show(`Demo payment of ₹${amount} processed! 🎉`, 'success');
    if (callback) callback({ razorpay_payment_id: 'DEMO_' + Date.now() });
  }, 1500);
  Toast.show('Processing payment...', 'info', 1200);
}

// COIN SYSTEM
const CoinSystem = {
  getBalance(userId) {
    return parseInt(localStorage.getItem(`coins_${userId}`) || '0');
  },
  setBalance(userId, amount) {
    localStorage.setItem(`coins_${userId}`, amount.toString());
    document.querySelectorAll('.coin-balance').forEach(el => el.textContent = amount);
  },
  deduct(userId, amount, reason) {
    const balance = this.getBalance(userId);
    if (balance < amount) { Toast.show('Insufficient coins! Please recharge.', 'error'); return false; }
    this.setBalance(userId, balance - amount);
    Toast.show(`${amount} coins deducted for ${reason}`, 'info');
    return true;
  },
  add(userId, amount, reason) {
    const balance = this.getBalance(userId);
    this.setBalance(userId, balance + amount);
    Toast.show(`${amount} coins added to your wallet! 🎉`, 'success');
  }
};

// SUPABASE CONFIG (demo)
const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  key: 'your-anon-key',
  note: 'Replace with your actual Supabase credentials'
};

// NAV SCROLL EFFECT
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
});

// INTERSECTION OBSERVER FOR ANIMATIONS
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.animationDelay = (i * 0.1) + 's';
      entry.target.classList.add('animate-fade-up');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Toast.init();
  document.querySelectorAll('.observe').forEach(el => observer.observe(el));

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });
});

// NUMBER COUNTER ANIMATION
function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = Math.floor(start).toLocaleString();
    if (start >= target) clearInterval(timer);
  }, 16);
}

// CHART HELPER (lightweight)
function drawLineChart(canvas, data, color = '#ff6b35') {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const padding = 20;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: height - padding - ((v - min) / range) * (height - padding * 2)
  }));

  ctx.clearRect(0, 0, width, height);

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, color + '40');
  grad.addColorStop(1, color + '00');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length-1].x, height);
  ctx.lineTo(pts[0].x, height);
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Dots
  pts.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}
