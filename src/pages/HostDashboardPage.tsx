import React, { useState, useEffect } from 'react';
import {
  Plus,
  Layers,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  Trash2,
  Edit,
  Upload,
  X,
  ShieldCheck,
  AlertCircle,
  Eye,
  Camera,
  GraduationCap,
  Sparkles,
  DollarSign
} from 'lucide-react';
import type { RoomListing, BookingRequest, RoomStatus, BathroomType } from '../types';
import { getHostRooms, createRoom, updateRoom, deleteRoom } from '../services/roomService';
import { getHostBookings, acceptBookingRequest, updateBookingStatus } from '../services/bookingService';
import { uploadRoomImage } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface HostDashboardPageProps {
  initialTab?: 'listings' | 'requests' | 'new';
  onNavigateToRoom: (roomId: string) => void;
}

const COMMON_AMENITIES = [
  'High-Speed WiFi',
  'Study Desk & Chair',
  'Attached Bathroom',
  'Air Conditioning',
  'Power Backup',
  'Clean Towels',
  'RO Drinking Water',
  'Luggage Storage',
  'Steam Iron & Board',
  'Electric Kettle',
  'Quiet Study Zone'
];

export const HostDashboardPage: React.FC<HostDashboardPageProps> = ({
  initialTab = 'listings',
  onNavigateToRoom,
}) => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'listings' | 'requests' | 'form'>(
    initialTab === 'new' ? 'form' : (initialTab as any)
  );

  const [rooms, setRooms] = useState<RoomListing[]>([]);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for creating / editing room
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [neighbourhood, setNeighbourhood] = useState('');
  const [approxLocation, setApproxLocation] = useState('');
  const [exactAddress, setExactAddress] = useState('');
  const [checkInInstructions, setCheckInInstructions] = useState('');
  const [nearbyLandmark, setNearbyLandmark] = useState('');
  const [bathroomType, setBathroomType] = useState<BathroomType>('attached');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'High-Speed WiFi',
    'Study Desk & Chair',
    'Attached Bathroom',
    'Power Backup',
    'RO Drinking Water'
  ]);
  const [houseRulesText, setHouseRulesText] = useState(
    'Quiet study atmosphere\nNo smoking or alcohol on premises\nValid photo ID required at check-in'
  );
  const [availableTimes, setAvailableTimes] = useState('07:00 AM - 10:00 PM');
  const [minStayHours, setMinStayHours] = useState(2);
  const [maxStayHours, setMaxStayHours] = useState(24);
  const [price2to3, setPrice2to3] = useState(399);
  const [price4to6, setPrice4to6] = useState(649);
  const [priceFullDay, setPriceFullDay] = useState(1099);
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('active');

  // Photo uploads
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80'
  ]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadHostData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [hostRooms, hostRequests] = await Promise.all([
        getHostRooms(user.uid),
        getHostBookings(user.uid),
      ]);
      setRooms(hostRooms);
      setRequests(hostRequests);
    } catch (err) {
      console.error('Error fetching host dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHostData();
  }, [user?.uid]);

  const handleOpenCreateForm = () => {
    setEditingRoomId(null);
    setTitle('');
    setDescription('');
    setCity('New Delhi');
    setNeighbourhood('');
    setApproxLocation('');
    setExactAddress('');
    setCheckInInstructions('');
    setNearbyLandmark('');
    setBathroomType('attached');
    setSelectedAmenities([
      'High-Speed WiFi',
      'Study Desk & Chair',
      'Attached Bathroom',
      'Power Backup',
      'RO Drinking Water'
    ]);
    setHouseRulesText(
      'Quiet study atmosphere\nNo smoking or alcohol on premises\nValid photo ID required at check-in'
    );
    setAvailableTimes('07:00 AM - 10:00 PM');
    setPrice2to3(399);
    setPrice4to6(649);
    setPriceFullDay(1099);
    setRoomStatus('active');
    setPhotos([
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80'
    ]);
    setActiveTab('form');
  };

  const handleOpenEditForm = (room: RoomListing) => {
    setEditingRoomId(room.id);
    setTitle(room.title);
    setDescription(room.description);
    setCity(room.city);
    setNeighbourhood(room.neighbourhood);
    setApproxLocation(room.approxLocation);
    setExactAddress(room.privateDetails?.exactAddress || '');
    setCheckInInstructions(room.privateDetails?.checkInInstructions || '');
    setNearbyLandmark(room.nearbyLandmark || '');
    setBathroomType(room.bathroomType);
    setSelectedAmenities(room.amenities || []);
    setHouseRulesText(room.houseRules?.join('\n') || '');
    setAvailableTimes(room.availableTimes);
    setMinStayHours(room.minStayHours);
    setMaxStayHours(room.maxStayHours);
    setPrice2to3(room.pricing.twoToThreeHours);
    setPrice4to6(room.pricing.fourToSixHours);
    setPriceFullDay(room.pricing.fullDay);
    setRoomStatus(room.status);
    setPhotos(room.photos || []);
    setActiveTab('form');
  };

  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const downloadUrl = await uploadRoomImage(file, user.uid, (progress) => {
        setUploadProgress(progress);
      });
      setPhotos((prev) => [...prev, downloadUrl]);
      success('Room photo uploaded successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to upload photo.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !city.trim() || !neighbourhood.trim() || !exactAddress.trim()) {
      error('Please fill in all required title, location, and exact address fields.');
      return;
    }
    if (photos.length === 0) {
      error('Please provide at least one photo of the room.');
      return;
    }

    setIsSubmitting(true);
    try {
      const houseRules = houseRulesText
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const roomPayload = {
        hostId: user.uid,
        hostName: user.displayName || 'Host',
        hostPhoto: user.photoURL,
        hostPhone: user.phoneNumber || '',
        title: title.trim(),
        description: description.trim(),
        city: city.trim(),
        neighbourhood: neighbourhood.trim(),
        approxLocation: approxLocation.trim() || `Near ${neighbourhood}, ${city}`,
        exactAddress: exactAddress.trim(),
        checkInInstructions: checkInInstructions.trim() || 'Welcome! Ring bell upon arrival.',
        nearbyLandmark: nearbyLandmark.trim(),
        bathroomType,
        amenities: selectedAmenities,
        houseRules,
        pricing: {
          hourly: Math.round(price2to3 / 2),
          twoToThreeHours: Number(price2to3),
          fourToSixHours: Number(price4to6),
          fullDay: Number(priceFullDay),
        },
        minStayHours: Number(minStayHours),
        maxStayHours: Number(maxStayHours),
        availableTimes: availableTimes.trim(),
        photos,
        status: roomStatus,
      };

      if (editingRoomId) {
        await updateRoom(editingRoomId, roomPayload);
        success('Room listing updated successfully!');
      } else {
        await createRoom(roomPayload);
        success('New room listing created successfully!');
      }

      await loadHostData();
      setActiveTab('listings');
    } catch (err: any) {
      error(err.message || 'Failed to save room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (room: RoomListing) => {
    const nextStatus: RoomStatus = room.status === 'active' ? 'paused' : 'active';
    try {
      await updateRoom(room.id, { status: nextStatus });
      success(`Listing marked as ${nextStatus}.`);
      loadHostData();
    } catch (err: any) {
      error(err.message || 'Failed to update status.');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm('Are you sure you want to delete this room listing permanently?')) return;
    try {
      await deleteRoom(roomId);
      success('Room listing deleted.');
      loadHostData();
    } catch (err: any) {
      error(err.message || 'Failed to delete room.');
    }
  };

  const handleAcceptRequest = async (bookingId: string) => {
    if (!user) return;
    try {
      await acceptBookingRequest(bookingId, user.uid);
      success('Booking request accepted! Exact address and arrival instructions unlocked for traveller.');
      loadHostData();
    } catch (err: any) {
      error(err.message || 'Could not accept booking due to schedule conflict.');
    }
  };

  const handleDeclineRequest = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, 'declined');
      info('Booking request declined.');
      loadHostData();
    } catch (err: any) {
      error(err.message || 'Could not decline booking.');
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, 'completed');
      success('Micro-stay marked as completed. Guest can now submit a verified review.');
      loadHostData();
    } catch (err: any) {
      error(err.message || 'Could not update status.');
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Host Management Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Host Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your rooms, upload photos, and review booking requests from exam aspirants & travellers.
          </p>
        </div>

        {activeTab !== 'form' && (
          <button
            onClick={handleOpenCreateForm}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create New Room
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'listings'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>My Room Listings ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 relative ${
            activeTab === 'requests'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Booking Requests ({requests.length})</span>
          {pendingRequestsCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        {activeTab === 'form' && (
          <button
            className="px-4 py-2 rounded-xl font-bold bg-brand-600 text-white shadow-sm flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            <span>{editingRoomId ? 'Edit Room Listing' : 'New Room Listing'}</span>
          </button>
        )}
      </div>

      {/* TAB 1: LISTINGS */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse h-48" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">No rooms listed yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                List a clean bedroom or study space to start hosting aspirants and travellers in your city.
              </p>
              <button
                onClick={handleOpenCreateForm}
                className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold"
              >
                + Add Your First Room
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={room.photos?.[0] || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=200&q=80'}
                          alt={room.title}
                          className="w-16 h-16 rounded-2xl object-cover bg-slate-100 flex-shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                room.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : room.status === 'paused'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {room.status}
                            </span>

                          </div>
                          <h3 className="font-bold text-slate-900 text-base mt-1 line-clamp-1">
                            {room.title}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {room.neighbourhood}, {room.city}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Slot pricing pills */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <p className="text-[10px] text-slate-400">2–3h</p>
                        <p className="font-extrabold text-teal-700">₹{room.pricing.twoToThreeHours}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <p className="text-[10px] text-slate-400">4–6h</p>
                        <p className="font-extrabold text-slate-900">₹{room.pricing.fourToSixHours}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <p className="text-[10px] text-slate-400">Full Day</p>
                        <p className="font-extrabold text-slate-900">₹{room.pricing.fullDay}</p>
                      </div>
                    </div>

                    {/* Private address indication */}
                    <div className="bg-teal-50/50 p-2.5 rounded-xl border border-teal-100/60 text-[11px] text-teal-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="truncate">
                        Exact: {room.privateDetails?.exactAddress || 'Not set'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => onNavigateToRoom(room.id)}
                      className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(room)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                          room.status === 'active'
                            ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={room.status === 'active' ? 'Pause Listing' : 'Activate Listing'}
                      >
                        {room.status === 'active' ? (
                          <>
                            <PauseCircle className="w-3.5 h-3.5" /> Pause
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3.5 h-3.5" /> Activate
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEditForm(room)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-white font-semibold flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>

                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold"
                        title="Delete listing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOOKING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse h-40" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-900 text-base">No booking requests yet</h3>
              <p className="text-xs text-slate-500">
                Incoming reservation requests for your listed rooms will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => {
                const isPending = req.status === 'pending';
                const isAccepted = req.status === 'accepted';

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            req.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : req.status === 'declined'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {req.status}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base mt-1">
                          {req.travellerName} requested {req.roomTitle}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {req.travellerEmail} • Contact: {req.travellerPhone}
                        </p>
                      </div>

                      <div className="text-right sm:self-center">
                        <span className="text-base font-extrabold text-teal-800">₹{req.totalPrice}</span>
                        <p className="text-[10px] text-slate-400">Direct check-in payment</p>
                      </div>
                    </div>

                    {/* Booking parameters */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-slate-400 text-[10px]">Date & Time</span>
                        <p className="font-bold text-slate-900">{req.date} at {req.startTime}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-slate-400 text-[10px]">Duration</span>
                        <p className="font-bold text-slate-900 capitalize">
                          {req.duration.replace('_', ' ')} (~{req.durationHours}h)
                        </p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-slate-400 text-[10px]">Guests</span>
                        <p className="font-bold text-slate-900">{req.guestCount} Guest</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-slate-400 text-[10px]">Requested On</span>
                        <p className="font-bold text-slate-900">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {req.message && (
                      <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100 text-xs text-amber-900">
                        <span className="font-bold">Traveller Note: </span>
                        {req.message}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[11px] text-slate-400">
                        {isAccepted && 'Exact address unlocked for traveller.'}
                      </p>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleDeclineRequest(req.id)}
                              className="px-3.5 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleAcceptRequest(req.id)}
                              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                              Accept & Unlock Address
                            </button>
                          </>
                        )}

                        {isAccepted && (
                          <button
                            onClick={() => handleCompleteBooking(req.id)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            Mark Stay Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CREATE / EDIT ROOM FORM */}
      {activeTab === 'form' && (
        <form onSubmit={handleSaveRoom} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingRoomId ? 'Edit Room Listing' : 'Create New Room Listing'}
              </h2>
              <p className="text-xs text-slate-500">
                Provide clear, accurate details. Your exact address is guarded from public search.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('listings')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 p-2"
            >
              Cancel
            </button>
          </div>

          {/* Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Listing Title *
              </label>
              <input
                type="text"
                required
                placeholder="E.g., Quiet AC Study & Rest Room near Karol Bagh Metro & Exam Centres"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Room Description *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe the room, quietness level, suitability for exam candidates, study desk, washroom access, drinking water, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Public vs Private Location Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                placeholder="E.g., New Delhi, Bengaluru, Kota..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Neighbourhood / Sector *
              </label>
              <input
                type="text"
                required
                placeholder="E.g., Karol Bagh, HSR Layout Sector 4, Shivaji Nagar..."
                value={neighbourhood}
                onChange={(e) => setNeighbourhood(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Public Approximate Map Marker / Description
              </label>
              <input
                type="text"
                placeholder="E.g., Within 400m of Metro Gate 3, Near Pearson VUE test centre"
                value={approxLocation}
                onChange={(e) => setApproxLocation(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                This general area note is visible to searchers. Do not enter house/flat numbers here.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nearby Station or Exam Centre Landmark
              </label>
              <input
                type="text"
                placeholder="E.g., 300m to TCS iON Digital Zone / Central Metro"
                value={nearbyLandmark}
                onChange={(e) => setNearbyLandmark(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Strictly Private Fields */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Private Host Data (Revealed Only Upon Accepted Booking)
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Exact Flat / House Number & Street Address *
              </label>
              <input
                type="text"
                required
                placeholder="E.g., Flat 302, Greenview Heights, Block 12, Pusa Road, Karol Bagh 110005"
                value={exactAddress}
                onChange={(e) => setExactAddress(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Check-in Door & Arrival Instructions
              </label>
              <textarea
                rows={2}
                placeholder="E.g., Ring bell 302 on 3rd floor. Caretaker Sunil will hand over the key. Wi-Fi code is on the study desk."
                value={checkInInstructions}
                onChange={(e) => setCheckInInstructions(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Pricing & Duration Settings */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Slot Pricing (INR ₹)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  2–3 Hours Rate (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  step={10}
                  value={price2to3}
                  onChange={(e) => setPrice2to3(Number(e.target.value))}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  4–6 Hours Rate (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={200}
                  step={10}
                  value={price4to6}
                  onChange={(e) => setPrice4to6(Number(e.target.value))}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Full Day Rate (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={400}
                  step={10}
                  value={priceFullDay}
                  onChange={(e) => setPriceFullDay(Number(e.target.value))}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Washroom Type & Available Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Washroom Arrangement
              </label>
              <select
                value={bathroomType}
                onChange={(e) => setBathroomType(e.target.value as any)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="attached">Private Attached Bathroom</option>
                <option value="accessible">Clean Bathroom Access in Flat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Daily Available Hours
              </label>
              <input
                type="text"
                placeholder="E.g., 07:00 AM - 10:00 PM"
                value={availableTimes}
                onChange={(e) => setAvailableTimes(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Amenities Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Amenities & Study Features
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_AMENITIES.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => handleToggleAmenity(amenity)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* House Rules */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              House Rules (one per line)
            </label>
            <textarea
              rows={3}
              value={houseRulesText}
              onChange={(e) => setHouseRulesText(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200"
            />
          </div>

          {/* Multi-Photo Uploads to Supabase Storage */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700">
                Room Photos (Upload via Supabase Storage)
              </label>
              <span className="text-[11px] text-slate-400">JPG, PNG or WebP, max 5MB</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photos.map((p, idx) => (
                <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black text-white rounded-lg"
                    title="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Upload trigger button */}
              <label className="relative aspect-video rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-500 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-teal-50/20">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <Camera className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-[11px] font-bold text-slate-600">
                  {isUploading ? `Uploading ${uploadProgress || 0}%...` : '+ Add Photo'}
                </span>
              </label>
            </div>

            {uploadProgress !== null && (
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-600 h-2 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Listing Status & Submit */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Status:</span>
              {(['active', 'paused', 'draft'] as RoomStatus[]).map((st) => (
                <label key={st} className="flex items-center gap-1.5 text-xs capitalize cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={roomStatus === st}
                    onChange={() => setRoomStatus(st)}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span>{st}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('listings')}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow transition-all"
              >
                {isSubmitting ? 'Saving Room...' : 'Publish Room Listing'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
