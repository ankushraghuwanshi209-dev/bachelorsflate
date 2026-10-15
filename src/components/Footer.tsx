import React from 'react';
import { ShieldCheck, Heart, Lock, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenLegal: (type: 'privacy' | 'terms' | 'deletion') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenLegal }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold text-sm">
                B
              </div>
              <span className="font-bold text-white text-base tracking-tight">Bachelors Flat</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              A little space to call your own. Connecting travellers, exam aspirants, and interviewees who need a clean, peaceful room for a few hours with trusted local hosts.
            </p>
            <div className="inline-flex items-center gap-1.5 text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-800/60 text-[11px]">
              <Lock className="w-3 h-3" />
              Strict Host & Guest Privacy Guaranteed
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Explore Stays</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('search')}
                  className="hover:text-white transition-colors"
                >
                  Hourly Rooms (2–3 Hours)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('search')}
                  className="hover:text-white transition-colors"
                >
                  Rooms Near Exam Centres & Stations
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Safety & Community</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('safety')}
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  Community Guidelines
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('safety')}
                  className="hover:text-white transition-colors"
                >
                  Traveller Checklist & Nap Etiquette
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('safety')}
                  className="hover:text-white transition-colors"
                >
                  Host Privacy Protection
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('safety')}
                  className="hover:text-white transition-colors"
                >
                  Report a Problem or Incident
                </button>
              </li>
            </ul>
          </div>

          {/* Privacy & Legal Policies */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Privacy & Account</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onOpenLegal('privacy')}
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  Privacy Policy <ExternalLink className="w-3 h-3 opacity-60" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('terms')}
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  Terms of Service <ExternalLink className="w-3 h-3 opacity-60" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('deletion')}
                  className="hover:text-rose-400 transition-colors flex items-center gap-1"
                >
                  Account & Data Deletion
                </button>
              </li>
            </ul>
            <p className="text-[11px] text-slate-500 italic pt-1">
              * Exact host addresses and contact numbers are strictly guarded and revealed only to authorized guests upon accepted reservations.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Bachelors Flat. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with care for aspirants and travellers <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};
