import { supabase, isSupabaseConfigured } from '../supabase/config';
import type { Review } from '../types';

const REVIEWS_STORAGE_KEY = 'bachelors_flat_reviews';

function getLocalReviews(): Review[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReviews(reviews: Review[]): void {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  } catch (error) {
    console.error('Failed to save reviews locally:', error);
  }
}

function rowToReview(row: Record<string, any>): Review {
  return {
    id: row.id,
    bookingId: row.booking_id,
    roomId: row.room_id,
    hostId: row.host_id,
    travellerId: row.traveller_id,
    travellerName: row.traveller_name,
    rating: Number(row.rating),
    comment: row.comment,
    moderationStatus: row.moderation_status,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function getRoomReviews(roomId: string): Promise<Review[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('room_id', roomId)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('Supabase fetch reviews failed:', error);
      } else if (data) {
        return data.map(rowToReview);
      }
    } catch (err) {
      console.warn('Supabase reviews query error:', err);
    }
  }

  const local = getLocalReviews();
  return local.filter((r) => r.roomId === roomId && r.moderationStatus === 'approved');
}

export interface CreateReviewParams {
  bookingId: string;
  roomId: string;
  hostId: string;
  travellerId: string;
  travellerName: string;
  rating: number;
  comment: string;
}

export async function submitReview(params: CreateReviewParams): Promise<Review> {
  const newReview: Review = {
    id: 'rev-' + Date.now().toString(36),
    ...params,
    moderationStatus: 'approved',
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('reviews').insert({
        id: newReview.id,
        booking_id: newReview.bookingId,
        room_id: newReview.roomId,
        host_id: newReview.hostId,
        traveller_id: newReview.travellerId,
        traveller_name: newReview.travellerName,
        rating: newReview.rating,
        comment: newReview.comment,
        moderation_status: 'approved',
        created_at: newReview.createdAt,
      });
    } catch (err) {
      console.warn('Supabase review insert failed, saving locally:', err);
    }
  }

  const local = getLocalReviews();
  local.unshift(newReview);
  saveLocalReviews(local);

  return newReview;
}
