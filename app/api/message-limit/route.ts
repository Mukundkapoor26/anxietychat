import { headers } from 'next/headers';

// Simple in-memory store for message counts
const messageCounts: Record<string, number> = {};

// Helper to get today's date key
const getTodayKey = () => new Date().toISOString().split('T')[0];

// Helper to get client IP
const getClientIP = async () => {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for') || '';
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return 'local';
};

// Clean up old entries (entries from previous days)
const cleanupOldEntries = () => {
  const today = getTodayKey();
  Object.keys(messageCounts).forEach(key => {
    if (!key.includes(today)) {
      delete messageCounts[key];
    }
  });
};

export async function GET() {
  const ip = await getClientIP();
  const today = getTodayKey();
  const key = `message-limit:${ip}:${today}`;
  
  try {
    cleanupOldEntries();
    const count = messageCounts[key] || 0;
    return Response.json({ 
      count, 
      remaining: Math.max(0, 20 - count),
      limitReached: count >= 20 
    });
  } catch (error) {
    console.error('Error getting message count:', error);
    return Response.json({ count: 0, remaining: 20, limitReached: false });
  }
}

export async function POST() {
  const ip = await getClientIP();
  const today = getTodayKey();
  const key = `message-limit:${ip}:${today}`;
  
  try {
    cleanupOldEntries();
    const currentCount = messageCounts[key] || 0;
    const newCount = currentCount + 1;
    messageCounts[key] = newCount;
    
    return Response.json({ 
      count: newCount,
      remaining: Math.max(0, 20 - newCount),
      limitReached: newCount >= 20 
    });
  } catch (error) {
    console.error('Error incrementing message count:', error);
    return Response.json({ error: 'Failed to update message count' }, { status: 500 });
  }
} 