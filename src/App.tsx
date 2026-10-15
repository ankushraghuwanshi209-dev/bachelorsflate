import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LegalModals } from './components/LegalModals';

// Pages
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { RoomDetailsPage } from './pages/RoomDetailsPage';
import { TravellerDashboardPage } from './pages/TravellerDashboardPage';
import { HostDashboardPage } from './pages/HostDashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { SafetyPage } from './pages/SafetyPage';
import { AuthPages } from './pages/AuthPages';

function AppContent() {
  const { user } = useAuth();
  const { info } = useToast();
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'deletion' | null>(null);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, viewParam]);

  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    setViewParam(param);
  };

  const handleSelectRoom = (roomId: string) => {
    if (!user) {
      info('Please log in or create an account to view room details.');
      setCurrentView('login');
      return;
    }
    setCurrentView('room-details');
    setViewParam(roomId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-brand-500 selection:text-white">
      {/* Main Top Header */}
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      {/* Main Body View */}
      <div className="flex-1">
        {currentView === 'home' && (
          <HomePage onNavigate={handleNavigate} onSelectRoom={handleSelectRoom} />
        )}

        {currentView === 'search' && (
          <SearchPage
            initialSearch={viewParam}
            onSelectRoom={handleSelectRoom}
            onRequireAuth={() => setCurrentView('login')}
          />
        )}

        {currentView === 'room-details' && (
          <RoomDetailsPage
            roomId={viewParam || ''}
            onBack={() => setCurrentView('search')}
            onNavigateToBooking={(bookingId) => {
              setCurrentView('traveller-dashboard');
              setViewParam(bookingId);
            }}
            onRequireAuth={() => setCurrentView('login')}
          />
        )}

        {currentView === 'traveller-dashboard' && (
          <TravellerDashboardPage
            highlightBookingId={viewParam}
            onNavigateToRoom={handleSelectRoom}
            onNavigateToSearch={() => setCurrentView('search')}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'host-dashboard' && (
          <HostDashboardPage
            initialTab={(viewParam as any) || 'listings'}
            onNavigateToRoom={handleSelectRoom}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'profile' && (
          <ProfilePage
            onOpenLegal={(type) => setLegalModalType(type)}
            onNavigateToAuth={() => setCurrentView('login')}
          />
        )}

        {currentView === 'safety' && <SafetyPage />}

        {(currentView === 'login' || currentView === 'register') && (
          <AuthPages
            initialView={currentView as any}
            onNavigate={handleNavigate}
            onSuccessRedirect={() => setCurrentView('home')}
          />
        )}
      </div>

      {/* Footer */}
      <div className="pb-16 md:pb-0">
        <Footer
          onNavigate={handleNavigate}
          onOpenLegal={(type) => setLegalModalType(type)}
        />
      </div>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Privacy / Terms / Account Deletion Modal */}
      <LegalModals
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
