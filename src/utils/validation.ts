/**
 * Validation rules and college configurations for Sri Vasavi Engineering College.
 */

export const SRI_VASAVI_COLLEGE_NAME = 'Sri Vasavi Engineering College';
export const SRI_VASAVI_COLLEGE_CODE = 'A8';
export const OFFICIAL_EMAIL_DOMAIN = 'srivasaviengg.ac.in';

// Configurable branches list for Sri Vasavi Engineering College
export const DEFAULT_BRANCHES = [
  'Artificial Intelligence & Data Science (AI & DS)',
  'Artificial Intelligence & Machine Learning (AI & ML)',
  'Computer Science & Engineering (CSE)',
  'Computer Science & Technology (CST)',
  'Computer Science and Artificial Intelligence (CAI)',
  'Electronics & Communication Engineering (ECE)',
  'Electrical & Electronics Engineering (EEE)',
  'Information Technology (IT)',
  'Mechanical Engineering (MECH)',
  'Civil Engineering (CIVIL)',
];

// Predefined safe campus meeting locations across Sri Vasavi Engineering College
export const CAMPUS_MEETING_LOCATIONS = [
  'Central Library - Ground Floor Discussion Area',
  'ECE Dept - IoT & Embedded Systems Lab (Block B, 2nd Floor)',
  'EEE Dept - Electrical Machines & Power Lab (Block C)',
  'CSE Dept - AI & Project Innovation Lab (Block A, 1st Floor)',
  'Mechanical Workshop & Fabrication Plaza',
  'Student Canteen Central Plaza',
  'Admin Block Student Helpdesk Foyer',
];

/**
 * Validates official Sri Vasavi Engineering College email address.
 * Allowed domain: @srivasaviengg.ac.in
 * Example: "25a81a4300@srivasaviengg.ac.in" or "praveen.k@srivasaviengg.ac.in"
 */
export function validateVasaviEmail(rawEmail: string): { isValid: boolean; normalized: string; error?: string } {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { isValid: false, normalized: '', error: 'Official college email is required.' };
  }

  const normalized = rawEmail.trim().toLowerCase();

  // Basic email pattern check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalized)) {
    return {
      isValid: false,
      normalized,
      error: 'Please enter a valid email address format (e.g., 25a81a4300@srivasaviengg.ac.in).'
    };
  }

  // Strict domain enforcement: must end with @srivasaviengg.ac.in
  if (!normalized.endsWith(`@${OFFICIAL_EMAIL_DOMAIN}`)) {
    return {
      isValid: false,
      normalized,
      error: `Registration is restricted to verified Sri Vasavi Engineering College students. Email must end with @${OFFICIAL_EMAIL_DOMAIN}.`
    };
  }

  return { isValid: true, normalized };
}

/**
 * Validates Sri Vasavi Engineering College roll number format.
 * Format: 2 digits year + 'A8' (College Code) + '1A' (Regular) or '5A' (Lateral) + 2 alphanumeric branch + 2 alphanumeric roll
 * Total: 10 alphanumeric characters.
 * Example from user prompt: "25A81A4300"
 */
export function validateVasaviRollNumber(rawRoll: string): { isValid: boolean; normalized: string; error?: string } {
  if (!rawRoll || typeof rawRoll !== 'string') {
    return { isValid: false, normalized: '', error: 'Roll number is required.' };
  }

  const normalized = rawRoll.trim().toUpperCase();

  if (normalized.length !== 10) {
    return {
      isValid: false,
      normalized,
      error: `Roll number must be exactly 10 characters long (e.g., 25A81A4300). Received ${normalized.length} characters.`
    };
  }

  // Regex checks:
  // ^\d{2}      -> 2 digits admission year (e.g. 21, 22, 23, 24, 25, 26)
  // A8          -> Sri Vasavi Engineering College code
  // (1A|5A)     -> 1A for regular B.Tech admission, 5A for lateral entry
  // [0-9A-Z]{2} -> 2 char branch code
  // [0-9A-Z]{2} -> 2 char sequence code
  const rollRegex = /^[0-9]{2}A8(1A|5A)[0-9A-Z]{2}[0-9A-Z]{2}$/;

  if (!rollRegex.test(normalized)) {
    if (!normalized.includes('A8')) {
      return {
        isValid: false,
        normalized,
        error: 'Invalid college code. Sri Vasavi Engineering College roll numbers must contain college code "A8" (e.g. 25A81A4300).'
      };
    }
    if (!normalized.includes('1A') && !normalized.includes('5A')) {
      return {
        isValid: false,
        normalized,
        error: 'Invalid admission type. Roll number must contain "1A" (Regular BTech) or "5A" (Lateral Entry).'
      };
    }
    return {
      isValid: false,
      normalized,
      error: 'Invalid roll number format. Expected format: 2-digit year + A8 + 1A/5A + 2-char branch + 2-char roll (e.g., 25A81A4300).'
    };
  }

  return { isValid: true, normalized };
}

/**
 * Validates 10-digit Indian mobile number format.
 */
export function validateMobileNumber(rawMobile: string): { isValid: boolean; normalized: string; error?: string } {
  if (!rawMobile) {
    return { isValid: false, normalized: '', error: 'Mobile number is required.' };
  }

  // Strip non-digits and optional leading +91 / 0
  let cleaned = rawMobile.replace(/[^0-9]/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.length !== 10) {
    return {
      isValid: false,
      normalized: cleaned,
      error: `Mobile number must be a 10-digit phone number. Received ${cleaned.length} digits.`
    };
  }

  const indianMobileRegex = /^[6-9][0-9]{9}$/;
  if (!indianMobileRegex.test(cleaned)) {
    return {
      isValid: false,
      normalized: cleaned,
      error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
    };
  }

  return { isValid: true, normalized: cleaned };
}

/**
 * Validates student password.
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required.' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long.' };
  }
  return { isValid: true };
}

/**
 * Enforces Circuit2Circuit Marketplace Rules based on student BTech year:
 * - 1st-, 2nd-, and 3rd-year students can request to rent or buy items, or ask about donations/swaps.
 * - 2nd- and 3rd-year students can list items for rent or swap.
 * - 4th-year students (graduating seniors) can list items for sale, swap, or donation.
 * - 2nd-, 3rd-, and 4th-year students can list donations.
 */
export function validateListingPermissions(
  studentYear: string,
  transactionType: 'rent' | 'sell' | 'donate' | 'swap'
): { isAllowed: boolean; message: string } {
  const year = studentYear.trim();

  // 1st Year rule: Cannot list items
  if (year === '1st Year') {
    return {
      isAllowed: false,
      message: '1st-year students can browse, rent, buy, swap, and request donations. Listing items is reserved for 2nd & 3rd years (rent/swap/donate) and 4th years (sale/swap/donate).'
    };
  }

  // 2nd & 3rd Year rule: Can list rent, swap, or donate (cannot list sale)
  if (year === '2nd Year' || year === '3rd Year') {
    if (transactionType === 'sell') {
      return {
        isAllowed: false,
        message: 'Only 4th-year graduating seniors are permitted to list surplus electronics for direct sale. 2nd- and 3rd-year students can list items for Rent, Component Swap, or as Free Donations.'
      };
    }
    return { isAllowed: true, message: 'Eligible to list for rent, swap, or donation.' };
  }

  // 4th Year rule: Can list sale, swap, or donate (cannot list rent)
  if (year === '4th Year') {
    if (transactionType === 'rent') {
      return {
        isAllowed: false,
        message: '4th-year graduating seniors list completed capstone project electronics for Sale, Swap, or Free Donation before graduation. Semester lab rentals are managed by 2nd- and 3rd-year students.'
      };
    }
    return { isAllowed: true, message: 'Eligible to list for sale, swap, or donation.' };
  }

  return { isAllowed: false, message: 'Please select a valid BTech year to list items.' };
}

/**
 * Enforces requesting rules:
 * - 1st-, 2nd-, 3rd-, and 4th-year students can coordinate component handovers.
 */
export function validateRequestPermissions(
  studentYear: string,
  transactionType: 'rent' | 'sell' | 'donate' | 'swap'
): { isAllowed: boolean; message: string } {
  const year = studentYear.trim();

  if (['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(year)) {
    return { isAllowed: true, message: 'Eligible to request component handover.' };
  }

  return { isAllowed: false, message: 'Please ensure you are signed in as an active BTech student.' };
}
