export type TransactionType = 'rent' | 'donate' | 'sell' | 'swap';

export type ListingStatus = 'available' | 'reserved' | 'rented' | 'returned' | 'sold' | 'donated';

export type ComponentCategory = 
  | 'microcontrollers' 
  | 'sensors' 
  | 'passives' 
  | 'prototyping' 
  | 'power_motors'
  | 'project_kits';

export type BTechYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | 'All Years';

export interface StudentUser {
  id: string;
  name: string;
  email: string;      // Official domain: @srivasaviengg.ac.in
  rollNumber: string; // e.g. "25A81A4300" (Sri Vasavi Engineering College format)
  branch: string;     // e.g. "Computer Science & Engineering (CSE)"
  mobile: string;     // 10 digits
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  shareMobilePublicly: boolean; // default false, kept private unless student opts in
  role?: 'student' | 'admin';
  isVerified?: boolean;
  createdAt: string;
}

export interface ProjectKitPart {
  name: string;
  qty: number;
  tested: boolean;
}

export interface ProjectKitDetails {
  partsList: ProjectKitPart[];
  compatibility: string;
  setupInstructions: string;
  wiringDiagramUrl?: string;
  sampleCode?: string;
  targetDomain?: string; // e.g., 'IoT & Sensor Systems', 'Robotics & Automation', 'Embedded Controllers'
}

export interface ComponentItem {
  id: string;
  name: string;
  category: ComponentCategory;
  categoryLabel: string;
  transactionType: TransactionType;
  samplePrice: string; // e.g. "₹40 / week" or "Free (Donation)" or "₹280" or "Swap with ESP32"
  priceNumeric: number;
  condition: 'Brand New / Sealed' | 'Like New (1 Lab Session)' | 'Gently Used (Tested OK)' | 'Functional Spares';
  sellerId?: string;
  sellerName: string;
  sellerRollNumber: string; // Displayed on listings
  sellerYear: string;
  sellerDept: string;
  sellerMobile?: string; // Only populated if seller shared mobile publicly!
  sellerShareMobile: boolean;
  sellerEmail?: string;
  pickupLocation: string;
  description: string;
  specs: string[];
  recommendedLabs: string[];
  targetYears: BTechYear[];
  isAvailable: boolean;
  status: ListingStatus; // 'available' | 'reserved' | 'rented' | 'returned' | 'sold' | 'donated'
  dateListed: string;
  iconType: 'microcontroller' | 'sensor' | 'breadboard' | 'wires' | 'passive' | 'motor' | 'multimeter' | 'display' | 'kit';
  photoUrl?: string;
  photoUrls?: string[];
  originalPriceNumeric?: number;
  depositAmount?: number; // Refundable security deposit for rentals
  rentalPeriod?: 'day' | 'week' | 'month' | 'semester';
  testingPeriodHours?: number; // 48 hours component test window
  isProjectKit?: boolean;
  kitDetails?: ProjectKitDetails;
  handoverStatus?: 'ready_for_handover' | 'in_testing_window' | 'completed' | 'disputed';
  weightGrams?: number; // For verified e-waste calculations
  isSample?: boolean; // Indicates sample / demo dataset item
}

export interface TransactionRecord {
  id: string;
  listingId: string;
  listingName: string;
  transactionType: TransactionType;
  priceNumeric: number;
  depositAmount?: number;
  sellerId: string;
  sellerName: string;
  sellerRoll: string;
  buyerId: string;
  buyerName: string;
  buyerRoll: string;
  status: 'reserved' | 'in_testing_48h' | 'completed' | 'disputed' | 'refunded' | 'returned';
  handoverLocation: string;
  testWindowExpiresAt?: string; // ISO date (48 hours after handover)
  disputeReason?: string;
  disputeResolution?: string;
  originalPriceNumeric?: number;
  weightGrams?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentCareGuide {
  id: string;
  title: string;
  category: 'pin_connections' | 'troubleshooting' | 'sample_code' | 'kit_setup';
  componentOrKit: string;
  authorName: string;
  authorRoll: string;
  authorBranch: string;
  authorYear: string;
  summary: string;
  pinoutNotes?: string;
  troubleshootingTips: string[];
  sampleCode?: string;
  upvotes: number;
  upvotedBy?: string[];
  createdAt: string;
}

export interface StudentCareRequest {
  id: string;
  title: string;
  componentNeededOrIssue: string;
  studentName: string;
  studentRoll: string;
  studentBranch: string;
  studentYear: string;
  urgency: 'low' | 'medium' | 'high';
  labName?: string;
  status: 'open' | 'answered' | 'resolved';
  answers: {
    id: string;
    responderName: string;
    responderRoll: string;
    responderYear: string;
    answerText: string;
    sampleCodeSnippet?: string;
    createdAt: string;
  }[];
  createdAt: string;
}

export interface EcoImpactMetrics {
  totalCompletedTransactions: number;
  totalSavedRupees: number;
  totalEwasteAvoidedKg: number;
  activeRentalsCount: number;
  activeDonationsCount: number;
  reusableComponentsInCirculation: number;
  methodology: {
    ewasteFormula: string;
    savingsFormula: string;
    verificationCriteria: string;
  };
  branchBreakdown: {
    branch: string;
    transactions: number;
    eWasteAvoidedGrams: number;
    savedRupees: number;
  }[];
}

export interface LeaderboardEntry {
  rank: number;
  maskedName: string;     // e.g. "Kavya R."
  maskedRoll: string;     // e.g. "21A81A04**"
  branch: string;         // e.g. "ECE"
  year: string;           // e.g. "4th Year"
  recirculatedCount: number;
  eWasteAvoidedGrams: number;
  badge: string;          // e.g. "Eco Champion", "Lab Sustainer", "Hardware Mentor"
}

export interface ItemRequest {
  id: string;
  itemId: string;
  itemName: string;
  itemTransactionType: TransactionType;
  samplePrice: string;
  sellerId?: string;
  sellerName: string;
  sellerRollNumber: string;
  requesterId: string;
  requesterName: string;
  requesterRollNumber: string;
  requesterBranch: string;
  requesterYear: string;
  requesterMobile: string;
  preferredTime: string;
  handoverLocation?: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'disputed';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRollNumber: string;
  text: string;
  type?: 'text' | 'phone_share' | 'offer' | 'location_suggest' | 'system';
  sharedPhone?: string;
  offerAmount?: string;
  suggestedLocation?: string;
  createdAt: string;
  readBy: string[];
}

export interface Conversation {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPrice: string;
  listingTransactionType: TransactionType;
  listingCategory: string;
  listingIconType: ComponentItem['iconType'];
  sellerId: string;
  sellerName: string;
  sellerRollNumber: string;
  sellerBranch: string;
  buyerId: string;
  buyerName: string;
  buyerRollNumber: string;
  buyerBranch: string;
  buyerYear: string;
  lastMessageText: string;
  lastMessageAt: string;
  isBlocked?: boolean;
  blockedBy?: string;
  reportCount?: number;
  unreadCount?: number; // Calculated dynamically for current user
  handoverLocation?: string;
  transactionState?: 'negotiating' | 'handover_scheduled' | 'testing_48h' | 'completed' | 'disputed';
  createdAt: string;
}

export interface NewListingFormData {
  name: string;
  category: ComponentCategory;
  transactionType: TransactionType;
  samplePrice: string;
  priceNumeric: number;
  originalPriceNumeric?: number;
  depositAmount?: number;
  condition: ComponentItem['condition'];
  sellerName: string;
  sellerYear: string;
  sellerDept: string;
  pickupLocation: string;
  description: string;
  specs: string;
  recommendedLabs: string;
  targetYears: BTechYear[];
  isProjectKit?: boolean;
  kitParts?: string;
  kitCompatibility?: string;
  kitSetup?: string;
  kitWiringNotes?: string;
  kitSampleCode?: string;
}
