import React, { useState, useEffect } from 'react';
import { ComponentItem, ComponentCategory, TransactionType, BTechYear, StudentUser } from '../types';
import { X, PlusCircle, AlertCircle, ShieldCheck, Lock, Info, Upload, Trash2, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { validateListingPermissions } from '../utils/validation';
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
  const [rentalPeriod, setRentalPeriod] = useState<'day' | 'week' | 'month' | 'semester'>('week');

  const [condition, setCondition] = useState<ComponentItem['condition']>('Like New (1 Lab Session)');
  const [pickupLocation, setPickupLocation] = useState('ECE Department Ground Floor Foyer');
  const [description, setDescription] = useState('');
  const [specs, setSpecs] = useState('5V Operating Voltage, Pins Intact, Tested OK');
  const [recommendedLabs, setRecommendedLabs] = useState('Microcontroller Lab, Mini Projects');
  const [targetYears, setTargetYears] = useState<BTechYear[]>(['1st Year', '2nd Year', '3rd Year']);
  
  // Photo Upload States
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Populate form if editing or initial state
  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setCategory(editingItem.category);
      setTransactionType(editingItem.transactionType);
      setSellingPrice(String(editingItem.priceNumeric || 250));
      setOriginalPrice(editingItem.originalPriceNumeric ? String(editingItem.originalPriceNumeric) : '');
      setRentalRate(String(editingItem.priceNumeric || 40));
      setRentalPeriod(editingItem.rentalPeriod || 'week');
      setCondition(editingItem.condition);
      setPickupLocation(editingItem.pickupLocation);
      setDescription(editingItem.description);
      setSpecs(editingItem.specs.join(', '));
      setRecommendedLabs(editingItem.recommendedLabs.join(', '));
      setTargetYears(editingItem.targetYears as BTechYear[]);
      setPhotoUrls(editingItem.photoUrls || (editingItem.photoUrl ? [editingItem.photoUrl] : []));
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

  // 1. Not Authenticated State
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
        <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 p-6 sm:p-8 space-y-5 text-slate-100 backdrop-blur-xl">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-extrabold text-white tracking-tight">Student Sign-In Required</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              To list lab components, please sign in with your Sri Vasavi Engineering College student account so other students can verify your roll number on campus.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400">
            <span>Sri Vasavi Engineering College (Tadepalligudem) student exchange.</span>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => {
                onClose();
                onOpenAuth('signin');
              }}
              className="w-full py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Sign In with Roll Number →
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAuth('register');
              }}
              className="w-full py-2.5 text-xs font-semibold text-violet-300 hover:bg-violet-900/60 bg-violet-950/60 border border-violet-800/60 rounded-xl transition-colors cursor-pointer"
            >
              Create New Student Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. 1st Year Rule Check State
  if (currentUser.year === '1st Year') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
        <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 p-6 sm:p-8 space-y-5 text-slate-100 backdrop-blur-xl">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-violet-950/80 border border-violet-800/60 flex items-center justify-center text-violet-400">
            <Info className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-violet-950/80 border border-violet-800/60 text-violet-300">
                1st Year Student
              </span>
              <span className="text-xs text-slate-400 font-mono">{currentUser.rollNumber}</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Marketplace Rule Notice</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              As a <strong>1st-year student</strong>, you are eligible to <strong>browse, rent, and receive free donations</strong> from senior students for your Basic Electrical & Physics labs.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-200">Campus Listing Guidelines:</p>
            <p>• <strong>2nd & 3rd Years:</strong> Can list components for <em>Rent</em> or <em>Donation</em>.</p>
            <p>• <strong>4th Years:</strong> Can list components for <em>Sale</em> or <em>Donation</em>.</p>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer"
            >
              Browse Available Components →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Photo Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setPhotoError(null);
    setUploadingPhoto(true);

    try {
      const newUrls: string[] = [...photoUrls];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setPhotoError(`File "${file.name}" exceeds 5MB limit.`);
          continue;
        }

        // Convert file to base64 data URL
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);

        const base64Data = await base64Promise;
        const uploadRes = await api.uploadPhoto(base64Data);
        if (uploadRes.photoUrl) {
          newUrls.push(uploadRes.photoUrl);
        }
      }
      setPhotoUrls(newUrls);
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotoUrls(photoUrls.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle deal type selection with year constraints
  const handleTransactionChange = (type: TransactionType) => {
    const check = validateListingPermissions(currentUser.year, type);
    if (!check.isAllowed) {
      setErrorMsg(check.message);
      return;
    }
    setErrorMsg(null);
    setTransactionType(type);
  };

  const handleYearToggle = (yr: BTechYear) => {
    if (targetYears.includes(yr)) {
      setTargetYears(targetYears.filter((y) => y !== yr));
    } else {
      setTargetYears([...targetYears, yr]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Double check rules
    const check = validateListingPermissions(currentUser.year, transactionType);
    if (!check.isAllowed) {
      setErrorMsg(check.message);
      return;
    }

    let iconType: ComponentItem['iconType'] = 'microcontroller';
    if (category === 'sensors') iconType = 'sensor';
    else if (category === 'passives') iconType = 'passive';
    else if (category === 'prototyping') iconType = 'breadboard';
    else if (category === 'power_motors') iconType = 'motor';

    const categoryLabels: Record<ComponentCategory, string> = {
      microcontrollers: 'Microcontrollers',
      sensors: 'Sensors & Modules',
      passives: 'Passive Components',
      prototyping: 'Prototyping & Lab Tools',
      power_motors: 'Power & Motors',
    };

    let priceNum = 0;
    let samplePriceStr = 'Free (Donation)';

    if (transactionType === 'sell') {
      priceNum = parseInt(sellingPrice, 10) || 0;
      samplePriceStr = `₹${priceNum}`;
    } else if (transactionType === 'rent') {
      priceNum = parseInt(rentalRate, 10) || 0;
      samplePriceStr = `₹${priceNum} / ${rentalPeriod}`;
    }

    const payload = {
      name: name.trim(),
      category,
      categoryLabel: categoryLabels[category],
      transactionType,
      samplePrice: samplePriceStr,
      priceNumeric: priceNum,
      originalPriceNumeric: transactionType === 'sell' && originalPrice ? parseInt(originalPrice, 10) : undefined,
      rentalPeriod: transactionType === 'rent' ? rentalPeriod : undefined,
      condition,
      pickupLocation: pickupLocation.trim(),
      description: description.trim() || 'Component tested and ready for campus student handover.',
      specs: specs.split(',').map((s) => s.trim()).filter(Boolean),
      recommendedLabs: recommendedLabs.split(',').map((l) => l.trim()).filter(Boolean),
      targetYears: targetYears.length > 0 ? targetYears : ['All Years'],
      iconType,
      photoUrl: photoUrls[0] || undefined,
      photoUrls,
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
      setErrorMsg(err.message || 'Failed to publish component listing.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate savings percentage preview for Sale items
  const selNum = parseInt(sellingPrice, 10) || 0;
  const origNum = parseInt(originalPrice, 10) || 0;
  const showSavings = transactionType === 'sell' && origNum > selNum && selNum > 0;
  const savingsPct = showSavings ? Math.round(((origNum - selNum) / origNum) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 p-6 sm:p-8 space-y-6 text-slate-100 my-8 max-h-[92vh] overflow-y-auto backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-xs font-mono font-bold text-emerald-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sri Vasavi Engineering College · {currentUser.year}</span>
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {editingItem ? 'Edit Component Listing' : '＋ Add a Component Listing'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Seller profile: <strong className="text-white font-bold">{currentUser.name}</strong> ({currentUser.rollNumber} · {currentUser.branch})
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Listing Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Component Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-200 font-bold block">
                Component Name & Model *
              </label>
              <span className="text-[10px] text-violet-400 font-mono">
                💡 Autocomplete active (Try "ultra", "dht", "pir", "soil", "uno")
              </span>
            </div>
            <SensorAutocomplete
              required
              value={name}
              onChange={(val) => setName(val)}
              onSelectVerified={(sensor) => {
                setName(sensor.name);
                setCategory(sensor.category);
                if (sensor.defaultSpecs && sensor.defaultSpecs.length > 0) {
                  setSpecs(sensor.defaultSpecs.join(', '));
                }
                if (sensor.defaultLabs && sensor.defaultLabs.length > 0) {
                  setRecommendedLabs(sensor.defaultLabs.join(', '));
                }
                if (!description || description.trim() === '') {
                  setDescription(sensor.defaultDescription);
                }
              }}
              placeholder="e.g. HC-SR04 Ultrasonic Sensor, DHT11 Temperature Sensor..."
            />
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-2 p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-bold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Upload Item Photos</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {photoUrls.length > 0 ? `${photoUrls.length} photo(s) selected` : 'Max 5MB per photo'}
              </span>
            </div>

            {/* Photo Previews */}
            {photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 py-2">
                {photoUrls.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl border border-slate-800 overflow-hidden bg-slate-950 shadow-md group">
                    <img src={url} alt={`Upload preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-slate-950/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                      title="Remove photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-emerald-500 text-slate-950 text-[9px] font-bold px-1 rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* File Input trigger button */}
            <label className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 border border-dashed border-slate-700 hover:border-emerald-400 rounded-xl cursor-pointer text-slate-300 hover:text-emerald-300 transition-colors">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-xs">
                {uploadingPhoto ? 'Processing photo upload...' : 'Click or drop real item photos here'}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={uploadingPhoto}
                className="hidden"
              />
            </label>

            {photoError && (
              <span className="text-[11px] text-rose-400 font-medium block">{photoError}</span>
            )}
            <span className="text-[10px] text-slate-400 block">
              *Upload real photos of your specific lab component. If no photo is uploaded, <strong>Photo unavailable</strong> will be displayed.
            </span>
          </div>

          {/* Transaction Mode Selector Enforcing Year Rules */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-200 font-bold block">
                Listing Mode (Enforced for {currentUser.year}) *
              </label>
              <span className="text-[11px] text-slate-400">
                {currentUser.year === '4th Year'
                  ? '4th Years: Sell or Donate'
                  : '2nd & 3rd Years: Rent or Donate'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Rent Button */}
              <button
                type="button"
                disabled={currentUser.year === '4th Year'}
                onClick={() => handleTransactionChange('rent')}
                className={`py-2.5 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  transactionType === 'rent'
                    ? 'bg-sky-950/80 border-sky-500/80 text-sky-300 shadow-md shadow-sky-950/40'
                    : currentUser.year === '4th Year'
                    ? 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                For Rent
              </button>

              {/* Sell Button */}
              <button
                type="button"
                disabled={currentUser.year !== '4th Year'}
                onClick={() => handleTransactionChange('sell')}
                className={`py-2.5 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  transactionType === 'sell'
                    ? 'bg-blue-950/80 border-blue-500/80 text-blue-300 shadow-md shadow-blue-950/40'
                    : currentUser.year !== '4th Year'
                    ? 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                For Sale (4th Years)
              </button>

              {/* Free Donation Button */}
              <button
                type="button"
                onClick={() => handleTransactionChange('donate')}
                className={`py-2.5 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  transactionType === 'donate'
                    ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                Free Donation
              </button>
            </div>
          </div>

          {/* Price & Rates Configuration */}
          {transactionType === 'sell' && (
            <div className="p-4 bg-blue-950/40 border border-blue-800/60 rounded-xl space-y-3">
              <span className="text-xs font-bold text-blue-300 block">Sale Price Details (4th Year Liquidations)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-200 font-semibold block mb-1">
                    Original / Retail Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-hidden focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">What you originally paid when new</span>
                </div>

                <div>
                  <label className="text-slate-200 font-semibold block mb-1">
                    Second-Hand Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 250"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono font-bold focus:outline-hidden focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Your student resale price</span>
                </div>
              </div>

              {showSavings && (
                <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Buyer Savings Preview: {savingsPct}% OFF (Original ₹{origNum} → Selling ₹{selNum})</span>
                </div>
              )}
            </div>
          )}

          {transactionType === 'rent' && (
            <div className="p-4 bg-sky-950/40 border border-sky-800/60 rounded-xl space-y-3">
              <span className="text-xs font-bold text-sky-300 block">Rental Rate Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-200 font-semibold block mb-1">
                    Rental Rate (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 40"
                    value={rentalRate}
                    onChange={(e) => setRentalRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono font-bold focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-200 font-semibold block mb-1">
                    Rental Period *
                  </label>
                  <select
                    value={rentalPeriod}
                    onChange={(e) => setRentalPeriod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-hidden focus:border-sky-500 cursor-pointer"
                  >
                    <option value="day" className="bg-slate-900 text-white">per day</option>
                    <option value="week" className="bg-slate-900 text-white">per week</option>
                    <option value="month" className="bg-slate-900 text-white">per month</option>
                    <option value="semester" className="bg-slate-900 text-white">per semester</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {transactionType === 'donate' && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 font-medium">
              🎁 Listing is marked as <strong>Free (Donation)</strong> for junior students.
            </div>
          )}

          {/* Category & Condition Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-200 font-bold block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                <option value="microcontrollers" className="bg-slate-900 text-white">Microcontrollers & Dev Boards</option>
                <option value="sensors" className="bg-slate-900 text-white">Sensors & Modules</option>
                <option value="passives" className="bg-slate-900 text-white">Passive Components & ICs</option>
                <option value="prototyping" className="bg-slate-900 text-white">Prototyping & Lab Tools</option>
                <option value="power_motors" className="bg-slate-900 text-white">Power Supplies & Motors</option>
              </select>
            </div>

            <div>
              <label className="text-slate-200 font-bold block mb-1">
                Component Condition *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                <option value="Brand New / Sealed" className="bg-slate-900 text-white">Brand New / Sealed</option>
                <option value="Like New (1 Lab Session)" className="bg-slate-900 text-white">Like New (1 Lab Session)</option>
                <option value="Gently Used (Tested OK)" className="bg-slate-900 text-white">Gently Used (Tested OK)</option>
                <option value="Functional Spares" className="bg-slate-900 text-white">Functional Spares</option>
              </select>
            </div>
          </div>

          {/* Target Years */}
          <div>
            <label className="text-slate-200 font-bold block mb-1">
              Target Junior Years
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {(['1st Year', '2nd Year', '3rd Year', '4th Year'] as BTechYear[]).map((yr) => (
                <button
                  type="button"
                  key={yr}
                  onClick={() => handleYearToggle(yr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                    targetYears.includes(yr)
                      ? 'bg-violet-950/80 border-violet-500/80 text-violet-300 font-bold shadow-xs'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Campus Handover Spot */}
          <div>
            <label className="text-slate-200 font-bold block mb-1">
              Campus Handover Location *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ECE Ground Floor Foyer, Central Library Entrance, Canteen..."
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Description & Labs */}
          <div>
            <label className="text-slate-200 font-bold block mb-1">
              Description & Notes for Students
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Used for our 3rd sem lab. All pins tested and working..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 min-h-[44px] text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 min-h-[44px] text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 text-center flex items-center justify-center"
            >
              {submitting ? 'Publishing...' : (editingItem ? 'Save Changes' : '＋ Publish Component Listing')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
