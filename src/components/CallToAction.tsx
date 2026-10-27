import React from 'react';
import { PlusCircle, Search, RefreshCw } from 'lucide-react';

interface CallToActionProps {
  onBrowseClick: () => void;
  onListClick: () => void;
}

export const CallToAction: React.FC<CallToActionProps> = ({ onBrowseClick, onListClick }) => {
  return (
    <section className="py-16 relative overflow-hidden bg-slate-50 border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-700">
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          <span>JOIN YOUR CAMPUS ELECTRONICS CIRCLE</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight text-balance">
          Ready to pass on your project gear or build your next semester prototype?
        </h2>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Whether you are a 4th-year senior clearing out your capstone bench or a 1st-year student preparing for your first breadboard lab viva, Circuit2Circuit connects you across campus.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onBrowseClick}
            className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4 text-white" />
            <span>Find Components Now</span>
          </button>

          <button
            onClick={onListClick}
            className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span>List a Component</span>
          </button>
        </div>

        <p className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold pt-2">
          Rent · Donate · Sell · Build
        </p>

      </div>
    </section>
  );
};
