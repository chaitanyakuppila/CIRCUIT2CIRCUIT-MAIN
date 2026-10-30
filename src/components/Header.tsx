import React, { useState } from 'react';
import { Menu, X, PlusCircle, Search, User, ShieldCheck, MessageSquare, UserPlus, BookOpen, Leaf, ShieldAlert, Package } from 'lucide-react';
import { StudentUser } from '../types';

interface HeaderProps {
  onFindComponentsClick: () => void;
  onOpenListItem: () => void;
  currentUser: StudentUser | null;
  onOpenAuth: (mode?: 'signin' | 'register') => void;
  onOpenProfile: () => void;
  unreadChatCount?: number;
  onOpenChat?: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onFindComponentsClick,
  onOpenListItem,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  unreadChatCount = 0,
  onOpenChat,
  onOpenAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 transition-all shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Zone */}
        <a 
          href="#" 
          className="flex items-center gap-2 sm:gap-2.5 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-0.5 shrink-0"
        >
          <img 
            src="/assets/aistudio/CIRCUIT2CIRCUIT_7c14473a.jpeg" 
            alt="Circuit2Circuit Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-xl border border-slate-800 group-hover:border-emerald-500/80 transition-colors shadow-md shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-white flex items-center">
                Circuit<span className="text-emerald-400">2</span><span className="text-blue-400">Circuit</span>
              </span>
              <span className="hidden md:inline-block text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/60 text-blue-300">
                Sri Vasavi
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 tracking-wider uppercase hidden xs:block">
              Rent · Swap · Donate · Build
            </span>
          </div>
        </a>

        {/* Navigation Links (Desktop 1024px+) */}
        <nav className="hidden lg:flex items-center gap-3 xl:gap-5 text-xs font-semibold text-slate-300">
          <button 
            onClick={() => scrollToSection('marketplace')} 
            className="hover:text-emerald-400 transition-colors whitespace-nowrap cursor-pointer text-slate-200 font-bold"
          >
            Marketplace
          </button>

          <button 
            onClick={() => scrollToSection('student-care')} 
            className="hover:text-emerald-400 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 text-slate-300 hover:text-white"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Student Care</span>
          </button>

          <button 
            onClick={() => scrollToSection('sustainability')} 
            className="hover:text-emerald-400 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 text-slate-300 hover:text-white"
          >
            <Leaf className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Eco-Impact & Ranks</span>
          </button>

          {onOpenAdmin && (
            <button 
              onClick={onOpenAdmin} 
              className="text-amber-300 hover:text-amber-200 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/50 px-2 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Campus Admin</span>
            </button>
          )}
        </nav>

        {/* Action Controls (Tablets & Laptops) */}
        <div className="hidden sm:flex items-center gap-1.5 md:gap-2 shrink-0">
          <button
            onClick={onFindComponentsClick}
            className="flex items-center gap-1 px-2.5 py-1.5 md:px-3 md:py-2 text-xs font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden md:inline">Find components</span>
          </button>

          {/* In-App Messages / Chat Button */}
          <button
            onClick={currentUser ? onOpenChat : () => onOpenAuth('signin')}
            className="relative flex items-center gap-1 px-2.5 py-1.5 md:px-3 md:py-2 text-xs font-bold text-violet-300 bg-violet-950/60 border border-violet-800/60 hover:bg-violet-900/60 rounded-xl transition-all cursor-pointer whitespace-nowrap"
            title={currentUser ? "Open student conversations" : "Sign in to chat with sellers"}
          >
            <MessageSquare className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span>Chats</span>
            {unreadChatCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-emerald-500 text-slate-950 rounded-full">
                {unreadChatCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenListItem}
            className="flex items-center gap-1 px-2.5 py-1.5 md:px-3 md:py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-950 shrink-0" />
            <span>＋ Add listing</span>
          </button>

          {/* Student Auth / Profile Buttons */}
          {currentUser ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-1.5 text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-200 transition-all cursor-pointer whitespace-nowrap shadow-md"
              title={`${currentUser.name} (${currentUser.rollNumber})`}
            >
              <div className="w-6 h-6 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left leading-tight hidden md:block">
                <span className="block truncate max-w-[100px] text-white font-bold">{currentUser.name}</span>
                <span className="text-[9px] font-mono text-emerald-400 block font-semibold">{currentUser.rollNumber}</span>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuth('signin')}
                className="flex items-center gap-1 px-2.5 py-1.5 md:px-3 md:py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Sign in</span>
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                className="flex items-center gap-1 px-2.5 py-1.5 md:px-3 md:py-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Create account</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Action Cluster (< 640px) */}
        <div className="flex items-center gap-1 sm:hidden">
          {!currentUser ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onOpenAuth('signin')}
                className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-800/70 rounded-lg min-h-[36px] cursor-pointer"
                title="Student Sign In"
              >
                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="hidden xs:flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-slate-200 bg-slate-900 border border-slate-800 rounded-lg min-h-[36px] cursor-pointer"
                title="Create Student Account"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Join</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenProfile}
              className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0"
              title={currentUser.name}
            >
              {currentUser.name.charAt(0)}
            </button>
          )}

          <button
            onClick={currentUser ? onOpenChat : () => onOpenAuth('signin')}
            className="relative p-1.5 text-violet-300 bg-violet-950/60 hover:bg-violet-900/60 rounded-lg border border-violet-800/60 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Open messages"
          >
            <MessageSquare className="w-4 h-4 text-violet-400" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 text-[9px] font-bold bg-emerald-400 text-slate-950 rounded-full">
                {unreadChatCount}
              </span>
            )}
          </button>

          <button
            onClick={onFindComponentsClick}
            className="p-1.5 text-slate-200 bg-slate-900 rounded-lg border border-slate-800 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Find components"
          >
            <Search className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-200 bg-slate-900 rounded-lg border border-slate-800 focus:outline-hidden min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Open navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 shadow-2xl">
          <nav className="flex flex-col space-y-1 text-sm font-semibold text-slate-200">
            <button 
              onClick={() => scrollToSection('marketplace')} 
              className="text-left py-2 px-3 hover:bg-slate-900 rounded-lg hover:text-emerald-400 transition-colors font-bold text-white min-h-[40px] flex items-center"
            >
              Browse Student Listings
            </button>
            <button 
              onClick={() => scrollToSection('student-care')} 
              className="text-left py-2 px-3 hover:bg-slate-900 rounded-lg hover:text-emerald-400 transition-colors text-slate-300 min-h-[40px] flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Student Care Helpdesk</span>
            </button>
            <button 
              onClick={() => scrollToSection('sustainability')} 
              className="text-left py-2 px-3 hover:bg-slate-900 rounded-lg hover:text-emerald-400 transition-colors text-slate-300 min-h-[40px] flex items-center gap-2"
            >
              <Leaf className="w-4 h-4 text-teal-400" />
              <span>Eco-Impact & Leaderboard</span>
            </button>
            {onOpenAdmin && (
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }} 
                className="text-left py-2 px-3 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-300 min-h-[40px] flex items-center gap-2 font-bold"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Campus Administration</span>
              </button>
            )}
          </nav>

          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2.5">
            {currentUser ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs min-h-[48px]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-white block">{currentUser.name}</span>
                      <span className="text-[10px] font-mono text-emerald-400 block font-semibold">{currentUser.rollNumber}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400">View Profile →</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenChat) onOpenChat();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-violet-950/60 border border-violet-800/60 text-xs text-violet-300 font-semibold min-h-[44px]"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-violet-400" />
                    <span>In-App Messages</span>
                  </div>
                  {unreadChatCount > 0 ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-slate-950 rounded-full">
                      {unreadChatCount} new
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Inbox</span>
                  )}
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('signin');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl min-h-[44px]"
                >
                  <User className="w-4 h-4 text-slate-950" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('register');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-emerald-300 bg-slate-900 border border-slate-700 hover:border-emerald-400/80 rounded-xl min-h-[44px]"
                >
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>Create Account</span>
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenListItem();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg cursor-pointer min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>＋ Add a listing</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
