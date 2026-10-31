import React from 'react';
import { ArrowRight, PlusCircle, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onBrowseClick: () => void;
  onListClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onBrowseClick,
  onListClick,
}) => {
  return (
    <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Main Headline & Intro */}
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-violet-950/70 border border-violet-800/60 text-xs text-violet-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Sri Vasavi Engineering College · Student Electronics Exchange</span>
            </div>

            <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Rent, Sell & Donate <span className="text-emerald-400">Lab Components</span> with Seniors & Juniors
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Find tested microcontrollers, sensors, breadboards, and lab modules right on campus. 
              Seniors pass on project hardware, while juniors rent or claim items for practical labs.
            </p>
          </div>

          {/* Action Buttons (stack on small mobile, side-by-side on sm+, with >= 44px touch target) */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 pt-1 md:pt-0">
            <button
              onClick={onListClick}
              className="w-full sm:w-auto px-5 py-3 min-h-[44px] text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-300/40"
            >
              <PlusCircle className="w-4 h-4 text-slate-950 shrink-0" />
              <span>＋ Add a listing</span>
            </button>

            <button
              onClick={onBrowseClick}
              className="w-full sm:w-auto px-5 py-3 min-h-[44px] text-xs font-bold text-violet-300 bg-violet-950/60 hover:bg-violet-900/60 border border-violet-800/60 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Browse Listings</span>
              <ArrowRight className="w-4 h-4 text-violet-400 shrink-0" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};
