export type UserRole = 'traveller' | 'host';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  roles: UserRole[];
  photoURL?: string;
  isVerified: boolean;
  bio?: string;
  city?: string;
  createdAt: string;
}

export interface PublicProfile {
  displayName: string;
  photoURL?: string;
  city?: string;
  bio?: string;
}

export type StayDurationType = '2-3_hours' | '4-6_hours';

export interface RoomPricing {
  hourly: number;
  twoToThreeHours: number;
}

export type RoomStatus = 'active' | 'draft' | 'paused';
export type BathroomType = 'attached' | 'accessible';

export interface RoomPrivateDetails {
  exactAddress: string;
  checkInInstructions: string;
  hostPhone?: string;
}

export interface BookingPrivateDetails {
  exactAddress: string;
  checkInInstructions: string;
  hostPhone?: string;
}

export interface RoomListing {
  id: string;
  hostId: string;
  hostName: string;
  hostPhoto?: string;
  hostRating: number;
  reviewCount: number;
  title: string;
  description: string;
  city: string;
  neighbourhood: string;
  approxLocation: string; // PUBLIC: e.g., "Near Central Metro, Within 400m of City Centre"
  privateDetails?: RoomPrivateDetails;
  amenities: string[];
  bathroomType: BathroomType;
  nearbyLandmark: string;
  houseRules: string[];
  pricing: RoomPricing;
  minStayHours: number;
  maxStayHours: number;
  availableTimes: string; // e.g., "07:00 AM - 10:00 PM"
  photos: string[];
  status: RoomStatus;
  isDemo?: boolean;       // Clearly labelled as demo content
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';

export interface BookingRequest {
  id: string;
  roomId: string;
  roomTitle: string;
  roomPhoto: string;
  city: string;
  neighbourhood: string;
  hostId: string;
  hostName: string;
  travellerId: string;
  travellerName: string;
  travellerEmail: string;
  travellerPhone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  duration: StayDurationType;
  durationHours: number;
  guestCount: number;
  message?: string;
  status: BookingStatus;
  totalPrice: number;
  privateDetails?: BookingPrivateDetails;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  roomId: string;
  hostId: string;
  travellerId: string;
  travellerName: string;
  rating: number; // 1-5
  comment: string;
  moderationStatus: 'approved' | 'pending' | 'flagged';
  createdAt: string;
}

export interface SearchFilters {
  city: string;
  neighbourhood?: string;
  duration: StayDurationType | 'any';
  minPrice?: number;
  maxPrice?: number;
  bathroomType?: BathroomType | 'any';
  nearLandmark?: string;
}
