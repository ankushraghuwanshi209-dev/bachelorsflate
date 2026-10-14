import React, { useState } from 'react';
import { Flag, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface ReportModalProps {
  targetTitle: string;
  targetId: string;
  type: 'room' | 'review' | 'user';
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ targetTitle, targetId, type, onClose }) => {
  const { success, error } = useToast();
  const [reason, setReason] = useState('inaccurate_description');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      error('Please describe what issue you encountered.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      success('Thank you. Your report has been submitted to the Bachelors Flat safety team for priority review.');
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Report {type === 'room' ? 'Listing' : 'Review'}</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[220px]">{targetTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for report</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            >
              <option value="inaccurate_description">Inaccurate photos or details</option>
              <option value="hygiene_issue">Cleanliness or sanitation concern</option>
              <option value="safety_security">Safety, security, or suspicious host</option>
              <option value="contact_exposed">Premature contact or address violation</option>
              <option value="unauthorized_charges">Extra or undisclosed charges requested</option>
              <option value="other">Other policy concern</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Details & Context</label>
            <textarea
              required
              rows={3}
              placeholder="Please provide specific details to help our safety moderation team investigate."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600 leading-relaxed border border-slate-200">
            Reports are handled confidentially. Hosts or users are never informed who submitted the report.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow"
            >
              {submitting ? 'Submitting...' : 'Send Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
