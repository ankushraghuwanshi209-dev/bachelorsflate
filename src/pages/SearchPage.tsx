import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  RotateCcw,
  GraduationCap,
  Sparkles,
  SlidersHorizontal,
  X,
  Bath,
  Lock,
  LogIn,
  ShieldCheck
} from 'lucide-react';
import type { RoomListing, SearchFilters, StayDurationType, BathroomType } from '../types';
import { getPublicRooms } from '../services/roomService';
import { RoomCard } from '../components/RoomCard';
import { useAuth } from '../context/AuthContext';

interface SearchPageProps {
  initialSearch?: string; // JSON string of { city, duration }
  onSelectRoom: (roomId: string) => void;
  onRequireAuth?: () => void;
}

const CITIES = ['All Cities', 'New Delhi', 'Bengaluru', 'Mumbai', 'Pune', 'Hyderabad', 'Kota', 'Jaipur', 'Chennai'];

export const SearchPage: React.FC<SearchPageProps> = ({ initialSearch, onSelectRoom, onRequireAuth }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters state
  const [city, setCity] = useState('All Cities');
  const [neighbourhood, setNeighbourhood] = useState('');
  const [duration, setDuration] = useState<StayDurationType | 'any'>('any');
  const [maxPrice, setMaxPrice] = useState<number>(1500);
  const [bathroomType, setBathroomType] = useState<BathroomType | 'any'>('any');
  const [nearLandmark, setNearLandmark] = useState('');

  // Parse initial search if navigated from home
  useEffect(() => {
    if (initialSearch) {
      try {
        const parsed = JSON.parse(initialSearch);
        if (parsed.city) setCity(parsed.city);
        if (parsed.duration) setDuration(parsed.duration);
      } catch (e) {
        // ignore
      }
    }
  }, [initialSearch]);

  const fetchFilteredRooms = async () => {
    setLoading(true);
    try {
      const activeFilters: Partial<SearchFilters> = {};
      if (city && city !== 'All Cities') activeFilters.city = city;
      if (neighbourhood.trim()) activeFilters.neighbourhood = neighbourhood.trim();
      if (bathroomType !== 'any') activeFilters.bathroomType = bathroomType;
      if (nearLandmark.trim()) activeFilters.nearLandmark = nearLandmark.trim();
      if (maxPrice < 1500) activeFilters.maxPrice = maxPrice;

      const results = await getPublicRooms(activeFilters);
      setRooms(results);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFilteredRooms();
    } else {
      setLoading(false);
    }
  }, [user, city, neighbourhood, bathroomType, nearLandmark, maxPrice]);

  const resetFilters = () => {
    setCity('All Cities');
    setNeighbourhood('');
    setDuration('any');
    setMaxPrice(1500);
    setBathroomType('any');
    setNearLandmark('');
  };

  const hasActiveFilters =
    city !== 'All Cities' ||
    neighbourhood !== '' ||
    duration !== 'any' ||
    bathroomType !== 'any' ||
    nearLandmark !== '' ||
    maxPrice < 1500;

  // AUTH GUARD: User without login cannot view rooms
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8 text-teal-600" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            Members Only Access
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Log In to View Rooms
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            To protect host security and the privacy of our student & traveller community, room listings, photos, and exact prices are accessible only to registered members.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2 max-w-xs mx-auto">
          <button
            onClick={onRequireAuth}
            className="w-full py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Account</span>
          </button>
          <button
            onClick={onRequireAuth}
            className="w-full py-3 px-6 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Create Free Account
          </button>
        </div>

        <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-2 text-[11px] text-slate-500">
          <div>🔒 Private Hosts</div>
          <div>⚡ Hourly Naps</div>
          <div>✓ Zero Advance Fee</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
      {/* Title & Mobile Filter Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Micro-Stay Room Listings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Book peaceful daytime rooms for exams, interviews, and short rests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters {hasActiveFilters && '•'}
          </button>
        </div>
      </div>

      {/* Quick City Chips (Mobile & Desktop) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {CITIES.map((c) => (
          <button
            key={c}
            onClick={() => setCity(c)}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
              city === c
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filter Sidebar (Desktop & Mobile Drawer) */}
        <aside
          className={`md:block ${
            showMobileFilters
              ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto'
              : 'hidden'
          } md:relative md:p-0 md:bg-transparent md:z-auto`}
        >
          {showMobileFilters && (
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 md:hidden">
              <h2 className="font-bold text-base text-slate-900">Filter Rooms</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
            {/* City Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Target City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Neighbourhood / Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Neighbourhood / Sector
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="E.g., Karol Bagh, HSR, Dadar..."
                  value={neighbourhood}
                  onChange={(e) => setNeighbourhood(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            </div>

            {/* Station or Exam Centre Landmark */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Near Exam Centre or Station
              </label>
              <div className="relative">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="E.g., TCS iON, Metro, Railway station..."
                  value={nearLandmark}
                  onChange={(e) => setNearLandmark(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            </div>

            {/* Stay Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Duration Needed
              </label>
              <div className="space-y-1 text-xs">
                {[
                  { value: 'any', label: 'Any Duration' },
                  { value: '2-3_hours', label: '2–3 Hours (Quick Nap)' },
                ].map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer font-medium text-slate-700"
                  >
                    <input
                      type="radio"
                      name="duration"
                      value={item.value}
                      checked={duration === item.value}
                      onChange={() => setDuration(item.value as any)}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bathroom Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Washroom Preference
              </label>
              <div className="space-y-1 text-xs">
                {[
                  { value: 'any', label: 'Any Washroom' },
                  { value: 'attached', label: 'Private Attached Bathroom' },
                  { value: 'accessible', label: 'Clean Bathroom Access' },
                ].map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer font-medium text-slate-700"
                  >
                    <input
                      type="radio"
                      name="bathroom"
                      value={item.value}
                      checked={bathroomType === item.value}
                      onChange={() => setBathroomType(item.value as any)}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                <span>Max 2-3h Price</span>
                <span className="text-teal-700 font-extrabold">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min={200}
                max={1500}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>₹200</span>
                <span>₹1,500</span>
              </div>
            </div>

            {showMobileFilters && (
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-2.5 bg-brand-600 text-white rounded-xl font-bold text-xs shadow"
              >
                Apply Filters
              </button>
            )}
          </div>
        </aside>

        {/* Room Listings Grid */}
        <main className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong>{rooms.length}</strong> available micro-stay room{rooms.length === 1 ? '' : 's'}
            </span>
            <span className="text-slate-400">All photos verified</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-80 border border-slate-200 animate-pulse p-4 space-y-3">
                  <div className="bg-slate-200 h-44 rounded-xl" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            /* Helpful Empty State */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 my-6">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <Search className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-bold text-slate-900 text-lg">No Rooms Found Matching Your Filters</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We couldn't find any listings matching your specific filters in {city !== 'All Cities' ? city : 'the selected area'}.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl max-w-sm mx-auto text-left text-xs text-slate-600 space-y-1.5 border border-slate-100">
                <p className="font-bold text-slate-800">Tips to find more rooms:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-500 text-[11px]">
                  <li>Try switching to <strong>All Cities</strong> or major exam hubs.</li>
                  <li>Increase your maximum price limit slider.</li>
                  <li>Clear neighbourhood or exam centre keywords.</li>
                </ul>
              </div>

              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} onSelect={onSelectRoom} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
