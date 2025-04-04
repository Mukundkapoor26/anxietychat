"use client";

import { useEffect, useState } from "react";
import { 
  formatTimeRemaining, 
  getMillisecondsUntilReset, 
  getResetTime, 
  MAX_MESSAGES_PER_DAY,
  getRemainingMessages
} from "@/utils/message-limit";

/**
 * Component that shows a notice when the user has reached their message limit
 */
export default function MessageLimitNotice() {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Get and format initial time
    updateTimeRemaining();
    
    // Set up interval to update the time remaining
    const interval = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, []);

  function updateTimeRemaining() {
    // Format is handled in the utility function now
    setTimeRemaining(formatTimeRemaining());
  }

  return (
    <div className="bg-amber-100 text-amber-800 rounded-lg p-4 mb-4 border border-amber-200">
      <h3 className="font-medium text-amber-900 mb-1">Message Limit Reached</h3>
      <p className="text-sm">
        You've reached your daily limit of {MAX_MESSAGES_PER_DAY} messages. 
        You can send more messages in: <span className="font-medium">{timeRemaining}</span>
      </p>
    </div>
  );
}

/**
 * Component that shows the remaining message count
 */
export function MessageCounter() {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Set initial count
    setRemaining(getRemainingMessages());
  }, []);

  return (
    <div className="text-sm text-ghibli-dark-green/70 backdrop-blur-sm bg-ghibli-beige-darker/40 px-3 py-1.5 rounded-lg">
      <span className="font-medium">{remaining}</span> of {MAX_MESSAGES_PER_DAY} messages remaining today
    </div>
  );
} 