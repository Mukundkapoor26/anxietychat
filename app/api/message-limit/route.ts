import { headers } from 'next/headers';

// Simple in-memory store for local development
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
  return headersList.get('x-real-ip') || 'unknown';
};

export async function GET() {
  const ip = await getClientIP();
  const today = getTodayKey();
  const key = `message-limit:${ip}:${today}`;
  
  try {
    // For local development, use in-memory store
    if (process.env.NODE_ENV === 'development') {
      const count = messageCounts[key] || 0;
      return Response.json({ count, remaining: 20 - count });
    }
    
    // In production, use Vercel KV
    const { kv } = await import('@vercel/kv');
    const count = Number(await kv.get(key)) || 0;
    return Response.json({ count, remaining: 20 - count });
  } catch (error) {
    console.error('Error getting message count:', error);
    return Response.json({ count: 0, remaining: 20 });
  }
}

export async function POST() {
  const ip = await getClientIP();
  const today = getTodayKey();
  const key = `message-limit:${ip}:${today}`;
  
  try {
    // For local development, use in-memory store
    if (process.env.NODE_ENV === 'development') {
      const currentCount = messageCounts[key] || 0;
      const newCount = currentCount + 1;
      messageCounts[key] = newCount;
      return Response.json({ 
        count: newCount,
        remaining: Math.max(0, 20 - newCount),
        limitReached: newCount >= 20 
      });
    }
    
    // In production, use Vercel KV
    const { kv } = await import('@vercel/kv');
    const count = Number(await kv.incr(key));
    await kv.expire(key, 24 * 60 * 60);
    
    return Response.json({ 
      count,
      remaining: Math.max(0, 20 - count),
      limitReached: count >= 20 
    });
  } catch (error) {
    console.error('Error incrementing message count:', error);
    return Response.json({ error: 'Failed to update message count' }, { status: 500 });
  }
} 