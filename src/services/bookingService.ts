import { supabase, isSupabaseConfigured } from '../supabase/config';
import type { BookingPrivateDetails, BookingRequest, BookingStatus, StayDurationType, UserProfile } from '../types';
import { getRoomById } from './roomService';

const BOOKINGS_STORAGE_KEY = 'bachelors_flat_bookings';

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getLocalBookings(): BookingRequest[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    return raw
      ? (JSON.parse(raw) as Array<BookingRequest & Partial<BookingPrivateDetails> & { hostPhone?: string }>).map(
          (booking) => {
            const { exactAddress, checkInInstructions, hostPhone, ...publicBooking } = booking;
            return {
              ...publicBooking,
              privateDetails:
                booking.privateDetails ||
                (exactAddress || checkInInstructions || hostPhone
                  ? { exactAddress: exactAddress || '', checkInInstructions: checkInInstructions || '', hostPhone }
                  : undefined),
            };
          }
        )
      : [];
  } catch {
    return [];
  }
}

function saveLocalBookings(bookings: BookingRequest[]): void {
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  } catch (error) {
    console.error('Failed to save bookings locally:', error);
  }
}

function rowToBooking(row: Record<string, any>, privateDetails?: BookingPrivateDetails): BookingRequest {
  return {
    id: row.id,
    roomId: row.room_id,
    roomTitle: row.room_title,
    roomPhoto: row.room_photo,
    city: row.city,
    neighbourhood: row.neighbourhood,
    hostId: row.host_id,
    hostName: row.host_name,
    travellerId: row.traveller_id,
    travellerName: row.traveller_name,
    travellerEmail: row.traveller_email,
    travellerPhone: row.traveller_phone,
    date: typeof row.date === 'string' ? row.date.substring(0, 10) : row.date,
    startTime: row.start_time,
    duration: row.duration as StayDurationType,
    durationHours: Number(row.duration_hours),
    guestCount: Number(row.guest_count),
    message: row.message || undefined,
    status: row.status as BookingStatus,
    totalPrice: Number(row.total_price),
    termsAgreed: Boolean(row.terms_agreed ?? true),
    termsAgreedAt: row.terms_agreed_at || undefined,
    termsVersion: row.terms_version || undefined,
    rulesAgreed: Boolean(row.rules_agreed ?? true),
    idVerificationAgreed: Boolean(row.id_verification_agreed ?? true),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    privateDetails,
  };
}

/**
 * Validate room availability and prevent conflicting accepted bookings
 */
export async function checkBookingConflict(
  roomId: string,
  date: string,
  startTime: string,
  durationHours: number,
  excludeBookingId?: string
): Promise<{ hasConflict: boolean; reason?: string }> {
  let allBookings: BookingRequest[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', roomId)
        .eq('date', date)
        .eq('status', 'accepted');

      if (error) {
        console.warn('Supabase booking query failed, falling back to local storage', error);
        allBookings = getLocalBookings();
      } else if (data) {
        allBookings = data.map((d: any) => rowToBooking(d));
      }
    } catch (err) {
      console.warn('Supabase booking check error, falling back to local storage:', err);
      allBookings = getLocalBookings();
    }
  } else {
    allBookings = getLocalBookings();
  }

  const newStartMin = parseTimeToMinutes(startTime);
  const newEndMin = newStartMin + durationHours * 60;

  for (const b of allBookings) {
    if (b.roomId !== roomId || b.date !== date || b.status !== 'accepted') continue;
    if (excludeBookingId && b.id === excludeBookingId) continue;

    const existStartMin = parseTimeToMinutes(b.startTime);
    const existEndMin = existStartMin + b.durationHours * 60;

    const isOverlap = newStartMin < existEndMin && newEndMin > existStartMin;

    if (isOverlap) {
      return {
        hasConflict: true,
        reason: `This room already has an accepted reservation on ${date} from ${b.startTime} to approximately ${Math.floor(
          existEndMin / 60
        ).toString().padStart(2, '0')}:${(existEndMin % 60).toString().padStart(2, '0')}. Please pick a different time slot.`,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Create a new booking request in pending state
 */
export async function createBooking(
  requestData: Omit<BookingRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  traveller?: UserProfile
): Promise<BookingRequest> {
  if (!Number.isInteger(requestData.guestCount) || requestData.guestCount <= 0) {
    throw new Error('Guest count must be a positive whole number.');
  }

  const room = await getRoomById(requestData.roomId);
  if (room && requestData.guestCount > room.candidateAllowance) {
    throw new Error(
      `This booking request exceeds the host's candidate allowance (${room.candidateAllowance} ${
        room.candidateAllowance === 1 ? 'candidate' : 'candidates'
      } maximum).`
    );
  }

  if (!requestData.termsAgreed || !requestData.rulesAgreed || !requestData.idVerificationAgreed) {
    throw new Error(
      'You must accept all required guest terms, host rules, conduct standards, and in-person ID verification before submitting a booking request.'
    );
  }

  const conflict = await checkBookingConflict(
    requestData.roomId,
    requestData.date,
    requestData.startTime,
    requestData.durationHours
  );

  if (conflict.hasConflict) {
    throw new Error(conflict.reason || 'This time slot is already booked.');
  }

  const bookingId = 'book-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  const newBooking: BookingRequest = {
    ...requestData,
    id: bookingId,
    travellerId: traveller?.uid || requestData.travellerId,
    travellerName: traveller?.displayName || requestData.travellerName,
    travellerEmail: traveller?.email || requestData.travellerEmail,
    travellerPhone: requestData.travellerPhone || traveller?.phoneNumber || '',
    status: 'pending',
    termsAgreed: true,
    termsAgreedAt: requestData.termsAgreedAt || now,
    termsVersion: requestData.termsVersion || '2026-10-v1',
    rulesAgreed: true,
    idVerificationAgreed: true,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const row: Record<string, any> = {
        id: bookingId,
        room_id: newBooking.roomId,
        room_title: newBooking.roomTitle,
        room_photo: newBooking.roomPhoto,
        city: newBooking.city,
        neighbourhood: newBooking.neighbourhood,
        host_id: newBooking.hostId,
        host_name: newBooking.hostName,
        traveller_id: newBooking.travellerId,
        traveller_name: newBooking.travellerName,
        traveller_email: newBooking.travellerEmail,
        traveller_phone: newBooking.travellerPhone,
        date: newBooking.date,
        start_time: newBooking.startTime,
        duration: newBooking.duration,
        duration_hours: newBooking.durationHours,
        guest_count: newBooking.guestCount,
        message: newBooking.message || null,
        status: 'pending',
        total_price: newBooking.totalPrice,
        terms_agreed: true,
        terms_agreed_at: newBooking.termsAgreedAt,
        terms_version: newBooking.termsVersion,
        rules_agreed: true,
        id_verification_agreed: true,
        created_at: now,
        updated_at: now,
      };

      let { error } = await supabase.from('bookings').insert(row);
      if (error && error.message?.includes('terms_agreed')) {
        const {
          terms_agreed,
          terms_agreed_at,
          terms_version,
          rules_agreed,
          id_verification_agreed,
          ...fallbackRow
        } = row;
        const retry = await supabase.from('bookings').insert(fallbackRow);
        error = retry.error;
      }
      if (error) {
        console.warn('Supabase booking insert failed, saving locally:', error);
      }
    } catch (err) {
      console.warn('Supabase create booking error:', err);
    }
  }

  const localBookings = getLocalBookings();
  localBookings.unshift(newBooking);
  saveLocalBookings(localBookings);

  return newBooking;
}

/**
 * Fetch bookings requested by a traveller
 */
export async function getBookingsByTraveller(travellerUid: string): Promise<BookingRequest[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('traveller_id', travellerUid)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase getBookingsByTraveller failed:', error);
      } else if (data) {
        const bookingsWithPrivate = await Promise.all(
          data.map(async (row: any) => {
            let priv: BookingPrivateDetails | undefined;
            if (['accepted', 'completed'].includes(row.status)) {
              const { data: privData } = await supabase!
                .from('booking_private_details')
                .select('exact_address, check_in_instructions, host_phone')
                .eq('booking_id', row.id)
                .maybeSingle();

              if (privData) {
                priv = {
                  exactAddress: privData.exact_address || '',
                  checkInInstructions: privData.check_in_instructions || '',
                  hostPhone: privData.host_phone || undefined,
                };
              }
            }
            return rowToBooking(row, priv);
          })
        );
        return bookingsWithPrivate;
      }
    } catch (err) {
      console.warn('Supabase fetch traveller bookings error:', err);
    }
  }

  const localBookings = getLocalBookings();
  return localBookings.filter((b) => b.travellerId === travellerUid);
}

/**
 * Fetch bookings for rooms owned by a host
 */
export async function getBookingsByHost(hostUid: string): Promise<BookingRequest[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('host_id', hostUid)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase getBookingsByHost failed:', error);
      } else if (data) {
        const bookingsWithPrivate = await Promise.all(
          data.map(async (row: any) => {
            let priv: BookingPrivateDetails | undefined;
            const { data: privData } = await supabase!
              .from('booking_private_details')
              .select('exact_address, check_in_instructions, host_phone')
              .eq('booking_id', row.id)
              .maybeSingle();

            if (privData) {
              priv = {
                exactAddress: privData.exact_address || '',
                checkInInstructions: privData.check_in_instructions || '',
                hostPhone: privData.host_phone || undefined,
              };
            }
            return rowToBooking(row, priv);
          })
        );
        return bookingsWithPrivate;
      }
    } catch (err) {
      console.warn('Supabase fetch host bookings error:', err);
    }
  }

  const localBookings = getLocalBookings();
  return localBookings.filter((b) => b.hostId === hostUid);
}

/**
 * Host accepts/declines or user cancels booking
 */
export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  hostUid?: string,
  _rejectionReason?: string
): Promise<BookingRequest> {
  const localBookings = getLocalBookings();
  const index = localBookings.findIndex((b) => b.id === bookingId);
  const now = new Date().toISOString();

  let targetBooking = index !== -1 ? localBookings[index] : null;

  if (newStatus === 'accepted') {
    const bookingToCheck = targetBooking;
    if (bookingToCheck) {
      const conflict = await checkBookingConflict(
        bookingToCheck.roomId,
        bookingToCheck.date,
        bookingToCheck.startTime,
        bookingToCheck.durationHours,
        bookingId
      );
      if (conflict.hasConflict) {
        throw new Error('Cannot accept booking: ' + (conflict.reason || 'Time conflict exists.'));
      }
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('bookings')
        .update({
          status: newStatus,
          updated_at: now,
        })
        .eq('id', bookingId);

      if (newStatus === 'accepted') {
        const room = targetBooking?.roomId ? await getRoomById(targetBooking.roomId, hostUid) : null;
        if (room?.privateDetails) {
          await supabase.from('booking_private_details').upsert({
            booking_id: bookingId,
            exact_address: room.privateDetails.exactAddress || '',
            check_in_instructions: room.privateDetails.checkInInstructions || '',
            host_phone: room.privateDetails.hostPhone || '',
            created_at: now,
          });
        }
      }
    } catch (err) {
      console.warn('Supabase updateBookingStatus failed:', err);
    }
  }

  if (index !== -1 && targetBooking) {
    let privateDetails = targetBooking.privateDetails;
    if (newStatus === 'accepted') {
      const room = await getRoomById(targetBooking.roomId, hostUid);
      if (room?.privateDetails) {
        privateDetails = {
          exactAddress: room.privateDetails.exactAddress || '',
          checkInInstructions: room.privateDetails.checkInInstructions || '',
          hostPhone: room.privateDetails.hostPhone,
        };
      }
    }

    const updated: BookingRequest = {
      ...targetBooking,
      status: newStatus,
      updatedAt: now,
      privateDetails,
    };

    localBookings[index] = updated;
    saveLocalBookings(localBookings);
    return updated;
  }

  throw new Error('Booking not found');
}

export async function migrateLegacyAcceptedBookings(hostUid: string): Promise<number> {
  // Handled cleanly via Supabase schema
  return 0;
}

export const createBookingRequest = createBooking;
export const getTravellerBookings = getBookingsByTraveller;
export const getHostBookings = getBookingsByHost;

export async function acceptBookingRequest(bookingId: string, hostUid?: string): Promise<BookingRequest> {
  return updateBookingStatus(bookingId, 'accepted', hostUid);
}
