/**
 * Validation Utilities for RemindIQ
 * Handles standard RFC email validation and localized phone number validation
 * (Australia, India, and International standards).
 */

// RFC 5322 compliant simplified email regex
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Indian mobile regex: 10 digits starting with 6, 7, 8, or 9 (optional +91, 91, or 0)
export const INDIA_PHONE_REGEX = /^(\+91|91|0)?[6-9]\d{9}$/;

// Australian phone regex:
// Mobile: 04XXXXXXXX or +614XXXXXXXX (9-10 digits)
// Landline: 02/03/07/08XXXXXXXX or +61[2-8]XXXXXXXX
export const AUSTRALIA_PHONE_REGEX = /^(\+61|0)?[2-578]\d{8}$|^(\+61|0)?4\d{8}$/;

// General E.164 international phone number (7 to 15 digits)
export const INTL_PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

/**
 * Validates an email address
 * @param {string} email
 * @param {boolean} required
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateEmail(email, required = true) {
  if (!email || !email.trim()) {
    if (required) {
      return { isValid: false, error: 'Email address is required.' };
    }
    return { isValid: true, error: '' };
  }

  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address (e.g. name@company.com).',
    };
  }

  return { isValid: true, error: '' };
}

/**
 * Validates a phone number based on country rules
 * @param {string} phone
 * @param {string} country - 'Australia' | 'India' | string
 * @param {boolean} required
 * @returns {{ isValid: boolean, error: string, cleaned: string }}
 */
export function validatePhone(phone, country = 'Australia', required = false) {
  if (!phone || !phone.trim()) {
    if (required) {
      return { isValid: false, error: 'Phone number is required.', cleaned: '' };
    }
    return { isValid: true, error: '', cleaned: '' };
  }

  const raw = phone.trim();

  // Explicitly disallow alphabetical characters or @ from accidental email autofill
  if (/[a-zA-Z@]/.test(raw)) {
    return {
      isValid: false,
      error: 'Phone number cannot contain letters or email characters.',
      cleaned: raw,
    };
  }

  // Strip all whitespace, hyphens, parentheses, and dots
  const cleaned = raw.replace(/[\s\-\(\)\.]/g, '');

  // Must have at least 6 digits
  const digitCount = (cleaned.match(/\d/g) || []).length;
  if (digitCount < 6) {
    return {
      isValid: false,
      error: 'Phone number is too short. Please enter a valid number.',
      cleaned,
    };
  }

  if (country === 'India') {
    if (!INDIA_PHONE_REGEX.test(cleaned)) {
      return {
        isValid: false,
        error: 'Indian mobile number must be 10 digits starting with 6, 7, 8, or 9 (e.g. 9876543210 or +91 98765 43210).',
        cleaned,
      };
    }
  } else if (country === 'Australia') {
    if (!AUSTRALIA_PHONE_REGEX.test(cleaned) && !INTL_PHONE_REGEX.test(cleaned)) {
      return {
        isValid: false,
        error: 'Australian number must be 9-10 digits (e.g. 0412 345 678 or +61 412 345 678).',
        cleaned,
      };
    }
  } else {
    if (!INTL_PHONE_REGEX.test(cleaned)) {
      return {
        isValid: false,
        error: 'Please enter a valid international phone number with 7 to 15 digits.',
        cleaned,
      };
    }
  }

  return { isValid: true, error: '', cleaned };
}

/**
 * Sanitizes phone input to strip non-phone characters (keeps digits, +, -, (, ), spaces)
 * @param {string} val
 * @returns {string}
 */
export function sanitizePhoneInput(val) {
  if (!val) return '';
  // Reject letters and special symbols like @ completely
  return val.replace(/[^0-9+\-\(\)\s]/g, '');
}
