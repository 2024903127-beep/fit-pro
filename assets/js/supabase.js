/* ════════════════════════════════════════════════
   FITPRO — SUPABASE INTEGRATION
   Auth · Database · Storage · Realtime
   Replace SUPABASE_URL and SUPABASE_ANON_KEY below
   ════════════════════════════════════════════════ */

const SUPABASE_URL     = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

// NOTE: Add this script tag in your HTML head to load Supabase SDK:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let _sb = null;

function initSupabase() {
  if (window.supabase && window.supabase.createClient) {
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[FitPro] Supabase ready');
  } else {
    console.warn('[FitPro] Supabase SDK not loaded — running in DEMO mode');
  }
  return _sb;
}

/* ── AUTH ─────────────────────────────────────── */
const Auth = {

  // Send OTP to email
  async sendOTP(email) {
    if (!_sb) {
      Toast.show('Demo mode: any 6-digit OTP works', 'info');
      return { demo: true };
    }
    const { error } = await _sb.auth.signInWithOtp({ email });
    if (error) { Toast.show(error.message, 'error'); return null; }
    Toast.show('OTP sent to ' + email, 'success');
    return { sent: true };
  },

  // Verify OTP — returns session or null
  async verifyOTP(email, token) {
    if (!_sb) {
      if (token.length === 6) return { user: { id: 'demo_' + Date.now(), email } };
      return null;
    }
    const { data, error } = await _sb.auth.verifyOtp({ email, token, type: 'email' });
    if (error) { Toast.show(error.message, 'error'); return null; }
    return data;
  },

  // Google OAuth
  async googleSignIn() {
    if (!_sb) { Toast.show('Configure Supabase for Google login', 'info'); return; }
    const { error } = await _sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/pages/learner-dashboard.html' }
    });
    if (error) Toast.show(error.message, 'error');
  },

  // Get current user
  async getUser() {
    if (!_sb) return { id: 'demo_user', email: 'demo@fitpro.in', role: 'learner' };
    const { data } = await _sb.auth.getUser();
    return data?.user || null;
  },

  // Get current session
  async getSession() {
    if (!_sb) return null;
    const { data } = await _sb.auth.getSession();
    return data?.session || null;
  },

  // Sign out
  async logout() {
    if (_sb) await _sb.auth.signOut();
    localStorage.clear();
    window.location.href = '../index.html';
  },

  // Create profile after registration
  async createProfile(userId, role, profileData) {
    if (!_sb) return { demo: true };
    const { error } = await _sb.from('profiles').upsert({
      id: userId,
      role,
      ...profileData,
      created_at: new Date().toISOString()
    });
    if (error) console.error('[Supabase] Profile error:', error);
    return !error;
  },

  // Require auth — redirect if not logged in
  async requireAuth(redirectTo = '../pages/login.html') {
    const session = await this.getSession();
    if (!session && !_sb) return; // demo mode, allow
    if (!session) window.location.href = redirectTo;
    return session;
  }
};

/* ── DATABASE ─────────────────────────────────── */
const DB = {

  // ── TRAINERS ────────────────────────────────
  async getTrainers(filters = {}) {
    if (!_sb) return TRAINERS; // demo data from core.js
    let q = _sb.from('trainers').select('*, profiles(*)').eq('is_verified', true);
    if (filters.specialty) q = q.contains('specialty', [filters.specialty]);
    if (filters.city)      q = q.eq('city', filters.city);
    const { data, error } = await q.order('rating', { ascending: false });
    if (error) { console.error(error); return TRAINERS; }
    return data || TRAINERS;
  },

  async getTrainerById(id) {
    if (!_sb) return TRAINERS.find(t => t.id == id) || TRAINERS[0];
    const { data } = await _sb.from('trainers').select('*, profiles(*)').eq('id', id).single();
    return data;
  },

  async updateTrainerProfile(trainerId, updates) {
    if (!_sb) return true;
    const { error } = await _sb.from('trainers').update(updates).eq('id', trainerId);
    if (error) { Toast.show(error.message, 'error'); return false; }
    Toast.show('Profile updated!', 'success');
    return true;
  },

  // ── LEARNERS ────────────────────────────────
  async getLearnerProfile(userId) {
    if (!_sb) return LEARNERS[0];
    const { data } = await _sb.from('learners').select('*, profiles(*)').eq('id', userId).single();
    return data;
  },

  // ── BOOKINGS ────────────────────────────────
  async createBooking(bookingData) {
    if (!_sb) {
      Toast.show('Booking created! (demo)', 'success');
      return { id: 'BK_DEMO_' + Date.now(), ...bookingData, status: 'pending' };
    }
    const { data, error } = await _sb.from('bookings').insert(bookingData).select().single();
    if (error) { Toast.show(error.message, 'error'); return null; }
    return data;
  },

  async getLearnerBookings(learnerId) {
    if (!_sb) return [];
    const { data } = await _sb.from('bookings')
      .select('*, trainers(*, profiles(*))')
      .eq('learner_id', learnerId)
      .order('session_date', { ascending: false });
    return data || [];
  },

  async getTrainerBookings(trainerId) {
    if (!_sb) return [];
    const { data } = await _sb.from('bookings')
      .select('*, learners(*, profiles(*))')
      .eq('trainer_id', trainerId)
      .order('session_date', { ascending: false });
    return data || [];
  },

  async updateBookingStatus(bookingId, status, extra = {}) {
    if (!_sb) return true;
    const { error } = await _sb.from('bookings').update({ status, ...extra }).eq('id', bookingId);
    return !error;
  },

  // ── PROGRESS ────────────────────────────────
  async logProgress(learnerId, entry) {
    if (!_sb) return { demo: true };
    const { data, error } = await _sb.from('progress_logs')
      .insert({ learner_id: learnerId, log_date: new Date().toISOString().split('T')[0], ...entry })
      .select().single();
    if (error) { Toast.show(error.message, 'error'); return null; }
    return data;
  },

  async getProgress(learnerId, days = 30) {
    if (!_sb) return [92,91.5,91,90.5,90,89.5,89,88.5,88,87.5,87,86.5,86,85.8,85.5,85.2,84.9,84.7,84.5,84.2,84,83.8,83.6,83.4,83.2,83,82.8,82.6,82.4,82.2];
    const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    const { data } = await _sb.from('progress_logs')
      .select('weight, log_date')
      .eq('learner_id', learnerId)
      .gte('log_date', since)
      .order('log_date');
    return data?.map(d => d.weight) || [];
  },

  // ── MESSAGES ────────────────────────────────
  async sendMessage(senderId, receiverId, content) {
    if (!_sb) return { id: 'msg_' + Date.now(), content, sent_at: new Date().toISOString() };
    const { data, error } = await _sb.from('messages')
      .insert({ sender_id: senderId, receiver_id: receiverId, content })
      .select().single();
    if (error) { Toast.show(error.message, 'error'); return null; }
    return data;
  },

  async getMessages(userId1, userId2, limit = 50) {
    if (!_sb) return [];
    const { data } = await _sb.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .order('created_at')
      .limit(limit);
    return data || [];
  },

  // ── COIN TRANSACTIONS ────────────────────────
  async addCoinTransaction(userId, amount, type, reason, paymentId = null) {
    if (!_sb) return { demo: true };
    const { data } = await _sb.from('coin_transactions')
      .insert({ user_id: userId, amount, type, reason, payment_id: paymentId })
      .select().single();
    return data;
  },

  async getCoinHistory(userId, limit = 20) {
    if (!_sb) return [];
    const { data } = await _sb.from('coin_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  },

  // ── WORKOUTS ────────────────────────────────
  async getWorkoutPlan(learnerId) {
    if (!_sb) return null;
    const { data } = await _sb.from('workout_plans')
      .select('*')
      .eq('learner_id', learnerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return data;
  },

  async uploadWorkoutPlan(trainerId, learnerId, plan) {
    if (!_sb) return { demo: true };
    const { data, error } = await _sb.from('workout_plans')
      .insert({ trainer_id: trainerId, learner_id: learnerId, ...plan })
      .select().single();
    if (error) { Toast.show(error.message, 'error'); return null; }
    Toast.show('Workout plan sent to learner!', 'success');
    return data;
  },

  // ── ATTENDANCE ───────────────────────────────
  async markAttendance(bookingId, learnerId, present) {
    if (!_sb) return true;
    const { error } = await _sb.from('attendance')
      .upsert({ booking_id: bookingId, learner_id: learnerId, present, marked_at: new Date().toISOString() });
    return !error;
  },

  async getAttendance(learnerId, month) {
    if (!_sb) return [];
    const { data } = await _sb.from('attendance')
      .select('*, bookings(session_date)')
      .eq('learner_id', learnerId);
    return data || [];
  },

  // ── ADMIN ────────────────────────────────────
  async getPendingTrainers() {
    if (!_sb) return [];
    const { data } = await _sb.from('trainers')
      .select('*, profiles(*)')
      .eq('is_verified', false)
      .order('created_at', { ascending: false });
    return data || [];
  },

  async verifyTrainer(trainerId, approved) {
    if (!_sb) return true;
    if (approved) {
      const { error } = await _sb.from('trainers').update({ is_verified: true }).eq('id', trainerId);
      return !error;
    } else {
      const { error } = await _sb.from('trainers').delete().eq('id', trainerId);
      return !error;
    }
  },

  async getPlatformStats() {
    if (!_sb) return { trainers: 47, learners: 892, sessions: 12400, revenue: 120000 };
    const [t, l, s] = await Promise.all([
      _sb.from('trainers').select('id', { count: 'exact', head: true }).eq('is_verified', true),
      _sb.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'learner'),
      _sb.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    ]);
    return { trainers: t.count||47, learners: l.count||892, sessions: s.count||12400 };
  },

  // ── NOTICES ──────────────────────────────────
  async getNotices() {
    if (!_sb) return [
      { id:1, title:'Platform Maintenance', body:'Sunday 2–4 AM IST. No bookings during this window.', audience:'all', created_at: new Date().toISOString() }
    ];
    const { data } = await _sb.from('notices').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  async postNotice(title, body, audience) {
    if (!_sb) return { demo: true };
    const { data, error } = await _sb.from('notices').insert({ title, body, audience }).select().single();
    if (error) { Toast.show(error.message, 'error'); return null; }
    Toast.show('Notice posted!', 'success');
    return data;
  }
};

/* ── FILE UPLOAD ──────────────────────────────── */
const Storage = {
  async uploadFile(bucket, path, file) {
    if (!_sb) {
      Toast.show('File upload requires Supabase setup', 'info');
      return { demo: true, url: '#' };
    }
    const { data, error } = await _sb.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) { Toast.show(error.message, 'error'); return null; }
    const { data: urlData } = _sb.storage.from(bucket).getPublicUrl(path);
    return { path, url: urlData.publicUrl };
  },

  async deleteFile(bucket, path) {
    if (!_sb) return true;
    const { error } = await _sb.storage.from(bucket).remove([path]);
    return !error;
  }
};

/* ── REALTIME MESSAGES ────────────────────────── */
const Realtime = {
  _channel: null,
  subscribe(userId, onMessage) {
    if (!_sb) return;
    this._channel = _sb.channel('messages_' + userId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${userId}`
      }, payload => onMessage(payload.new))
      .subscribe();
  },
  unsubscribe() {
    if (_sb && this._channel) _sb.removeChannel(this._channel);
  }
};

/* ── SUPABASE SQL SCHEMA ──────────────────────────
   Run this in Supabase SQL Editor to set up all tables

CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  role text CHECK (role IN ('trainer','learner','admin')),
  full_name text, email text, phone text, city text,
  avatar_url text, created_at timestamptz DEFAULT now()
);

CREATE TABLE trainers (
  id uuid REFERENCES profiles PRIMARY KEY,
  specialty text[], experience_years int,
  session_price int, training_type text[],
  is_verified boolean DEFAULT false,
  coins int DEFAULT 0, rating numeric(3,2) DEFAULT 0,
  review_count int DEFAULT 0, about text,
  certifications text[]
);

CREATE TABLE learners (
  id uuid REFERENCES profiles PRIMARY KEY,
  goal text, coins int DEFAULT 100,
  streak int DEFAULT 0,
  trainer_id uuid REFERENCES trainers
);

CREATE TABLE bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id uuid REFERENCES learners,
  trainer_id uuid REFERENCES trainers,
  session_date timestamptz, session_type text,
  coins_spent int, status text DEFAULT 'pending',
  zoom_link text, zoom_password text,
  address text, notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES profiles,
  receiver_id uuid REFERENCES profiles,
  content text, created_at timestamptz DEFAULT now()
);

CREATE TABLE workout_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id uuid REFERENCES trainers,
  learner_id uuid REFERENCES learners,
  title text, exercises jsonb, week int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE progress_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id uuid REFERENCES learners,
  log_date date, weight numeric(5,2),
  energy_level int, notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE coin_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles,
  amount int, type text, reason text,
  payment_id text, created_at timestamptz DEFAULT now()
);

CREATE TABLE attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES bookings,
  learner_id uuid REFERENCES learners,
  present boolean, marked_at timestamptz
);

CREATE TABLE notices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text, body text, audience text DEFAULT 'all',
  created_at timestamptz DEFAULT now()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

── END SCHEMA ─────────────────────────────────── */

document.addEventListener('DOMContentLoaded', initSupabase);
