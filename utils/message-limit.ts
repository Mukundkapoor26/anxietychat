/**
 * Message limit utilities for client-side
 * Using localStorage for persistence
 */

import CryptoJS from "crypto-js";

// Message limit constants
export const MAX_MESSAGES_PER_DAY = 10;
const MESSAGE_COUNT_KEY = 'anxietychat_message_count';
const RESET_TIME_KEY = 'anxietychat_reset_time';

// Encryption key should be in environment variable in production
// For now using a hardcoded key for simplicity
const ENCRYPTION_KEY = "anxiety-chat-secure-key-2024";

/**
 * Initialize the message limit system
 * - Sets up the initial count if not present
 * - Handles reset timing
 */
export function initMessageLimit(): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  try {
    const resetTimeStr = secureGet(RESET_TIME_KEY);
    const resetTime = resetTimeStr ? new Date(resetTimeStr) : null;
    
    // Check if we need to reset (either no reset time or it's passed)
    if (!resetTime || new Date() > resetTime) {
      resetMessageCount();
    }
    
    // Initialize count if it doesn't exist
    if (secureGet(MESSAGE_COUNT_KEY) === null) {
      secureSet(MESSAGE_COUNT_KEY, "0");
    }
  } catch (error) {
    console.error("Error initializing message limit:", error);
    // Fallback to a fresh count
    resetMessageCount();
  }
}

/**
 * Reset the message count to 0 and set a new reset time for the next day
 */
export function resetMessageCount(): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  try {
    // Set count to 0
    secureSet(MESSAGE_COUNT_KEY, "0");
    
    // Set reset time to next day at midnight
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    secureSet(RESET_TIME_KEY, tomorrow.toISOString());
  } catch (error) {
    console.error("Error resetting message count:", error);
  }
}

/**
 * Encrypt data before storing in localStorage
 */
function encrypt(data: string | null): string | null {
  if (data === null) return null;
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt data retrieved from localStorage
 */
function decrypt(encrypted: string | null): string | null {
  if (encrypted === null) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}

/**
 * Secure wrapper for localStorage.getItem
 */
function secureGet(key: string): string | null {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  
  try {
    const encrypted = localStorage.getItem(key);
    return decrypt(encrypted);
  } catch (error) {
    console.error("LocalStorage access error:", error);
    return null;
  }
}

/**
 * Secure wrapper for localStorage.setItem
 */
function secureSet(key: string, value: string): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  
  try {
    const encrypted = encrypt(value);
    if (encrypted) {
      localStorage.setItem(key, encrypted);
    }
  } catch (error) {
    console.error("LocalStorage set error:", error);
  }
}

/**
 * Get the current message count for today
 */
export function getMessageCount(): number {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return 0;
  
  try {
    const count = secureGet(MESSAGE_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error("Error getting message count:", error);
    return 0;
  }
}

/**
 * Increment the message count after a message is sent
 */
export function incrementMessageCount(): number {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return 0;
  
  try {
    const currentCount = getMessageCount();
    const newCount = currentCount + 1;
    secureSet(MESSAGE_COUNT_KEY, newCount.toString());
    return newCount;
  } catch (error) {
    console.error("Error incrementing message count:", error);
    return getMessageCount(); // Return the current count as fallback
  }
}

/**
 * Check if the user has reached their daily message limit
 */
export function hasReachedLimit(): boolean {
  return getMessageCount() >= MAX_MESSAGES_PER_DAY;
}

/**
 * Get the number of messages remaining for the day
 */
export function getRemainingMessages(): number {
  const used = getMessageCount();
  return Math.max(0, MAX_MESSAGES_PER_DAY - used);
}

/**
 * Get the reset time (when the message count will reset)
 */
export function getResetTime(): Date | null {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return null;
  
  try {
    const resetTimeStr = secureGet(RESET_TIME_KEY);
    return resetTimeStr ? new Date(resetTimeStr) : null;
  } catch (error) {
    console.error("Error getting reset time:", error);
    return null;
  }
}

/**
 * Get milliseconds until the next reset
 */
export function getMillisecondsUntilReset(): number {
  const resetTime = getResetTime();
  if (!resetTime) return 0;
  
  const now = new Date();
  return Math.max(0, resetTime.getTime() - now.getTime());
}

/**
 * Format the time remaining until reset in a human-readable format
 */
export function formatTimeRemaining(): string {
  const ms = getMillisecondsUntilReset();
  
  // Less than a minute
  if (ms < 60000) {
    return "Less than a minute";
  }
  
  const minutes = Math.floor(ms / 60000);
  
  // Less than an hour
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  
  return `${hours} hour${hours === 1 ? '' : 's'} and ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
}

/**
 * Determine if we should show the remaining message count indicator
 */
export function shouldShowRemainingMessages(): boolean {
  const count = getMessageCount();
  return count > 0 && count < MAX_MESSAGES_PER_DAY;
} 