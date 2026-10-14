import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  UserCheck,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  PhoneCall,
  Clock,
  Flag
} from 'lucide-react';
import { ReportModal } from '../components/ReportModal';

export const SafetyPage: React.FC = () => {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          Trust, Safety & Mutual Respect
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Bachelors Flat Safety & Community Guidelines
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Designed specifically to keep both travellers (aspirants, interviewees, workers) and local hosts safe, secure, and respected.
        </p>
      </div>

      {/* 4 Pillars of Safety */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">1. Strict Address Masking</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Public visitors and unconfirmed travellers only see the general neighbourhood and approximate distance to nearby exam hubs or metro stations. The exact flat/house number and building door instructions are securely revealed <strong>only after</strong> the host explicitly accepts the booking.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">2. Protected Contact Numbers</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            To prevent spam and unsolicited calls, host phone numbers and personal emails are never displayed on public listing search cards. Direct contact details are unlocked exclusively in the traveller dashboard for coordination during confirmed reservations.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">3. Verified Identity Badges</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            A user profile only displays the green "Verified" badge if their identity credentials have been authenticated. Guests are required to carry a government photo ID or exam admit card when checking in.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">4. Transparent Pay at Check-in</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            No credit card charges or upfront payment lock-ins are required to request a room. Payment is made directly to the host upon check-in via Cash or UPI, preventing financial disputes.
          </p>
        </div>
      </div>

      {/* Guidelines for Guests & Hosts */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Community Etiquette for Aspirants & Hosts</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
          <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80">
            <h4 className="font-bold text-sm text-slate-900">For Travellers & Aspirants</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Maintain peaceful study environment and observe quiet hours.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Bring your valid government ID and exam admit card for verification.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Vacate the room punctually at the end of your requested time slot.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>No unregistered outside visitors or smoking inside the premises.</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80">
            <h4 className="font-bold text-sm text-slate-900">For Local Room Hosts</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Ensure clean linens, functioning fan/AC, and clean washroom.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Provide safe, pure drinking water and power backup/Wi-Fi as listed.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Respect guest privacy behind closed doors during their study or nap.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Never demand rates above the agreed slot rate.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Incident Reporting CTA */}
      <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="font-bold text-base text-rose-950 flex items-center justify-center sm:justify-start gap-2">
            <Flag className="w-4 h-4 text-rose-600" />
            Notice Suspicious Activity or Inaccurate Listing?
          </h3>
          <p className="text-xs text-rose-800">
            Our safety trust desk responds to all reported concerns promptly.
          </p>
        </div>

        <button
          onClick={() => setReportOpen(true)}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow transition-all whitespace-nowrap"
        >
          Submit Safety Report
        </button>
      </div>

      {reportOpen && (
        <ReportModal
          targetTitle="Safety & Trust Desk"
          targetId="general-safety"
          type="user"
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
};
