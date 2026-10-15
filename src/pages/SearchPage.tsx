import React, { useState, useEffect, useMemo } from 'react';
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
  ShieldCheck,
  Compass,
  Users
} from 'lucide-react';
import type { RoomListing, SearchFilters, StayDurationType, BathroomType } from '../types';
import { getPublicRooms } from '../services/roomService';
import { RoomCard } from '../components/RoomCard';
import { useAuth } from '../context/AuthContext';

interface SearchPageProps {
  initialSearch?: string; // JSON string of { city, duration, query }
  onSelectRoom: (roomId: string) => void;
  onRequireAuth?: () => void;
}

const POPULAR_EXAM_HUBS = [
  'All Cities',
  'New Delhi',
  'Bengaluru',
  'Mumbai',
  'Pune',
  'Hyderabad',
  'Kota',
  'Jaipur',
  'Chennai',
  'Lucknow',
  'Indore',
  'Kolkata',
];

export const SearchPage: React.FC<SearchPageProps> = ({ initialSearch, onSelectRoom, onRequireAuth }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [neighbourhood, setNeighbourhood] = useState('');
  const [duration, setDuration] = useState<StayDurationType | 'any'>('any');
  const [guestCount, setGuestCount] = useState<number>(1);
  const [maxPrice, setMaxPrice] = useState<number>(1500);
  const [bathroomType, setBathroomType] = useState<BathroomType | 'any'>('any');
  const [nearLandmark, setNearLandmark] = useState('');

  // Geolocation discovery state
  const [userLocationLabel, setUserLocationLabel] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);

  // Request browser geolocation with user permission and reverse geocode
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatusMessage('Geolocation not supported by browser. Manual search active.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationStatusMessage('Locating nearby rooms with your permission...');

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
              setUserLocationLabel(detected);
              setLocationStatusMessage(`Showing rooms near ${detected} (Current Location)`);
              setIsDetectingLocation(false);
              return;
            }
          }
        } catch {
          // Fallback if reverse geocode service fails
        }
        setUserLocationLabel('Current Location');
        setLocationStatusMessage('Showing rooms near your current coordinates');
        setIsDetectingLocation(false);
      },
      (err) => {
        setIsDetectingLocation(false);
        // Graceful fallback if permission is denied or unavailable
        setLocationStatusMessage('Location permission denied or unavailable. Manual search active.');
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  // Request location on first mount if no initial search was provided
  useEffect(() => {
    if (!initialSearch) {
      requestLocation();
    }
  }, []);

  // Parse initial search if navigated from home
  useEffect(() => {
    if (initialSearch) {
      try {
        const parsed = JSON.parse(initialSearch);
        if (parsed.query) setSearchQuery(parsed.query);
        else if (parsed.city) setSearchQuery(parsed.city);
        if (parsed.duration) setDuration(parsed.duration);
        if (parsed.guestCount) setGuestCount(Number(parsed.guestCount));
      } catch {
        // ignore
      }
    }
  }, [initialSearch]);

  const fetchFilteredRooms = async () => {
    setLoading(true);
    try {
      const activeFilters: Partial<SearchFilters> = {};

      // Requirement 3: Manual place search prioritizes over user's detected location
      if (searchQuery.trim()) {
        activeFilters.query = searchQuery.trim();
      } else if (selectedCity && selectedCity !== 'All Cities') {
        activeFilters.city = selectedCity;
      } else if (userLocationLabel && userLocationLabel !== 'Current Location') {
        activeFilters.query = userLocationLabel;
      }

      if (neighbourhood.trim()) activeFilters.neighbourhood = neighbourhood.trim();
      if (duration !== 'any') activeFilters.duration = duration;
      if (guestCount > 1) activeFilters.guestCount = guestCount;
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
  }, [
    user,
    searchQuery,
    selectedCity,
    userLocationLabel,
    neighbourhood,
    duration,
    guestCount,
    bathroomType,
    nearLandmark,
    maxPrice
  ]);

  // Suggestions for searchable input
  const locationSuggestions = useMemo(() => {
    const list = new Set<string>();
    rooms.forEach((r) => {
      if (r.city) list.add(r.city);
      if (r.neighbourhood) list.add(r.neighbourhood);
      if (r.nearbyLandmark) list.add(r.nearbyLandmark);
    });
    POPULAR_EXAM_HUBS.filter((c) => c !== 'All Cities').forEach((c) => list.add(c));
    return Array.from(list);
  }, [rooms]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCity('All Cities');
    setUserLocationLabel(null);
    setLocationStatusMessage(null);
    setNeighbourhood('');
    setDuration('any');
    setGuestCount(1);
    setMaxPrice(1500);
    setBathroomType('any');
    setNearLandmark('');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCity !== 'All Cities' ||
    userLocationLabel !== null ||
    neighbourhood !== '' ||
    duration !== 'any' ||
    guestCount > 1 ||
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Title & Mobile Filter Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Micro-Stay Room Listings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Book daytime rooms for exams, interviews, and short rests.
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

      {/* Prominent Freeform Search Bar with Dynamic Suggestions & Near Me button */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="relative flex items-center">
          <MapPin className="w-4 h-4 text-brand-600 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            list="location-datalist"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any city, neighbourhood, or exam centre (e.g. Karol Bagh, Kota, HSR Layout)..."
            className="w-full pl-10 pr-28 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 bg-slate-50/50"
          />
          <datalist id="location-datalist">
            {locationSuggestions.map((item, idx) => (
              <option key={idx} value={item} />
            ))}
          </datalist>

          <button
            type="button"
            onClick={requestLocation}
            disabled={isDetectingLocation}
            className={`absolute right-2 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              userLocationLabel && !searchQuery.trim()
                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Use current location"
          >
            <Compass className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin text-brand-600' : ''}`} />
            <span>{isDetectingLocation ? 'Detecting...' : 'Near Me'}</span>
          </button>
        </div>

        {/* Location Status Badge */}
        {locationStatusMessage && (
          <div className="flex items-center justify-between px-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-600" />
              {locationStatusMessage}
              {searchQuery.trim() && userLocationLabel && (
                <span className="font-semibold text-teal-700 ml-1">
                  (Prioritizing your manual search: "{searchQuery}")
                </span>
              )}
            </span>
            {userLocationLabel && (
              <button
                onClick={() => {
                  setUserLocationLabel(null);
                  setLocationStatusMessage(null);
                }}
                className="text-slate-400 hover:text-slate-600 underline text-[10px]"
              >
                Clear Location
              </button>
            )}
          </div>
        )}

        {/* Popular Quick Hubs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap mr-1">
            Exam Hubs:
          </span>
          {POPULAR_EXAM_HUBS.map((c) => (
            <button
              key={c}
              onClick={() => {
                if (c === 'All Cities') {
                  setSelectedCity('All Cities');
                  setSearchQuery('');
                } else {
                  setSelectedCity(c);
                  setSearchQuery(c);
                }
              }}
              className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap text-[11px] transition-all ${
                (searchQuery.toLowerCase() === c.toLowerCase()) || (selectedCity === c && !searchQuery)
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
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
            {/* Stay Duration Selector */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                <label className="text-xs font-bold text-slate-700">
                  Stay Duration Needed
                </label>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Shows rooms matching host-enabled booking durations.
              </p>
              <div className="space-y-1.5 text-xs">
                {[
                  { value: 'any', label: 'Any Duration' },
                  { value: '1_hour', label: '1 Hour (Quick Freshen Up)' },
                  { value: '2_hours', label: '2 Hours (Power Nap & Revision)' },
                  { value: '3_hours', label: '3 Hours (Pre-Exam Deep Rest)' },
                ].map((item) => (
                  <label
                    key={item.value}
                    className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer font-medium transition-all ${
                      duration === item.value
                        ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
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

            {/* Traveller Group Size Selector */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Users className="w-3.5 h-3.5 text-brand-600" />
                <label className="text-xs font-bold text-slate-700">
                  Traveller Group Size
                </label>
              </div>
              <select
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value={1}>1 Guest (Aspirant / Solo Stay)</option>
                <option value={2}>2 Guests</option>
                <option value={3}>3 Guests</option>
                <option value={4}>4+ Guests</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                Filters listings where host candidate allowance meets or exceeds your group size.
              </p>
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
                  placeholder="E.g., TCS iON, Metro, Central Station..."
                  value={nearLandmark}
                  onChange={(e) => setNearLandmark(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            </div>

            {/* Specific Neighbourhood / Sector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Specific Area / Neighbourhood
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="E.g., Dadar, Koramangala, Sector 62..."
                  value={neighbourhood}
                  onChange={(e) => setNeighbourhood(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            </div>

            {/* Washroom Preference */}
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
                <span>Max Stay Price</span>
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
              {guestCount > 1 && ` for ${guestCount} guests`}
              {duration !== 'any' && ` • ${duration.replace('_', ' ')}`}
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
                <h3 className="font-bold text-slate-900 text-lg">No Rooms Found Matching Your Criteria</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We couldn't find any listings matching your specific filters
                  {searchQuery ? ` in "${searchQuery}"` : ''}
                  {guestCount > 1 ? ` for ${guestCount} guests` : ''}.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl max-w-sm mx-auto text-left text-xs text-slate-600 space-y-1.5 border border-slate-100">
                <p className="font-bold text-slate-800">Tips to find more rooms:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-500 text-[11px]">
                  <li>Search for a broader city or neighbouring district.</li>
                  <li>Reduce group size or check rooms with higher candidate allowance.</li>
                  <li>Select "Any Duration" to view all available slots.</li>
                  <li>Increase your maximum price limit slider.</li>
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
