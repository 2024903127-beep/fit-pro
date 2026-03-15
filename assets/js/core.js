/* ════════════════════════════════════════════════
   FITPRO CORE JS v4
   Theme · Toast · Modal · Coins · Charts · Data
   ════════════════════════════════════════════════ */

// ── THEME ──────────────────────────────────────
const Theme = {
  init() { if (localStorage.getItem('fp-theme') === 'light') document.body.classList.add('light'); },
  toggle() {
    document.body.classList.toggle('light');
    localStorage.setItem('fp-theme', document.body.classList.contains('light') ? 'light' : 'dark');
  }
};

// ── TOAST ──────────────────────────────────────
const Toast = {
  _wrap: null,
  _get() {
    if (!this._wrap) { this._wrap = document.createElement('div'); this._wrap.className = 'toast-wrap'; document.body.appendChild(this._wrap); }
    return this._wrap;
  },
  show(msg, type = 'info', duration = 3500) {
    const icons = { success:'✓', error:'✕', info:'ℹ' };
    const t = document.createElement('div');
    t.className = `toast t-${type}`;
    t.innerHTML = `<span style="flex-shrink:0;font-size:1rem">${icons[type]||'ℹ'}</span><span>${msg}</span>`;
    this._get().appendChild(t);
    setTimeout(() => { t.style.cssText += ';opacity:0;transform:translateX(20px);transition:0.3s'; setTimeout(() => t.remove(), 300); }, duration);
  }
};

// ── MODAL ──────────────────────────────────────
const Modal = {
  open(id)  { const el=document.getElementById(id); if(el){el.classList.add('open');document.body.style.overflow='hidden'} },
  close(id) { const el=document.getElementById(id); if(el){el.classList.remove('open');document.body.style.overflow=''} }
};
document.addEventListener('click', e => {
  if (e.target.classList.contains('moverlay')) { e.target.classList.remove('open'); document.body.style.overflow=''; }
});

// ── COIN SYSTEM ────────────────────────────────
const Coins = {
  get()    { return parseInt(localStorage.getItem('fp-coins') || '150'); },
  set(v)   { localStorage.setItem('fp-coins', Math.max(0,v)); document.querySelectorAll('.coin-bal').forEach(el => el.textContent = Math.max(0,v)); },
  add(n)   { this.set(this.get()+n); Toast.show(`+${n} FitCoins added! 🪙`, 'success'); },
  deduct(n, reason='session') {
    if (this.get()<n) { Toast.show('Not enough coins! Please recharge.','error'); return false; }
    this.set(this.get()-n); Toast.show(`${n} coins deducted for ${reason}`,'info'); return true;
  }
};

// ── DEMO PAYMENT ──────────────────────────────
function demoPayment(amount, purpose, onSuccess) {
  Toast.show('Processing payment…','info',1300);
  setTimeout(() => {
    const id='PAY_DEMO_'+Math.random().toString(36).substr(2,9).toUpperCase();
    Toast.show(`✓ ₹${amount.toLocaleString()} paid for ${purpose}`,'success');
    if (onSuccess) onSuccess({ paymentId:id, amount, demo:true });
  }, 1600);
}

// ── LINE CHART ────────────────────────────────
function drawChart(canvas, data, color='#FF4500') {
  if (!canvas||!data.length) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width=canvas.parentElement.offsetWidth;
  const H=canvas.offsetHeight||120; canvas.height=H;
  const pad=20, max=Math.max(...data), min=Math.min(...data), range=max-min||1;
  ctx.clearRect(0,0,W,H);
  const pts=data.map((v,i)=>({x:pad+(i/(data.length-1))*(W-pad*2),y:H-pad-((v-min)/range)*(H-pad*2)}));
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,color+'38'); g.addColorStop(1,color+'00');
  ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); pts.forEach(p=>ctx.lineTo(p.x,p.y));
  ctx.lineTo(pts[pts.length-1].x,H); ctx.lineTo(pts[0].x,H); ctx.fillStyle=g; ctx.fill();
  ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); pts.forEach(p=>ctx.lineTo(p.x,p.y));
  ctx.strokeStyle=color; ctx.lineWidth=2.5; ctx.lineJoin='round'; ctx.stroke();
  pts.forEach(p=>{ ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fillStyle=color; ctx.fill(); ctx.beginPath(); ctx.arc(p.x,p.y,2,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill(); });
}

// ── BAR CHART ────────────────────────────────
function drawBarChart(canvas, data, labels, color='#FF4500') {
  if (!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width=canvas.parentElement.offsetWidth;
  const H=canvas.offsetHeight||100; canvas.height=H;
  const pad=20, gap=6, max=Math.max(...data)||1;
  ctx.clearRect(0,0,W,H);
  const barW=(W-pad*2)/data.length-gap;
  data.forEach((v,i)=>{
    const bH=((v/max)*(H-pad*2));
    const x=pad+i*(barW+gap), y=H-pad-bH;
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(x,y,barW,bH,[4,4,0,0]); else ctx.rect(x,y,barW,bH);
    ctx.fillStyle=color+'cc'; ctx.fill();
    if(labels?.[i]){ ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText(labels[i],x+barW/2,H-4); }
  });
}

// ── SCROLL REVEAL ─────────────────────────────
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('in');revObs.unobserve(e.target);} });
}, {threshold:0.08});

// ── COUNTER ───────────────────────────────────
function animCounter(el, target, dur=1800) {
  const sfx=el.dataset.suffix||'', start=performance.now();
  (function step(now){ const p=Math.min((now-start)/dur,1),ease=1-Math.pow(1-p,4); el.textContent=Math.floor(ease*target).toLocaleString()+sfx; if(p<1)requestAnimationFrame(step); })(start);
}
const cntObs = new IntersectionObserver(entries => {
  entries.forEach(e=>{ if(e.isIntersecting){animCounter(e.target,parseInt(e.target.dataset.count));cntObs.unobserve(e.target);} });
},{threshold:0.5});

// ── DEMO DATA ─────────────────────────────────
const TRAINERS = [
  { id:1, name:'Arjun Sharma',   avatar:'AS', spec:'Weight Loss & HIIT',          rating:4.9, reviews:128, price:1200, coins:50,  city:'Delhi',     exp:'8 yrs',  online:true,  offline:true,  badge:'Top Rated',  grad:'linear-gradient(135deg,#FF4500,#FF6A35)', verified:true,  about:'Certified NASM personal trainer with 8+ years transforming bodies. Specialises in sustainable fat loss and HIIT programming. Helped 200+ clients lose weight without crash dieting.', certs:['NASM-CPT','ACE-PT','TRX Certified'] },
  { id:2, name:'Priya Mehta',    avatar:'PM', spec:'Yoga & Flexibility',           rating:4.8, reviews:95,  price:900,  coins:40,  city:'Mumbai',    exp:'6 yrs',  online:true,  offline:false, badge:'Trending',   grad:'linear-gradient(135deg,#38BFFF,#8B5CF6)', verified:true,  about:'RYT-500 certified yoga instructor. Specialises in Hatha, Vinyasa and restorative yoga. Mindfulness-first approach that reduces stress and improves flexibility within weeks.', certs:['RYT-500','YA Certified','Meditation Guide'] },
  { id:3, name:'Rahul Singh',    avatar:'RS', spec:'Muscle Building & Strength',   rating:4.7, reviews:203, price:1500, coins:60,  city:'Bangalore', exp:'10 yrs', online:true,  offline:true,  badge:'Pro',        grad:'linear-gradient(135deg,#00E5A0,#38BFFF)', verified:true,  about:'Former national-level powerlifter turned coach. Hypertrophy expert with a science-backed approach to muscle gain. Custom periodisation programs built around your lifestyle.', certs:['NSCA-CSCS','IPF Level 2','Sports Nutrition'] },
  { id:4, name:'Kavya Nair',     avatar:'KN', spec:'Nutrition & Diet Planning',    rating:4.9, reviews:76,  price:800,  coins:35,  city:'Chennai',   exp:'4 yrs',  online:true,  offline:false, badge:'Expert',     grad:'linear-gradient(135deg,#FFB800,#FF4500)', verified:true,  about:'Registered Dietitian and certified fitness coach. Creates personalised meal plans for every goal. Evidence-based nutrition without fad diets.', certs:['RD Certified','Precision Nutrition L2','Sports Dietitian'] },
  { id:5, name:'Vikram Bose',    avatar:'VB', spec:'CrossFit & Functional Fitness', rating:4.6, reviews:142, price:1100, coins:45,  city:'Kolkata',   exp:'7 yrs',  online:true,  offline:true,  badge:'Top Rated',  grad:'linear-gradient(135deg,#8B5CF6,#FF4500)', verified:true,  about:'CrossFit Level 2 trainer with a passion for functional fitness and athletic performance. Programs designed to make everyday life easier.', certs:['CF-L2','Olympic Weightlifting','FMS Certified'] },
  { id:6, name:'Anjali Patel',   avatar:'AP', spec:'Prenatal & Postnatal Fitness',  rating:4.8, reviews:54,  price:950,  coins:42,  city:'Pune',      exp:'5 yrs',  online:true,  offline:true,  badge:'Specialist', grad:'linear-gradient(135deg,#FF4500,#FFB800)', verified:true,  about:'Specialist in pre and postnatal exercise. Safe, gentle, and effective workouts for mothers at every stage. Pelvic floor rehab and postnatal strength rebuilding.', certs:['CETI Prenatal Certified','Pelvic Floor Specialist','Postnatal Recovery'] },
  { id:7, name:'Deepak Verma',   avatar:'DV', spec:'Marathon & Running Coaching',   rating:4.7, reviews:88,  price:850,  coins:38,  city:'Hyderabad', exp:'6 yrs',  online:true,  offline:false, badge:'Rising',     grad:'linear-gradient(135deg,#00E5A0,#FFB800)', verified:true,  about:'USATF certified running coach and 3x marathon finisher. Builds base fitness, speed, and race-day strategy for beginners through sub-3-hour marathoners.', certs:['USATF Running Coach','RRCA Certified','Sports Physiology'] },
  { id:8, name:'Meera Krishnan', avatar:'MK', spec:'Zumba & Dance Fitness',         rating:4.9, reviews:167, price:700,  coins:32,  city:'Kochi',     exp:'5 yrs',  online:true,  offline:true,  badge:'Most Loved', grad:'linear-gradient(135deg,#FF4500,#8B5CF6)', verified:true,  about:'Licensed Zumba Instructor and Bollywood dance fitness coach. Burns 400–600 calories per session while actually having fun. Suitable for all ages.', certs:['ZIN Certified','Bollywood Dance Pro','Group Fitness Instructor'] },
];

const LEARNERS = [
  { id:1, name:'Amit Kumar',  avatar:'AK', goal:'Weight Loss',  progress:60, sessions:8,  streak:12, coins:150, trainer:'Arjun Sharma', grad:'linear-gradient(135deg,#38BFFF,#8B5CF6)' },
  { id:2, name:'Sneha Roy',   avatar:'SR', goal:'Strength',      progress:35, sessions:3,  streak:5,  coins:85,  trainer:'Arjun Sharma', grad:'linear-gradient(135deg,#FFB800,#FF4500)' },
  { id:3, name:'Rohan Verma', avatar:'RV', goal:'Marathon Prep', progress:78, sessions:15, streak:21, coins:200, trainer:'Rahul Singh',  grad:'linear-gradient(135deg,#00E5A0,#38BFFF)' },
  { id:4, name:'Priya Das',   avatar:'PD', goal:'Yoga & Flex',   progress:45, sessions:6,  streak:8,  coins:120, trainer:'Priya Mehta',  grad:'linear-gradient(135deg,#8B5CF6,#FF4500)' },
  { id:5, name:'Kiran Nair',  avatar:'KN', goal:'Post-baby fit', progress:52, sessions:4,  streak:6,  coins:95,  trainer:'Anjali Patel', grad:'linear-gradient(135deg,#FF4500,#FFB800)' },
];

const TESTIMONIALS = [
  { name:'Amit Kumar',  city:'Delhi',     av:'AK', grad:'linear-gradient(135deg,#38BFFF,#8B5CF6)', result:'-18kg in 4mo',        text:'Lost 18kg in 4 months with Arjun. The progress tracking kept me honest every single day. Genuinely the best investment I\'ve made in my health.', stars:5 },
  { name:'Sneha Roy',   city:'Mumbai',    av:'SR', grad:'linear-gradient(135deg,#FF4500,#FF6A35)', result:'6mo consistent',       text:'Online yoga with Priya is a game changer. She adapts to my crazy schedule, and I\'ve never felt more flexible or calm. Cannot recommend enough.', stars:5 },
  { name:'Rohan Verma', city:'Bangalore', av:'RV', grad:'linear-gradient(135deg,#00E5A0,#38BFFF)', result:'+40kg bench in 3mo',   text:'Bench press went from 50kg to 90kg in 3 months with Rahul. Science-backed programming, no bro-science. My squat technique finally stopped hurting.', stars:5 },
  { name:'Kavya Iyer',  city:'Chennai',   av:'KI', grad:'linear-gradient(135deg,#FFB800,#FF4500)', result:'-12kg, no crash diet',  text:'Kavya rebuilt my relationship with food. No crash diets. I now understand macros and meal timing. Lost 12kg without starving myself.', stars:5 },
  { name:'Meera Shah',  city:'Pune',      av:'MS', grad:'linear-gradient(135deg,#FF4500,#8B5CF6)', result:'Full recovery in 3mo',  text:'Post c-section, I was scared to exercise. Anjali\'s program was so safe and effective. Back to full strength in 3 months. Life changing.', stars:5 },
  { name:'Dev Patel',   city:'Hyderabad', av:'DP', grad:'linear-gradient(135deg,#00E5A0,#FFB800)', result:'First marathon 4:12',   text:'First marathon done — 4:12:34. Deepak\'s 16-week plan was perfect. He answered every WhatsApp at 5am. Truly invested in your success.', stars:5 },
];

const BADGE_CLS = { 'Top Rated':'b-gold','Trending':'b-fire','Pro':'b-sky','Expert':'b-mint','Specialist':'b-purple','Rising':'b-mint','Most Loved':'b-fire' };

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  Coins.set(Coins.get());
  document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));
  document.querySelectorAll('[data-count]').forEach(el => cntObs.observe(el));
  // Nav scroll
  const nav=document.getElementById('main-nav');
  if(nav) window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>30),{passive:true});
  // Sidebar toggle
  const tog=document.getElementById('sb-toggle'), sb=document.getElementById('sidebar');
  if(tog&&sb){
    tog.addEventListener('click',()=>sb.classList.toggle('mob-open'));
    document.addEventListener('click',e=>{ if(sb.classList.contains('mob-open')&&!sb.contains(e.target)&&e.target!==tog) sb.classList.remove('mob-open'); });
  }
});
