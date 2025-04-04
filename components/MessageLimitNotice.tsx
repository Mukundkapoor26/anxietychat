import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatTimeRemaining, getMillisecondsUntilReset } from '@/utils/message-limit';

export default function MessageLimitNotice() {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  useEffect(() => {
    // Initial time calculation
    const calculateTimeRemaining = () => {
      const remainingMs = getMillisecondsUntilReset();
      setTimeRemaining(formatTimeRemaining(remainingMs));
    };
    
    // Calculate initially
    calculateTimeRemaining();
    
    // Set up interval to update the timer every second
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="rounded-full backdrop-blur-md bg-ghibli-beige-darker/90 border border-ghibli-medium-green/50 px-6 py-3 shadow-md w-full max-w-md mx-auto text-center flex items-center justify-between gap-3">
      <div className="flex-1 text-left">
        <p className="text-ghibli-dark-green font-copernicus text-sm font-medium">
          Daily message limit reached
        </p>
      </div>
      
      <div className="flex items-center gap-2 text-ghibli-medium-green">
        <Clock className="w-4 h-4" />
        <span className="font-copernicus text-sm font-medium">
          {timeRemaining}
        </span>
      </div>
    </div>
  );
}

// Component for showing message count in a pill - only used after 5 messages
export function MessageCounter({ count }: { count: number }) {
  // Only show remaining messages after 5 messages sent
  if (count <= 5) return null;
  
  const remaining = 10 - count;
  
  return (
    <div className="rounded-full bg-ghibli-medium-green/10 text-ghibli-dark-green/70 px-3 py-1 shadow-sm text-center inline-flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-ghibli-medium-green animate-pulse"></div>
      <span className="font-copernicus text-sm">
        {remaining} message{remaining !== 1 ? 's' : ''} remaining today
      </span>
    </div>
  );
} 