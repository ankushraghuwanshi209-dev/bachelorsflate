import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Navigation,
  Copy,
  Info
} from 'lucide-react';
import type { BookingRequest, BookingStatus } from '../types';
import { getTravellerBookings, updateBookingStatus } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ReviewModal } from '../components/ReviewModal';

interface TravellerDashboardPageProps {
  highlightBookingId?: string;
  onNavigateToRoom: (roomId: string) => void;
  onNavigateToSearch: () => void;
  onNavigate?: (view: string, param?: string) => void;
}

export const TravellerDashboardPage: React.FC<TravellerDashboardPageProps> = ({
  highlightBookingId,
  onNavigateToRoom,
  onNavigateToSearch,
  onNavigate,
}) => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all');
  const [reviewingBooking, setReviewingBooking] = useState<BookingRequest | null>(null);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await getTravellerBookings(user.uid);
      setBookings(list);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user?.uid]);

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this reservation request?')) return;
    try {
      await updateBookingStatus(bookingId, 'cancelled');
      success('Booking reservation cancelled.');
      fetchBookings();
    } catch (err: any) {
      error(err.message || 'Failed to cancel booking.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    info(`${label} copied to clipboard.`);
  };

  const filteredBookings = filterStatus === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filterStatus);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Accepted & Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Waiting for Host
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Declined by Host
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
            Cancelled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
            Stay Completed
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Traveller Reservations & Micro-Stays
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your requested rooms, view check-in details once accepted, and review completed stays.
          </p>
        </div>

        <button
          onClick={onNavigateToSearch}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          Book Another Room
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'all', label: 'All Requests' },
          { key: 'accepted', label: 'Accepted & Confirmed' },
          { key: 'pending', label: 'Pending' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled / Declined' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key as any)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              filterStatus === tab.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse h-48" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No reservations found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any bookings matching this status. Find an exam or rest room when you're ready!
          </p>
          <button
            onClick={onNavigateToSearch}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold"
          >
            Browse Available Rooms
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredBookings.map((b) => {
            const isAccepted = b.status === 'accepted';
            const isCompleted = b.status === 'completed';
            const isPending = b.status === 'pending';

            return (
              <div
                key={b.id}
                className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                  b.id === highlightBookingId
                    ? 'border-brand-500 ring-2 ring-brand-300 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Top bar: Room title, Status, and Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={b.roomPhoto || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=200&q=80'}
                        alt={b.roomTitle}
                        className="w-14 h-14 rounded-2xl object-cover bg-slate-100 flex-shrink-0"
                      />
                      <div>
                        <h3
                          onClick={() => onNavigateToRoom(b.roomId)}
                          className="font-bold text-slate-900 text-sm sm:text-base hover:text-brand-700 cursor-pointer transition-colors"
                        >
                          {b.roomTitle}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-600" />
                          {b.neighbourhood}, {b.city}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:self-center">
                      {getStatusBadge(b.status)}
                    </div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-slate-400 font-medium text-[11px]">Date & Time</p>
                      <p className="font-bold text-slate-900 mt-0.5">{b.date} at {b.startTime}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-slate-400 font-medium text-[11px]">Duration</p>
                      <p className="font-bold text-slate-900 mt-0.5 capitalize">
                        {b.duration.replace('_', ' ')} (~{b.durationHours}h)
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-slate-400 font-medium text-[11px]">Guest Count</p>
                      <p className="font-bold text-slate-900 mt-0.5">{b.guestCount} Guest</p>
                    </div>

                    <div className="bg-teal-50/70 p-3 rounded-2xl border border-teal-100">
                      <p className="text-teal-700 font-medium text-[11px]">Total Fee (Pay at check-in)</p>
                      <p className="font-extrabold text-teal-900 text-sm mt-0.5">₹{b.totalPrice}</p>
                    </div>
                  </div>

                  {/* SENSITIVE DETAILS: Revealed ONLY When Accepted or Completed */}
                  {isAccepted && (
                    <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3 animate-fade-in">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Host Accepted! Unlocked Check-in Details
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-emerald-950">
                        {/* Exact Address */}
                        <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/80 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">Exact Room Address:</span>
                            <button
                              onClick={() => copyToClipboard(b.privateDetails?.exactAddress || '', 'Exact Address')}
                              className="text-[11px] text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          </div>
                          <p className="font-medium text-slate-900 leading-relaxed">
                            {b.privateDetails?.exactAddress || 'Contact host directly for final door instructions.'}
                          </p>
                        </div>

                        {/* Host Phone & Check-in Instructions */}
                        <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/80 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">Host Contact:</span>
                            {b.privateDetails?.hostPhone && (
                              <a
                                href={`tel:${b.privateDetails.hostPhone}`}
                                className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                              >
                                <Phone className="w-3 h-3" /> Call Host
                              </a>
                            )}
                          </div>
                          <p className="font-medium text-slate-900">{b.hostName} ({b.privateDetails?.hostPhone || 'Shared via chat'})</p>
                          <p className="text-[11px] text-slate-600 mt-1 italic">
                            {b.privateDetails?.checkInInstructions || 'Ring doorbell upon arrival. Present your ID.'}
                          </p>
                        </div>
                      </div>

                      <div className="bg-teal-50/80 border border-teal-200/80 rounded-xl p-3 flex items-start gap-2 text-xs text-teal-950">
                        <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-bold text-teal-900">In-Person Physical ID Verification Reminder</p>
                          <p className="text-[11px] leading-relaxed text-teal-800">
                            Please carry a valid physical government-issued photo ID (Aadhaar, Voter ID, Passport, or Driving License) to present directly to the host upon check-in. To safeguard privacy, no ID photos or numbers are collected online.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => onNavigateToRoom(b.roomId)}
                      className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1"
                    >
                      View Room Listing Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <button
                          onClick={() => setReviewingBooking(b)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Star className="w-3.5 h-3.5" /> Leave Review
                        </button>
                      )}

                      {(isPending || isAccepted) && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="px-3.5 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewingBooking && (
        <ReviewModal
          booking={reviewingBooking}
          onClose={() => setReviewingBooking(null)}
          onSuccess={() => {
            setReviewingBooking(null);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
};
