import React, { useState } from 'react';
import { Star, X, CheckCircle, MessageSquare } from 'lucide-react';
import { submitReview } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { BookingRequest } from '../types';

interface ReviewModalProps {
  booking: BookingRequest;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ booking, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!comment.trim()) {
      error('Please share a few words about your stay experience.');
      return;
    }

    setSubmitting(true);
    try {
      await submitReview({
        bookingId: booking.id,
        roomId: booking.roomId,
        hostId: booking.hostId,
        travellerId: user.uid,
        travellerName: user.displayName || 'Verified Traveller',
        rating,
        comment: comment.trim(),
      });
      success('Thank you! Your verified stay review has been posted.');
      onSuccess();
    } catch (err: any) {
      error(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Review Your Micro-Stay</h3>
            <p className="text-xs text-slate-500 truncate max-w-[260px]">{booking.roomTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
              How was your room cleanliness and comfort?
            </label>
            <div className="flex justify-center items-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-xs font-semibold text-slate-500 mt-1">
              {rating === 5 && 'Outstanding • Clean & Quiet'}
              {rating === 4 && 'Good • Met expectations'}
              {rating === 3 && 'Average'}
              {rating === 2 && 'Needs improvement'}
              {rating === 1 && 'Unsatisfactory'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Review & Tips for Fellow Aspirants
            </label>
            <textarea
              required
              rows={3}
              placeholder="E.g., Host was polite, WiFi was fast, room was quiet for exam preparation, hot shower was ready."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow"
            >
              {submitting ? 'Publishing...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
