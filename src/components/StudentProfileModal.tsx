import React, { useState, useEffect } from 'react';
import { X, User, Phone, Lock, BookOpen, Layers, Inbox, Trash2, CheckCircle2, Clock, Check, AlertCircle, Eye, EyeOff, Shield, MessageSquare } from 'lucide-react';
import { StudentUser, ComponentItem, ItemRequest } from '../types';
import { api } from '../services/api';
import { validateMobileNumber, validatePassword } from '../utils/validation';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: StudentUser;
  onUserUpdated: (user: StudentUser) => void;
  onSignOut: () => void;
  branches: string[];
  onOpenListItem: () => void;
  onListingsModified: () => void;
  onOpenChat?: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  onSignOut,
  branches,
  onOpenListItem,
  onListingsModified,
  onOpenChat,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'listings' | 'requests'>('profile');

  // Edit profile form state
  const [name, setName] = useState(currentUser.name);
  const [branch, setBranch] = useState(currentUser.branch);
  const [year, setYear] = useState(currentUser.year);
  const [mobile, setMobile] = useState(currentUser.mobile);
  const [shareMobilePublicly, setShareMobilePublicly] = useState(currentUser.shareMobilePublicly);

  // Password update
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status & lists
  const [myListings, setMyListings] = useState<ComponentItem[]>([]);
  const [sentRequests, setSentRequests] = useState<ItemRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ItemRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setName(currentUser.name);
    setBranch(currentUser.branch);
    setYear(currentUser.year);
    setMobile(currentUser.mobile);
    setShareMobilePublicly(currentUser.shareMobilePublicly);
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      loadProfileData();
    }
  }, [isOpen]);

  const loadProfileData = async () => {
    setLoadingData(true);
    try {
      const [listingsRes, requestsRes] = await Promise.all([
        api.getMyListings(),
        api.getMyRequests(),
      ]);
      setMyListings(listingsRes.listings || []);
      setSentRequests(requestsRes.sent || []);
      setReceivedRequests(requestsRes.received || []);
    } catch (err) {
      console.error('Failed to load profile listings/requests:', err);
    } finally {
      setLoadingData(false);
    }
  };

  if (!isOpen) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    const mobileCheck = validateMobileNumber(mobile);
    if (!mobileCheck.isValid) {
      setFeedbackMsg({ type: 'error', text: mobileCheck.error || 'Invalid mobile number.' });
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setFeedbackMsg({ type: 'error', text: 'Please enter your current password to set a new one.' });
        return;
      }
      const passCheck = validatePassword(newPassword);
      if (!passCheck.isValid) {
        setFeedbackMsg({ type: 'error', text: passCheck.error || 'New password must be at least 6 characters.' });
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setFeedbackMsg({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
    }

    setSavingProfile(true);
    try {
      const res = await api.updateProfile({
        name: name.trim(),
        branch,
        year,
        mobile: mobileCheck.normalized,
        shareMobilePublicly,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      onUserUpdated(res.user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setFeedbackMsg({ type: 'success', text: 'Profile updated successfully.' });
      onListingsModified();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteListing = async (id: string, itemName: string) => {
    if (!confirm(`Are you sure you want to remove "${itemName}" from active listings?`)) {
      return;
    }
    try {
      await api.deleteListing(id);
      setMyListings((prev) => prev.filter((l) => l.id !== id));
      onListingsModified();
      setFeedbackMsg({ type: 'success', text: `Removed "${itemName}".` });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to delete listing.' });
    }
  };

  const handleRequestStatusChange = async (requestId: string, newStatus: ItemRequest['status']) => {
    try {
      const res = await api.updateRequestStatus(requestId, newStatus);
      setReceivedRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
      );
      setFeedbackMsg({ type: 'success', text: `Request marked as ${newStatus}.` });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update request.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 p-6 sm:p-8 space-y-6 text-slate-100 my-8 max-h-[92vh] overflow-y-auto backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Student Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center font-extrabold text-lg shadow-md">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">{currentUser.name}</h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-800/60">
                  {currentUser.rollNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                {currentUser.branch} · <strong className="text-white">{currentUser.year}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenChat && (
              <button
                onClick={() => {
                  onClose();
                  onOpenChat();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-300 bg-blue-950/80 border border-blue-800/60 hover:bg-blue-900/80 rounded-xl transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Open Messages</span>
              </button>
            )}
            <button
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="px-3.5 py-2 text-xs font-bold text-rose-300 hover:text-white bg-rose-950/80 border border-rose-800/60 rounded-xl hover:bg-rose-900/80 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('profile');
              setFeedbackMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer text-center ${
              activeTab === 'profile'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Profile & Privacy Settings
          </button>
          <button
            onClick={() => {
              setActiveTab('listings');
              setFeedbackMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'listings'
                ? 'bg-slate-800 text-emerald-400 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>My Active Listings</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 border border-slate-700">
              {myListings.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab('requests');
              setFeedbackMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-slate-800 text-sky-400 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Item Requests</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 border border-slate-700">
              {sentRequests.length + receivedRequests.length}
            </span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2.5 text-xs animate-in fade-in duration-200 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* TAB 1: Profile & Privacy Settings */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Roll Number (Fixed Identity)
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser.rollNumber}
                  className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            {/* Branch and Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  BTech Branch (Sri Vasavi Engineering College) *
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-emerald-400 cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Current BTech Year *
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-emerald-400 cursor-pointer"
                >
                  <option value="1st Year">1st Year (Freshman)</option>
                  <option value="2nd Year">2nd Year (Core Labs)</option>
                  <option value="3rd Year">3rd Year (IoT/Mini Projects)</option>
                  <option value="4th Year">4th Year (Senior/Capstones)</option>
                </select>
              </div>
            </div>

            {/* Mobile Number & Privacy Setting */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Mobile Number (10 digits) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 font-mono text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-hidden focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Privacy Setting Checkbox */}
              <label className="flex items-start gap-2.5 pt-2 border-t border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareMobilePublicly}
                  onChange={(e) => setShareMobilePublicly(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Display my phone number on my active listings
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    {shareMobilePublicly
                      ? 'Status: PUBLIC. Other students will see your mobile number on cards for WhatsApp/Call coordination.'
                      : 'Status: PRIVATE (Default). Your phone number is hidden from the public marketplace. Handover notes and meeting spots coordinate exchanges.'}
                  </p>
                </div>
              </label>
            </div>

            {/* Optional Password Change */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-sky-400" />
                Change Password (Optional)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">New Password (min 6)</label>
                  <input
                    type="password"
                    placeholder="Enter new"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Re-enter new"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-sky-400 hover:from-emerald-300 hover:to-sky-300 rounded-lg transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: My Active Listings */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Your Listed Components</h3>
                <p className="text-xs text-slate-400">
                  Manage components you have put up for rent, sale, or donation on campus.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenListItem();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 rounded-lg hover:bg-emerald-900/50 transition-colors cursor-pointer"
              >
                + Add Listing
              </button>
            </div>

            {loadingData ? (
              <p className="text-xs text-slate-400 py-6 text-center">Loading your active listings...</p>
            ) : myListings.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">You currently have no active component listings.</p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenListItem();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
                >
                  List a Component Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myListings.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          item.transactionType === 'rent'
                            ? 'border-sky-500/40 text-sky-400 bg-sky-950/30'
                            : item.transactionType === 'donate'
                            ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                            : 'border-teal-500/40 text-teal-300 bg-teal-950/30'
                        }`}>
                          {item.transactionType.toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-white">{item.name}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {item.samplePrice} · Handover: <span className="text-slate-300">{item.pickupLocation}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDeleteListing(item.id, item.name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/20 border border-rose-900/40 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Item Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-6 text-xs">
            {/* Requests Received (From other students wanting your hardware) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-emerald-400" />
                  <span>Requests Received for Your Items</span>
                </h4>
                <span className="text-[11px] font-mono text-slate-400">
                  {receivedRequests.length} incoming
                </span>
              </div>

              {receivedRequests.length === 0 ? (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-slate-400">
                  No incoming requests yet. Once students request your listings, you will coordinate handovers here.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {receivedRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-white">{req.itemName}</span>
                          <span className="text-slate-400 ml-2">({req.itemTransactionType})</span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          req.status === 'accepted'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : req.status === 'completed'
                            ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                            : req.status === 'declined'
                            ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="text-slate-400 space-y-0.5">
                        <p>
                          From: <strong className="text-slate-200">{req.requesterName}</strong> ({req.requesterRollNumber} · {req.requesterBranch} · {req.requesterYear})
                        </p>
                        <p>Preferred Meeting: <span className="text-slate-300">{req.preferredTime}</span></p>
                        {req.notes && <p className="italic text-slate-500">Note: "{req.notes}"</p>}
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                          <button
                            onClick={() => handleRequestStatusChange(req.id, 'accepted')}
                            className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold hover:bg-emerald-500/30 cursor-pointer"
                          >
                            Accept Handover
                          </button>
                          <button
                            onClick={() => handleRequestStatusChange(req.id, 'declined')}
                            className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[11px] font-semibold hover:bg-rose-500/30 cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {req.status === 'accepted' && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-emerald-400">Ready for campus meeting!</span>
                          <button
                            onClick={() => handleRequestStatusChange(req.id, 'completed')}
                            className="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[11px] font-semibold hover:bg-sky-500/30 cursor-pointer"
                          >
                            Mark as Completed
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Requests Sent by Me */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>Requests You Have Made</span>
                </h4>
                <span className="text-[11px] font-mono text-slate-400">
                  {sentRequests.length} requests
                </span>
              </div>

              {sentRequests.length === 0 ? (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-slate-400">
                  You haven't requested any items yet. Browse components to request lab rentals or donations!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{req.itemName}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          req.status === 'accepted'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : req.status === 'completed'
                            ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                            : req.status === 'declined'
                            ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-slate-400">
                        Owner: <strong className="text-slate-200">{req.sellerName}</strong> ({req.sellerRollNumber})
                      </p>
                      <p className="text-[11px] text-slate-400">Preferred Meeting: {req.preferredTime}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
