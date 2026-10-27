import React, { useState, useMemo } from 'react';
import { ComponentItem, TransactionType, ComponentCategory, BTechYear } from '../types';
import { ComponentCard } from './ComponentCard';
import { Search, Filter, RotateCcw, SlidersHorizontal, PlusCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { SensorAutocomplete } from './SensorAutocomplete';

interface MarketplaceProps {
  items: ComponentItem[];
  onSelectItem: (item: ComponentItem) => void;
  onOpenListItem: () => void;
  onStartChat?: (item: ComponentItem) => void;
  selectedYearFilter?: BTechYear | null;
  onClearYearFilter?: () => void;
  onRefreshListings?: () => Promise<void>;
  isRefreshing?: boolean;
  refreshError?: string | null;
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  items,
  onSelectItem,
  onOpenListItem,
  onStartChat,
  selectedYearFilter,
  onClearYearFilter,
  onRefreshListings,
  isRefreshing = false,
  refreshError = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<BTechYear | 'all'>(selectedYearFilter || 'all');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'name'>('default');

  // Sync if prop changes from outside
  React.useEffect(() => {
    if (selectedYearFilter) {
      setSelectedYear(selectedYearFilter);
    }
  }, [selectedYearFilter]);

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'microcontrollers', label: 'Microcontrollers' },
    { id: 'sensors', label: 'Sensors & Modules' },
    { id: 'passives', label: 'Passives & ICs' },
    { id: 'prototyping', label: 'Breadboards & Tools' },
    { id: 'power_motors', label: 'Motors & Power' },
  ];

  const transactionTypes = [
    { id: 'all', label: 'All Items' },
    { id: 'rent', label: 'For Rent' },
    { id: 'donate', label: 'Free Donations' },
    { id: 'sell', label: 'For Sale' },
  ];

  const btechYears: Array<BTechYear | 'all'> = [
    'all',
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
  ];

  // Filtering Logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesSpecs = item.specs.some((s) => s.toLowerCase().includes(query));
        const matchesLabs = item.recommendedLabs.some((l) => l.toLowerCase().includes(query));
        const matchesSeller = item.sellerName.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesSpecs && !matchesLabs && !matchesSeller) {
          return false;
        }
      }

      // Category check
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Transaction type check
      if (selectedTransaction !== 'all' && item.transactionType !== selectedTransaction) {
        return false;
      }

      // Year check
      if (selectedYear !== 'all') {
        if (!item.targetYears.includes(selectedYear) && !item.targetYears.includes('All Years')) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.priceNumeric - b.priceNumeric;
      if (sortBy === 'price_desc') return b.priceNumeric - a.priceNumeric;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0; // Default order
    });
  }, [items, searchQuery, selectedCategory, selectedTransaction, selectedYear, sortBy]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTransaction('all');
    setSelectedYear('all');
    setSortBy('default');
    if (onClearYearFilter) onClearYearFilter();
  };

  const handleRefresh = async () => {
    if (onRefreshListings) {
      // Preserve current scroll position during refresh
      const scrollY = window.scrollY;
      await onRefreshListings();
      window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
    }
  };

  const hasActiveFilters = 
    searchQuery !== '' || 
    selectedCategory !== 'all' || 
    selectedTransaction !== 'all' || 
    selectedYear !== 'all' || 
    sortBy !== 'default';

  return (
    <section id="marketplace" className="py-12 bg-slate-950/40 border-t border-b border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Heading and Refresh Button */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-800/60 text-xs font-mono font-semibold text-violet-300 mb-2">
              <span>SRI VASAVI STUDENT MARKETPLACE</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Electronics Listings
              </h2>
              
              {/* Refresh Listings Button beside heading */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-violet-300 bg-violet-950/60 border border-violet-800/60 hover:bg-violet-900/60 rounded-lg transition-all cursor-pointer disabled:opacity-60"
                title="Fetch latest student listings from backend without clearing search or filters"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-violet-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh listings'}</span>
              </button>
            </div>

            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Browse actual student-submitted components available for campus purchase, rental, or free donation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenListItem}
              className="flex items-center gap-2 px-4.5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>＋ Add a listing</span>
            </button>
          </div>
        </div>

        {/* Error Alert if Refresh Fails */}
        {refreshError && (
          <div className="my-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-between gap-3 text-xs text-rose-200 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{refreshError}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="px-2.5 py-1 bg-rose-900 hover:bg-rose-800 text-rose-100 font-semibold rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Search & Main Filter Bar */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 sm:p-5 mt-6 shadow-2xl space-y-4">
          
          {/* Top row: Search input + Sort Dropdown */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8">
              <SensorAutocomplete
                value={searchQuery}
                onChange={(val) => setSearchQuery(val)}
                onSelectVerified={(sensor) => setSearchQuery(sensor.name)}
                placeholder="Search Arduino Uno, ESP32, HC-SR04 ultrasonic, PIR, soil moisture..."
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                rightElement={
                  searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  ) : null
                }
                inputClassName="w-full pl-10 pr-14 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
              />
            </div>

            <div className="md:col-span-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-hidden focus:border-violet-500 cursor-pointer"
              >
                <option value="default">Sort: Default (Newest)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Component Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Transaction Type & Year Filter Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            {/* Deal Type */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium shrink-0">Deal Type:</span>
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                {transactionTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTransaction(t.id as any)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap min-h-[36px] flex items-center ${
                      selectedTransaction === t.id
                        ? 'bg-emerald-400 text-slate-950 shadow-md font-extrabold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* BTech Year Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium shrink-0">Year:</span>
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                {btechYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      if (year === 'all' && onClearYearFilter) onClearYearFilter();
                    }}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap min-h-[36px] flex items-center ${
                      selectedYear === year
                        ? 'bg-violet-600 text-white shadow-md font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {year === 'all' ? 'All Years' : year}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Tabs (Smooth touch scrolling on mobile) */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800 touch-pan-x">
            <span className="text-xs text-slate-400 font-medium mr-1 shrink-0">Category:</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id as any)}
                  className={`px-3.5 py-2 text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[36px] flex items-center shrink-0 ${
                    selectedCategory === c.id
                      ? 'bg-violet-950/80 border border-violet-500/60 text-violet-200 font-bold shadow-md'
                      : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Reset button if filters active */}
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="ml-auto flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors cursor-pointer whitespace-nowrap px-2 py-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset filters</span>
              </button>
            )}
          </div>

        </div>

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between text-xs text-slate-300 py-4">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-white font-mono">{filteredItems.length}</strong> listings available on campus</span>
            {selectedYear !== 'all' && (
              <span className="bg-violet-950/80 text-violet-300 px-2 py-0.5 rounded border border-violet-800/60 font-mono text-[11px] font-semibold">
                Filtered for {selectedYear}
              </span>
            )}
          </div>
        </div>

        {/* Component Cards Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ComponentCard 
                key={item.id} 
                item={item} 
                onSelect={onSelectItem} 
                onStartChat={onStartChat}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto my-8 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No components matched your search</h3>
            <p className="text-sm text-slate-300">
              Try adjusting your search terms or resetting category and year filters to see all student listings.
            </p>
            <button
              onClick={resetAllFilters}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
