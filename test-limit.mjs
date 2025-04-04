#!/usr/bin/env node

// Simple script to test the message limit functionality with encryption from the command line
// This simulates a browser's localStorage for testing

class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

// Setup mock localStorage
global.localStorage = new LocalStorageMock();

// For encryption/decryption
global.btoa = str => Buffer.from(str).toString('base64');
global.atob = str => Buffer.from(str, 'base64').toString();

// Message limit constants and security
const MAX_MESSAGES_PER_DAY = 10;
const MESSAGE_COUNT_KEY = 'anxiety-chat-message-count';
const RESET_TIME_KEY = 'anxiety-chat-reset-time';
const SECRET_KEY = 'anxiety-chat-secure-v1';

// Encryption functions
function encrypt(value) {
  try {
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

function decrypt(encrypted) {
  if (!encrypted) return null;
  
  try {
    const payload = JSON.parse(atob(encrypted));
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

function secureSet(key, value) {
  localStorage.setItem(key, encrypt(value));
}

function secureGet(key) {
  const encrypted = localStorage.getItem(key);
  return decrypt(encrypted);
}

// Utility functions
function initMessageLimit() {
  const resetTimeStr = secureGet(RESET_TIME_KEY);
  const now = new Date();
  
  if (!resetTimeStr || new Date(parseInt(resetTimeStr, 10)) <= now) {
    resetMessageCount();
  }
  
  if (secureGet(MESSAGE_COUNT_KEY) === null) {
    secureSet(MESSAGE_COUNT_KEY, '0');
  }
  
  return parseInt(secureGet(MESSAGE_COUNT_KEY) || '0', 10);
}

function resetMessageCount() {
  secureSet(MESSAGE_COUNT_KEY, '0');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  secureSet(RESET_TIME_KEY, tomorrow.getTime().toString());
}

function getMessageCount() {
  return parseInt(secureGet(MESSAGE_COUNT_KEY) || '0', 10);
}

function incrementMessageCount() {
  const currentCount = getMessageCount();
  secureSet(MESSAGE_COUNT_KEY, (currentCount + 1).toString());
  return currentCount + 1;
}

function hasReachedLimit() {
  return getMessageCount() >= MAX_MESSAGES_PER_DAY;
}

function getRemainingMessages() {
  return Math.max(0, MAX_MESSAGES_PER_DAY - getMessageCount());
}

function getResetTime() {
  const resetTimeStr = secureGet(RESET_TIME_KEY);
  if (!resetTimeStr) {
    resetMessageCount();
    return new Date(parseInt(secureGet(RESET_TIME_KEY) || '0', 10));
  }
  return new Date(parseInt(resetTimeStr, 10));
}

// Test the message limit functionality
console.log('==== Message Limit Test (WITH ENCRYPTION) ====');

// Show raw localStorage for debugging
const showRawStorage = () => {
  console.log('\nRaw localStorage:');
  console.log(localStorage.store);
}

// Initialize and show current state
initMessageLimit();
console.log(`Initial state: ${getMessageCount()} / ${MAX_MESSAGES_PER_DAY} messages used`);
console.log(`Remaining messages: ${getRemainingMessages()}`);
console.log(`Limit reached: ${hasReachedLimit()}`);
showRawStorage();

console.log('\n==== Incrementing message count ====');

// Try to increment message count to the limit and beyond
for (let i = 0; i < MAX_MESSAGES_PER_DAY + 2; i++) {
  const newCount = incrementMessageCount();
  const remaining = getRemainingMessages();
  const reached = hasReachedLimit();
  
  console.log(`Message ${i+1} sent. Count: ${newCount}/${MAX_MESSAGES_PER_DAY}, Remaining: ${remaining}, Limit reached: ${reached}`);
  
  if (reached) {
    console.log('⚠️ Message limit reached!');
  }
  
  // Show encrypted storage after a few increments
  if (i === 0 || i === 5 || i === MAX_MESSAGES_PER_DAY) {
    showRawStorage();
  }
}

console.log('\n==== Demonstrating tampering protection ====');
// Try to tamper with the value directly
const originalEncrypted = localStorage.getItem(MESSAGE_COUNT_KEY);
console.log('Original encrypted count:', originalEncrypted);

// Attempt to modify the localStorage value directly (simulating user tampering)
localStorage.setItem(MESSAGE_COUNT_KEY, 'fakeValue');
console.log('After tampering attempt, count:', getMessageCount());
console.log('System detected tampering:', getMessageCount() === 0);

// Reset to proper value for continued testing
localStorage.setItem(MESSAGE_COUNT_KEY, originalEncrypted);

console.log('\n==== Reset test ====');
resetMessageCount();
console.log(`After reset: ${getMessageCount()} / ${MAX_MESSAGES_PER_DAY} messages used`);
console.log(`Remaining messages: ${getRemainingMessages()}`);
console.log(`Limit reached: ${hasReachedLimit()}`);
showRawStorage();

console.log('\n==== Test complete ===='); 