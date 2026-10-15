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

  // Consent checkboxes state
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [agreedToConduct, setAgreedToConduct] = useState(false);
  const [agreedToIdVerification, setAgreedToIdVerification] = useState(false);

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
    if (guestCount > room.candidateAllowance) {
      error(`This room allows a maximum of ${room.candidateAllowance} ${room.candidateAllowance === 1 ? 'candidate' : 'candidates'}.`);
      return;
    }
    setStep('review');
  };

  const handleConfirmBooking = async () => {
    if (guestCount > room.candidateAllowance) {
      error(`This booking exceeds the host's candidate allowance (${room.candidateAllowance} maximum).`);
      setStep('form');
      return;
    }

    if (!agreedToRules || !agreedToConduct || !agreedToIdVerification) {
      error('Please confirm all required terms: agree to host rules, conduct & allowance policy, and in-person ID verification.');
      return;
    }

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
        termsAgreed: true,
        termsAgreedAt: new Date().toISOString(),
        termsVersion: '2026-10-v1',
        rulesAgreed: true,
        idVerificationAgreed: true,
      });

      success('Booking request sent successfully to host! Check status in your dashboard.');
      onSuccess(newBooking.id);
    } catch (err: any) {
      error(err.message || 'Failed to submit booking request. Please check conflicting slots.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
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
                  {Array.from({ length: Math.max(1, room.candidateAllowance || 1) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest (Aspirant / Solo)' : `${n} Guests`}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Host Allowance: Up to {room.candidateAllowance} {room.candidateAllowance === 1 ? 'candidate' : 'candidates'} max.
                </p>
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

            {/* Host's House Rules */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                <Info className="w-4 h-4 text-brand-600" />
                <span>Host's House Rules ({room.hostName})</span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1 pl-1">
                {room.houseRules && room.houseRules.length > 0 ? (
                  room.houseRules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-brand-600 font-bold">•</span>
                      <span>{rule}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-1.5">
                    <span className="text-brand-600 font-bold">•</span>
                    <span>Maintain a quiet exam-preparation atmosphere. Respect premises and check-in times.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Conduct & Safety Standards */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-2 text-xs text-amber-950">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Conduct, Allowance & In-Person ID Policy</span>
              </div>
              <ul className="text-[11px] text-amber-900/90 space-y-1 list-disc list-inside">
                <li>
                  <strong>Allowance Limit:</strong> Group size must not exceed {room.candidateAllowance} {room.candidateAllowance === 1 ? 'candidate' : 'candidates'}.
                </li>
                <li>
                  <strong>Prohibited Conduct:</strong> Violence, harassment, threats, illegal acts, and use of intoxicating substances (alcohol, illicit drugs) are strictly forbidden on the property.
                </li>
                <li>
                  <strong>Privacy & In-Person ID Check:</strong> To safeguard your privacy, no government ID copies or numbers are uploaded or stored online. You agree to show your original physical government-issued photo ID directly to the host upon check-in.
                </li>
              </ul>
            </div>

            {/* Required Consent Checkboxes */}
            <div className="space-y-2.5 pt-1 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Required Agreements *
              </p>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={agreedToRules}
                  onChange={(e) => setAgreedToRules(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span className="text-slate-700 leading-snug">
                  I have read and agree to strictly follow the host's <strong>house rules</strong> and exam-study etiquette.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={agreedToConduct}
                  onChange={(e) => setAgreedToConduct(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span className="text-slate-700 leading-snug">
                  I confirm our group does not exceed the candidate allowance ({room.candidateAllowance} max), and will refrain from violence, harassment, illegal acts, and intoxicating substances.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={agreedToIdVerification}
                  onChange={(e) => setAgreedToIdVerification(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span className="text-slate-700 leading-snug">
                  I confirm that I will present a valid physical <strong>government-issued photo ID</strong> directly to the host upon arrival for in-person identity verification.
                </span>
              </label>
            </div>

            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Host Privacy Guard:</strong> For security, the host's exact house number, street address, and door instructions unlock in your dashboard only after the host accepts this request.
              </p>
            </div>

            <p className="text-[10px] text-slate-400 italic text-center">
              Notice: These terms define mutual traveller and host responsibilities; site operators should review final phrasing with local legal counsel.
            </p>

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
