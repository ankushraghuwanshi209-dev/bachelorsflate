import React, { useState } from 'react';
import {
  MapPin,
  Star,
  Clock,
  Wifi,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import type { RoomListing } from '../types';

interface RoomCardProps {
  room: RoomListing;
  onSelect: (roomId: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onSelect }) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  const photos = room.photos && room.photos.length > 0
    ? room.photos
    : ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80'];

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div
      onClick={() => onSelect(room.id)}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-teal-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full transform hover:-translate-y-0.5"
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        <img
          src={photos[photoIndex]}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Multi-photo carousel buttons */}
        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow"
              aria-label="Next photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Photo dots */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1 pointer-events-none">
              {photos.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === photoIndex ? 'bg-white w-3' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}



        {/* Rating Badge */}
        <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>{room.hostRating.toFixed(1)}</span>
          <span className="text-[10px] text-slate-400 font-normal">({room.reviewCount})</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* General Location & Landmark (Never exact address) */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
            <span className="text-slate-700 font-bold">{room.neighbourhood}</span>
            <span>•</span>
            <span className="truncate">{room.city}</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-teal-700 transition-colors mb-2">
            {room.title}
          </h3>

          {/* Amenities & Bathroom Badge */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5 text-xs text-slate-600">
            <span className="bg-teal-50 text-teal-800 font-medium px-2 py-0.5 rounded-md text-[11px] border border-teal-100">
              {room.bathroomType === 'attached' ? 'Attached Bath' : 'Bathroom Access'}
            </span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-semibold">
              Up to {room.candidateAllowance} {room.candidateAllowance === 1 ? 'Guest' : 'Guests'}
            </span>
            {room.amenities.slice(0, 2).map((amenity, idx) => (
              <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                {amenity}
              </span>
            ))}
          </div>

          {/* Enabled Duration Options */}
          <div className="flex items-center gap-1.5 mb-3 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Durations:</span>
            <div className="flex items-center gap-1">
              {(room.availableDurations && room.availableDurations.length > 0 ? room.availableDurations : [1, 2, 3]).map((d) => (
                <span
                  key={d}
                  className="bg-brand-50 text-brand-700 border border-brand-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded"
                >
                  {d}h
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing & Availability Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-slate-900">
                ₹{room.availableDurations?.includes(1) && room.pricing.hourly
                  ? room.pricing.hourly
                  : room.pricing.twoToThreeHours}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {room.availableDurations?.includes(1) && room.pricing.hourly ? '/ 1 hr' : '/ 2–3 hrs'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Available {room.availableTimes}</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(room.id);
            }}
            className="bg-brand-50 group-hover:bg-brand-600 text-brand-700 group-hover:text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};
