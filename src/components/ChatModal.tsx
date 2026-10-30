import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Flag,
  MessageSquare,
  AlertCircle,
  CheckCheck,
  Clock,
  Sparkles,
  MapPin,
  Tag,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { Conversation, ChatMessage, ComponentItem, StudentUser } from '../types';
import { api } from '../services/api';
import { HardwareVisual } from './HardwareVisual';
import { CAMPUS_MEETING_LOCATIONS } from '../utils/validation';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: StudentUser;
  activeConversationId?: string | null;
  initialConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onConversationsUpdated?: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeConversationId = null,
  initialConversationId = null,
  onSelectConversation,
  onConversationsUpdated,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConversationId || activeConversationId || null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [activeListing, setActiveListing] = useState<ComponentItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Input & message state
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals inside chat
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate or misleading messages');
  const [reportCustomText, setReportCustomText] = useState('');
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerValue, setOfferValue] = useState('');

  // Mobile responsive list vs chat view toggle
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Load conversation list on open
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  // 2. Load active conversation messages when selected
  useEffect(() => {
    const targetId = activeConversationId || initialConversationId;
    if (targetId) {
      setSelectedConvId(targetId);
      loadActiveConversation(targetId);
      setShowMobileChat(true);
    } else {
      setShowMobileChat(false);
    }
  }, [activeConversationId, initialConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await api.getConversations();
      const list = res.conversations || [];
      setConversations(list);
      const targetId = activeConversationId || initialConversationId || selectedConvId;
      if (targetId) {
        const found = list.find((c) => c.id === targetId);
        if (found) {
          setActiveConv(found);
          loadActiveConversation(targetId);
        }
      } else if (list.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
        setSelectedConvId(list[0].id);
        loadActiveConversation(list[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConvId(id);
    loadActiveConversation(id);
    setShowMobileChat(true);
    if (onSelectConversation) onSelectConversation(id);
  };

  const loadActiveConversation = async (id: string) => {
    try {
      const res = await api.getConversation(id);
      setActiveConv(res.conversation);
      setMessages(res.messages || []);
      setActiveListing(res.listing);
      // Update local unread counter
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load chat messages.');
    }
  };

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeConv) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      const res = await api.sendMessage(activeConv.id, textToSend, 'text');
      setMessages((prev) => [...prev, res.message]);
      setActiveConv(res.conversation);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConv.id ? res.conversation : c))
      );
      if (onConversationsUpdated) onConversationsUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleSharePhone = async () => {
    if (!activeConv) return;
    try {
      const res = await api.sharePhoneInChat(activeConv.id);
      setMessages((prev) => [...prev, res.message]);
      setActiveConv(res.conversation);
      setSuccessToast(`Shared your mobile number (+91 ${currentUser.mobile}) in this private chat.`);
      setTimeout(() => setSuccessToast(null), 4000);
      if (onConversationsUpdated) onConversationsUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to share phone number.');
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerValue.trim() || !activeConv) return;

    try {
      const offerText = `Proposed Deal / Offer: ${offerValue.trim()}`;
      const res = await api.sendMessage(activeConv.id, offerText, 'offer', { offerAmount: offerValue.trim() });
      setMessages((prev) => [...prev, res.message]);
      setActiveConv(res.conversation);
      setShowOfferInput(false);
      setOfferValue('');
      setSuccessToast('Offer sent to student.');
      setTimeout(() => setSuccessToast(null), 4000);
      if (onConversationsUpdated) onConversationsUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send offer.');
    }
  };

  const handleSendQuickPrompt = (prompt: string) => {
    setMessageText(prompt);
  };

  const handleBlockConversation = async () => {
    if (!activeConv) return;
    if (!confirm('Are you sure you want to block this student? Neither of you will be able to send messages.')) {
      return;
    }

    try {
      const res = await api.blockConversation(activeConv.id);
      setActiveConv(res.conversation);
      setSuccessToast(res.message);
      setTimeout(() => setSuccessToast(null), 4000);
      loadActiveConversation(activeConv.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to block conversation.');
    }
  };

  const handleUnblockConversation = async () => {
    if (!activeConv) return;
    try {
      const res = await api.unblockConversation(activeConv.id);
      setActiveConv(res.conversation);
      setSuccessToast('Conversation unblocked.');
      setTimeout(() => setSuccessToast(null), 4000);
      loadActiveConversation(activeConv.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to unblock.');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;

    const fullReason = `${reportReason}: ${reportCustomText.trim()}`.trim();
    try {
      const res = await api.reportConversation(activeConv.id, fullReason);
      setShowReportModal(false);
      setReportCustomText('');
      setSuccessToast(res.message);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit report.');
    }
  };

  // Determine peer info
  const peerName = activeConv
    ? activeConv.buyerId === currentUser.id
      ? activeConv.sellerName
      : activeConv.buyerName
    : '';

  const peerRoll = activeConv
    ? activeConv.buyerId === currentUser.id
      ? activeConv.sellerRollNumber
      : activeConv.buyerRollNumber
    : '';

  const peerBranch = activeConv
    ? activeConv.buyerId === currentUser.id
      ? activeConv.sellerBranch
      : activeConv.buyerBranch
    : '';

  const isSeller = activeConv ? activeConv.sellerId === currentUser.id : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden">
      <div 
        className="relative w-full max-w-5xl h-[88vh] bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden text-slate-100 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Main Modal Header Bar */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <MessageSquare className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <span>Campus Messages</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-950/80 border border-violet-800/60 text-violet-300">
                  Sri Vasavi Engineering College
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 font-medium">
                Direct in-app communication between verified students for lab hardware handovers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close chat modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successToast && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-300 px-4 py-2 text-xs flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="bg-rose-950/80 border-b border-rose-500/40 text-rose-300 px-4 py-2 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-xs text-rose-400 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* 2-Pane Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANE: Conversation Threads List (Hidden on mobile if chat is active) */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-slate-800 bg-slate-950/60 flex flex-col shrink-0 ${
              showMobileChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Conversations</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                {conversations.length} active
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading your conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center space-y-3 text-xs text-slate-400">
                  <MessageSquare className="w-8 h-8 text-slate-700 mx-auto" />
                  <p>No active conversations yet.</p>
                  <p className="text-[11px] text-slate-400">
                    Click <strong>"Chat with seller"</strong> on any marketplace component to start negotiating handovers.
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = activeConv?.id === conv.id;
                  const otherStudentName = conv.buyerId === currentUser.id ? conv.sellerName : conv.buyerName;
                  const otherStudentRoll = conv.buyerId === currentUser.id ? conv.sellerRollNumber : conv.buyerRollNumber;
                  const hasUnread = (conv.unreadCount || 0) > 0;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-l-2 border-emerald-400'
                          : 'hover:bg-slate-900/50'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                        {otherStudentName.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-white truncate">
                            {otherStudentName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                          <span className="font-mono text-emerald-400 text-[10px]">{otherStudentRoll}</span>
                          <span>·</span>
                          <span className="truncate text-slate-300 font-medium">{conv.listingTitle}</span>
                        </div>

                        <p className={`text-xs truncate ${hasUnread ? 'text-white font-semibold' : 'text-slate-400'}`}>
                          {conv.lastMessageText}
                        </p>
                      </div>

                      {hasUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20 shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE: Active Conversation Messages & Item Top Banner */}
          <div
            className={`flex-1 flex flex-col bg-slate-900 overflow-hidden ${
              !showMobileChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeConv ? (
              <>
                {/* 1. Item Header Preview Strip */}
                <div className="bg-slate-950/90 border-b border-slate-800 p-3 sm:px-5 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Mobile back to list button */}
                    <button
                      onClick={() => setShowMobileChat(false)}
                      className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {activeConv.listingTitle}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          activeConv.listingTransactionType === 'rent'
                            ? 'border-sky-500/40 text-sky-400 bg-sky-950/40'
                            : activeConv.listingTransactionType === 'donate'
                            ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40'
                            : 'border-teal-500/40 text-teal-300 bg-teal-950/40'
                        }`}>
                          {activeConv.listingTransactionType.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono text-emerald-400 font-bold">{activeConv.listingPrice}</span>
                        <span>·</span>
                        <span>Chatting with: <strong className="text-slate-200">{peerName}</strong> ({peerRoll} · {peerBranch})</span>
                      </div>
                    </div>
                  </div>

                  {/* Safety & Action Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleSharePhone}
                      disabled={activeConv.isBlocked}
                      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/50 border border-emerald-500/40 hover:bg-emerald-900/60 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="Share your mobile number with this student"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Share Phone</span>
                    </button>

                    <button
                      onClick={() => setShowOfferInput(!showOfferInput)}
                      disabled={activeConv.isBlocked}
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-sky-300 bg-sky-950/50 border border-sky-500/40 hover:bg-sky-900/60 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Make Offer</span>
                    </button>

                    {activeConv.isBlocked ? (
                      <button
                        onClick={handleUnblockConversation}
                        className="px-2.5 py-1.5 text-[11px] font-semibold text-amber-300 bg-amber-950/40 border border-amber-500/40 rounded-lg cursor-pointer"
                      >
                        Unblock
                      </button>
                    ) : (
                      <button
                        onClick={handleBlockConversation}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                        title="Block this student"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => setShowReportModal(true)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                      title="Report inappropriate message"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Make Offer Strip (Dropdown on demand) */}
                {showOfferInput && (
                  <form
                    onSubmit={handleSendOffer}
                    className="p-3 bg-slate-950 border-b border-slate-800 flex items-center gap-3 text-xs"
                  >
                    <span className="font-semibold text-slate-300 shrink-0">Propose Price / Terms:</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ₹30/week for 2 weeks or ₹200 cash pickup"
                      value={offerValue}
                      onChange={(e) => setOfferValue(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-sky-400"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold rounded-lg cursor-pointer text-xs"
                    >
                      Send Offer
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOfferInput(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </form>
                )}

                {/* 2. Messages Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  
                  {/* Safety reminder header inside chat */}
                  <div className="max-w-md mx-auto p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 text-center space-y-1">
                    <p className="font-semibold text-slate-300 flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sri Vasavi Peer Exchange Safety Guidelines</span>
                    </p>
                    <p>
                      Meet in daytime at campus locations (ECE block, Central Library, SAC canteen). Bring a USB cable or multimeter to verify board power on site.
                    </p>
                  </div>

                  {/* Messages Stream */}
                  {messages.map((msg) => {
                    const isMine = msg.senderId === currentUser.id;
                    const isSystem = msg.type === 'system';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center my-2">
                          <span className="inline-block px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] text-amber-300 font-mono">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-300">{isMine ? 'You' : msg.senderName}</span>
                          <span className="font-mono text-emerald-400">{msg.senderRollNumber}</span>
                          <span>·</span>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Special bubble: Phone Share */}
                        {msg.type === 'phone_share' ? (
                          <div
                            className={`p-3.5 rounded-2xl max-w-sm border text-xs space-y-1.5 ${
                              isMine
                                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                                : 'bg-slate-950 border-emerald-500/30 text-emerald-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 font-bold text-emerald-300">
                              <Phone className="w-4 h-4 text-emerald-400" />
                              <span>Shared Contact Number</span>
                            </div>
                            <p className="font-mono text-sm font-bold text-white">
                              +91 {msg.sharedPhone}
                            </p>
                            <p className="text-[10px] text-emerald-400/80">
                              Shared directly in this private chat for campus handover coordination.
                            </p>
                          </div>
                        ) : msg.type === 'offer' ? (
                          /* Special bubble: Offer */
                          <div
                            className={`p-3.5 rounded-2xl max-w-sm border text-xs space-y-1 ${
                              isMine
                                ? 'bg-sky-950/60 border-sky-500/40 text-sky-200'
                                : 'bg-slate-950 border-sky-500/30 text-sky-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold text-sky-300">
                              <Tag className="w-4 h-4 text-sky-400" />
                              <span>Proposal / Offer Made</span>
                            </div>
                            <p className="font-mono text-sm font-bold text-white">
                              {msg.offerAmount || msg.text}
                            </p>
                          </div>
                        ) : (
                          /* Normal text bubble */
                          <div
                            className={`px-4 py-2.5 rounded-2xl max-w-md text-xs leading-relaxed ${
                              isMine
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs shadow-md'
                                : 'bg-slate-950 border border-slate-800 text-slate-100 rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>

                {/* 3. Quick Chips & Input Bar */}
                {activeConv.isBlocked ? (
                  <div className="p-4 bg-slate-950 border-t border-slate-800 text-center text-xs text-rose-300 space-y-1">
                    <p className="font-semibold">This conversation is blocked.</p>
                    <p className="text-slate-400">
                      Neither party can send messages until unblocked.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
                    
                    {/* Quick response chips */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] text-slate-300">
                      <button
                        type="button"
                        onClick={() => handleSendQuickPrompt('Hi, is this component still available for pickup?')}
                        className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 whitespace-nowrap cursor-pointer hover:text-white"
                      >
                        Still available?
                      </button>
                      {CAMPUS_MEETING_LOCATIONS.slice(0, 3).map((loc, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSendQuickPrompt(`📍 Propose meeting location: ${loc}. Does this work for testing & handover?`)}
                          className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 whitespace-nowrap cursor-pointer hover:text-white flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>Meet at {loc.split('-')[0].trim()}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleSendQuickPrompt('I will bring my multimeter & laptop to verify power in the lab.')}
                        className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 whitespace-nowrap cursor-pointer hover:text-white"
                      >
                        Bring testing tools
                      </button>
                      <button
                        type="button"
                        onClick={handleSharePhone}
                        className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 whitespace-nowrap cursor-pointer flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Share Phone Number</span>
                      </button>
                    </div>

                    {/* Chat Text Input */}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={`Message ${peerName} about this component...`}
                        className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                      />
                      <button
                        type="submit"
                        disabled={sending || !messageText.trim()}
                        className="px-4 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-sky-400 hover:from-emerald-300 hover:to-sky-300 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-slate-950" />
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    </form>

                  </div>
                )}
              </>
            ) : (
              /* No Conversation Selected Placeholder */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">Select a conversation</h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Choose a chat thread from the left or click <strong>"Chat with seller"</strong> on any component listing to discuss price, testing, and campus handover.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* MODAL: Report Conversation */}
        {showReportModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flag className="w-4 h-4 text-amber-400" />
                  <span>Report Inappropriate Conduct</span>
                </h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Reports help maintain a safe, trusted electronics exchange environment for Sri Vasavi Engineering College students.
              </p>

              <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Reason for Report</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                  >
                    <option value="Inappropriate or abusive language">Inappropriate or abusive language</option>
                    <option value="Spam or fraudulent offer">Spam or fraudulent offer</option>
                    <option value="Did not show up for scheduled campus handover">Did not show up for scheduled campus handover</option>
                    <option value="Misleading component condition or defective item">Misleading component condition or defective item</option>
                    <option value="Other campus guideline violation">Other campus guideline violation</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Additional Details (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Provide context regarding the chat or handover..."
                    value={reportCustomText}
                    onChange={(e) => setReportCustomText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
