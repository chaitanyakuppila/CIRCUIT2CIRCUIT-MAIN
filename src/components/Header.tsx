import React, { useState } from 'react';
import { Menu, X, MessageSquare, ShieldAlert, User, PlusCircle } from 'lucide-react';
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
  const [activeNav, setActiveNav] = useState<'market' | 'features' | 'care' | 'eco' | 'my-hub'>('my-hub');

  const isAdmin = Boolean(
    currentUser &&
      currentUser.rollNumber &&
      currentUser.rollNumber.trim().toUpperCase() === '25A81A4329'
  );

  const handleNavClick = (nav: 'market' | 'features' | 'care' | 'eco' | 'my-hub') => {
    setActiveNav(nav);
    setMobileMenuOpen(false);

    if (nav === 'market') {
      const el = document.getElementById('marketplace');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else onFindComponentsClick();
    } else if (nav === 'features') {
      const el = document.getElementById('marketplace');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (nav === 'care') {
      const el = document.getElementById('student-care');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (nav === 'eco') {
      const el = document.getElementById('sustainability');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (nav === 'my-hub') {
      if (currentUser) {
        onOpenProfile();
      } else {
        onOpenAuth('signin');
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#060c13]/90 backdrop-blur-md border-b border-slate-800/80 transition-all shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand Wordmark & Icon */}
        <a 
          href="#" 
          className="flex items-center gap-2.5 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg p-0.5 shrink-0"
        >
          <img 
            src="/assets/aistudio/CIRCUIT2CIRCUIT_7c14473a.jpeg" 
            alt="Circuit2Circuit Logo" 
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl border border-slate-800/80 group-hover:border-teal-400/80 transition-colors shadow-md shrink-0"
            referrerPolicy="no-referrer"
          />
          <span className="font-orbitron text-lg sm:text-xl font-bold tracking-tight text-[#7ef1d2] text-glow-teal flex items-center">
            Circuit<span className="text-[#34d399]">2</span>Circuit
          </span>
        </a>

        {/* Zone 2: Exact 5 Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-9 text-sm font-medium">
          <button 
            onClick={() => handleNavClick('market')} 
            className={`transition-all duration-200 cursor-pointer whitespace-nowrap py-1 relative shine-hover-effect ${
              activeNav === 'market' 
                ? 'text-[#5eead4] text-glow-teal font-semibold' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Market
          </button>

          <button 
            onClick={() => handleNavClick('features')} 
            className={`transition-all duration-200 cursor-pointer whitespace-nowrap py-1 relative shine-hover-effect ${
              activeNav === 'features' 
                ? 'text-[#5eead4] text-glow-teal font-semibold' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Features
          </button>

          <button 
            onClick={() => handleNavClick('care')} 
            className={`transition-all duration-200 cursor-pointer whitespace-nowrap py-1 relative shine-hover-effect ${
              activeNav === 'care' 
                ? 'text-[#5eead4] text-glow-teal font-semibold' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Care
          </button>

          <button 
            onClick={() => handleNavClick('eco')} 
            className={`transition-all duration-200 cursor-pointer whitespace-nowrap py-1 relative shine-hover-effect ${
              activeNav === 'eco' 
                ? 'text-[#5eead4] text-glow-teal font-semibold' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Eco
          </button>

          <button 
            onClick={() => handleNavClick('my-hub')} 
            className={`transition-all duration-200 cursor-pointer whitespace-nowrap py-1 relative shine-hover-effect ${
              activeNav === 'my-hub' 
                ? 'text-[#5eead4] text-glow-teal font-semibold' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            My Hub
          </button>
        </nav>

        {/* Zone 3: Action Buttons ("Sign in" + "+ List Item") */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {/* Quick Chat Shortcut if user has chats */}
          {currentUser && onOpenChat && (
            <button
              onClick={onOpenChat}
              className="relative p-2 text-violet-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-700/80 rounded-full transition-all cursor-pointer"
              title="Open student chats"
              aria-label="Student chats"
            >
              <MessageSquare className="w-4 h-4 text-violet-400" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-bold bg-[#34d399] text-slate-950 rounded-full">
                  {unreadChatCount}
                </span>
              )}
            </button>
          )}

          {/* Admin shortcut if available and user is an admin */}
          {onOpenAdmin && isAdmin && (
            <button 
              onClick={onOpenAdmin} 
              className="text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 px-3 py-1.5 rounded-full transition-all cursor-pointer text-xs font-semibold flex items-center gap-1.5"
              title="Campus Administration"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Admin</span>
            </button>
          )}

          {/* Sign in / User Profile Capsule */}
          {currentUser ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 rounded-full border border-slate-700/80 hover:border-teal-400/50 text-slate-200 transition-all cursor-pointer whitespace-nowrap shadow-sm shine-hover-effect"
              title={`${currentUser.name} (${currentUser.rollNumber})`}
            >
              <div className="w-5 h-5 rounded-full bg-[#34d399] text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <span className="max-w-[100px] truncate text-white">{currentUser.name}</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth('signin')}
              className="px-5 py-2 text-sm font-semibold text-slate-100 hover:text-white bg-slate-900/70 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 rounded-full transition-all cursor-pointer whitespace-nowrap shadow-sm shine-hover-effect"
            >
              Sign in
            </button>
          )}

          {/* + List Item Button: Lime Neon Pill */}
          <button
            onClick={onOpenListItem}
            className="px-5 py-2 text-sm font-bold text-slate-950 bg-[#bbf47b] hover:bg-[#cbf98e] rounded-full shadow-[0_0_18px_rgba(187,244,123,0.4)] hover:shadow-[0_0_26px_rgba(187,244,123,0.6)] transition-all cursor-pointer whitespace-nowrap shine-hover-effect flex items-center gap-1.5"
          >
            <span>+ List Item</span>
          </button>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex items-center gap-2 sm:hidden">
          {!currentUser ? (
            <button
              onClick={() => onOpenAuth('signin')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-full"
            >
              Sign in
            </button>
          ) : (
            <button
              onClick={onOpenProfile}
              className="w-7 h-7 rounded-full bg-[#34d399] text-slate-950 flex items-center justify-center font-bold text-xs"
            >
              {currentUser.name.charAt(0)}
            </button>
          )}

          <button
            onClick={onOpenListItem}
            className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-[#a8f368] rounded-full"
          >
            + List
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-200 bg-slate-900 rounded-lg border border-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-800 bg-[#060c13]/98 backdrop-blur-xl px-5 pt-3 pb-6 space-y-3 shadow-2xl">
          <nav className="flex flex-col space-y-1 text-sm font-medium text-slate-200">
            <button 
              onClick={() => handleNavClick('market')} 
              className={`text-left py-2.5 px-3 rounded-xl transition-all ${
                activeNav === 'market' ? 'text-[#5eead4] bg-teal-950/40 font-bold' : 'hover:bg-slate-900'
              }`}
            >
              Market
            </button>
            <button 
              onClick={() => handleNavClick('features')} 
              className={`text-left py-2.5 px-3 rounded-xl transition-all ${
                activeNav === 'features' ? 'text-[#5eead4] bg-teal-950/40 font-bold' : 'hover:bg-slate-900'
              }`}
            >
              Features
            </button>
            <button 
              onClick={() => handleNavClick('care')} 
              className={`text-left py-2.5 px-3 rounded-xl transition-all ${
                activeNav === 'care' ? 'text-[#5eead4] bg-teal-950/40 font-bold' : 'hover:bg-slate-900'
              }`}
            >
              Care
            </button>
            <button 
              onClick={() => handleNavClick('eco')} 
              className={`text-left py-2.5 px-3 rounded-xl transition-all ${
                activeNav === 'eco' ? 'text-[#5eead4] bg-teal-950/40 font-bold' : 'hover:bg-slate-900'
              }`}
            >
              Eco
            </button>
            <button 
              onClick={() => handleNavClick('my-hub')} 
              className={`text-left py-2.5 px-3 rounded-xl transition-all ${
                activeNav === 'my-hub' ? 'text-[#5eead4] bg-teal-950/40 font-bold' : 'hover:bg-slate-900'
              }`}
            >
              My Hub
            </button>

            {onOpenAdmin && isAdmin && (
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }} 
                className="text-left py-2 px-3 text-amber-400 bg-amber-950/30 rounded-xl flex items-center gap-2 font-semibold"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Campus Admin</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
