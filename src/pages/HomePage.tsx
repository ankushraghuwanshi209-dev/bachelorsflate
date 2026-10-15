import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Compass,
  GraduationCap,
  Briefcase,
  Smile,
  Coffee,
  HelpCircle
} from 'lucide-react';
import type { RoomListing } from '../types';
import { getPublicRooms } from '../services/roomService';
import { RoomCard } from '../components/RoomCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface HomePageProps {
  onNavigate: (view: string, param?: string) => void;
  onSelectRoom: (roomId: string) => void;
}

const POPULAR_CITIES = [
  'New Delhi',
  'Bengaluru',
  'Mumbai',
  'Pune',
  'Hyderabad',
  'Kota',
  'Jaipur',
  'Chennai',
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectRoom }) => {
  const { user, activeRole, setActiveRole } = useAuth();
  const { info, error } = useToast();

  const [searchCity, setSearchCity] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [featuredRooms, setFeaturedRooms] = useState<RoomListing[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    async function loadRooms() {
      try {
        const rooms = await getPublicRooms();
        setFeaturedRooms(rooms.slice(0, 6));
      } catch (err) {
        console.error('Failed to load featured rooms', err);
      } finally {
        setLoadingRooms(false);
      }
    }
    loadRooms();
  }, []);

  // Geolocation helper with graceful fallback
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      error('Geolocation is not supported by your browser. Please type your city manually.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const detected =
              data.address?.city ||
              data.address?.town ||
              data.address?.suburb ||
              data.address?.state_district;
            if (detected) {
              setSearchCity(detected);
              info(`Location detected: ${detected}. Rooms updated.`);
              setIsDetectingLocation(false);
              return;
            }
          }
        } catch {
          // Fallback if reverse geocode service fails
        }
        setSearchCity('New Delhi');
        info('Location detected near New Delhi. You can refine or change this anytime.');
        setIsDetectingLocation(false);
      },
      (err) => {
        setIsDetectingLocation(false);
        info('Location permission was denied or unavailable. You can search any city manually.');
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      info('Please log in or sign up to view and search available rooms.');
      onNavigate('login');
      return;
    }
    onNavigate('search', JSON.stringify({ city: searchCity }));
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-slate-50 to-white pt-8 sm:pt-16 pb-12 sm:pb-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 bg-brand-100/80 border border-brand-200 text-brand-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Affordable Micro-Stays for Exams, Interviews & Travel</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              “A little space to call your own.”
            </h1>

            <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Arriving in town for a competitive exam, job interview, or quick stopover? Book a clean, quiet room with fresh towels, AC, and private bath for a <strong>2–3 hour</strong> stay.
            </p>

            {/* Interactive Search Widget */}
            <div className="mt-8 bg-white p-3 sm:p-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 text-left">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* City Input with Geolocation button */}
                  <div className="md:col-span-10 relative">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">
                      Where do you need a room?
                    </label>
                    <div className="relative flex items-center">
                      <MapPin className="w-4 h-4 text-brand-600 absolute left-3.5" />
                      <input
                        type="text"
                        placeholder="E.g., New Delhi, Bengaluru, Kota, Pune..."
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                        className="w-full pl-10 pr-28 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold text-slate-900 placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isDetectingLocation}
                        className="absolute right-2 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title="Detect current location"
                      >
                        <Compass className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin text-brand-600' : ''}`} />
                        <span className="hidden sm:inline">Near me</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Button */}
                  <div className="md:col-span-2 flex items-end">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      <span>Find Rooms</span>
                    </button>
                  </div>
                </div>

                {/* Popular City Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-500">
                  <span className="font-semibold text-slate-600">Quick Exam Hubs:</span>
                  {POPULAR_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSearchCity(city)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        searchCity === city
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </form>
            </div>

            {/* Privacy Promise Banner */}
            <div className="inline-flex items-center gap-2 text-slate-600 text-xs bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-slate-200/60 shadow-sm">
              <Lock className="w-3.5 h-3.5 text-teal-600" />
              <span>
                <strong>Privacy Guaranteed:</strong> Host phone numbers and exact addresses are never publicly exposed.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Target Use Cases Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Why Book a Bachelors Flat Micro-Stay?
          </h2>
          <p className="text-sm text-slate-600">
            Hotel rooms charge for 24 hours even if you only need 3. Bachelors Flat gives you clean, dignified rest at a fair price.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Competitive Exam Aspirants</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Arriving early for UPSC, GATE, CAT, or TCS iON exam shifts? Avoid sitting on station platforms. Rest in an air-conditioned room, revise in peace, and arrive sharp.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Job Interviews & Remote Work</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Freshen up with a hot shower, iron your formal wear, connect to high-speed fiber Wi-Fi, and complete your technical assessment or in-person rounds confidently.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Transit Layover & Power Naps</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Catching an evening train or flight after an early check-out? Drop your heavy luggage in a secure private room and enjoy an undisturbed power nap.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Micro-Stay Rooms */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Cleanliness & Study-Ready
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Short-Stay Rooms
            </h2>
          </div>

          <button
            onClick={() => onNavigate(user ? 'search' : 'login')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors"
          >
            Browse all rooms across cities <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {!user ? (
          /* Members Only Auth Gate for Room Listings */
          <div className="bg-gradient-to-br from-teal-50/70 via-white to-brand-50/60 rounded-3xl border border-teal-200/80 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm space-y-5">
            <div className="w-14 h-14 bg-white border border-teal-200 text-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-7 h-7 text-teal-600" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-100/70 px-3 py-1 rounded-full border border-teal-200">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                Community Privacy Guard
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Log In to View Available Rooms & Rates
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                To guarantee cleanliness, aspirant security, and host privacy, available rooms, study setups, photos, and exact slot prices are exclusively viewable by registered members.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-xs sm:max-w-md mx-auto">
              <button
                onClick={() => onNavigate('login')}
                className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Log In to View Rooms
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                Create Free Account
              </button>
            </div>

            <div className="pt-4 border-t border-teal-100/80 grid grid-cols-3 gap-2 text-[11px] text-slate-500">
              <div>✓ 50+ Verified Rooms</div>
              <div>⚡ 2–3h Slots from ₹399</div>
              <div>🔒 Safe & Quiet</div>
            </div>
          </div>
        ) : loadingRooms ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-80 border border-slate-200 animate-pulse p-4 space-y-3">
                <div className="bg-slate-200 h-44 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : featuredRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRooms.map((room) => (
              <RoomCard key={room.id} room={room} onSelect={onSelectRoom} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Be the First Host to List a Room</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Have a clean room, study flat, or quiet space? Welcome exam aspirants, travellers, and interview candidates for 2–3 hour micro-stays.
            </p>
            <button
              onClick={() => {
                setActiveRole('host');
                onNavigate('host-dashboard');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              List Your Room as a Host
            </button>
          </div>
        )}
      </section>

      {/* How It Works (For Travellers & Hosts) */}
      <section className="bg-slate-900 text-white py-16 sm:py-20 rounded-3xl max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
          <span className="text-teal-400 font-bold text-xs uppercase tracking-wider">Simple & Transparent</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">How Bachelors Flat Works</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Designed for genuine human connection, safety, and mutual respect. One account lets you book or host.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-extrabold text-sm border border-teal-500/30">
              1
            </div>
            <h3 className="font-bold text-base text-white">Find by City & Hours</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Search by city, exam centre, or railway station. Find rooms for a 2–3 hour stay.
            </p>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-extrabold text-sm border border-teal-500/30">
              2
            </div>
            <h3 className="font-bold text-base text-white">Host Accepts Request</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Send your request with date, time, and optional note. The local host verifies room readiness and accepts your booking.
            </p>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-extrabold text-sm border border-teal-500/30">
              3
            </div>
            <h3 className="font-bold text-base text-white">Unlock Address & Rest</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Upon acceptance, exact door details and host phone are revealed. Pay directly at check-in and enjoy your space.
            </p>
          </div>
        </div>
      </section>

      {/* Safety & Trust Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Safety, Privacy & Verification First
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                Your Privacy and Peace of Mind Are Protected
              </h2>
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Private Address Protection:</strong> We never show a host's house number or exact address publicly. It is revealed strictly to the traveller after the host accepts the booking.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>No Hard-Coded or Plaintext Credentials:</strong> Supabase Auth guards credentials securely without storing passwords in plain text tables.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Conflict-Free Scheduling:</strong> Automated check ensures no two accepted travellers can book overlapping slots for the same room.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Verified Reviews:</strong> Reviews can only be submitted after a real, completed stay.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4 text-center sm:text-left">
              <h3 className="text-base font-bold text-slate-900">Have a Clean Spare Room?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Turn your spare room into steady daytime income by hosting sincere students, exam takers, and professionals for 2–4 hours during the day.
              </p>
              <ul className="text-xs text-slate-700 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                  You choose available hours & set your own rates
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                  Full control: accept or decline every request
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                  Your exact address stays private until you accept
                </li>
              </ul>
              <button
                onClick={() => {
                  if (!user) {
                    onNavigate('register');
                  } else {
                    setActiveRole('host');
                    onNavigate('host-dashboard', 'new');
                  }
                }}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                List Your Room Now →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
