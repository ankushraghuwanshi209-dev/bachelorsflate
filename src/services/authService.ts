import { supabase, isSupabaseConfigured } from '../supabase/config';
import type { PublicProfile, UserProfile, UserRole } from '../types';

const USER_SESSION_KEY = 'bachelors_flat_current_user';

function toPublicProfile(profile: UserProfile): PublicProfile {
  return {
    displayName: profile.displayName,
    photoURL: profile.photoURL || '',
    city: profile.city || '',
    bio: profile.bio || '',
  };
}

function userRowToProfile(row: Record<string, any>): UserProfile {
  return {
    uid: row.uid,
    email: row.email,
    displayName: row.display_name,
    phoneNumber: row.phone_number || undefined,
    roles: (row.roles || ['traveller']) as UserRole[],
    photoURL: row.photo_url || undefined,
    isVerified: Boolean(row.is_verified),
    bio: row.bio || undefined,
    city: row.city || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', uid)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching user profile from Supabase:', error);
      } else if (data) {
        return userRowToProfile(data);
      }
    } catch (err) {
      console.warn('Error fetching user profile from Supabase:', err);
    }
  }

  const local = getLocalSessionUser();
  if (local && local.uid === uid) return local;
  return null;
}

export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName: string,
  roles: UserRole[],
  phone?: string
): Promise<UserProfile> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        display_name: displayName.trim() || 'Aspirant Traveller',
        phone_number: phone || '',
        roles,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Sign up failed. Please check your credentials and try again.');
  }

  const newProfile: UserProfile = {
    uid: data.user.id,
    email: data.user.email || email,
    displayName: displayName.trim() || 'Aspirant Traveller',
    phoneNumber: phone || '',
    roles,
    photoURL: undefined,
    isVerified: Boolean(data.user.email_confirmed_at),
    createdAt: new Date().toISOString(),
  };

  // Upsert profile in users & public_profiles tables
  try {
    await supabase.from('users').upsert({
      uid: newProfile.uid,
      email: newProfile.email,
      display_name: newProfile.displayName,
      phone_number: newProfile.phoneNumber || null,
      roles: newProfile.roles,
      photo_url: null,
      is_verified: newProfile.isVerified,
      created_at: newProfile.createdAt,
    });

    await supabase.from('public_profiles').upsert({
      id: newProfile.uid,
      display_name: newProfile.displayName,
      photo_url: null,
    });
  } catch (saveErr) {
    console.warn('Profile write to Supabase table failed:', saveErr);
  }

  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(newProfile));
  return newProfile;
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Sign in failed.');
  }

  let profile = await fetchUserProfile(data.user.id);
  if (!profile) {
    profile = {
      uid: data.user.id,
      email: data.user.email || email,
      displayName: data.user.user_metadata?.display_name || 'Bachelors Flat User',
      roles: (data.user.user_metadata?.roles as UserRole[]) || ['traveller'],
      isVerified: Boolean(data.user.email_confirmed_at),
      createdAt: data.user.created_at || new Date().toISOString(),
    };

    try {
      await supabase.from('users').upsert({
        uid: profile.uid,
        email: profile.email,
        display_name: profile.displayName,
        roles: profile.roles,
        is_verified: profile.isVerified,
        created_at: profile.createdAt,
      });
      await supabase.from('public_profiles').upsert({
        id: profile.uid,
        display_name: profile.displayName,
      });
    } catch (err) {
      console.warn('Failed to upsert fallback profile:', err);
    }
  }

  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(profile));
  return profile;
}

export async function loginWithGoogle(): Promise<UserProfile> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.url) {
    window.location.href = data.url;
    return new Promise(() => {});
  }

  const current = getLocalSessionUser();
  if (current) return current;
  return new Promise(() => {});
}

export async function loginWithSimulatedGoogle(name?: string, email?: string): Promise<UserProfile> {
  const googleUser: UserProfile = {
    uid: 'google_' + Math.random().toString(36).substring(2, 10),
    email: email || 'user.google@gmail.com',
    displayName: name || 'Google Verified User',
    roles: ['traveller'],
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('users').upsert({
        uid: googleUser.uid,
        email: googleUser.email,
        display_name: googleUser.displayName,
        roles: googleUser.roles,
        photo_url: googleUser.photoURL,
        is_verified: true,
        created_at: googleUser.createdAt,
      });
      await supabase.from('public_profiles').upsert({
        id: googleUser.uid,
        display_name: googleUser.displayName,
        photo_url: googleUser.photoURL,
      });
    } catch (e) {
      console.warn('Simulated google save error:', e);
    }
  }

  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(googleUser));
  return googleUser;
}

export async function resetUserPassword(email: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}`,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  if (isSupabaseConfigured && supabase) {
    const current = await fetchUserProfile(uid);
    if (!current) throw new Error('User profile not found.');
    const updated = { ...current, ...updates };

    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
    if (updates.roles !== undefined) dbUpdates.roles = updates.roles;
    if (updates.photoURL !== undefined) dbUpdates.photo_url = updates.photoURL;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;

    const { error } = await supabase.from('users').update(dbUpdates).eq('uid', uid);
    if (error) {
      console.warn('Supabase update profile failed:', error);
      throw new Error(error.message);
    }

    await supabase.from('public_profiles').upsert({
      id: uid,
      display_name: updated.displayName,
      photo_url: updated.photoURL || null,
      city: updated.city || null,
      bio: updated.bio || null,
      updated_at: new Date().toISOString(),
    });

    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updated));
    return updated;
  }

  const current = getLocalSessionUser();
  if (current && current.uid === uid) {
    const updated = { ...current, ...updates };
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updated));
    return updated;
  }

  throw new Error('User not found.');
}

export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase sign out error:', err);
    }
  }
  localStorage.removeItem(USER_SESSION_KEY);
}

export function getLocalSessionUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function subscribeToAuthChanges(onUserChanged: (user: UserProfile | null) => void) {
  if (isSupabaseConfigured && supabase) {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        onUserChanged(profile);
      } else {
        const local = getLocalSessionUser();
        onUserChanged(local);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(profile));
        }
        onUserChanged(profile);
      } else {
        localStorage.removeItem(USER_SESSION_KEY);
        onUserChanged(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  const localUser = getLocalSessionUser();
  onUserChanged(localUser);
  return () => {};
}
