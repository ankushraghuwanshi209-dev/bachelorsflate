import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types';
import {
  fetchUserProfile,
  signUpWithEmail,
  loginWithEmail,
  loginWithGoogle,
  resetUserPassword,
  updateUserProfile,
  logoutUser,
  getLocalSessionUser,
  subscribeToAuthChanges,
} from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  signUp: (email: string, pass: string, name: string, roles: UserRole[], phone?: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => getLocalSessionUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<UserRole>('traveller');

  // Sync activeRole whenever user changes
  useEffect(() => {
    if (user) {
      if (user.roles.includes('host') && !user.roles.includes('traveller')) {
        setActiveRole('host');
      } else if (user.roles.includes('traveller')) {
        setActiveRole('traveller');
      }
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((profile) => {
      setUser(profile);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, pass: string, name: string, roles: UserRole[], phone?: string) => {
    setLoading(true);
    try {
      const newUser = await signUpWithEmail(email, pass, name, roles, phone);
      setUser(newUser);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const loggedIn = await loginWithEmail(email, pass);
      setUser(loggedIn);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const gUser = await loginWithGoogle();
      setUser(gUser);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await resetUserPassword(email);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await updateUserProfile(user.uid, updates);
    setUser(updated);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        activeRole,
        setActiveRole,
        signUp,
        login,
        loginWithGoogle: handleGoogleLogin,
        resetPassword,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
