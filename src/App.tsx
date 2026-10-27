/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ComponentItem, BTechYear, StudentUser } from './types';
import { INITIAL_COMPONENTS } from './data/sampleComponents';
import { DEFAULT_BRANCHES } from './utils/validation';
import { api, getStoredToken } from './services/api';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Marketplace } from './components/Marketplace';
import { Footer } from './components/Footer';
import { ComponentDetailModal } from './components/ComponentDetailModal';
import { ListItemModal } from './components/ListItemModal';
import { AuthModal } from './components/AuthModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { ChatModal } from './components/ChatModal';
import { AnimatedCircuitBackground } from './components/AnimatedCircuitBackground';
import { CheckCircle2, X, ShieldCheck, PlusCircle } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<ComponentItem[]>(INITIAL_COMPONENTS);
  const [branches, setBranches] = useState<string[]>(DEFAULT_BRANCHES);
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null);
  
  // Modals
  const [selectedItem, setSelectedItem] = useState<ComponentItem | null>(null);
  const [isListItemOpen, setIsListItemOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pendingActionAfterAuth, setPendingActionAfterAuth] = useState<'openListItem' | null>(null);

  // OLX-Style In-App Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatConversationId, setActiveChatConversationId] = useState<string | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  // Filters & Notifications
  const [selectedYearFilter, setSelectedYearFilter] = useState<BTechYear | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refresh State
  const [isRefreshingListings, setIsRefreshingListings] = useState(false);
  const [refreshListingsError, setRefreshListingsError] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const fetchUnreadCount = async () => {
    if (!getStoredToken()) {
      setUnreadChatCount(0);
      return;
    }
    try {
      const res = await api.getUnreadTotal();
      setUnreadChatCount(res.totalUnread || 0);
    } catch (err) {
      // ignore
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    // 1. Fetch branches
    api.getBranches()
      .then((res) => {
        if (res.branches && res.branches.length > 0) {
          setBranches(res.branches);
        }
      })
      .catch((err) => console.log('Using default branches:', err));

    // 2. Fetch live listings
    loadListings();

    // 3. Check existing auth session
    if (getStoredToken()) {
      api.getMe()
        .then((res) => {
          if (res.user) {
            setCurrentUser(res.user);
            fetchUnreadCount();
          }
        })
        .catch(() => {
          // Token expired or invalid
          setCurrentUser(null);
        });
    }
  }, []);

  // Poll for unread messages when logged in
  useEffect(() => {
    if (!currentUser) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const loadListings = () => {
    api.getListings()
      .then((res) => {
        if (res.listings && res.listings.length > 0) {
          setItems(res.listings);
        }
      })
      .catch((err) => console.error('Failed to load listings from backend:', err));
  };

  const handleScrollToMarketplace = () => {
    const el = document.getElementById('marketplace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Route sync for direct /signin and /register URLs
  useEffect(() => {
    const syncRouteWithState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/signin' || path === '/login') {
        setAuthMode('signin');
        setIsAuthOpen(true);
      } else if (path === '/register' || path === '/signup') {
        setAuthMode('register');
        setIsAuthOpen(true);
      }
    };

    syncRouteWithState();
    window.addEventListener('popstate', syncRouteWithState);
    return () => window.removeEventListener('popstate', syncRouteWithState);
  }, []);

  const handleAuthSuccess = (user: StudentUser, message: string) => {
    setCurrentUser(user);
    showToast(`${message} Welcome, ${user.name}!`);
    loadListings();

    const path = window.location.pathname.toLowerCase();
    if (path === '/signin' || path === '/login' || path === '/register' || path === '/signup') {
      window.history.pushState(null, '', '/');
    }

    // Check if user was trying to open "Add a listing" before signing in
    if (pendingActionAfterAuth === 'openListItem') {
      setPendingActionAfterAuth(null);
      setIsListItemOpen(true);
    }
  };

  const handleSignOut = async () => {
    await api.logout();
    setCurrentUser(null);
    showToast('Signed out of Circuit2Circuit.');
    loadListings();
  };

  const handleOpenAuth = (mode: 'signin' | 'register' = 'signin') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
    const targetPath = mode === 'register' ? '/register' : '/signin';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  const handleCloseAuth = () => {
    setIsAuthOpen(false);
    const path = window.location.pathname.toLowerCase();
    if (path === '/signin' || path === '/login' || path === '/register' || path === '/signup') {
      window.history.pushState(null, '', '/');
    }
  };

  const handleOpenListItem = () => {
    if (!currentUser) {
      showToast('Please sign in with your Sri Vasavi roll number to create a listing.');
      setPendingActionAfterAuth('openListItem');
      handleOpenAuth('signin');
      return;
    }
    setIsListItemOpen(true);
  };

  const handleAddItem = (newItem: ComponentItem) => {
    setItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
    showToast(`Successfully published "${newItem.name}" on Circuit2Circuit!`);
    handleScrollToMarketplace();
  };

  const handleStartChat = async (item: ComponentItem) => {
    if (!currentUser) {
      showToast('Please sign in with your Sri Vasavi roll number to chat with sellers.');
      handleOpenAuth('signin');
      return;
    }

    if (item.sellerRollNumber === currentUser.rollNumber || (item.sellerId && item.sellerId === currentUser.id)) {
      showToast('This is your own component listing.');
      return;
    }

    try {
      const res = await api.startConversation(item.id);
      setActiveChatConversationId(res.conversation.id);
      setIsChatOpen(true);
      fetchUnreadCount();
    } catch (err: any) {
      showToast(err.message || 'Could not start conversation with seller.');
    }
  };

  const handleRefreshListings = async () => {
    setIsRefreshingListings(true);
    setRefreshListingsError(null);
    try {
      const res = await api.getListings();
      if (res.listings && res.listings.length > 0) {
        setItems(res.listings);
      }
    } catch (err: any) {
      setRefreshListingsError(err.message || 'Failed to refresh student listings. Please check connection.');
    } finally {
      setIsRefreshingListings(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-violet-500/20 selection:text-violet-300 overflow-x-hidden">
      
      {/* Animated Circuit Canvas Background */}
      <AnimatedCircuitBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* College Notice Ribbon */}
        <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 text-[10px] sm:text-[11px] py-1.5 px-3 sm:px-4 text-center text-slate-300 flex items-center justify-center gap-2 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate sm:overflow-visible">
            <strong className="text-white">Sri Vasavi Engineering College (Autonomous)</strong> · Student Electronics & Lab Components Exchange
          </span>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-slate-900/95 border border-violet-500/50 text-white px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Header */}
        <Header
          onFindComponentsClick={handleScrollToMarketplace}
          onOpenListItem={handleOpenListItem}
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onOpenProfile={() => setIsProfileOpen(true)}
          unreadChatCount={unreadChatCount}
          onOpenChat={() => {
            setActiveChatConversationId(null);
            setIsChatOpen(true);
          }}
        />

        {/* Main Content */}
        <main className="flex-1">
          {/* 1. Compact Intro Banner */}
          <Hero
            onBrowseClick={handleScrollToMarketplace}
            onListClick={handleOpenListItem}
          />

          {/* 2. Active Student Marketplace with Search, Category Filters, and Refresh listings */}
          <Marketplace
            items={items}
            onSelectItem={(item) => setSelectedItem(item)}
            onOpenListItem={handleOpenListItem}
            selectedYearFilter={selectedYearFilter}
            onClearYearFilter={() => setSelectedYearFilter(null)}
            onStartChat={handleStartChat}
            onRefreshListings={handleRefreshListings}
            isRefreshing={isRefreshingListings}
            refreshError={refreshListingsError}
          />
        </main>

        {/* Concise Footer */}
        <Footer
          onBrowseClick={handleScrollToMarketplace}
          onListClick={handleOpenListItem}
        />

        {/* Floating Action Button (FAB) for Mobile - "＋ Add a listing" */}
        <button
          onClick={handleOpenListItem}
          className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3.5 rounded-full shadow-xl flex items-center gap-2 sm:hidden cursor-pointer transition-transform active:scale-95 border border-emerald-500"
          title="＋ Add a listing"
        >
          <PlusCircle className="w-5 h-5 text-white shrink-0" />
          <span>＋ Add a listing</span>
        </button>

      </div>

      {/* Item Detail & Handover Request Modal */}
      <ComponentDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onRequestSubmitted={loadListings}
        onStartChat={handleStartChat}
      />

      {/* 4th-Year Senior & Student Listing Modal */}
      <ListItemModal
        isOpen={isListItemOpen}
        onClose={() => setIsListItemOpen(false)}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onAddItem={handleAddItem}
      />

      {/* Student Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={handleCloseAuth}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authMode}
        branches={branches}
      />

      {/* Student Profile & Privacy Management Modal */}
      {currentUser && (
        <StudentProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          onUserUpdated={(updated) => setCurrentUser(updated)}
          onSignOut={handleSignOut}
          branches={branches}
          onOpenListItem={handleOpenListItem}
          onListingsModified={loadListings}
          onOpenChat={() => {
            setIsProfileOpen(false);
            setActiveChatConversationId(null);
            setIsChatOpen(true);
          }}
        />
      )}

      {/* OLX-Style In-App Chat Modal */}
      {currentUser && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setActiveChatConversationId(null);
            fetchUnreadCount();
          }}
          currentUser={currentUser}
          initialConversationId={activeChatConversationId}
        />
      )}

    </div>
  );
}
