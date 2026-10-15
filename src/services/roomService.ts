import { supabase, isSupabaseConfigured } from '../supabase/config';
import type { PublicProfile, RoomListing, RoomPrivateDetails, RoomStatus, SearchFilters, UserProfile } from '../types';

const STORAGE_KEY = 'bachelors_flat_rooms';

export function sanitizePublicRoom(room: RoomListing): RoomListing {
  const { privateDetails: _privateDetails, ...publicRoom } = room;
  return publicRoom;
}

function normalizeLocalRoom(room: RoomListing): RoomListing {
  const legacyRoom = room as RoomListing & Partial<RoomPrivateDetails>;
  const { exactAddress, checkInInstructions, hostPhone, ...publicRoom } = legacyRoom;
  return {
    ...publicRoom,
    privateDetails: room.privateDetails || {
      exactAddress: exactAddress || '',
      checkInInstructions: checkInInstructions || '',
      hostPhone,
    },
  };
}

function rowToRoom(
  row: Record<string, any>,
  hostProfile?: PublicProfile | null,
  privateDetails?: RoomPrivateDetails
): RoomListing {
  return {
    id: row.id,
    hostId: row.host_id,
    hostName: hostProfile?.displayName || row.host_name || 'Bachelors Flat Host',
    hostPhoto: hostProfile?.photoURL || row.host_photo || undefined,
    hostRating: Number(row.host_rating) || 5.0,
    reviewCount: Number(row.review_count) || 0,
    title: row.title,
    description: row.description || '',
    city: row.city,
    neighbourhood: row.neighbourhood,
    approxLocation: row.approx_location,
    amenities: row.amenities || [],
    bathroomType: row.bathroom_type || 'attached',
    nearbyLandmark: row.nearby_landmark || '',
    houseRules: row.house_rules || [],
    pricing: row.pricing || { hourly: 100, twoToThreeHours: 350 },
    minStayHours: row.min_stay_hours ?? 2,
    maxStayHours: row.max_stay_hours ?? 24,
    availableTimes: row.available_times || '07:00 AM - 10:00 PM',
    photos: row.photos || [],
    status: row.status as RoomStatus,
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    privateDetails,
  };
}

async function getPublicProfile(hostId: string): Promise<PublicProfile | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data } = await supabase
      .from('public_profiles')
      .select('display_name, photo_url, city, bio')
      .eq('id', hostId)
      .maybeSingle();

    if (!data) return null;
    return {
      displayName: data.display_name,
      photoURL: data.photo_url || undefined,
      city: data.city || undefined,
      bio: data.bio || undefined,
    };
  } catch {
    return null;
  }
}

function getLocalRooms(): RoomListing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeLocalRoom) : [];
  } catch {
    return [];
  }
}

function saveLocalRooms(rooms: RoomListing[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch (error) {
    console.error('Failed to save rooms to localStorage', error);
  }
}

/**
 * Fetch all active rooms for public search with privacy sanitation
 */
export async function getPublicRooms(filters?: Partial<SearchFilters>): Promise<RoomListing[]> {
  let rooms: RoomListing[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('rooms').select('*').eq('status', 'active');

      if (filters?.city && filters.city.trim() !== '' && filters.city !== 'All Cities') {
        query = query.ilike('city', `%${filters.city.trim()}%`);
      }

      if (filters?.neighbourhood && filters.neighbourhood.trim() !== '') {
        query = query.ilike('neighbourhood', `%${filters.neighbourhood.trim()}%`);
      }

      if (filters?.bathroomType && filters.bathroomType !== 'any') {
        query = query.eq('bathroom_type', filters.bathroomType);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.warn('Supabase fetch rooms failed:', error);
        rooms = getLocalRooms();
      } else if (data) {
        const hostIds = [...new Set(data.map((r: any) => r.host_id))];
        const profileMap = new Map<string, PublicProfile>();
        await Promise.all(
          hostIds.map(async (hostId) => {
            const profile = await getPublicProfile(hostId);
            if (profile) profileMap.set(hostId, profile);
          })
        );

        rooms = data.map((row: any) => rowToRoom(row, profileMap.get(row.host_id)));
      }
    } catch (err) {
      console.warn('Supabase fetch error:', err);
      rooms = getLocalRooms();
    }
  } else {
    rooms = getLocalRooms();
  }

  let filtered = rooms.filter((r) => r.status === 'active');

  if (filters) {
    if (filters.city && filters.city.trim() !== '' && filters.city !== 'All Cities') {
      const searchCity = filters.city.toLowerCase().trim();
      filtered = filtered.filter((r) => r.city.toLowerCase().includes(searchCity));
    }

    if (filters.neighbourhood && filters.neighbourhood.trim() !== '') {
      const searchNeighbourhood = filters.neighbourhood.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.neighbourhood.toLowerCase().includes(searchNeighbourhood) ||
          r.approxLocation.toLowerCase().includes(searchNeighbourhood)
      );
    }

    if (filters.bathroomType && filters.bathroomType !== 'any') {
      filtered = filtered.filter((r) => r.bathroomType === filters.bathroomType);
    }

    if (filters.nearLandmark && filters.nearLandmark.trim() !== '') {
      const landmarkLower = filters.nearLandmark.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.nearbyLandmark.toLowerCase().includes(landmarkLower) ||
          r.description.toLowerCase().includes(landmarkLower) ||
          r.approxLocation.toLowerCase().includes(landmarkLower)
      );
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((r) => r.pricing.twoToThreeHours <= (filters.maxPrice as number));
    }
  }

  return filtered.map(sanitizePublicRoom);
}

/**
 * Fetch room by ID. If caller is host, includes private details.
 */
export async function getRoomById(roomId: string, callerUid?: string): Promise<RoomListing | null> {
  let room: RoomListing | null = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();

      if (error) {
        console.warn('Supabase fetch room failed:', error);
      } else if (data) {
        let privateDetails: RoomPrivateDetails | undefined;
        if (callerUid && callerUid === data.host_id) {
          const { data: privData } = await supabase
            .from('room_private')
            .select('exact_address, check_in_instructions, host_phone')
            .eq('room_id', roomId)
            .maybeSingle();

          if (privData) {
            privateDetails = {
              exactAddress: privData.exact_address || '',
              checkInInstructions: privData.check_in_instructions || '',
              hostPhone: privData.host_phone || undefined,
            };
          }
        }

        const profile = await getPublicProfile(data.host_id);
        room = rowToRoom(data, profile, privateDetails);
        return room;
      }
    } catch (err) {
      console.warn('Supabase getRoomById error:', err);
    }
  }

  const localRooms = getLocalRooms();
  room = localRooms.find((r) => r.id === roomId) || null;
  if (!room) return null;

  if (callerUid && room.hostId === callerUid) {
    return room;
  }
  return sanitizePublicRoom(room);
}

/**
 * Fetch all rooms listed by a specific host
 */
export async function getRoomsByHost(hostUid: string): Promise<RoomListing[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('host_id', hostUid);

      if (error) {
        console.warn('Supabase fetch rooms by host failed:', error);
      } else if (data) {
        const profile = await getPublicProfile(hostUid);
        const roomsWithPrivate = await Promise.all(
          data.map(async (row: any) => {
            const { data: privData } = await supabase!
              .from('room_private')
              .select('exact_address, check_in_instructions, host_phone')
              .eq('room_id', row.id)
              .maybeSingle();

            const privateDetails: RoomPrivateDetails | undefined = privData
              ? {
                  exactAddress: privData.exact_address || '',
                  checkInInstructions: privData.check_in_instructions || '',
                  hostPhone: privData.host_phone || undefined,
                }
              : undefined;

            return rowToRoom(row, profile, privateDetails);
          })
        );
        return roomsWithPrivate;
      }
    } catch (err) {
      console.warn('Supabase getRoomsByHost error:', err);
    }
  }

  const localRooms = getLocalRooms();
  return localRooms.filter((r) => r.hostId === hostUid);
}

export const getHostRooms = getRoomsByHost;

/**
 * Create a new room listing
 */
export async function createRoom(
  data: Omit<RoomListing, 'id' | 'hostId' | 'hostRating' | 'reviewCount' | 'createdAt' | 'updatedAt'>,
  host?: UserProfile
): Promise<RoomListing> {
  const currentHost =
    host ||
    (() => {
      try {
        const raw = localStorage.getItem('bachelors_flat_current_user');
        return raw ? (JSON.parse(raw) as UserProfile) : null;
      } catch {
        return null;
      }
    })();

  if (!currentHost) {
    throw new Error('You must be logged in to create a room listing.');
  }

  const newId = 'room-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  const newRoom: RoomListing = {
    ...data,
    id: newId,
    hostId: currentHost.uid,
    hostName: currentHost.displayName,
    hostPhoto: currentHost.photoURL,
    hostRating: 5.0,
    reviewCount: 0,
    status: data.status || 'active',
    isDemo: false,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const roomRow = {
        id: newId,
        host_id: currentHost.uid,
        host_name: currentHost.displayName,
        host_photo: currentHost.photoURL || null,
        host_rating: 5.0,
        review_count: 0,
        title: newRoom.title,
        description: newRoom.description,
        city: newRoom.city,
        neighbourhood: newRoom.neighbourhood,
        approx_location: newRoom.approxLocation,
        amenities: newRoom.amenities,
        bathroom_type: newRoom.bathroomType,
        nearby_landmark: newRoom.nearbyLandmark,
        house_rules: newRoom.houseRules,
        pricing: newRoom.pricing,
        min_stay_hours: newRoom.minStayHours,
        max_stay_hours: newRoom.maxStayHours,
        available_times: newRoom.availableTimes,
        photos: newRoom.photos,
        status: newRoom.status,
        is_demo: false,
        created_at: now,
        updated_at: now,
      };

      const { error: roomErr } = await supabase.from('rooms').insert(roomRow);
      if (roomErr) throw roomErr;

      if (data.privateDetails) {
        await supabase.from('room_private').insert({
          room_id: newId,
          host_id: currentHost.uid,
          exact_address: data.privateDetails.exactAddress,
          check_in_instructions: data.privateDetails.checkInInstructions,
          host_phone: data.privateDetails.hostPhone || currentHost.phoneNumber || null,
        });
      }
    } catch (err: any) {
      console.warn('Supabase create room failed:', err);
      throw new Error(err.message || 'Failed to create room in database.');
    }
  }

  const localRooms = getLocalRooms();
  localRooms.unshift(newRoom);
  saveLocalRooms(localRooms);

  return newRoom;
}

/**
 * Update an existing room listing
 */
export async function updateRoom(
  roomId: string,
  updates: Partial<RoomListing>,
  hostUid?: string
): Promise<RoomListing> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      const roomRowUpdates: Record<string, any> = {
        updated_at: now,
      };

      if (updates.title !== undefined) roomRowUpdates.title = updates.title;
      if (updates.description !== undefined) roomRowUpdates.description = updates.description;
      if (updates.city !== undefined) roomRowUpdates.city = updates.city;
      if (updates.neighbourhood !== undefined) roomRowUpdates.neighbourhood = updates.neighbourhood;
      if (updates.approxLocation !== undefined) roomRowUpdates.approx_location = updates.approxLocation;
      if (updates.amenities !== undefined) roomRowUpdates.amenities = updates.amenities;
      if (updates.bathroomType !== undefined) roomRowUpdates.bathroom_type = updates.bathroomType;
      if (updates.nearbyLandmark !== undefined) roomRowUpdates.nearby_landmark = updates.nearbyLandmark;
      if (updates.houseRules !== undefined) roomRowUpdates.house_rules = updates.houseRules;
      if (updates.pricing !== undefined) roomRowUpdates.pricing = updates.pricing;
      if (updates.minStayHours !== undefined) roomRowUpdates.min_stay_hours = updates.minStayHours;
      if (updates.maxStayHours !== undefined) roomRowUpdates.max_stay_hours = updates.maxStayHours;
      if (updates.availableTimes !== undefined) roomRowUpdates.available_times = updates.availableTimes;
      if (updates.photos !== undefined) roomRowUpdates.photos = updates.photos;
      if (updates.status !== undefined) roomRowUpdates.status = updates.status;

      await supabase.from('rooms').update(roomRowUpdates).eq('id', roomId);

      if (updates.privateDetails && hostUid) {
        await supabase.from('room_private').upsert({
          room_id: roomId,
          host_id: hostUid,
          exact_address: updates.privateDetails.exactAddress,
          check_in_instructions: updates.privateDetails.checkInInstructions,
          host_phone: updates.privateDetails.hostPhone || null,
          updated_at: now,
        });
      }
    } catch (err) {
      console.warn('Supabase update room failed:', err);
    }
  }

  const localRooms = getLocalRooms();
  const index = localRooms.findIndex((r) => r.id === roomId);
  if (index !== -1) {
    const updated: RoomListing = {
      ...localRooms[index],
      ...updates,
      updatedAt: now,
    };
    localRooms[index] = updated;
    saveLocalRooms(localRooms);
    return updated;
  }

  // Fetch updated room from Supabase directly
  const room = await getRoomById(roomId, hostUid);
  if (!room) throw new Error('Room listing not found.');
  return room;
}

/**
 * Delete a room listing
 */
export async function deleteRoom(roomId: string, hostUid?: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('rooms').delete().eq('id', roomId);
      if (hostUid) {
        query = query.eq('host_id', hostUid);
      }
      await query;
    } catch (err) {
      console.warn('Supabase delete room failed:', err);
    }
  }

  const localRooms = getLocalRooms();
  const filtered = localRooms.filter((r) => r.id !== roomId);
  saveLocalRooms(filtered);
}

/**
 * Toggle room status (active / paused)
 */
export async function toggleRoomStatus(
  roomId: string,
  newStatus: RoomStatus,
  hostUid?: string
): Promise<RoomListing> {
  return updateRoom(roomId, { status: newStatus }, hostUid);
}
