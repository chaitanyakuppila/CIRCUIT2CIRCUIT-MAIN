import React, { useState, useEffect } from 'react';
import { ComponentItem, ComponentCategory, TransactionType, BTechYear, StudentUser, ProjectKitDetails } from '../types';
import {
  X,
  PlusCircle,
  AlertCircle,
  ShieldCheck,
  Lock,
  Info,
  Upload,
  Trash2,
  CheckCircle2,
  Package,
  Code2,
  Repeat,
  IndianRupee,
  MapPin
} from 'lucide-react';
import { validateListingPermissions, CAMPUS_MEETING_LOCATIONS } from '../utils/validation';
import { api } from '../services/api';
import { SensorAutocomplete } from './SensorAutocomplete';

interface ListItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: StudentUser | null;
  onOpenAuth: (mode?: 'signin' | 'register') => void;
  onAddItem: (newItem: ComponentItem) => void;
  editingItem?: ComponentItem | null;
}

export const ListItemModal: React.FC<ListItemModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onAddItem,
  editingItem,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ComponentCategory>('microcontrollers');
  const [transactionType, setTransactionType] = useState<TransactionType>('rent');
  
  // Pricing & Rent fields
  const [sellingPrice, setSellingPrice] = useState('250');
  const [originalPrice, setOriginalPrice] = useState('500');
  const [rentalRate, setRentalRate] = useState('40');
  const [depositAmount, setDepositAmount] = useState('100');
  const [rentalPeriod, setRentalPeriod] = useState<'day' | 'week' | 'month' | 'semester'>('week');
  const [swapWishlist, setSwapWishlist] = useState('ESP8266 NodeMCU or MPU6050 Accelerometer');

  const [condition, setCondition] = useState<ComponentItem['condition']>('Like New (1 Lab Session)');
  const [pickupLocation, setPickupLocation] = useState(CAMPUS_MEETING_LOCATIONS[0]);
  const [description, setDescription] = useState('');
  const [specs, setSpecs] = useState('5V Operating Voltage, Pins Intact, Tested OK in Lab');
  const [recommendedLabs, setRecommendedLabs] = useState('Microcontroller Lab, Mini Projects');
  const [targetYears, setTargetYears] = useState<BTechYear[]>(['1st Year', '2nd Year', '3rd Year']);

  // Project Kit Extension
  const [isProjectKit, setIsProjectKit] = useState(false);
  const [kitParts, setKitParts] = useState('Arduino Uno R3 (qty 1), Breadboard MB-102 (qty 1), Dupont Jumpers (qty 20)');
  const [kitCompatibility, setKitCompatibility] = useState('Arduino IDE 2.x, 5V USB logic');
  const [kitSetupInstructions, setKitSetupInstructions] = useState('1. Connect board to breadboard\n2. Power with 5V USB cable\n3. Flash provided sketch');
  const [kitSampleCode, setKitSampleCode] = useState('');
  const [kitDomain, setKitDomain] = useState('Embedded Systems & IoT');
  
  // Photo Upload States
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setCategory(editingItem.category);
      setTransactionType(editingItem.transactionType);
      setSellingPrice(String(editingItem.priceNumeric || 250));
      setOriginalPrice(editingItem.originalPriceNumeric ? String(editingItem.originalPriceNumeric) : '');
      setRentalRate(String(editingItem.priceNumeric || 40));
      setDepositAmount(editingItem.depositAmount ? String(editingItem.depositAmount) : '100');
      setRentalPeriod(editingItem.rentalPeriod || 'week');
      setCondition(editingItem.condition);
      setPickupLocation(editingItem.pickupLocation);
      setDescription(editingItem.description);
      setSpecs(editingItem.specs.join(', '));
      setRecommendedLabs(editingItem.recommendedLabs.join(', '));
      setTargetYears(editingItem.targetYears as BTechYear[]);
      setPhotoUrls(editingItem.photoUrls || (editingItem.photoUrl ? [editingItem.photoUrl] : []));
      setIsProjectKit(Boolean(editingItem.isProjectKit));
      if (editingItem.kitDetails) {
        setKitParts(editingItem.kitDetails.partsList.map((p) => `${p.name} (qty ${p.qty})`).join(', '));
        setKitCompatibility(editingItem.kitDetails.compatibility);
        setKitSetupInstructions(editingItem.kitDetails.setupInstructions);
        setKitSampleCode(editingItem.kitDetails.sampleCode || '');
        setKitDomain(editingItem.kitDetails.targetDomain || 'Embedded Systems');
      }
    } else if (currentUser) {
      if (currentUser.year === '4th Year') {
        setTransactionType('sell');
        setSellingPrice('250');
        setOriginalPrice('500');
      } else {
        setTransactionType('rent');
        setRentalRate('40');
        setRentalPeriod('week');
      }
      setErrorMsg(null);
      setPhotoError(null);
    }
  }, [currentUser, isOpen, editingItem]);

  if (!isOpen) return null;

  // Not Authenticated Guard
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 text-slate-100 shadow-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-white">Student Sign-In Required</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Please sign in with your Sri Vasavi Engineering College student account to list electronics and project kits.
          </p>
          <button
            onClick={() => {
              onClose();
              onOpenAuth('signin');
            }}
            className="w-full py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl"
          >
            Sign in with Sri Vasavi Credentials →
          </button>
        </div>
      </div>
    );
  }

  // 1st Year Restriction Rule
  if (currentUser.year === '1st Year') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-4">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">1st-Year Student Notice</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Per Circuit2Circuit marketplace rules, 1st-year students can borrow, rent, swap, or request donations from seniors. Listing items is reserved for 2nd & 3rd years (rentals, swaps, donations) and graduating 4th years (sales, swaps, donations).
          </p>
          <button onClick={onClose} className="w-full py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl">
            Browse Campus Listings
          </button>
        </div>
      </div>
    );
  }

  // Compression helper
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawResult = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const MAX_DIM = 1200;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(rawResult);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(rawResult);
        img.src = rawResult;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPhotoError(null);
    setUploadingPhoto(true);

    try {
      const newUrls = [...photoUrls];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const base64Data = await compressImageFile(file);
        const res = await api.uploadPhoto(base64Data);
        if (res.photoUrl) newUrls.push(res.photoUrl);
      }
      setPhotoUrls(newUrls);
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleTransactionChange = (type: TransactionType) => {
    const check = validateListingPermissions(currentUser.year, type);
    if (!check.isAllowed) {
      setErrorMsg(check.message);
      return;
    }
    setErrorMsg(null);
    setTransactionType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const check = validateListingPermissions(currentUser.year, transactionType);
    if (!check.isAllowed) {
      setErrorMsg(check.message);
      return;
    }

    let iconType: ComponentItem['iconType'] = isProjectKit ? 'kit' : 'microcontroller';
    if (!isProjectKit) {
      if (category === 'sensors') iconType = 'sensor';
      else if (category === 'passives') iconType = 'passive';
      else if (category === 'prototyping') iconType = 'breadboard';
      else if (category === 'power_motors') iconType = 'motor';
    }

    const categoryLabels: Record<ComponentCategory, string> = {
      microcontrollers: 'Microcontrollers',
      sensors: 'Sensors & Modules',
      passives: 'Passive Components',
      prototyping: 'Prototyping & Lab Tools',
      power_motors: 'Power & Motors',
      project_kits: 'Project Kits',
    };

    let priceNum = 0;
    let samplePriceStr = 'Free (Donation)';

    if (transactionType === 'sell') {
      priceNum = parseInt(sellingPrice, 10) || 0;
      samplePriceStr = `₹${priceNum}`;
    } else if (transactionType === 'rent') {
      priceNum = parseInt(rentalRate, 10) || 0;
      samplePriceStr = `₹${priceNum} / ${rentalPeriod}`;
    } else if (transactionType === 'swap') {
      samplePriceStr = `Swap: ${swapWishlist.trim() || 'Equal Value Sensor'}`;
    }

    // Construct Project Kit Details
    let kitDetailsObj: ProjectKitDetails | undefined = undefined;
    if (isProjectKit) {
      const partsArr = kitParts
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => ({ name: p, qty: 1, tested: true }));

      kitDetailsObj = {
        partsList: partsArr.length > 0 ? partsArr : [{ name: name, qty: 1, tested: true }],
        compatibility: kitCompatibility.trim() || 'Compatible with Arduino IDE 2.x & 5V/3.3V power',
        setupInstructions: kitSetupInstructions.trim() || 'Connect components as labeled and flash sample sketch.',
        sampleCode: kitSampleCode.trim() || undefined,
        targetDomain: kitDomain.trim() || 'Embedded Systems & IoT',
      };
    }

    const payload = {
      name: name.trim(),
      category: isProjectKit ? 'project_kits' : category,
      categoryLabel: isProjectKit ? 'Project Kits' : categoryLabels[category],
      transactionType,
      samplePrice: samplePriceStr,
      priceNumeric: priceNum,
      originalPriceNumeric: transactionType === 'sell' && originalPrice ? parseInt(originalPrice, 10) : undefined,
      depositAmount: transactionType === 'rent' ? parseInt(depositAmount, 10) || 0 : undefined,
      rentalPeriod: transactionType === 'rent' ? rentalPeriod : undefined,
      condition,
      pickupLocation: pickupLocation.trim(),
      description: description.trim() || 'Tested hardware ready for peer campus exchange at Sri Vasavi Engineering College.',
      specs: specs.split(',').map((s) => s.trim()).filter(Boolean),
      recommendedLabs: recommendedLabs.split(',').map((l) => l.trim()).filter(Boolean),
      targetYears: targetYears.length > 0 ? targetYears : ['All Years'],
      iconType,
      photoUrl: photoUrls[0] || undefined,
      photoUrls,
      isProjectKit,
      kitDetails: kitDetailsObj,
      testingPeriodHours: 48,
    };

    setSubmitting(true);
    try {
      if (editingItem) {
        const res = await api.updateListing(editingItem.id, payload);
        onAddItem(res.listing);
      } else {
        const res = await api.createListing(payload);
        onAddItem(res.listing);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-7 space-y-4 text-slate-100 my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            {editingItem ? 'Edit Marketplace Listing' : 'List Hardware / Project Kit'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Peer hardware exchange for Sri Vasavi Engineering College ({currentUser.name} • {currentUser.rollNumber})
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Project Kit Toggle */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-white block">Complete Pre-Tested Project Kit?</span>
                <span className="text-[11px] text-slate-400">Bundle sensors, boards, wiring diagrams, and sample code together</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isProjectKit}
                onChange={(e) => setIsProjectKit(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-400"></div>
            </label>
          </div>

          {/* Component Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-200">
                {isProjectKit ? 'Project Kit Title' : 'Component Name'}
              </label>
              <input
                type="text"
                required
                placeholder={isProjectKit ? 'e.g. Smart IoT Weather Station Kit' : 'e.g. Arduino Uno R3'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            {!isProjectKit && (
              <div>
                <label className="block font-semibold mb-1 text-slate-200">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="microcontrollers">Microcontrollers</option>
                  <option value="sensors">Sensors & Modules</option>
                  <option value="prototyping">Breadboards & Prototyping</option>
                  <option value="passives">Passive Components & ICs</option>
                  <option value="power_motors">Motors & Power</option>
                </select>
              </div>
            )}
          </div>

          {/* Transaction Type Selector: Rent, Sell, Swap, Donate */}
          <div>
            <label className="block font-semibold mb-1.5 text-slate-200">Exchange Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleTransactionChange('rent')}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  transactionType === 'rent'
                    ? 'bg-sky-950 text-sky-300 border-sky-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                For Rent
              </button>

              <button
                type="button"
                onClick={() => handleTransactionChange('donate')}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  transactionType === 'donate'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Free Donation
              </button>

              <button
                type="button"
                onClick={() => handleTransactionChange('swap')}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  transactionType === 'swap'
                    ? 'bg-amber-950 text-amber-300 border-amber-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Component Swap
              </button>

              <button
                type="button"
                onClick={() => handleTransactionChange('sell')}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  transactionType === 'sell'
                    ? 'bg-violet-950 text-violet-300 border-violet-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                For Sale {currentUser.year === '4th Year' ? '(Senior)' : ''}
              </button>
            </div>
          </div>

          {/* Dynamic Pricing / Rent / Swap Details */}
          {transactionType === 'rent' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">Rent Rate (₹)</label>
                <input
                  type="number"
                  min="5"
                  value={rentalRate}
                  onChange={(e) => setRentalRate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Rental Period</label>
                <select
                  value={rentalPeriod}
                  onChange={(e) => setRentalPeriod(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                >
                  <option value="day">per day</option>
                  <option value="week">per week</option>
                  <option value="month">per month</option>
                  <option value="semester">per semester</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Refundable Deposit (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </div>
            </div>
          )}

          {transactionType === 'sell' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  min="10"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Original Price (₹)</label>
                <input
                  type="number"
                  min="10"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </div>
            </div>
          )}

          {transactionType === 'swap' && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <label className="block text-slate-400 mb-1">What hardware would you like in exchange?</label>
              <input
                type="text"
                placeholder="e.g. ESP32 NodeMCU, MPU6050 Accelerometer, or 1602 I2C Display"
                value={swapWishlist}
                onChange={(e) => setSwapWishlist(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
              />
            </div>
          )}

          {/* PROJECT KIT EXTRA FIELDS */}
          {isProjectKit && (
            <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-3">
              <span className="font-bold text-emerald-400 block">Kit Specifications & Code</span>
              <div>
                <label className="block text-slate-400 mb-1">Parts Checklist (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. ESP32 (qty 1), DHT11 (qty 1), OLED 0.96 (qty 1), 400-tie Breadboard (qty 1)"
                  value={kitParts}
                  onChange={(e) => setKitParts(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Compatibility & Power</label>
                  <input
                    type="text"
                    value={kitCompatibility}
                    onChange={(e) => setKitCompatibility(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Target Tech Domain</label>
                  <input
                    type="text"
                    value={kitDomain}
                    onChange={(e) => setKitDomain(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Setup Instructions</label>
                <textarea
                  rows={2}
                  value={kitSetupInstructions}
                  onChange={(e) => setKitSetupInstructions(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tested Working Code Snippet</label>
                <textarea
                  rows={3}
                  placeholder="// Paste working Arduino sketch..."
                  value={kitSampleCode}
                  onChange={(e) => setKitSampleCode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-emerald-300 text-[11px]"
                />
              </div>
            </div>
          )}

          {/* Condition & Pickup Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-200">Hardware Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              >
                <option value="Brand New / Sealed">Brand New / Sealed</option>
                <option value="Like New (1 Lab Session)">Like New (1 Lab Session)</option>
                <option value="Gently Used (Tested OK)">Gently Used (Tested OK)</option>
                <option value="Functional Spares">Functional Spares</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-200">Campus Meeting Location</label>
              <select
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              >
                {CAMPUS_MEETING_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Photo Upload Zone */}
          <div>
            <label className="block font-semibold mb-1 text-slate-200">Item Photos</label>
            <div className="flex items-center gap-3">
              <label className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 flex items-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{uploadingPhoto ? 'Uploading...' : 'Upload Real Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-slate-400 text-[11px]">Real hardware photos build student trust</span>
            </div>

            {photoUrls.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto py-1">
                {photoUrls.map((url, idx) => (
                  <div key={idx} className="relative group w-14 h-14 shrink-0">
                    <img src={url} alt="upload" className="w-full h-full object-cover rounded-lg border border-slate-800" />
                    <button
                      type="button"
                      onClick={() => setPhotoUrls(photoUrls.filter((_, i) => i !== idx))}
                      className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow-md"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold mb-1 text-slate-200">Description</label>
            <textarea
              rows={2}
              required
              placeholder="Include details about lab usage, pin conditions, or what lab experiments this was used for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-950/40"
            >
              {submitting ? 'Publishing...' : editingItem ? 'Save Changes' : 'Publish Listing'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
