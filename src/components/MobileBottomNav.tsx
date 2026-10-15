import React from 'react';
import {
  Home,
  Search,
  Calendar,
  Layers,
  User,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
}) => {
  const { user, activeRole } = useAuth();

  const isHost = Boolean(user && activeRole === 'host');

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-4 items-center">
        {/* Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentView === 'home'
              ? 'text-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            <Home className="w-5 h-5 stroke-[2.2]" />
            {currentView === 'home' && (
              <span className="absolute -bottom-1 inset-x-1 h-0.5 bg-brand-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* Find Rooms */}
        <button
          onClick={() => onNavigate(user ? 'search' : 'login')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentView === 'search' || currentView === 'room-details'
              ? 'text-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            <Search className="w-5 h-5 stroke-[2.2]" />
            {(currentView === 'search' || currentView === 'room-details') && (
              <span className="absolute -bottom-1 inset-x-1 h-0.5 bg-brand-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-0.5">Rooms</span>
        </button>

        {/* Bookings or Host Portal */}
        <button
          onClick={() => {
            if (!user) {
              onNavigate('login');
              return;
            }
            if (isHost && activeRole === 'host') {
              onNavigate('host-dashboard');
            } else {
              onNavigate('traveller-dashboard');
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentView === 'traveller-dashboard' || currentView === 'host-dashboard'
              ? 'text-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            {isHost && activeRole === 'host' ? (
              <Layers className="w-5 h-5 stroke-[2.2]" />
            ) : (
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            )}
            {(currentView === 'traveller-dashboard' || currentView === 'host-dashboard') && (
              <span className="absolute -bottom-1 inset-x-1 h-0.5 bg-brand-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 truncate max-w-[65px]">
            {isHost && activeRole === 'host' ? 'Host' : 'Bookings'}
          </span>
        </button>

        {/* Profile / Account */}
        <button
          onClick={() => onNavigate(user ? 'profile' : 'login')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentView === 'profile' || currentView === 'login' || currentView === 'register'
              ? 'text-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            {user ? (
              <User className="w-5 h-5 stroke-[2.2]" />
            ) : (
              <LogIn className="w-5 h-5 stroke-[2.2]" />
            )}
            {(currentView === 'profile' || currentView === 'login' || currentView === 'register') && (
              <span className="absolute -bottom-1 inset-x-1 h-0.5 bg-brand-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-0.5">
            {user ? 'Profile' : 'Log In'}
          </span>
        </button>
      </div>
    </nav>
  );
};
