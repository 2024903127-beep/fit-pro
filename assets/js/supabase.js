// ============================================================
// SUPABASE INTEGRATION — FitPro
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with your values
// ============================================================

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// Load Supabase client (CDN version — included in HTML head)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let supabase = null;

function initSupabase() {
  if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[FitPro] Supabase initialized');
  } else {
    console.warn('[FitPro] Supabase SDK not loaded — running in DEMO mode');
  }
  return supabase;
}

// ─── AUTH ────────────────────────────────────────────────────

const Auth = {

  // Send OTP to email
  async sendOTP(email) {
    if (!supabase) {
      Toast.show('Demo mode: use any 6-digit OTP', 'info');
      return { demo: true };
    }
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) { Toast.show(error.message, 'error'); return null; }
    Toast.show(`OTP sent to ${email}`, 'success');
    return { sent: true };
  },

  // Verify OTP
  async verifyOTP(email, token) {
    if (!supabase) {
      // Demo: any 6-digit code works
      if (token.length === 6) return { user: { id: 'demo_' + Date.now(), email } };
      return null;
    }
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) { Toast.show(error.message, 'error'); return null; }
    return data;
  },

  // Google OAuth
  async googleSignIn() {
    if (!supabase) { Toast.show('Configure Supabase to enable Google login', 'info'); return; }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/pages/learner-dashboard.html' }
    });
    if (error) Toast.show(error.message, 'error');
  },

  // Get current session
  async getSession() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session;
  },

  // Get current user
  async getUser() {
    if (!supabase) return { id: 'demo_user', email: 'demo@fitpro.in' };
    const { data } = await supabase.auth.getUser();
    return data?.user;
  },

  // Logout
  async logout() {
    if (supabase) await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '../index.html';
  },

  // Create profile after registration
  async createProfile(userId, role, data) {
    if (!supabase) return { demo: true };
    const { error } = await supabase.from('profiles').upsert({
      id: userId, role, ...data, created_at: new Date().toISOString()
    });
    if (error) console.error('Profile creation error:', error);
    return !error;
  }
};

// ─── DATABASE ─────────────────────────────────────────────────

const DB = {

  // Get all verified trainers
  async getTrainers(filters = {}) {
    if (!supabase) return DEMO_TRAINERS;
    let q = supabase
      .from('trainers')
      .select('*, profiles(*)')
      .eq('is_verified', true);
    if (filters.specialty) q = q.contains('specialty', [filters.specialty]);
    const { data, error } = await q;
    if (error) { console.error(error); return DEMO_TRAINERS; }
    return data;
  },

  // Get trainer by ID
  async getTrainer(id) {
    if (!supabase) return DEMO_TRAINERS.find(t => t.id == id);
    const { data } = await supabase
      .from('trainers')
      .select('*, profiles(*)')
      .eq('id', id)
      .single();
    return data;
  },

  // Create booking
  async createBooking(bookingData) {
    if (!supabase) {
      Toast.show('Booking created (demo)!', 'success');
      return { id: 'demo_booking_' + Date.now(), ...bookingData };
    }
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();
    if (error) { Toast.show(error.message, 'error'); return null; }
    return data;
  },

  // Get learner bookings
  async getLearnerBookings(learnerId) {
    if (!supabase) return [];
    const { data } = await supabase
      .from('bookings')
      .select('*, trainers(*, profiles(*))')
      .eq('learner_id', learnerId)
      .order('session_date', { ascending: false });
    return data || [];
  },

  // Get trainer bookings
  async getTrainerBookings(trainerId) {
    if (!supabase) return [];
    const { data } = await supabase
      .from('bookings')
      .select('*, learners(*, profiles(*))')
      .eq('trainer_id', trainerId)
      .order('session_date', { ascending: false });
    return data || [];
  },

  // Update booking status
  async updateBooking(id, status, zoomLink = null) {
    if (!supabase) return true;
    const update = { status };
    if (zoomLink) update.zoom_link = zoomLink;
    const { error } = await supabase.from('bookings').update(update).eq('id', id);
    return !error;
  },

  // Log progress
  async logProgress(learnerId, weight, notes = '') {
    if (!supabase) return { demo: true };
    const { data, error } = await supabase
      .from('progress_logs')
      .insert({ learner_id: learnerId, weight, notes, log_date: new Date().toISOString().split('T')[0] })
      .select().single();
    if (error) { Toast.show(error.message, 'error'); return null; }
    return data;
  },

  // Get progress logs
  async getProgress(learnerId, days = 30) {
    if (!supabase) return [92,91,90.5,89.8,89,88.2,87.5,87,86.3,86,85.5,85.1,84.7,84.2];
    const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    const { data } = await supabase
      .from('progress_logs')
      .select('weight, log_date')
      .eq('learner_id', learnerId)
      .gte('log_date', since)
      .order('log_date');
    return data?.map(d => d.weight) || [];
  },

  // Send message
  async sendMessage(senderId, receiverId, content) {
    if (!supabase) return { demo: true };
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: senderId, receiver_id: receiverId, content })
      .select().single();
    if (error) { Toast.show(error.message, 'error'); return null; }
    return data;
  },

  // Get messages between two users
  async getMessages(userId1, userId2) {
    if (!supabase) return [];
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .order('created_at');
    return data || [];
  },

  // Coin transaction
  async addCoinTransaction(userId, amount, type, reason, paymentId = null) {
    if (!supabase) return { demo: true };
    const { data, error } = await supabase
      .from('coin_transactions')
      .insert({ user_id: userId, amount, type, reason, payment_id: paymentId })
      .select().single();
    return data;
  },

  // Get pending trainer registrations (admin)
  async getPendingTrainers() {
    if (!supabase) return [];
    const { data } = await supabase
      .from('trainers')
      .select('*, profiles(*)')
      .eq('is_verified', false);
    return data || [];
  },

  // Verify/reject trainer (admin)
  async setTrainerVerified(trainerId, approved) {
    if (!supabase) return true;
    if (approved) {
      const { error } = await supabase
        .from('trainers')
        .update({ is_verified: true })
        .eq('id', trainerId);
      return !error;
    } else {
      const { error } = await supabase
        .from('trainers')
        .delete()
        .eq('id', trainerId);
      return !error;
    }
  },

  // Upload file to Supabase Storage
  async uploadFile(bucket, filePath, file) {
    if (!supabase) {
      Toast.show('File upload requires Supabase setup', 'info');
      return { demo: true, path: filePath };
    }
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });
    if (error) { Toast.show(error.message, 'error'); return null; }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { path: filePath, url: urlData.publicUrl };
  }
};

// ─── REALTIME MESSAGES ──────────────────────────────────────

const Realtime = {
  channel: null,

  subscribeToMessages(userId, onMessage) {
    if (!supabase) return;
    this.channel = supabase
      .channel('messages_' + userId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`
      }, payload => onMessage(payload.new))
      .subscribe();
  },

  unsubscribe() {
    if (this.channel) supabase.removeChannel(this.channel);
  }
};

// Init on load
document.addEventListener('DOMContentLoaded', initSupabase);
