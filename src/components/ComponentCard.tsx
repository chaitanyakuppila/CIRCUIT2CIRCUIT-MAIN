import React from 'react';
import { ComponentItem } from '../types';
import { HardwareVisual } from './HardwareVisual';
import { User, ArrowUpRight, MessageSquare } from 'lucide-react';

interface ComponentCardProps {
  item: ComponentItem;
  onSelect: (item: ComponentItem) => void;
  onStartChat?: (item: ComponentItem) => void;
}

export const ComponentCard: React.FC<ComponentCardProps> = ({ item, onSelect, onStartChat }) => {
  // Styling according to transaction type with dark glass contrast
  const getBadgeDetails = () => {
    switch (item.transactionType) {
      case 'rent':
        return {
          label: 'FOR RENT',
          textColor: 'text-sky-300',
          borderColor: 'border-sky-800/60',
          bgColor: 'bg-sky-950/70',
          priceColor: 'text-sky-300 font-bold',
        };
      case 'donate':
        return {
          label: 'FREE DONATION',
          textColor: 'text-emerald-300',
          borderColor: 'border-emerald-800/60',
          bgColor: 'bg-emerald-950/70',
          priceColor: 'text-emerald-400 font-bold',
        };
      case 'sell':
        return {
          label: 'FOR SALE',
          textColor: 'text-violet-300',
          borderColor: 'border-violet-800/60',
          bgColor: 'bg-violet-950/70',
          priceColor: 'text-violet-300 font-bold',
        };
    }
  };

  const badge = getBadgeDetails();

  const hasPhoto = Boolean(item.photoUrl);

  return (
    <div 
      className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between h-full hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-950/20 transition-all duration-200 group shadow-lg"
    >
      <div className="space-y-4 flex-1">
        
        {/* Hardware Visual Preview with photo or neutral fallback */}
        <div className="cursor-pointer" onClick={() => onSelect(item)}>
          <HardwareVisual 
            iconType={item.iconType} 
            category={item.category} 
            name={item.name} 
            photoUrl={item.photoUrl}
          />
        </div>

        {/* Transaction Type & Price Header */}
        <div className="flex items-start justify-between gap-2 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono tracking-wider font-bold px-2 py-0.5 rounded border ${badge.borderColor} ${badge.textColor} ${badge.bgColor}`}>
                {badge.label}
              </span>
              <span className="text-xs text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-medium truncate max-w-[120px]">{item.categoryLabel}</span>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className={`text-base font-mono ${badge.priceColor} tabular-nums font-extrabold`}>
              {item.samplePrice}
            </span>
            {item.transactionType === 'sell' && item.originalPriceNumeric && item.originalPriceNumeric > item.priceNumeric && (
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="line-through">Orig: ₹{item.originalPriceNumeric}</span>
                <span className="text-emerald-300 font-bold bg-emerald-950/80 px-1 rounded border border-emerald-800/50">
                  {Math.round(((item.originalPriceNumeric - item.priceNumeric) / item.originalPriceNumeric) * 100)}% OFF
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 
            onClick={() => onSelect(item)}
            className="text-base font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {item.name}
          </h3>
          <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Condition & Target Years Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-1">
          <span className="text-slate-200 font-medium">{item.condition}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-emerald-300 font-mono text-[11px] font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
            {item.targetYears.join(', ')}
          </span>
        </div>

        {/* Recommended Lab Badges */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-medium block">Lab Suitability:</span>
          <div className="flex flex-wrap gap-1.5">
            {item.recommendedLabs.slice(0, 2).map((lab, idx) => (
              <span 
                key={idx}
                className="text-[10px] font-mono text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[200px]"
              >
                {lab}
              </span>
            ))}
            {item.recommendedLabs.length > 2 && (
              <span className="text-[10px] font-mono text-slate-400 self-center">
                +{item.recommendedLabs.length - 2} more
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Footer: Seller (Name, Roll, Branch) & Campus Location */}
      <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-3">
        
        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate" title={`${item.sellerName} (${item.sellerRollNumber} · ${item.sellerDept})`}>
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-200 truncate">{item.sellerName}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-950/80 border border-violet-800/60 text-violet-300 font-bold shrink-0">
                {item.sellerRollNumber}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0 font-medium">{item.sellerYear}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate max-w-[170px]" title={item.sellerDept}>{item.sellerDept}</span>
            {item.sellerShareMobile && item.sellerMobile ? (
              <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                📞 {item.sellerMobile}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 italic">
                Mobile private
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => onSelect(item)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-200 hover:text-white bg-slate-950/80 hover:bg-slate-800 active:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer min-h-[40px]"
          >
            <span>Specs & Labs</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => onStartChat ? onStartChat(item) : onSelect(item)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-xl shadow-md transition-all cursor-pointer min-h-[40px]"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-950" />
            <span>Chat Seller</span>
          </button>
        </div>

      </div>

    </div>
  );
};

