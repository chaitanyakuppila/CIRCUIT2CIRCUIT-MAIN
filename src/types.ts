export type TransactionType = 'rent' | 'donate' | 'sell';

export type ComponentCategory = 
  | 'microcontrollers' 
  | 'sensors' 
  | 'passives' 
  | 'prototyping' 
  | 'power_motors';

export type BTechYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | 'All Years';

export interface StudentUser {
  id: string;
  name: string;
  rollNumber: string; // e.g. "25A81A4300" (Sri Vasavi Engineering College format)
  branch: string;     // e.g. "Computer Science & Engineering (CSE)"
  mobile: string;     // 10 digits
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  shareMobilePublicly: boolean; // default false, kept private unless student opts in
  createdAt: string;
}

export interface ComponentItem {
  id: string;
  name: string;
  category: ComponentCategory;
  categoryLabel: string;
  transactionType: TransactionType;
  samplePrice: string; // e.g. "₹40 / week (sample)" or "Free (Donation)" or "₹280 (sample)"
  priceNumeric: number;
  condition: 'Brand New / Sealed' | 'Like New (1 Lab Session)' | 'Gently Used (Tested OK)' | 'Functional Spares';
  sellerId?: string;
  sellerName: string;
  sellerRollNumber: string; // Displayed on listings
  sellerYear: string;
  sellerDept: string;
  sellerMobile?: string; // Only populated if seller shared mobile publicly!
  sellerShareMobile: boolean;
  pickupLocation: string;
  description: string;
  specs: string[];
  recommendedLabs: string[];
  targetYears: BTechYear[];
  isAvailable: boolean;
  dateListed: string;
  iconType: 'microcontroller' | 'sensor' | 'breadboard' | 'wires' | 'passive' | 'motor' | 'multimeter' | 'display';
  photoUrl?: string;
  photoUrls?: string[];
  originalPriceNumeric?: number;
  rentalPeriod?: 'day' | 'week' | 'month' | 'semester';
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
  notes?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRollNumber: string;
  text: string;
  type?: 'text' | 'phone_share' | 'offer' | 'system';
  sharedPhone?: string;
  offerAmount?: string;
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
  createdAt: string;
}

export interface NewListingFormData {
  name: string;
  category: ComponentCategory;
  transactionType: TransactionType;
  samplePrice: string;
  priceNumeric: number;
  condition: ComponentItem['condition'];
  sellerName: string;
  sellerYear: string;
  sellerDept: string;
  pickupLocation: string;
  description: string;
  specs: string;
  recommendedLabs: string;
  targetYears: BTechYear[];
}
