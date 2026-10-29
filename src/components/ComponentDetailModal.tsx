import React, { useState } from 'react';
import { ComponentItem, StudentUser } from '../types';
import { X, MapPin, User, CheckCircle2, ShieldCheck, Send, Phone, Lock, AlertCircle, Info, MessageSquare } from 'lucide-react';
import { HardwareVisual } from './HardwareVisual';
import { api, resolveImageUrl } from '../services/api';
import { validateRequestPermissions } from '../utils/validation';

interface ComponentDetailModalProps {
  item: ComponentItem | null;
  onClose: () => void;
  currentUser: StudentUser | null;
  onOpenAuth: (mode?: 'signin' | 'register') => void;
  onRequestSubmitted?: () => void;
  onStartChat?: (item: ComponentItem) => void;
}

export const ComponentDetailModal: React.FC<ComponentDetailModalProps> = ({
  item,
  onClose,
  currentUser,
  onOpenAuth,
  onRequestSubmitted,
  onStartChat,
}) => {
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [preferredTime, setPreferredTime] = useState('Tomorrow 1:30 PM (Lunch Break)');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!item) return null;

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUser) {
      onOpenAuth('signin');
      return;
    }

    const permission = validateRequestPermissions(currentUser.year, item.transactionType);
    if (!permission.isAllowed) {
      setErrorMsg(permission.message);
      return;
    }

    setSubmitting(true);
    try {
      await api.submitRequest({
        itemId: item.id,
        preferredTime,
        notes,
      });
      setRequestSubmitted(true);
      if (onRequestSubmitted) onRequestSubmitted();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit handover request.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setRequestSubmitted(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 p-6 sm:p-8 space-y-6 text-slate-100 my-8 max-h-[92vh] overflow-y-auto backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={resetAndClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
              item.transactionType === 'rent'
                ? 'border-sky-800/60 text-sky-300 bg-sky-950/70'
                : item.transactionType === 'donate'
                ? 'border-emerald-800/60 text-emerald-300 bg-emerald-950/70'
                : 'border-violet-800/60 text-violet-300 bg-violet-950/70'
            }`}>
              {item.transactionType.toUpperCase()}
            </span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-medium">{item.categoryLabel}</span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">{item.condition}</span>
          </div>
          
          <h2 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
            {item.name}
          </h2>
          
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
              {item.samplePrice}
            </span>
            {item.transactionType === 'sell' && item.originalPriceNumeric && item.originalPriceNumeric > item.priceNumeric && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 line-through">Original: ₹{item.originalPriceNumeric}</span>
                <span className="text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                  Save {Math.round(((item.originalPriceNumeric - item.priceNumeric) / item.originalPriceNumeric) * 100)}%
                </span>
              </div>
            )}
            <span className="text-xs text-slate-400 font-medium">
              (Direct campus peer handover)
            </span>
          </div>
        </div>

        {/* Visual Schematic or Hardware Photo Gallery */}
        <div className="space-y-2">
          <HardwareVisual 
            iconType={item.iconType} 
            category={item.category} 
            name={item.name} 
            photoUrl={item.photoUrl}
          />
          {item.photoUrls && item.photoUrls.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-800">
              {item.photoUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={resolveImageUrl(url) || url}
                  alt={`${item.name} view ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    // Hide broken gallery thumbnail gracefully
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  className="w-16 h-16 object-cover rounded-lg border border-slate-800 shrink-0 bg-slate-950"
                />
              ))}
            </div>
          )}
        </div>

        {/* Description & Specs Grid */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold mb-1">
              Description & Notes
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {item.description}
            </p>
          </div>

          {item.specs && item.specs.length > 0 && (
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
                Hardware Specifications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {item.specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-slate-200 font-mono">{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.recommendedLabs && item.recommendedLabs.length > 0 && (
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
                Recommended BTech Practical Courses
              </h4>
              <div className="flex flex-wrap gap-2">
                {item.recommendedLabs.map((lab, i) => (
                  <span key={i} className="text-xs font-mono bg-violet-950/80 border border-violet-800/60 text-violet-300 px-2.5 py-1 rounded-md font-semibold">
                    {lab}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Seller Info Card with Privacy Protection */}
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                {item.sellerName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{item.sellerName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950/80 border border-violet-800/60 text-violet-300 font-bold">
                    {item.sellerRollNumber}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {item.sellerDept} · <strong className="text-slate-200">{item.sellerYear}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2 pt-2 sm:pt-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    onOpenAuth('signin');
                  } else if (onStartChat) {
                    onClose();
                    onStartChat(item);
                  }
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[40px] text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-950" />
                <span>Chat with Seller</span>
              </button>

              {item.sellerShareMobile && item.sellerMobile ? (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-mono text-[11px] font-bold">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>+91 {item.sellerMobile}</span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 italic">
                  🔒 Mobile private (chat in app)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300 pt-2 border-t border-slate-800/80">
            <MapPin className="w-4 h-4 text-violet-400 shrink-0" />
            <span>Campus Pickup Location: <strong className="text-white font-bold">{item.pickupLocation}</strong></span>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Handover Request Form or Sign-In Prompt */}
        {!currentUser ? (
          <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-300">
              Sign in with your Sri Vasavi Engineering College roll number to submit a handover request to <strong>{item.sellerName}</strong>.
            </p>
            <button
              onClick={() => onOpenAuth('signin')}
              className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Sign In to Request Component →
            </button>
          </div>
        ) : !requestSubmitted ? (
          <form onSubmit={handleSubmitRequest} className="space-y-4 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Submit Campus Handover Request</span>
              </h4>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                Logged in as {currentUser.rollNumber} ({currentUser.year})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-200 font-bold block mb-1">Your Details (Sri Vasavi)</label>
                <input
                  type="text"
                  disabled
                  value={`${currentUser.name} (${currentUser.rollNumber} · ${currentUser.branch})`}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="text-slate-200 font-bold block mb-1">Preferred Handover Time Slot *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tomorrow 1:30 PM (Lunch Break) or After 4:15 PM"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-200 font-bold block mb-1">Note for Seller / Lab Experiment (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Need for Friday microcontroller lab exam, will bring laptop to verify"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-violet-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-400 italic">
                *Handover at {item.pickupLocation}.
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-3 min-h-[44px] text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center text-center"
              >
                {submitting ? 'Sending Request...' : 'Send Handover Request →'}
              </button>
            </div>
          </form>
        ) : (
          /* Confirmation State */
          <div className="p-5 bg-emerald-950/80 border border-emerald-800/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Handover Request Recorded in Profile!</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Your request was registered for <strong>{item.name}</strong>. Meeting spot proposed: <strong>{item.pickupLocation}</strong> at <strong>{preferredTime}</strong>.
            </p>
            <p className="text-xs text-slate-300">
              You can check the status of this request at any time under <strong>My Profile → Item Requests</strong>.
            </p>
            <button
              onClick={resetAndClose}
              className="mt-2 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer shadow-md"
            >
              Done / Return to Marketplace
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
