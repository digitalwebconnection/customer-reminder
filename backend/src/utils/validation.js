/**
 * Server-side Validation Utilities for RemindIQ
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const INDIA_PHONE_REGEX = /^(\+91|91|0)?[6-9]\d{9}$/;
export const AUSTRALIA_PHONE_REGEX = /^(\+61|0)?[2-578]\d{8}$|^(\+61|0)?4\d{8}$/;
export const INTL_PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

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
      error: 'Please provide a valid email address (e.g. name@company.com).',
    };
  }

  return { isValid: true, error: '', email: trimmed };
}

export function validatePhone(phone, country = 'Australia', required = false) {
  if (!phone || !phone.trim()) {
    if (required) {
      return { isValid: false, error: 'Phone number is required.' };
    }
    return { isValid: true, error: '', phone: '' };
  }

  const raw = phone.trim();

  if (/[a-zA-Z@]/.test(raw)) {
    return {
      isValid: false,
      error: 'Phone number cannot contain letters or email characters.',
    };
  }

  const cleaned = raw.replace(/[\s\-\(\)\.]/g, '');
  const digitCount = (cleaned.match(/\d/g) || []).length;
  if (digitCount < 6) {
    return {
      isValid: false,
      error: 'Phone number is too short. Please provide a valid phone number.',
    };
  }

  if (country === 'India') {
    if (!INDIA_PHONE_REGEX.test(cleaned)) {
      return {
        isValid: false,
        error: 'Indian mobile number must be 10 digits starting with 6, 7, 8, or 9 (e.g. 9876543210 or +91 98765 43210).',
      };
    }
  } else if (country === 'Australia') {
    if (!AUSTRALIA_PHONE_REGEX.test(cleaned) && !INTL_PHONE_REGEX.test(cleaned)) {
      return {
        isValid: false,
        error: 'Australian number must be 9-10 digits (e.g. 0412 345 678 or +61 412 345 678).',
      };
    }
  } else {
    if (!INTL_PHONE_REGEX.test(cleaned)) {
      return {
        isValid: false,
        error: 'Please provide a valid international phone number with 7 to 15 digits.',
      };
    }
  }

  return { isValid: true, error: '', phone: raw };
}
