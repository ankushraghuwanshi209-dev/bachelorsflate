import React, { useState } from 'react';
import { X, Shield, FileText, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface LegalModalProps {
  type: 'privacy' | 'terms' | 'deletion' | null;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const { user, logout } = useAuth();
  const { success, error } = useToast();
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!type) return null;

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      error('Please type "DELETE" exactly to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      await logout();
      success('Your account and associated profile data have been queued for deletion.');
      onClose();
    } catch (err: any) {
      error('Failed to process deletion request.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {type === 'privacy' && <Shield className="w-5 h-5 text-teal-600" />}
            {type === 'terms' && <FileText className="w-5 h-5 text-teal-600" />}
            {type === 'deletion' && <Trash2 className="w-5 h-5 text-rose-600" />}
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {type === 'privacy' && 'Privacy Policy'}
                {type === 'terms' && 'Terms of Service'}
                {type === 'deletion' && 'Delete Account & Personal Data'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {type === 'deletion' ? 'Permanent Action' : 'Bachelors Flat Community Terms'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-3 text-xs text-slate-600 leading-relaxed flex-1 pr-1">
          {type === 'privacy' && (
            <>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                <strong>Legal Disclaimer:</strong> This document is a placeholder product policy outline for Bachelors Flat and does not constitute formal legal counsel.
              </div>
              <h4 className="font-bold text-slate-900 text-xs">1. Information We Collect</h4>
              <p>
                We collect essential details to facilitate short-stay room reservations: traveller display name, contact phone number, email address, and voluntary account bio. Hosts submit room descriptions, photos, approximate neighborhood markers, and strictly private exact address data.
              </p>
              <h4 className="font-bold text-slate-900 text-xs">2. Host and Guest Contact Masking</h4>
              <p>
                To maintain physical security and privacy, host phone numbers, exact flat/house numbers, and building entrance codes are <strong>strictly masked</strong> from search results and unconfirmed visitors. They are exposed exclusively to travellers whose reservation requests have been explicitly accepted by the host.
              </p>
              <h4 className="font-bold text-slate-900 text-xs">3. Supabase & Infrastructure Protection</h4>
              <p>
                Authentication credentials and encrypted passwords are managed directly by Supabase Auth and are never stored in readable database tables. Public listing queries receive only sanitized listing summaries protected by Row Level Security (RLS).
              </p>
              <h4 className="font-bold text-slate-900 text-xs">4. Data Retention and Control</h4>
              <p>
                Users have the right to inspect, edit, or request complete deletion of their account profile, listed rooms, and booking records at any time.
              </p>
            </>
          )}

          {type === 'terms' && (
            <>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                <strong>Legal Disclaimer:</strong> This summary represents product rules for Bachelors Flat micro-stay marketplace and is not formal legal advice.
              </div>
              <h4 className="font-bold text-slate-900 text-xs">1. Purpose and Permitted Use</h4>
              <p>
                Bachelors Flat facilitates short daytime micro-stays of 2–3 hours for students, exam aspirants, interview candidates, and remote professionals needing a clean, peaceful space to rest, freshen up, or study.
              </p>
              <h4 className="font-bold text-slate-900 text-xs">2. Host Responsibilities</h4>
              <p>
                Hosts agree to provide safe, clean rooms matching their uploaded photos. Rooms must have functioning electricity, lockable privacy, clean washroom access, and safe drinking water as listed.
              </p>
              <h4 className="font-bold text-slate-900 text-xs">3. Guest Conduct & Etiquette</h4>
              <p>
                Guests must respect house quiet hours, observe study noise limitations, vacate by the agreed-upon duration end time, and bring valid government identification.
              </p>
              <h4 className="font-bold text-slate-900 text-xs">4. Direct Payments</h4>
              <p>
                Unless stated otherwise, payments are settled directly between guest and host upon arrival at check-in (via Cash or UPI). No online payment processing fee is levied on standard requests.
              </p>
            </>
          )}

          {type === 'deletion' && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 bg-rose-50 p-3.5 rounded-2xl border border-rose-200 text-rose-900">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <h4 className="font-bold text-xs mb-1">Warning: Irreversible Deletion</h4>
                  <p className="text-[11px] leading-relaxed">
                    Deleting your account will permanently remove your profile, host room listings, active booking history, and reviews. Any pending reservations will be automatically cancelled.
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Type <span className="text-rose-600 font-mono">DELETE</span> in capital letters to confirm:
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-xs uppercase"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Keep Account
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded-xl shadow transition-all"
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {type !== 'deletion' && (
          <div className="pt-3 border-t border-slate-100 flex justify-end flex-shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
