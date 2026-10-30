import React, { useState } from 'react';
import { ComponentItem, StudentUser } from '../types';
import {
  X,
  MapPin,
  User,
  CheckCircle2,
  ShieldCheck,
  Send,
  Phone,
  Lock,
  AlertCircle,
  Info,
  MessageSquare,
  Package,
  Code2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { HardwareVisual } from './HardwareVisual';
import { api, resolveImageUrl } from '../services/api';
import { validateRequestPermissions, CAMPUS_MEETING_LOCATIONS } from '../utils/validation';

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
  const [selectedMeetingLocation, setSelectedMeetingLocation] = useState(CAMPUS_MEETING_LOCATIONS[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sample code view
  const [showCode, setShowCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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
        handoverLocation: selectedMeetingLocation,
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

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const resetAndClose = () => {
    setRequestSubmitted(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl shadow-black/90 p-4 sm:p-7 space-y-4 text-slate-100 my-auto max-h-[92vh] overflow-y-auto backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={resetAndClose}
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
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
                : item.transactionType === 'swap'
                ? 'border-amber-800/60 text-amber-300 bg-amber-950/70'
                : 'border-violet-800/60 text-violet-300 bg-violet-950/70'
            }`}>
              {item.transactionType.toUpperCase()}
            </span>
            {item.isProjectKit && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                PRE-TESTED KIT
              </span>
            )}
            {item.isSample && (
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                DEMO DATA
              </span>
            )}
            <span className="text-xs text-slate-400 font-medium">{item.categoryLabel}</span>
            <span className="text-xs text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              {item.condition}
            </span>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
            {item.name}
          </h2>
          
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 tabular-nums">
              {item.samplePrice}
            </span>
            {item.depositAmount && item.depositAmount > 0 ? (
              <span className="text-xs font-medium text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                +₹{item.depositAmount} Refundable Deposit
              </span>
            ) : null}
            {item.transactionType === 'sell' && item.originalPriceNumeric && item.originalPriceNumeric > item.priceNumeric && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 line-through">Retail: ₹{item.originalPriceNumeric}</span>
                <span className="text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                  Save {Math.round(((item.originalPriceNumeric - item.priceNumeric) / item.originalPriceNumeric) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 48-Hour Campus Testing Guarantee Badge */}
        <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-white block">48-Hour Lab Testing Window:</span>
            Meet the seller at safe campus meeting locations, test the components in your department lab. If any pin or sensor is defective, raise a dispute within 48 hours for immediate deposit refund or part replacement.
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
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {item.photoUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={resolveImageUrl(url) || url}
                  alt={`${item.name} view ${idx + 1}`}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  className="w-16 h-16 object-cover rounded-lg border border-slate-800 shrink-0 bg-slate-950"
                />
              ))}
            </div>
          )}
        </div>

        {/* PROJECT KIT SECTION (If applicable) */}
        {item.isProjectKit && item.kitDetails && (
          <div className="p-4 bg-slate-950/90 rounded-2xl border border-emerald-500/30 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" />
                Pre-Tested Kit Components ({item.kitDetails.partsList.length} items)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Target: {item.kitDetails.targetDomain || 'Embedded Systems'}
              </span>
            </div>

            {/* Parts Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {item.kitDetails.partsList.map((part, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-200 font-medium">{part.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-slate-400">×{part.qty}</span>
                    {part.tested && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1 rounded">
                        ✓ Tested
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Compatibility & Setup */}
            <div className="space-y-1.5 pt-1">
              <div>
                <span className="font-bold text-slate-300 block mb-0.5">Compatibility:</span>
                <p className="text-slate-400 leading-relaxed">{item.kitDetails.compatibility}</p>
              </div>

              <div>
                <span className="font-bold text-slate-300 block mb-0.5">Setup Instructions:</span>
                <p className="text-slate-400 leading-relaxed whitespace-pre-line">{item.kitDetails.setupInstructions}</p>
              </div>
            </div>

            {/* Tested Sample Code */}
            {item.kitDetails.sampleCode && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-xs font-semibold text-emerald-400 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-4 h-4" />
                    Verified Arduino / Python Sample Code
                  </span>
                  {showCode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showCode && (
                  <div className="mt-2 relative rounded-xl bg-slate-950 p-3 border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-56">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(item.kitDetails!.sampleCode!)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="whitespace-pre leading-relaxed pr-12">{item.kitDetails.sampleCode}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Description & Specs Grid */}
        <div className="space-y-3 text-xs">
          <div>
            <h4 className="font-mono uppercase tracking-wider text-white font-bold mb-1">
              Description & Notes
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {item.description}
            </p>
          </div>

          {item.specs && item.specs.length > 0 && (
            <div>
              <h4 className="font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
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
              <h4 className="font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
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
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-bold">
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
                <span>Chat in Private</span>
              </button>

              {item.sellerShareMobile && item.sellerMobile ? (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-mono text-[11px] font-bold">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>+91 {item.sellerMobile}</span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 italic">
                  🔒 Mobile protected (chat in app)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300 pt-2 border-t border-slate-800/80">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Default Campus Spot: <strong className="text-white font-bold">{item.pickupLocation}</strong></span>
          </div>
        </div>

        {/* Payment Policy & Handover Notice */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
          <span className="font-bold text-slate-200 block">Campus Handover & Payment Notice:</span>
          <p>
            Payment is exchanged in-person (Cash or UPI) upon physical inspection at campus meeting locations. Online escrow gateway is labeled unconfigured pending college administrative onboarding. No money is collected online.
          </p>
        </div>

        {/* Handover Request Section */}
        {requestSubmitted ? (
          <div className="p-4 bg-emerald-950/80 border border-emerald-800/80 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-emerald-200 text-sm">
              Handover Request Dispatched to {item.sellerName} ({item.sellerRollNumber})!
            </h4>
            <p className="text-xs text-emerald-300/90 max-w-md mx-auto">
              Meet at <strong className="text-white">{selectedMeetingLocation}</strong>. You can chat in the in-app messaging tab to coordinate the exact time.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitRequest} className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <h4 className="font-bold text-white text-sm">
              Arrange Campus Handover
            </h4>

            {errorMsg && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Campus Meeting Spot</label>
                <select
                  value={selectedMeetingLocation}
                  onChange={(e) => setSelectedMeetingLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
                >
                  {CAMPUS_MEETING_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Preferred Time</label>
                <input
                  type="text"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  placeholder="e.g. Tomorrow 1:30 PM (Lunch Break)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Optional Message for Seller</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Need this for 3rd year IoT lab practical"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-xs"
            >
              {submitting ? 'Dispatching...' : `Submit Handover Request (${item.samplePrice})`}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
