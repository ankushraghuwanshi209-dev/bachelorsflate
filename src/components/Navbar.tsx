import React, { useState } from 'react';
import {
  Home,
  Search,
  PlusCircle,
  User,
  Shield,
  Menu,
  X,
  LogOut,
  Calendar,
  Layers,
  ArrowRightLeft,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, activeRole, setActiveRole, logout, updateProfile } = useAuth();
  const { success } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleRoleToggle = async () => {
    if (!user) return;
    const hasBoth = user.roles.includes('traveller') && user.roles.includes('host');

    if (hasBoth) {
      const nextRole = activeRole === 'traveller' ? 'host' : 'traveller';
      setActiveRole(nextRole);
      success(`Switched mode to ${nextRole === 'host' ? 'Host' : 'Traveller'}`);
      if (nextRole === 'host') {
        onNavigate('host-dashboard');
      } else {
        onNavigate('traveller-dashboard');
      }
    } else if (user.roles.includes('traveller')) {
      // Add host role to account
      await updateProfile({ roles: ['traveller', 'host'] });
      setActiveRole('host');
      success('Host privileges activated! You can now list rooms.');
      onNavigate('host-dashboard');
    }
  };

  const handleNav = (view: string, param?: string) => {
    onNavigate(view, param);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    success('Logged out successfully.');
    onNavigate('home');
  };

  const hasBothRoles = user?.roles.includes('traveller') && user?.roles.includes('host');
  const isDashboard = currentView === 'host-dashboard' || currentView === 'traveller-dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <div
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Home className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight flex items-center gap-1.5">
                Bachelors Flat
                <span className="text-[10px] uppercase tracking-wider bg-brand-50 text-brand-700 font-bold px-1.5 py-0.5 rounded border border-brand-200">
                  Micro-Stays
                </span>
              </span>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium -mt-0.5">
                A little space to call your own
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => handleNav('search')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                currentView === 'search'
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Search className="w-4 h-4" />
              Find a Room
            </button>

            <button
              onClick={() => handleNav('safety')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                currentView === 'safety'
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Shield className="w-4 h-4" />
              Safety & Trust
            </button>

            {/* Quick role toggle pill if logged in */}
            {user && !isDashboard && (
              <button
                onClick={handleRoleToggle}
                className={`ml-2 px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                  activeRole === 'host'
                    ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                    : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                }`}
                title="Switch between Traveller and Host mode"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Mode: <strong className="capitalize">{activeRole}</strong></span>
                {hasBothRoles && <span className="text-[10px] opacity-75">(Switch)</span>}
              </button>
            )}
          </nav>

          {/* CTA & User Profile Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Show 'List your room' CTA only if guest is not logged in */}
            {!user && (
              <button
                onClick={() => handleNav('register')}
                className="text-xs font-bold text-slate-700 hover:text-brand-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                List your room
              </button>
            )}

            {/* 'Add Room' button: ONLY appears when user is logged in AND Host role is selected */}
            {user && activeRole === 'host' && (
              <button
                onClick={() => handleNav('host-dashboard', 'new')}
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                Add Room
              </button>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
                  aria-expanded={userDropdownOpen}
                >
                  <img
                    src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName)}`}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200"
                  />
                  <div className="hidden lg:block text-xs leading-tight">
                    <p className="font-bold text-slate-900 truncate max-w-[110px]">{user.displayName}</p>
                    <p className="text-slate-500 capitalize">{activeRole}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 pr-0.5" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in text-sm text-slate-700">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900 text-xs truncate">{user.displayName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => handleNav('traveller-dashboard')}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-xs font-medium"
                    >
                      <Calendar className="w-4 h-4 text-slate-500" />
                      Traveller Bookings
                    </button>

                    {activeRole === 'host' ? (
                      <button
                        onClick={() => handleNav('host-dashboard')}
                        className="w-full text-left px-4 py-2 hover:bg-purple-50 text-purple-700 flex items-center gap-2 text-xs font-semibold"
                      >
                        <Layers className="w-4 h-4 text-purple-600" />
                        Host Dashboard & Listings
                      </button>
                      ) : !isDashboard ? (
                      <button
                        onClick={handleRoleToggle}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-xs font-medium text-slate-600"
                      >
                        <Layers className="w-4 h-4 text-slate-400" />
                        Switch to Host Mode
                      </button>
                      ) : null}

                    <button
                      onClick={() => handleNav('profile')}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-xs font-medium"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      Manage Profile & Roles
                    </button>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 text-xs font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('login')}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100/70 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="px-4 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm hover:shadow transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle & quick login */}
          <div className="flex md:hidden items-center gap-2">
            {!user ? (
              <button
                onClick={() => handleNav('login')}
                className="px-3 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 rounded-xl"
              >
                Log In
              </button>
            ) : user && !isDashboard ? (
              <button
                onClick={handleRoleToggle}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-teal-50 text-teal-800 border-teal-200"
              >
                {activeRole === 'host' ? 'Host' : 'Traveller'}
              </button>
            ) : null}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 animate-fade-in">
          {user && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-2">
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName)}`}
                alt={user.displayName}
                className="w-10 h-10 rounded-lg object-cover bg-slate-100"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{user.displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              {!isDashboard && (
                <button
                  onClick={handleRoleToggle}
                  className="text-[11px] font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm"
                >
                  Switch Role
                </button>
              )}
            </div>
          )}

          <div className="space-y-1">
            <button
              onClick={() => handleNav('home')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
            >
              <Home className="w-4 h-4 text-slate-500" />
              Home
            </button>
            <button
              onClick={() => handleNav('search')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
            >
              <Search className="w-4 h-4 text-slate-500" />
              Find a Room
            </button>
            <button
              onClick={() => handleNav('safety')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
            >
              <Shield className="w-4 h-4 text-slate-500" />
              Safety & Trust
            </button>
          </div>

          {user ? (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <button
                onClick={() => handleNav('traveller-dashboard')}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
              >
                <Calendar className="w-4 h-4 text-brand-600" />
                Traveller Bookings
              </button>

              {activeRole === 'host' ? (
                <button
                  onClick={() => handleNav('host-dashboard')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-purple-700 hover:bg-purple-50 flex items-center gap-2.5"
                >
                  <Layers className="w-4 h-4 text-purple-600" />
                  Host Dashboard & Rooms
                </button>
              ) : !isDashboard ? (
                <button
                  onClick={handleRoleToggle}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <Layers className="w-4 h-4 text-slate-500" />
                  Switch to Host Mode
                </button>
              ) : null}

              <button
                onClick={() => handleNav('profile')}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
              >
                <User className="w-4 h-4 text-slate-500" />
                My Profile
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => handleNav('login')}
                className="w-full py-2.5 text-center text-sm font-bold text-slate-700 bg-slate-100 rounded-xl"
              >
                Log In
              </button>
              <button
                onClick={() => handleNav('register')}
                className="w-full py-2.5 text-center text-sm font-bold text-white bg-brand-600 rounded-xl shadow"
              >
                Create Free Account
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
