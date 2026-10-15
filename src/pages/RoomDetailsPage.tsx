import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Star,
  Clock,
  ShieldCheck,
  CheckCircle,
  Lock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Calendar,
  Share2,
  Users,
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import type { RoomListing, Review } from '../types';
import { getRoomById } from '../services/roomService';
import { getRoomReviews } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BookingRequestModal } from '../components/BookingRequestModal';
import { ReportModal } from '../components/ReportModal';

interface RoomDetailsPageProps {
  roomId: string;
  onBack: () => void;
  onNavigateToBooking: (bookingId: string) => void;
  onRequireAuth: () => void;
}

export const RoomDetailsPage: React.FC<RoomDetailsPageProps> = ({
  roomId,
  onBack,
  onNavigateToBooking,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const { info } = useToast();

  const [room, setRoom] = useState<RoomListing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const found = await getRoomById(roomId, user?.uid);
        setRoom(found);
        if (found) {
          const revs = await getRoomReviews(roomId);
          setReviews(revs);
        }
      } catch (err) {
        console.error('Error fetching room details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [roomId, user?.uid]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    info('Room link copied to clipboard.');
  };

  // AUTH GUARD: User without login cannot view room details
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8 text-teal-600" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            Protected Room Details
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Log In to View Room Details
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Please log in or create an account to view photos, full pricing, verified host reviews, and request daytime micro-stays.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-2 max-w-xs mx-auto">
          <button
            onClick={onRequireAuth}
            className="w-full py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In to Continue</span>
          </button>
          <button
            onClick={onBack}
            className="w-full py-2.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-96 bg-slate-200 rounded-3xl" />
        <div className="h-24 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Room Not Found</h2>
        <p className="text-xs text-slate-500">This room listing may have been paused or removed.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          ← Return to Search
        </button>
      </div>
    );
  }

  const photos = room.photos?.length > 0 ? room.photos : ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80'];
  const isHostOwner = user?.uid === room.hostId;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Listings
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-semibold">Share</span>
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs flex items-center gap-1.5 transition-colors"
            title="Report this listing"
          >
            <Flag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-semibold">Report</span>
          </button>
        </div>
      </div>

      {/* Title & Approximate Area */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">

          <span className="bg-teal-50 text-teal-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-teal-200">
            {room.bathroomType === 'attached' ? 'Attached Bathroom' : 'Clean Bathroom Access'}
          </span>
          <span className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Users className="w-3 h-3 text-brand-600" />
            Up to {room.candidateAllowance} {room.candidateAllowance === 1 ? 'candidate' : 'candidates'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {room.title}
        </h1>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-2">
          <MapPin className="w-4 h-4 text-brand-600" />
          <span>{room.neighbourhood}, {room.city}</span>
          <span>•</span>
          <div className="flex items-center gap-1 text-slate-900 font-bold">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{room.hostRating.toFixed(1)}</span>
            <span className="text-slate-400 font-normal">({room.reviewCount} verified reviews)</span>
          </div>
        </div>
      </div>

      {/* Photo Showcase Gallery */}
      <div className="space-y-3">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden bg-slate-900 shadow-lg">
          <img
            src={photos[activePhotoIdx]}
            alt={room.title}
            className="w-full h-full object-cover transition-opacity duration-300"
          />

          {photos.length > 1 && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
              <button
                onClick={() => setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length)}
                className="pointer-events-auto w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActivePhotoIdx((prev) => (prev + 1) % photos.length)}
                className="pointer-events-auto w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
            Photo {activePhotoIdx + 1} of {photos.length}
          </div>
        </div>

        {/* Thumbnail Selector */}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setActivePhotoIdx(idx)}
                className={`relative flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  idx === activePhotoIdx ? 'border-brand-600 ring-2 ring-brand-400/30' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={p} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Details on Left, Booking Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Privacy Security Callout */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-950">
            <Lock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-emerald-900">Host Privacy & Exact Address Shield</p>
              <p className="leading-relaxed text-emerald-800 text-[11px]">
                To safeguard privacy, exact house numbers, door codes, and the host's direct phone number are never visible on public pages. They will unlock securely in your traveller dashboard as soon as the host accepts your request.
              </p>
              {isHostOwner && (
                <div className="mt-2 pt-2 border-t border-emerald-200 text-xs font-semibold text-emerald-900">
                  <span className="text-[10px] uppercase tracking-wider bg-emerald-200 px-1.5 py-0.5 rounded mr-1">Owner View</span>
                  Exact Address: {room.privateDetails?.exactAddress} • Instructions: {room.privateDetails?.checkInInstructions}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">About this Micro-Stay Room</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {room.description}
            </p>
          </div>

          {/* Amenities */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Amenities & Study Facilities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {room.amenities.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-800"
                >
                  <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* House Rules */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">House Rules & Aspirant Etiquette</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 divide-y divide-slate-100 text-xs text-slate-700">
              {(room.houseRules && room.houseRules.length > 0
                ? room.houseRules
                : [
                    'Maintain a quiet, study-focused environment at all times',
                    'Physical government-issued photo ID required upon check-in',
                    `Candidate allowance strictly enforced (Maximum ${room.candidateAllowance} ${room.candidateAllowance === 1 ? 'traveller' : 'travellers'})`,
                    'No smoking, alcohol, or intoxicating substances permitted on premises',
                    'Adhere to reserved check-in and checkout timings'
                  ]
              ).map((rule, idx) => (
                <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Host Summary Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <img
              src={room.hostPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(room.hostName)}`}
              alt={room.hostName}
              className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
            />
            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                <h3 className="font-bold text-base text-slate-900">{room.hostName}</h3>
                <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200 w-fit mx-auto sm:mx-0">
                  <ShieldCheck className="w-3 h-3 text-teal-600" /> Verified Host
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Host on Bachelors Flat • Typically responds within 15 minutes
              </p>
              <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                Dedicated local host committed to providing quiet, comfortable spaces for aspirants and travelling guests.
              </p>
            </div>
          </div>

          {/* Verified Stay Reviews */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Verified Aspirant Reviews</h2>
                <p className="text-xs text-slate-500">Reviews submitted only after a completed stay</p>
              </div>
              <div className="flex items-center gap-1 font-extrabold text-base text-slate-900">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{room.hostRating.toFixed(1)}</span>
                <span className="text-xs text-slate-400 font-normal">({reviews.length} reviews)</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-slate-50 p-6 rounded-2xl text-center text-xs text-slate-500 border border-slate-100">
                No reviews yet for this room. Book a stay and be the first to share your experience!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{rev.travellerName}</span>
                      <div className="flex items-center gap-0.5">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    <p className="text-[10px] text-slate-400">
                      Stay completed on {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing & Booking Card (Sticky 4 cols) */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 p-6 space-y-6">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Transparent Slot Rates</span>
              <div className="mt-2 space-y-2">
                <div className="flex items-baseline justify-between p-3 rounded-2xl bg-teal-50/60 border border-teal-100">
                  <div>
                    <p className="font-bold text-xs text-slate-900">2–3 Hours</p>
                    <p className="text-[10px] text-slate-500">Power nap & freshen up</p>
                  </div>
                  <span className="text-lg font-black text-teal-800">₹{room.pricing.twoToThreeHours}</span>
                </div>

              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Available Times:</span>
                <span className="font-bold text-slate-900">{room.availableTimes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Min / Max Stay:</span>
                <span className="font-bold text-slate-900">{room.minStayHours}h – {room.maxStayHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Direct Payment:</span>
                <span className="font-bold text-emerald-700">Cash / UPI at check-in</span>
              </div>
            </div>

            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Request to Book Room</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>No advance card charge • Pay at check-in</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Booking Bar (Fixed right above bottom navigation) */}
      <div className="lg:hidden fixed bottom-12 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-3 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Starting at</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-teal-800">₹{room.pricing.twoToThreeHours}</span>
            <span className="text-xs text-slate-500 font-semibold">/ 2–3 hrs</span>
          </div>
        </div>
        <button
          onClick={() => setShowBookingModal(true)}
          className="py-2.5 px-5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
        >
          <Calendar className="w-4 h-4" />
          <span>Request to Book</span>
        </button>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingRequestModal
          room={room}
          onClose={() => setShowBookingModal(false)}
          onSuccess={(bookingId) => {
            setShowBookingModal(false);
            onNavigateToBooking(bookingId);
          }}
          onRequireAuth={onRequireAuth}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          targetTitle={room.title}
          targetId={room.id}
          type="room"
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
