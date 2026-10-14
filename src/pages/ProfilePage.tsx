import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Trash2,
  Camera,
  Save,
  ArrowRightLeft,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import type { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ProfilePageProps {
  onOpenLegal: (type: 'privacy' | 'terms' | 'deletion') => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenLegal }) => {
  const { user, updateProfile, activeRole, setActiveRole } = useAuth();
  const { success, error, info } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [city, setCity] = useState(user?.city || 'New Delhi');
  const [bio, setBio] = useState(user?.bio || '');
  const [roles, setRoles] = useState<UserRole[]>(user?.roles || ['traveller']);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Please Sign In</h2>
        <p className="text-xs text-slate-500">Log in to view and manage your profile settings.</p>
      </div>
    );
  }

  const handleRoleToggle = (targetRole: UserRole) => {
    let updated: UserRole[];
    if (roles.includes(targetRole)) {
      if (roles.length === 1) {
        error('Your account must have at least one active role (Traveller or Host).');
        return;
      }
      updated = roles.filter((r) => r !== targetRole);
    } else {
      updated = [...roles, targetRole];
    }
    setRoles(updated);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      error('Display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        city: city.trim(),
        bio: bio.trim(),
        roles,
      });

      // Synchronize active role if current role is no longer present
      if (!roles.includes(activeRole)) {
        setActiveRole(roles[0]);
      }

      success('Profile and account roles updated successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestVerification = async () => {
    setIsVerifying(true);
    setTimeout(async () => {
      try {
        await updateProfile({ isVerified: true });
        setIsVerifying(false);
        success('Verification successful! You now have a verified identity badge.');
      } catch (err: any) {
        setIsVerifying(false);
        error('Failed to complete verification.');
      }
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Account & Profile Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal contact info, user roles (Traveller, Host, or Both), and verification badge.
          </p>
        </div>

        {user.isVerified ? (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verified Profile
          </span>
        ) : (
          <button
            onClick={handleRequestVerification}
            disabled={isVerifying}
            className="inline-flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1.5 rounded-full border border-teal-200 transition-colors self-start sm:self-auto"
          >
            <FileCheck className="w-3.5 h-3.5 text-teal-600" />
            {isVerifying ? 'Verifying...' : 'Request Verification'}
          </button>
        )}
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
            <img
              src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName)}`}
              alt={user.displayName}
              className="w-20 h-20 rounded-2xl object-cover bg-slate-100 border border-slate-200 shadow-sm"
            />
            <div className="space-y-1 text-center sm:text-left flex-1">
              <h2 className="text-lg font-bold text-slate-900">{user.displayName}</h2>
              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                {user.roles.map((r) => (
                  <span
                    key={r}
                    className="text-[10px] uppercase tracking-wider font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Role Selection Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Choose Your Account Roles</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                One Bachelors Flat account lets you travel, host, or both. Toggle either or both roles anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Traveller checkbox */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  roles.includes('traveller')
                    ? 'border-brand-500 bg-brand-50/60 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={roles.includes('traveller')}
                  onChange={() => handleRoleToggle('traveller')}
                  className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Traveller Role</span>
                  <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                    Search and request clean hourly rooms for exams, tests, or travel napping.
                  </span>
                </div>
              </label>

              {/* Host checkbox */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  roles.includes('host')
                    ? 'border-purple-500 bg-purple-50/60 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={roles.includes('host')}
                  onChange={() => handleRoleToggle('host')}
                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Host Role</span>
                  <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                    List spare rooms, manage daytime availability, and host guests flexibly.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number (For Booking Coordination)
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Masked from public view. Only shared with confirmed hosts/guests.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bio / About You
              </label>
              <textarea
                rows={3}
                placeholder="Share a short note about why you use Bachelors Flat (e.g., preparing for exams, remote consultant, host with clean space)."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-rose-950 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Data Privacy & Account Removal
            </h3>
            <p className="text-xs text-rose-800 leading-relaxed">
              Permanently delete your account, listed rooms, and personal contact history.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenLegal('deletion')}
            className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
          >
            Delete Account
          </button>
        </div>
      </form>
    </div>
  );
};
