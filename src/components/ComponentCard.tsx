import React from 'react';
import { ComponentItem } from '../types';
import { HardwareVisual } from './HardwareVisual';
import { User, ArrowUpRight, MessageSquare, Package, ShieldCheck, Repeat, Clock } from 'lucide-react';

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
      case 'swap':
        return {
          label: 'COMPONENT SWAP',
          textColor: 'text-amber-300',
          borderColor: 'border-amber-800/60',
          bgColor: 'bg-amber-950/70',
          priceColor: 'text-amber-300 font-bold',
        };
      case 'sell':
      default:
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

  return (
    <div 
      className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-950/20 transition-all duration-200 group shadow-lg"
    >
      <div className="space-y-3.5 flex-1">
        
        {/* Hardware Visual Preview with photo or fallback */}
        <div className="cursor-pointer relative" onClick={() => onSelect(item)}>
          <HardwareVisual 
            iconType={item.iconType} 
            category={item.category} 
            name={item.name} 
            photoUrl={item.photoUrl}
          />

          {/* Project Kit Overlay Tag */}
          {item.isProjectKit && (
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/60 text-[10px] font-extrabold text-emerald-300 shadow-md flex items-center gap-1 backdrop-blur-xs">
              <Package className="w-3 h-3 text-emerald-400" />
              <span>PRE-TESTED PROJECT KIT</span>
            </div>
          )}

          {/* 48H Guarantee Tag */}
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-800 text-[9px] font-mono font-bold text-slate-300 shadow-xs flex items-center gap-1 backdrop-blur-xs">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
            <span>48H Testing Window</span>
          </div>
        </div>

        {/* Transaction Type & Price Header */}
        <div className="flex items-start justify-between gap-2 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] sm:text-[11px] font-mono tracking-wider font-bold px-2 py-0.5 rounded border ${badge.borderColor} ${badge.textColor} ${badge.bgColor}`}>
                {badge.label}
              </span>
              {item.isSample && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800/90 border border-slate-700/80 text-slate-300">
                  Demo Data
                </span>
              )}
              <span className="text-xs text-slate-400 font-medium truncate max-w-[120px]">{item.categoryLabel}</span>
            </div>
          </div>

          <div className="text-right flex flex-col items-end shrink-0">
            <span className={`text-sm sm:text-base font-mono ${badge.priceColor} tabular-nums font-extrabold`}>
              {item.samplePrice}
            </span>
            {item.depositAmount && item.depositAmount > 0 ? (
              <span className="text-[10px] text-amber-400 font-medium">
                +₹{item.depositAmount} ref. deposit
              </span>
            ) : null}
            {item.transactionType === 'sell' && item.originalPriceNumeric && item.originalPriceNumeric > item.priceNumeric ? (
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="line-through">Orig: ₹{item.originalPriceNumeric}</span>
                <span className="text-emerald-300 font-bold bg-emerald-950/80 px-1 rounded border border-emerald-800/50">
                  {Math.round(((item.originalPriceNumeric - item.priceNumeric) / item.originalPriceNumeric) * 100)}% OFF
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 
            onClick={() => onSelect(item)}
            className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {item.name}
          </h3>
          <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Condition & Target Years Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-0.5">
          <span className="text-slate-200 font-medium text-[11px]">{item.condition}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-emerald-300 font-mono text-[10px] sm:text-[11px] font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
            {item.targetYears.join(', ')}
          </span>
          {item.status && item.status !== 'available' && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
              {item.status}
            </span>
          )}
        </div>

        {/* Recommended Lab Badges */}
        <div className="space-y-1 pt-0.5">
          <span className="text-[10px] text-slate-400 font-medium block">Lab Practical:</span>
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

      {/* Footer: Seller (Name, Roll, Branch) & Action CTAs */}
      <div className="pt-3.5 mt-3.5 border-t border-slate-800/80 space-y-3">
        
        <div className="space-y-1 text-xs text-slate-300">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate" title={`${item.sellerName} (${item.sellerRollNumber} · ${item.sellerDept})`}>
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-200 truncate text-xs">{item.sellerName}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-bold shrink-0">
                {item.sellerRollNumber}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0 font-medium">{item.sellerYear}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate max-w-[170px]" title={item.sellerDept}>{item.sellerDept}</span>
            {item.sellerShareMobile && item.sellerMobile ? (
              <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1 text-[10px]">
                📞 {item.sellerMobile}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 italic">
                Mobile private
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onSelect(item)}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-950/80 hover:bg-slate-800 active:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer min-h-[42px]"
          >
            <span>{item.isProjectKit ? 'View Kit' : 'Specs'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => onStartChat ? onStartChat(item) : onSelect(item)}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-xl shadow-md transition-all cursor-pointer min-h-[42px]"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-950" />
            <span>Chat Seller</span>
          </button>
        </div>

      </div>

    </div>
  );
};
