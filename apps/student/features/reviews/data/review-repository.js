import { api } from '@/shared/lib/api';

export async function submitGeneralReview(rating, comment) {
  try {
    await api.post('/reviews/general', { rating, comment });
    return { success: true };
  } catch (err) {
    console.error('Failed to submit review', err);
    return { success: false, error: err.message };
  }
}
