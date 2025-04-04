/**
 * Message limit utilities for client-side
 * Using localStorage for persistence
 */

// Message limit constants
export const MAX_MESSAGES_PER_DAY = 10;
const MESSAGE_COUNT_KEY = 'anxiety-chat-message-count';
const RESET_TIME_KEY = 'anxiety-chat-reset-time';
const SECRET_KEY = 'anxiety-chat-secure-v1'; // This is for simple obfuscation, not high security

/**
 * Simple encryption to make localStorage manipulation harder
 * This isn't bulletproof security, but adds a barrier to casual manipulation
 */
function encrypt(value: string): string {
  try {
    // Create a base64 encoded, JSON string with the actual value and a timestamp
    // The timestamp helps prevent simple copy-paste of values
    const payload = JSON.stringify({
      v: value,
      t: Date.now(),
      k: SECRET_KEY
    });
    return btoa(payload);
  } catch (error) {
    console.error('Error encrypting value:', error);
    return '';
  }
}

/**
 * Decrypt a stored value
 */
function decrypt(encrypted: string | null): string | null {
  if (!encrypted) return null;
  
  try {
    const payload = JSON.parse(atob(encrypted));
    // Verify the secret key to ensure this is our data
    if (payload.k !== SECRET_KEY) {
      console.warn('Invalid data detected - resetting count');
      return null;
    }
    return payload.v;
  } catch (error) {
    console.error('Error decrypting value:', error);
    return null;
  }
}

/**
 * Securely store a value in localStorage
 */
function secureSet(key: string, value: string): void {
  localStorage.setItem(key, encrypt(value));
}

/**
 * Securely retrieve a value from localStorage
 */
function secureGet(key: string): string | null {
  const encrypted = localStorage.getItem(key);
  return decrypt(encrypted);
}

/**
 * Initialize message limit tracking
 * Call this when app starts to ensure proper setup
 */
export function initMessageLimit() {
  // Check if we need to initialize or reset
  const resetTimeStr = secureGet(RESET_TIME_KEY);
  const now = new Date();
  
  if (!resetTimeStr || new Date(parseInt(resetTimeStr, 10)) <= now) {
    resetMessageCount();
  }
  
  // If no count exists yet, set it to 0
  if (secureGet(MESSAGE_COUNT_KEY) === null) {
    secureSet(MESSAGE_COUNT_KEY, '0');
  }
  
  return parseInt(secureGet(MESSAGE_COUNT_KEY) || '0', 10);
}

/**
 * Reset the message count to 0
 * This is done at midnight each day
 */
export function resetMessageCount() {
  secureSet(MESSAGE_COUNT_KEY, '0');
  
  // Set reset time to next day at midnight
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  secureSet(RESET_TIME_KEY, tomorrow.getTime().toString());
}

/**
 * Get the current message count
 */
export function getMessageCount(): number {
  return parseInt(secureGet(MESSAGE_COUNT_KEY) || '0', 10);
}

/**
 * Increment the message count by 1
 * Returns the new count
 */
export function incrementMessageCount(): number {
  const currentCount = getMessageCount();
  secureSet(MESSAGE_COUNT_KEY, (currentCount + 1).toString());
  return currentCount + 1;
}

/**
 * Check if the user has reached their message limit
 */
export function hasReachedLimit(): boolean {
  return getMessageCount() >= MAX_MESSAGES_PER_DAY;
}

/**
 * Get the number of remaining messages for today
 */
export function getRemainingMessages(): number {
  return Math.max(0, MAX_MESSAGES_PER_DAY - getMessageCount());
}

/**
 * Check if we should show the remaining message count
 * Only reveals counter after 5 messages have been used
 */
export function shouldShowRemainingMessages(): boolean {
  return getMessageCount() > 5;
}

/**
 * Get the reset time (when message counts will reset)
 */
export function getResetTime(): Date {
  const resetTimeStr = secureGet(RESET_TIME_KEY);
  if (!resetTimeStr) {
    // If no reset time exists, create one
    resetMessageCount();
    return new Date(parseInt(secureGet(RESET_TIME_KEY) || '0', 10));
  }
  return new Date(parseInt(resetTimeStr, 10));
}

/**
 * Get the milliseconds until the next reset
 */
export function getMillisecondsUntilReset(): number {
  const resetTime = getResetTime();
  const now = new Date();
  return Math.max(0, resetTime.getTime() - now.getTime());
}

/**
 * Format the remaining time until reset in a human-readable format
 */
export function formatTimeRemaining(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
} 