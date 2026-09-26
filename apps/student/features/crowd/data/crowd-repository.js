import { api } from '@/shared/lib/api';

/**
 * CROWD REPOSITORY — Real backend integration.
 * Fetches crowd status and submits crowd reports to the API.
 */

let listeners = new Set();
let status = { level: null, origin: 'AUTOMATIC', responseCount: 0, updatedAt: new Date() };

// Local state for GPS simulation
let hasActiveVisit = false;
let feedbackPending = false;
let checkInDates = []; // Future: fetch from backend

export function getSnapshot() {
  return {
    status,
    hasActiveVisit,
    canSubmitFeedback: hasActiveVisit,
    feedbackPending,
    checkInDates,
  };
}

export function subscribe(listener) {
  listeners.add(listener);
  
  // Initial fetch
  fetchStatus();

  // Poll every 10s
  const timer = setInterval(fetchStatus, 10000);

  // Heartbeat every 60s while inside mess
  const heartbeatTimer = setInterval(() => {
    if (hasActiveVisit) {
      api.post('/presence/heartbeat').catch(() => {});
    }
  }, 60000);
  
  listener(getSnapshot());
  
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      clearInterval(heartbeatTimer);
    }
  };
}

async function fetchStatus() {
  try {
    const res = await api.get('/reviews/crowd-status');
    status = res.status;
    emit();
  } catch (err) {
    // Silently fail in background, keep old status
  }
}

function emit() {
  const snap = getSnapshot();
  listeners.forEach((fn) => fn(snap));
}

export function enterMess() {
  hasActiveVisit = true;
  feedbackPending = true;
  emit();
  api.post('/presence/enter').then((res) => {
    if (res?.count !== undefined) {
      status = { ...status, headcount: res.count };
      emit();
    }
  }).catch(() => {});
}

export function leaveMess() {
  hasActiveVisit = false;
  feedbackPending = false;
  emit();
  api.post('/presence/leave').then((res) => {
    if (res?.count !== undefined) {
      status = { ...status, headcount: res.count };
      emit();
    }
  }).catch(() => {});
}

export async function submitFeedback(level) {
  if (!feedbackPending) return false;
  feedbackPending = false;
  emit();
  
  try {
    await api.post('/reviews/crowd', { level });
    await fetchStatus();
    return true;
  } catch (err) {
    console.error('Failed to submit crowd feedback:', err);
    return false;
  }
}

/**
 * Called when the student taps the crowd-review push notification.
 * Re-surfaces the in-app feedback prompt even if they already dismissed it once.
 */
export function triggerFeedbackFromNotification() {
  if (hasActiveVisit) {
    feedbackPending = true;
    emit();
  }
}

// Stubs for simulation tools in home-screen.js
export function setOwnerOverride(level) {}
export function clearOwnerOverride() {}
export function resetSimulation() {
  leaveMess();
}
