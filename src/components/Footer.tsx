import React from 'react';
import { ArrowUp } from 'lucide-react';

interface FooterProps {
  onBrowseClick: () => void;
  onListClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onBrowseClick,
  onListClick,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 text-slate-400 text-xs py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand & Copy */}
        <div className="flex items-center gap-3">
          <img 
            src="/assets/aistudio/CIRCUIT2CIRCUIT_7c14473a.jpeg" 
            alt="Circuit2Circuit Logo" 
            className="w-8 h-8 object-contain rounded-lg border border-slate-800"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1">
              Circuit<span className="text-emerald-400">2</span><span className="text-blue-400">Circuit</span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium">
              Sri Vasavi Engineering College Student Electronics Exchange
            </p>
          </div>
        </div>

        {/* Quick Actions & Scroll to top */}
        <div className="flex items-center gap-4 text-[11px] font-semibold">
          <button 
            onClick={onBrowseClick} 
            className="text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            Browse Marketplace
          </button>
          <span className="text-slate-700">·</span>
          <button 
            onClick={onListClick} 
            className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer font-bold"
          >
            ＋ Add a listing
          </button>
          <span className="text-slate-700">·</span>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-slate-300 hover:text-violet-400 transition-colors cursor-pointer"
          >
            <span>Top</span>
            <ArrowUp className="w-3.5 h-3.5 text-violet-400" />
          </button>
        </div>

      </div>
    </footer>
  );
};


