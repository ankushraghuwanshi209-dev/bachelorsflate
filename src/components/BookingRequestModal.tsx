import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  CheckCircle,
  X,
  CreditCard,
  Info
} from 'lucide-react';
import type { RoomListing, StayDurationType } from '../types';
import { createBookingRequest } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface BookingRequestModalProps {
  room: RoomListing;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
  onRequireAuth: () => void;
}

export const BookingRequestModal: React.FC<BookingRequestModalProps> = ({
  room,
  onClose,
  onSuccess,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('09:00');
  const duration: StayDurationType = '2-3_hours';
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState('');
  const [travellerPhone, setTravellerPhone] = useState(user?.phoneNumber || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'review'>('form');

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Account Required to Request</h3>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Please log in or sign up with Bachelors Flat to send a micro-stay reservation request to this host.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                onRequireAuth();
              }}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors"
            >
              Log In / Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Price & duration calculations
  const durationHours = 3;
  const calculatedPrice = room.pricing.twoToThreeHours;

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime) {
      error('Please select both a date and start time.');
      return;
    }
    if (!travellerPhone.trim()) {
      error('Please provide a phone number for the host to coordinate your arrival.');
      return;
    }
    setStep('review');
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    try {
      const newBooking = await createBookingRequest({
        roomId: room.id,
        roomTitle: room.title,
        roomPhoto: room.photos[0] || '',
        city: room.city,
        neighbourhood: room.neighbourhood,
        hostId: room.hostId,
        hostName: room.hostName,
        travellerId: user.uid,
        travellerName: user.displayName || 'Traveller',
        travellerEmail: user.email,
        travellerPhone,
        date,
        startTime,
        duration,
        durationHours,
        guestCount,
        message: message.trim(),
        totalPrice: calculatedPrice,
      });

      success('Booking request sent successfully to host! Check status in your dashboard.');
      onSuccess(newBooking.id);
    } catch (err: any) {
      error(err.message || 'Failed to submit booking request. Please check conflicting slots.');
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {step === 'form' ? 'Request Room Reservation' : 'Review & Confirm Request'}
            </h2>
            <p className="text-xs text-slate-500">
              {room.neighbourhood}, {room.city}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleProceedToReview} className="space-y-4 pt-4">
            {/* Stay Duration Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Stay Duration Option
              </label>
              <div className="grid grid-cols-1 gap-2">
                <div className="p-3 rounded-xl border border-brand-500 bg-brand-50/70 text-center text-brand-900">
                  <p className="font-bold text-xs">2–3 Hours</p>
                  <p className="text-xs font-extrabold text-teal-700 mt-0.5">₹{room.pricing.twoToThreeHours}</p>
                  <p className="text-[10px] text-slate-400">Power nap / Fresh up</p>
                </div>
              </div>
            </div>

            {/* Date and Start Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Guest Count & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Number of Guests
                </label>
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value={1}>1 Guest (Aspirant / Solo)</option>
                  <option value={2}>2 Guests</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Contact Phone
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={travellerPhone}
                  onChange={(e) => setTravellerPhone(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Message to Host */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Note for Host (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="E.g., Appearing for UPSC prelims afternoon shift nearby. Need quiet desk to revise and quick nap."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Payment & Security Clarification Notice */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <span>Zero Advance Payment Required</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                You will not be charged right now. Pay the total of <strong>₹{calculatedPrice}</strong> directly to the host when you check in (Cash / UPI).
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-md transition-all"
              >
                Review Request Details →
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Review Request */
          <div className="space-y-4 pt-4">
            <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-teal-100">
                <span className="text-slate-500">Room</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{room.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Date & Slot</span>
                <span className="font-bold text-slate-900">{date} at {startTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Duration</span>
                <span className="font-bold text-teal-800 capitalize">
                  {duration.replace('_', ' ')} (~{durationHours} hours)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Guests</span>
                <span className="font-bold text-slate-900">{guestCount} Guest</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-teal-100">
                <span className="text-sm font-bold text-slate-900">Total Payable at Check-in</span>
                <span className="text-base font-extrabold text-teal-700">₹{calculatedPrice}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Host Privacy Guard:</strong> For security, the host's exact house number, full street address, and check-in door instructions will become visible in your traveller dashboard the moment the host accepts this request.
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setStep('form')}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                ← Back to Edit
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmBooking}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Checking Availability...</span>
                ) : (
                  <span>Send Request to Host</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
